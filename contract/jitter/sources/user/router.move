/// router - user entrypoints that compose Jitter SY/PT/YT flows
///
/// The router only orchestrates protocol actions. It starts from SY and stays
/// adapter-agnostic; underlying custody and quoting belong to adapter packages.
///
/// Common composed flows:
///   - mint_py_from_sy
///   - swap_sy_for_pt / swap_sy_for_exact_pt
///   - swap_sy_for_yt_to_position / swap_sy_for_exact_yt_to_position
///   - add_liquidity / remove_liquidity
///   - redeem_before_expiry / redeem_after_expiry / claim_yt_interest
///
/// Design principles:
///   - Router composes, lower modules calculate
///   - Adapter packages handle underlying custody and oracle snapshots
module jitter::router {
    use sui::balance;
    use sui::coin::{Self, Coin};
    use jitter::jitter_position::{Self, JitterPosition};
    
    use jitter::market::{Self, Market};
    use jitter::orderbook::{Self, OrderBook};
    use jitter::pool::{Self, Pool};
    
    use jitter::py_state::{Self, PyState};
    use jitter::reward_distributor::{Self, RewardDistributor, RewardOperation, RewardSettlement};
    use jitter_math::full_math_u128;
    use jitter_oracle::price_info::{Self, PriceInfo};

    // ===========================================
    // Error Codes
    // ===========================================

    const E_ZERO_AMOUNT: u64 = 3000;
    const E_SLIPPAGE: u64 = 3001;
    const E_STATE_MISMATCH: u64 = 3002;
    const E_INEXACT_YT_OUTPUT: u64 = 3003;
    const E_ROUTE_EXPIRED: u64 = 3004;
    const E_BAD_REWARD_SETTLEMENTS: u64 = 3005;
    const FP64_ONE: u128 = 1 << 64;

    // ===========================================
    // Events
    // ===========================================

    #[allow(unused_field)]
    public struct RouterMintEvent has copy, drop {
        user: address,
        sy_amount: u64,
        py_amount: u64,
    }

    public struct RouterSwapEvent has copy, drop {
        user: address,
        direction: u8, // 0 = SY -> PT, 1 = PT -> SY
        amount_in: u64,
        amount_out: u64,
    }

    public struct RouterSwapYtEvent has copy, drop {
        user: address,
        sy_amount_in: u64,
        yt_amount_out: u64,
        sy_amount_out: u64,
    }

    public struct RouterSwapYtForSyEvent has copy, drop {
        user: address,
        yt_amount_in: u64,
        sy_amount_out: u64,
        sy_amount_repaid: u64,
    }

    public struct RouterHybridSwapEvent has copy, drop {
        user: address,
        direction: u8, // 0 = SY -> PT, 1 = PT -> SY
        book_amount_in: u64,
        book_amount_out: u64,
        amm_amount_in: u64,
        amm_amount_out: u64,
        total_amount_out: u64,
    }

    public fun create_py_position<SY: drop>(
        state: &PyState<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): JitterPosition {
        jitter_position::mint_py(
            py_state::state_id(state),
            py_state::market_id(state),
            py_state::expiry(state),
            clock,
            ctx,
        )
    }

    public fun create_lp_position<SY: drop>(
        market: &Pool<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): JitterPosition {
        jitter_position::mint_lp(
            pool::pool_id(market),
            pool::py_state_id(market),
            pool::market_id(market),
            pool::expiry(market),
            clock,
            ctx,
        )
    }

    public fun create_position<SY: drop>(
        state: &PyState<SY>,
        market: &Pool<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): JitterPosition {
        assert!(py_state::state_id(state) == pool::py_state_id(market), E_STATE_MISMATCH);
        assert!(py_state::market_id(state) == pool::market_id(market), E_STATE_MISMATCH);
        jitter_position::mint_lp(
            pool::pool_id(market),
            py_state::state_id(state),
            py_state::market_id(state),
            py_state::expiry(state),
            clock,
            ctx,
        )
    }

    public fun transfer_position(position: JitterPosition, recipient: address) {
        jitter_position::transfer_position(position, recipient)
    }

    // ===========================================
    // PTB Route Guards
    // ===========================================

    /// Guard a frontend-routed PTB by checking the user-supplied deadline.
    /// `deadline_ms = 0` means no deadline.
    public fun assert_before(deadline_ms: u64, clock: &sui::clock::Clock): u64 {
        let now = sui::clock::timestamp_ms(clock);
        assert!(deadline_ms == 0 || now <= deadline_ms, E_ROUTE_EXPIRED);
        now
    }

    /// Guard a frontend-routed PTB by checking an output coin after arbitrary
    /// orderbook and AMM legs have executed.
    public fun assert_coin_min_value<T: drop>(coin: &Coin<T>, min_value: u64): u64 {
        let value = coin::value(coin);
        assert!(value >= min_value, E_SLIPPAGE);
        value
    }

    /// Guard a frontend-routed PTB by checking leftover input does not exceed
    /// the caller's expected refund. Useful for exact-out routes.
    public fun assert_coin_max_value<T: drop>(coin: &Coin<T>, max_value: u64): u64 {
        let value = coin::value(coin);
        assert!(value <= max_value, E_SLIPPAGE);
        value
    }

    /// Guard total PT acquired across explicit order fills and AMM legs by
    /// comparing the final JitterPosition balance against an off-chain snapshot.
    public fun assert_pt_delta_at_least(
        position: &JitterPosition,
        initial_pt_balance: u64,
        min_pt_delta: u64,
    ): u64 {
        let current = jitter_position::pt_balance(position);
        assert!(current >= initial_pt_balance, E_SLIPPAGE);
        let delta = current - initial_pt_balance;
        assert!(delta >= min_pt_delta, E_SLIPPAGE);
        delta
    }

    /// Guard total YT acquired across composed PTB legs.
    public fun assert_yt_delta_at_least(
        position: &JitterPosition,
        initial_yt_balance: u64,
        min_yt_delta: u64,
    ): u64 {
        let current = jitter_position::yt_balance(position);
        assert!(current >= initial_yt_balance, E_SLIPPAGE);
        let delta = current - initial_yt_balance;
        assert!(delta >= min_yt_delta, E_SLIPPAGE);
        delta
    }

    /// Guard total LP acquired across composed deposit legs.
    public fun assert_lp_delta_at_least(
        position: &JitterPosition,
        initial_lp_amount: u64,
        min_lp_delta: u64,
    ): u64 {
        let current = jitter_position::lp_amount(position);
        assert!(current >= initial_lp_amount, E_SLIPPAGE);
        let delta = current - initial_lp_amount;
        assert!(delta >= min_lp_delta, E_SLIPPAGE);
        delta
    }

    // ===========================================
    // Mainline Market Flow
    // ===========================================

    public fun mint_py_from_sy<SY: drop>(
        sy_coin: Coin<SY>,
        price_info: PriceInfo<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        clock: &sui::clock::Clock,
    ): u64 {
        py_state::mint_py(
            sy_coin,
            price_info,
            position,
            py_state,
            clock,
        )
    }

    public fun mint_py_from_sy_after_yt_reward_settlement<SY: drop>(
        yt_settlement: RewardSettlement,
        distributor: &RewardDistributor,
        sy_coin: Coin<SY>,
        price_info: PriceInfo<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        clock: &sui::clock::Clock,
        ctx: &TxContext,
    ): (u64, RewardOperation) {
        assert_reward_distributor_matches_py_state(distributor, py_state);
        let yt_access = py_state::begin_yt_reward_mutation(
            py_state,
            yt_settlement,
            ctx.sender(),
            object::id(position),
        );
        let py_amount = mint_py_from_sy(
            sy_coin,
            price_info,
            position,
            py_state,
            clock,
        );
        py_state::end_yt_reward_mutation(py_state, yt_access);
        (py_amount, begin_post_yt_operation(distributor, position, ctx.sender()))
    }

    public fun swap_sy_for_pt_to_position<SY: drop>(
        sy_coin: Coin<SY>,
        min_pt_out: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, Coin<SY>) {
        assert_yt_route_match(market, position, py_state);
        let sy_index_raw = observe_pool_index(market, py_state, price_info, clock);

        let (pt_out, sy_used, sy_change) = pool::swap_sy_for_pt(
            sy_coin,
            min_pt_out,
            market,
            sy_index_raw,
            clock,
            ctx,
        );
        jitter_position::add_pt(position, pt_out);

        sui::event::emit(RouterSwapEvent {
            user: ctx.sender(),
            direction: 0,
            amount_in: sy_used,
            amount_out: pt_out,
        });

        (pt_out, sy_change)
    }

    public fun swap_sy_for_exact_pt_to_position<SY: drop>(
        sy_coin: Coin<SY>,
        pt_out: u64,
        max_sy_in: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, Coin<SY>) {
        assert_yt_route_match(market, position, py_state);
        let sy_index_raw = observe_pool_index(market, py_state, price_info, clock);

        let (sy_used, sy_change) = pool::swap_sy_for_exact_pt(
            sy_coin,
            pt_out,
            max_sy_in,
            market,
            sy_index_raw,
            clock,
            ctx,
        );
        jitter_position::add_pt(position, pt_out);

        sui::event::emit(RouterSwapEvent {
            user: ctx.sender(),
            direction: 0,
            amount_in: sy_used,
            amount_out: pt_out,
        });

        (sy_used, sy_change)
    }

    public fun swap_sy_for_yt_to_position<SY: drop>(
        sy_coin: Coin<SY>,
        min_yt_out: u64,
        min_sy_out: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, Coin<SY>) {
        let sy_amount_in = coin::value(&sy_coin);
        let (yt_out, sy_out_coin) = mint_yt_and_sell_pt_for_sy(
            sy_coin,
            min_yt_out,
            min_sy_out,
            market,
            position,
            py_state,
            price_info,
            clock,
            ctx,
        );
        let sy_amount_out = coin::value(&sy_out_coin);

        sui::event::emit(RouterSwapYtEvent {
            user: ctx.sender(),
            sy_amount_in,
            yt_amount_out: yt_out,
            sy_amount_out,
        });

        (yt_out, sy_out_coin)
    }

    public fun swap_yt_for_sy_to_position<SY: drop>(
        yt_amount: u64,
        min_sy_out: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): Coin<SY> {
        let (sy_coin, sy_repaid) = sell_yt_for_sy_with_pt_settlement(
            yt_amount,
            min_sy_out,
            market,
            position,
            py_state,
            price_info,
            clock,
            ctx,
        );
        let sy_amount_out = coin::value(&sy_coin);

        sui::event::emit(RouterSwapYtForSyEvent {
            user: ctx.sender(),
            yt_amount_in: yt_amount,
            sy_amount_out,
            sy_amount_repaid: sy_repaid,
        });

        sy_coin
    }

    public fun swap_sy_for_exact_yt_to_position<SY: drop>(
        mut sy_coin: Coin<SY>,
        yt_out: u64,
        max_sy_in: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): Coin<SY> {
        jitter_position::assert_state_match(position, py_state::state_id(py_state));
        assert!(pool::py_state_id(market) == py_state::state_id(py_state), E_STATE_MISMATCH);
        assert!(jitter_position::market_id(position) == py_state::market_id(py_state), E_STATE_MISMATCH);
        assert!(yt_out > 0, E_ZERO_AMOUNT);

        let total_sy_in = coin::value(&sy_coin);
        let sy_index_raw = observe_pool_index(market, py_state, price_info, clock);
        let sy_needed = py_state::calc_sy_amount_for_py(
            yt_out,
            sy_index_raw,
            py_state,
        );
        assert!(sy_needed <= total_sy_in, E_SLIPPAGE);

        let sy_to_mint = coin::split(&mut sy_coin, sy_needed, ctx);
        let actual_yt_out = py_state::mint_py_with_sy_index(
            sy_to_mint,
            sy_index_raw,
            position,
            py_state,
            clock,
        );
        assert!(actual_yt_out >= yt_out, E_INEXACT_YT_OUTPUT);

        jitter_position::sub_pt(position, yt_out);
        let sy_refund_coin = pool::swap_pt_for_sy(
            yt_out,
            0,
            market,
            sy_index_raw,
            clock,
            ctx,
        );

        let mut change_balance = coin::into_balance(sy_coin);
        balance::join(&mut change_balance, coin::into_balance(sy_refund_coin));
        let sy_change = coin::from_balance(change_balance, ctx);
        let actual_sy_in = total_sy_in - coin::value(&sy_change);
        assert!(actual_sy_in <= max_sy_in, E_SLIPPAGE);

        sui::event::emit(RouterSwapYtEvent {
            user: ctx.sender(),
            sy_amount_in: actual_sy_in,
            yt_amount_out: actual_yt_out,
            sy_amount_out: coin::value(&sy_change),
        });

        sy_change
    }

    public fun swap_pt_for_sy_from_position<SY: drop>(
        pt_amount: u64,
        min_sy_out: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): Coin<SY> {
        assert_yt_route_match(market, position, py_state);
        let sy_index_raw = observe_pool_index(market, py_state, price_info, clock);
        jitter_position::sub_pt(position, pt_amount);

        let sy_coin = pool::swap_pt_for_sy(
            pt_amount,
            min_sy_out,
            market,
            sy_index_raw,
            clock,
            ctx,
        );

        sui::event::emit(RouterSwapEvent {
            user: ctx.sender(),
            direction: 1,
            amount_in: pt_amount,
            amount_out: coin::value(&sy_coin),
        });

        sy_coin
    }

    public fun swap_pt_for_exact_sy_from_position<SY: drop>(
        sy_out: u64,
        max_pt_in: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, Coin<SY>) {
        assert_yt_route_match(market, position, py_state);
        let sy_index_raw = observe_pool_index(market, py_state, price_info, clock);

        let (pt_in, sy_coin) = pool::swap_pt_for_exact_sy(
            sy_out,
            max_pt_in,
            market,
            sy_index_raw,
            clock,
            ctx,
        );
        jitter_position::sub_pt(position, pt_in);

        sui::event::emit(RouterSwapEvent {
            user: ctx.sender(),
            direction: 1,
            amount_in: pt_in,
            amount_out: sy_out,
        });

        (pt_in, sy_coin)
    }

    public fun swap_sy_for_pt_orderbook_then_amm<SY: drop, PT: drop, YT: drop>(
        mut sy_coin: Coin<SY>,
        orderbook: &mut OrderBook<SY, PT>,
        order_ids: vector<u64>,
        max_book_price_raw: u128,
        min_total_pt_out: u64,
        market_obj: &mut Market<SY, PT, YT>,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): Coin<SY> {
        assert_market_route_match(orderbook, market_obj, market, position);
        let sy_index_raw = observe_pool_index(market, py_state, price_info, clock);

        let mut book_sy_in = 0;
        let mut book_pt_out = 0;
        let mut i = 0;
        let len = vector::length(&order_ids);
        while (i < len && coin::value(&sy_coin) > 0) {
            let order_id = *vector::borrow(&order_ids, i);
            let fill_pt = orderbook::fillable_ask_pt(
                orderbook,
                order_id,
                coin::value(&sy_coin),
                max_book_price_raw,
                clock,
            );

            if (fill_pt > 0) {
                let sy_before = coin::value(&sy_coin);
                let (pt_coin, sy_change) = orderbook::fill_ask_exact_pt(
                    orderbook,
                    order_id,
                    sy_coin,
                    fill_pt,
                    max_book_price_raw,
                    clock,
                    ctx,
                );
                jitter_position::burn_pt_in(
                    pt_coin,
                    position,
                    pool::py_state_id(market),
                    market_obj,
                );
                let sy_after = coin::value(&sy_change);
                book_sy_in = book_sy_in + (sy_before - sy_after);
                book_pt_out = book_pt_out + fill_pt;
                sy_coin = sy_change;
            };

            i = i + 1;
        };

        let mut amm_sy_in = 0;
        let mut amm_pt_out = 0;
        if (coin::value(&sy_coin) > 0) {
            let (pt_out, sy_used, sy_change) = pool::swap_sy_for_pt(
                sy_coin,
                0,
                market,
                sy_index_raw,
                clock,
                ctx,
            );
            jitter_position::add_pt(position, pt_out);
            amm_sy_in = sy_used;
            amm_pt_out = pt_out;
            sy_coin = sy_change;
        };

        let total_pt_out = book_pt_out + amm_pt_out;
        assert!(total_pt_out >= min_total_pt_out, E_SLIPPAGE);

        sui::event::emit(RouterHybridSwapEvent {
            user: ctx.sender(),
            direction: 0,
            book_amount_in: book_sy_in,
            book_amount_out: book_pt_out,
            amm_amount_in: amm_sy_in,
            amm_amount_out: amm_pt_out,
            total_amount_out: total_pt_out,
        });

        sy_coin
    }

    public fun swap_pt_for_sy_orderbook_then_amm<SY: drop, PT: drop, YT: drop>(
        pt_amount: u64,
        orderbook: &mut OrderBook<SY, PT>,
        order_ids: vector<u64>,
        min_book_price_raw: u128,
        min_total_sy_out: u64,
        market_obj: &mut Market<SY, PT, YT>,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): Coin<SY> {
        assert!(pt_amount > 0, E_ZERO_AMOUNT);
        assert_market_route_match(orderbook, market_obj, market, position);
        let sy_index_raw = observe_pool_index(market, py_state, price_info, clock);

        let mut sy_balance = balance::zero<SY>();
        let mut remaining_pt = pt_amount;
        let mut book_pt_in = 0;
        let mut book_sy_out = 0;
        let mut i = 0;
        let len = vector::length(&order_ids);
        while (i < len && remaining_pt > 0) {
            let order_id = *vector::borrow(&order_ids, i);
            let fill_pt = orderbook::fillable_bid_pt(
                orderbook,
                order_id,
                remaining_pt,
                min_book_price_raw,
                clock,
            );

            if (fill_pt > 0) {
                let pt_coin = jitter_position::redeem_pt_out(
                    fill_pt,
                    position,
                    pool::py_state_id(market),
                    market_obj,
                    clock,
                    ctx,
                );
                let (sy_out, pt_change) = orderbook::fill_bid_exact_pt(
                    orderbook,
                    order_id,
                    pt_coin,
                    fill_pt,
                    min_book_price_raw,
                    clock,
                    ctx,
                );
                let sy_amount = coin::value(&sy_out);
                balance::join(&mut sy_balance, coin::into_balance(sy_out));
                coin::destroy_zero(pt_change);
                remaining_pt = remaining_pt - fill_pt;
                book_pt_in = book_pt_in + fill_pt;
                book_sy_out = book_sy_out + sy_amount;
            };

            i = i + 1;
        };

        let mut amm_pt_in = 0;
        let mut amm_sy_out = 0;
        if (remaining_pt > 0) {
            jitter_position::sub_pt(position, remaining_pt);
            let sy_from_amm = pool::swap_pt_for_sy(
                remaining_pt,
                0,
                market,
                sy_index_raw,
                clock,
                ctx,
            );
            amm_pt_in = remaining_pt;
            amm_sy_out = coin::value(&sy_from_amm);
            balance::join(&mut sy_balance, coin::into_balance(sy_from_amm));
        };

        let sy_coin = coin::from_balance(sy_balance, ctx);
        let total_sy_out = coin::value(&sy_coin);
        assert!(total_sy_out >= min_total_sy_out, E_SLIPPAGE);

        sui::event::emit(RouterHybridSwapEvent {
            user: ctx.sender(),
            direction: 1,
            book_amount_in: book_pt_in,
            book_amount_out: book_sy_out,
            amm_amount_in: amm_pt_in,
            amm_amount_out: amm_sy_out,
            total_amount_out: total_sy_out,
        });

        sy_coin
    }

    public fun add_liquidity_from_position<SY: drop>(
        sy_coin: Coin<SY>,
        pt_amount: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, u64, Coin<SY>) {
        assert_yt_route_match(market, position, py_state);
        let sy_index_raw = observe_pool_index(market, py_state, price_info, clock);

        let (lp_amount, _, pt_used, sy_change) = pool::add_liquidity(
            sy_coin,
            pt_amount,
            market,
            position,
            sy_index_raw,
            clock,
            ctx,
        );
        jitter_position::sub_pt(position, pt_used);
        (lp_amount, pt_used, sy_change)
    }

    public fun add_liquidity_keep_yt_from_sy<SY: drop>(
        mut sy_coin: Coin<SY>,
        _sy_to_mint_hint: u64,
        min_lp_out: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, u64, Coin<SY>) {
        assert_yt_route_match(market, position, py_state);
        let total_sy_in = coin::value(&sy_coin);
        assert!(total_sy_in > 1, E_ZERO_AMOUNT);

        let sy_index_raw = observe_pool_index(market, py_state, price_info, clock);
        let sy_to_mint = solve_sy_to_mint_for_keep_yt(
            total_sy_in,
            market,
            py_state,
        );
        assert!(sy_to_mint > 0 && total_sy_in > sy_to_mint, E_ZERO_AMOUNT);
        let sy_for_mint = coin::split(&mut sy_coin, sy_to_mint, ctx);
        let yt_amount = py_state::mint_py_with_sy_index(
            sy_for_mint,
            sy_index_raw,
            position,
            py_state,
            clock,
        );

        let (lp_amount, _, pt_used, sy_change) = pool::add_liquidity(
            sy_coin,
            yt_amount,
            market,
            position,
            sy_index_raw,
            clock,
            ctx,
        );
        jitter_position::sub_pt(position, pt_used);
        assert!(lp_amount >= min_lp_out, E_SLIPPAGE);

        (lp_amount, yt_amount, sy_change)
    }

    public fun remove_liquidity_to_position<SY: drop>(
        lp_amount: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (Coin<SY>, u64) {
        jitter_position::assert_state_match(position, pool::py_state_id(market));

        let (sy_coin, pt_amount) = pool::remove_liquidity(
            lp_amount,
            market,
            position,
            clock,
            ctx,
        );
        jitter_position::add_pt(position, pt_amount);

        (sy_coin, pt_amount)
    }

    public fun remove_liquidity_keep_yt_to_position<SY: drop>(
        lp_amount: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (Coin<SY>, u64) {
        remove_liquidity_to_position(
            lp_amount,
            market,
            position,
            clock,
            ctx,
        )
    }

    // ===========================================
    // Reward-Settled Pool Entrypoints
    // ===========================================

    public fun swap_sy_for_pt_to_position_after_pool_reward_settlement<SY: drop>(
        settlement: RewardSettlement,
        distributor: &RewardDistributor,
        sy_coin: Coin<SY>,
        min_pt_out: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, Coin<SY>, RewardOperation) {
        assert_reward_distributor_matches_pool(distributor, market);
        let access = pool::begin_reward_operation(market, settlement);
        let (pt_out, sy_change) = swap_sy_for_pt_to_position(
            sy_coin,
            min_pt_out,
            market,
            position,
            py_state,
            price_info,
            clock,
            ctx,
        );
        pool::end_reward_operation(market, access);
        (pt_out, sy_change, begin_post_pool_operation(distributor, market))
    }

    public fun swap_sy_for_exact_pt_to_position_after_pool_reward_settlement<SY: drop>(
        settlement: RewardSettlement,
        distributor: &RewardDistributor,
        sy_coin: Coin<SY>,
        pt_out: u64,
        max_sy_in: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, Coin<SY>, RewardOperation) {
        assert_reward_distributor_matches_pool(distributor, market);
        let access = pool::begin_reward_operation(market, settlement);
        let (sy_used, sy_change) = swap_sy_for_exact_pt_to_position(
            sy_coin,
            pt_out,
            max_sy_in,
            market,
            position,
            py_state,
            price_info,
            clock,
            ctx,
        );
        pool::end_reward_operation(market, access);
        (sy_used, sy_change, begin_post_pool_operation(distributor, market))
    }

    public fun swap_pt_for_sy_from_position_after_pool_reward_settlement<SY: drop>(
        settlement: RewardSettlement,
        distributor: &RewardDistributor,
        pt_amount: u64,
        min_sy_out: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (Coin<SY>, RewardOperation) {
        assert_reward_distributor_matches_pool(distributor, market);
        let access = pool::begin_reward_operation(market, settlement);
        let sy_coin = swap_pt_for_sy_from_position(
            pt_amount,
            min_sy_out,
            market,
            position,
            py_state,
            price_info,
            clock,
            ctx,
        );
        pool::end_reward_operation(market, access);
        (sy_coin, begin_post_pool_operation(distributor, market))
    }

    public fun swap_pt_for_exact_sy_from_position_after_pool_reward_settlement<SY: drop>(
        settlement: RewardSettlement,
        distributor: &RewardDistributor,
        sy_out: u64,
        max_pt_in: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, Coin<SY>, RewardOperation) {
        assert_reward_distributor_matches_pool(distributor, market);
        let access = pool::begin_reward_operation(market, settlement);
        let (pt_in, sy_coin) = swap_pt_for_exact_sy_from_position(
            sy_out,
            max_pt_in,
            market,
            position,
            py_state,
            price_info,
            clock,
            ctx,
        );
        pool::end_reward_operation(market, access);
        (pt_in, sy_coin, begin_post_pool_operation(distributor, market))
    }

    public fun swap_sy_for_yt_to_position_after_pool_reward_settlement<SY: drop>(
        pool_settlement: RewardSettlement,
        yt_settlement: RewardSettlement,
        distributor: &RewardDistributor,
        sy_coin: Coin<SY>,
        min_yt_out: u64,
        min_sy_out: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, Coin<SY>, RewardOperation, RewardOperation) {
        assert_reward_distributor_matches_pool(distributor, market);
        assert_reward_distributor_matches_py_state(distributor, py_state);
        let access = pool::begin_reward_operation(market, pool_settlement);
        let yt_access = py_state::begin_yt_reward_mutation(
            py_state,
            yt_settlement,
            ctx.sender(),
            object::id(position),
        );
        let (yt_out, sy_change) = swap_sy_for_yt_to_position(
            sy_coin,
            min_yt_out,
            min_sy_out,
            market,
            position,
            py_state,
            price_info,
            clock,
            ctx,
        );
        py_state::end_yt_reward_mutation(py_state, yt_access);
        pool::end_reward_operation(market, access);
        (
            yt_out,
            sy_change,
            begin_post_yt_operation(distributor, position, ctx.sender()),
            begin_post_pool_operation(distributor, market),
        )
    }

    public fun swap_sy_for_exact_yt_to_position_after_pool_reward_settlement<SY: drop>(
        pool_settlement: RewardSettlement,
        yt_settlement: RewardSettlement,
        distributor: &RewardDistributor,
        sy_coin: Coin<SY>,
        yt_out: u64,
        max_sy_in: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (Coin<SY>, RewardOperation, RewardOperation) {
        assert_reward_distributor_matches_pool(distributor, market);
        assert_reward_distributor_matches_py_state(distributor, py_state);
        let access = pool::begin_reward_operation(market, pool_settlement);
        let yt_access = py_state::begin_yt_reward_mutation(
            py_state,
            yt_settlement,
            ctx.sender(),
            object::id(position),
        );
        let sy_change = swap_sy_for_exact_yt_to_position(
            sy_coin,
            yt_out,
            max_sy_in,
            market,
            position,
            py_state,
            price_info,
            clock,
            ctx,
        );
        py_state::end_yt_reward_mutation(py_state, yt_access);
        pool::end_reward_operation(market, access);
        (
            sy_change,
            begin_post_yt_operation(distributor, position, ctx.sender()),
            begin_post_pool_operation(distributor, market),
        )
    }

    public fun swap_yt_for_sy_to_position_after_pool_reward_settlement<SY: drop>(
        pool_settlement: RewardSettlement,
        yt_settlement: RewardSettlement,
        distributor: &RewardDistributor,
        yt_amount: u64,
        min_sy_out: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (Coin<SY>, RewardOperation, RewardOperation) {
        assert_reward_distributor_matches_pool(distributor, market);
        assert_reward_distributor_matches_py_state(distributor, py_state);
        let access = pool::begin_reward_operation(market, pool_settlement);
        let yt_access = py_state::begin_yt_reward_mutation(
            py_state,
            yt_settlement,
            ctx.sender(),
            object::id(position),
        );
        let sy_coin = swap_yt_for_sy_to_position(
            yt_amount,
            min_sy_out,
            market,
            position,
            py_state,
            price_info,
            clock,
            ctx,
        );
        py_state::end_yt_reward_mutation(py_state, yt_access);
        pool::end_reward_operation(market, access);
        (
            sy_coin,
            begin_post_yt_operation(distributor, position, ctx.sender()),
            begin_post_pool_operation(distributor, market),
        )
    }

    public fun swap_sy_for_pt_orderbook_then_amm_after_pool_reward_settlement<
        SY: drop,
        PT: drop,
        YT: drop,
    >(
        pool_settlement: RewardSettlement,
        orderbook_settlement: RewardSettlement,
        distributor: &RewardDistributor,
        sy_coin: Coin<SY>,
        orderbook: &mut OrderBook<SY, PT>,
        order_ids: vector<u64>,
        max_book_price_raw: u128,
        min_total_pt_out: u64,
        market_obj: &mut Market<SY, PT, YT>,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (Coin<SY>, RewardOperation, RewardOperation) {
        assert_reward_distributor_matches_pool(distributor, market);
        assert_reward_distributor_matches_orderbook(distributor, orderbook);
        let access = pool::begin_reward_operation(market, pool_settlement);
        let book_access = orderbook::begin_reward_operation(orderbook, orderbook_settlement);
        let sy_change = swap_sy_for_pt_orderbook_then_amm(
            sy_coin,
            orderbook,
            order_ids,
            max_book_price_raw,
            min_total_pt_out,
            market_obj,
            market,
            position,
            py_state,
            price_info,
            clock,
            ctx,
        );
        orderbook::end_reward_operation(orderbook, book_access);
        pool::end_reward_operation(market, access);
        (
            sy_change,
            begin_post_orderbook_operation(distributor, orderbook),
            begin_post_pool_operation(distributor, market),
        )
    }

    public fun swap_pt_for_sy_orderbook_then_amm_after_pool_reward_settlement<
        SY: drop,
        PT: drop,
        YT: drop,
    >(
        pool_settlement: RewardSettlement,
        orderbook_settlement: RewardSettlement,
        distributor: &RewardDistributor,
        pt_amount: u64,
        orderbook: &mut OrderBook<SY, PT>,
        order_ids: vector<u64>,
        min_book_price_raw: u128,
        min_total_sy_out: u64,
        market_obj: &mut Market<SY, PT, YT>,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (Coin<SY>, RewardOperation, RewardOperation) {
        assert_reward_distributor_matches_pool(distributor, market);
        assert_reward_distributor_matches_orderbook(distributor, orderbook);
        let access = pool::begin_reward_operation(market, pool_settlement);
        let book_access = orderbook::begin_reward_operation(orderbook, orderbook_settlement);
        let sy_coin = swap_pt_for_sy_orderbook_then_amm(
            pt_amount,
            orderbook,
            order_ids,
            min_book_price_raw,
            min_total_sy_out,
            market_obj,
            market,
            position,
            py_state,
            price_info,
            clock,
            ctx,
        );
        orderbook::end_reward_operation(orderbook, book_access);
        pool::end_reward_operation(market, access);
        (
            sy_coin,
            begin_post_orderbook_operation(distributor, orderbook),
            begin_post_pool_operation(distributor, market),
        )
    }

    public fun add_liquidity_from_position_after_pool_reward_settlement<SY: drop>(
        pool_settlement: RewardSettlement,
        lp_settlement: RewardSettlement,
        distributor: &RewardDistributor,
        sy_coin: Coin<SY>,
        pt_amount: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, u64, Coin<SY>, RewardOperation, RewardOperation) {
        assert_reward_distributor_matches_pool(distributor, market);
        let access = pool::begin_reward_operation(market, pool_settlement);
        let lp_access = jitter_position::begin_reward_mutation(
            position,
            lp_settlement,
            reward_distributor::id(distributor),
            ctx.sender(),
        );
        let (lp_amount, pt_used, sy_change) = add_liquidity_from_position(
            sy_coin,
            pt_amount,
            market,
            position,
            py_state,
            price_info,
            clock,
            ctx,
        );
        jitter_position::end_reward_mutation(position, lp_access);
        pool::end_reward_operation(market, access);
        (
            lp_amount,
            pt_used,
            sy_change,
            begin_post_lp_operation(distributor, position, ctx.sender()),
            begin_post_pool_operation(distributor, market),
        )
    }

    public fun add_liquidity_keep_yt_from_sy_after_pool_reward_settlement<SY: drop>(
        pool_settlement: RewardSettlement,
        yt_settlement: RewardSettlement,
        lp_settlement: RewardSettlement,
        distributor: &RewardDistributor,
        sy_coin: Coin<SY>,
        sy_to_mint_hint: u64,
        min_lp_out: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, u64, Coin<SY>, RewardOperation, RewardOperation, RewardOperation) {
        assert_reward_distributor_matches_pool(distributor, market);
        assert_reward_distributor_matches_py_state(distributor, py_state);
        let access = pool::begin_reward_operation(market, pool_settlement);
        let yt_access = py_state::begin_yt_reward_mutation(
            py_state,
            yt_settlement,
            ctx.sender(),
            object::id(position),
        );
        let lp_access = jitter_position::begin_reward_mutation(
            position,
            lp_settlement,
            reward_distributor::id(distributor),
            ctx.sender(),
        );
        let (lp_amount, yt_amount, sy_change) = add_liquidity_keep_yt_from_sy(
            sy_coin,
            sy_to_mint_hint,
            min_lp_out,
            market,
            position,
            py_state,
            price_info,
            clock,
            ctx,
        );
        jitter_position::end_reward_mutation(position, lp_access);
        py_state::end_yt_reward_mutation(py_state, yt_access);
        pool::end_reward_operation(market, access);
        (
            lp_amount,
            yt_amount,
            sy_change,
            begin_post_yt_operation(distributor, position, ctx.sender()),
            begin_post_lp_operation(distributor, position, ctx.sender()),
            begin_post_pool_operation(distributor, market),
        )
    }

    public fun remove_liquidity_to_position_after_pool_reward_settlement<SY: drop>(
        pool_settlement: RewardSettlement,
        lp_settlement: RewardSettlement,
        distributor: &RewardDistributor,
        lp_amount: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (Coin<SY>, u64, RewardOperation, RewardOperation) {
        assert_reward_distributor_matches_pool(distributor, market);
        let access = pool::begin_reward_operation(market, pool_settlement);
        let lp_access = jitter_position::begin_reward_mutation(
            position,
            lp_settlement,
            reward_distributor::id(distributor),
            ctx.sender(),
        );
        let (sy_coin, pt_amount) = remove_liquidity_to_position(
            lp_amount,
            market,
            position,
            clock,
            ctx,
        );
        jitter_position::end_reward_mutation(position, lp_access);
        pool::end_reward_operation(market, access);
        (
            sy_coin,
            pt_amount,
            begin_post_lp_operation(distributor, position, ctx.sender()),
            begin_post_pool_operation(distributor, market),
        )
    }

    public fun remove_liquidity_keep_yt_to_position_after_pool_reward_settlement<SY: drop>(
        pool_settlement: RewardSettlement,
        lp_settlement: RewardSettlement,
        distributor: &RewardDistributor,
        lp_amount: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (Coin<SY>, u64, RewardOperation, RewardOperation) {
        assert_reward_distributor_matches_pool(distributor, market);
        let access = pool::begin_reward_operation(market, pool_settlement);
        let lp_access = jitter_position::begin_reward_mutation(
            position,
            lp_settlement,
            reward_distributor::id(distributor),
            ctx.sender(),
        );
        let (sy_coin, pt_amount) = remove_liquidity_keep_yt_to_position(
            lp_amount,
            market,
            position,
            clock,
            ctx,
        );
        jitter_position::end_reward_mutation(position, lp_access);
        pool::end_reward_operation(market, access);
        (
            sy_coin,
            pt_amount,
            begin_post_lp_operation(distributor, position, ctx.sender()),
            begin_post_pool_operation(distributor, market),
        )
    }

    // ===========================================
    // Short Reward-Aware Entrypoints
    // ===========================================

    /// Unified short entrypoint for `SY -> PT`.
    /// Pass an empty `pool_settlements` vector for non-reward pools, or exactly
    /// one pool settlement for reward-enabled pools.
    public fun buy_pt<SY: drop>(
        pool_settlements: vector<RewardSettlement>,
        distributor: &RewardDistributor,
        sy_coin: Coin<SY>,
        min_pt_out: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, Coin<SY>, vector<RewardOperation>) {
        if (pool::reward_distributor_required(market)) {
            let mut pool_settlements = pool_settlements;
            assert_reward_distributor_matches_pool(distributor, market);
            let access = pool::begin_reward_operation(
                market,
                take_one_settlement(&mut pool_settlements),
            );
            let (pt_out, sy_change) = swap_sy_for_pt_to_position(
                sy_coin,
                min_pt_out,
                market,
                position,
                py_state,
                price_info,
                clock,
                ctx,
            );
            pool::end_reward_operation(market, access);
            vector::destroy_empty(pool_settlements);
            let mut post_ops = vector[];
            vector::push_back(&mut post_ops, begin_post_pool_operation(distributor, market));
            (pt_out, sy_change, post_ops)
        } else {
            assert_no_settlements(pool_settlements);
            let (pt_out, sy_change) = swap_sy_for_pt_to_position(
                sy_coin,
                min_pt_out,
                market,
                position,
                py_state,
                price_info,
                clock,
                ctx,
            );
            (pt_out, sy_change, vector[])
        }
    }

    /// Unified short entrypoint for `PT -> SY`.
    public fun sell_pt<SY: drop>(
        pool_settlements: vector<RewardSettlement>,
        distributor: &RewardDistributor,
        pt_amount: u64,
        min_sy_out: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (Coin<SY>, vector<RewardOperation>) {
        if (pool::reward_distributor_required(market)) {
            let mut pool_settlements = pool_settlements;
            assert_reward_distributor_matches_pool(distributor, market);
            let access = pool::begin_reward_operation(
                market,
                take_one_settlement(&mut pool_settlements),
            );
            let sy_coin = swap_pt_for_sy_from_position(
                pt_amount,
                min_sy_out,
                market,
                position,
                py_state,
                price_info,
                clock,
                ctx,
            );
            pool::end_reward_operation(market, access);
            vector::destroy_empty(pool_settlements);
            let mut post_ops = vector[];
            vector::push_back(&mut post_ops, begin_post_pool_operation(distributor, market));
            (sy_coin, post_ops)
        } else {
            assert_no_settlements(pool_settlements);
            let sy_coin = swap_pt_for_sy_from_position(
                pt_amount,
                min_sy_out,
                market,
                position,
                py_state,
                price_info,
                clock,
                ctx,
            );
            (sy_coin, vector[])
        }
    }

    /// Unified short entrypoint for buying YT.
    /// Project-based reward mode requires Pool and YT gates to be enabled
    /// together; mixed mode aborts.
    public fun buy_yt<SY: drop>(
        pool_settlements: vector<RewardSettlement>,
        yt_settlements: vector<RewardSettlement>,
        distributor: &RewardDistributor,
        sy_coin: Coin<SY>,
        min_yt_out: u64,
        min_sy_out: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, Coin<SY>, vector<RewardOperation>) {
        assert_pool_yt_reward_mode_match(market, py_state);
        if (pool::reward_distributor_required(market)) {
            let mut pool_settlements = pool_settlements;
            let mut yt_settlements = yt_settlements;
            assert_reward_distributor_matches_pool(distributor, market);
            assert_reward_distributor_matches_py_state(distributor, py_state);
            let access = pool::begin_reward_operation(
                market,
                take_one_settlement(&mut pool_settlements),
            );
            let yt_access = py_state::begin_yt_reward_mutation(
                py_state,
                take_one_settlement(&mut yt_settlements),
                ctx.sender(),
                object::id(position),
            );
            let (yt_out, sy_change) = swap_sy_for_yt_to_position(
                sy_coin,
                min_yt_out,
                min_sy_out,
                market,
                position,
                py_state,
                price_info,
                clock,
                ctx,
            );
            py_state::end_yt_reward_mutation(py_state, yt_access);
            pool::end_reward_operation(market, access);
            vector::destroy_empty(pool_settlements);
            vector::destroy_empty(yt_settlements);
            let mut post_ops = vector[];
            vector::push_back(&mut post_ops, begin_post_yt_operation(distributor, position, ctx.sender()));
            vector::push_back(&mut post_ops, begin_post_pool_operation(distributor, market));
            (yt_out, sy_change, post_ops)
        } else {
            assert_no_settlements(pool_settlements);
            assert_no_settlements(yt_settlements);
            let (yt_out, sy_change) = swap_sy_for_yt_to_position(
                sy_coin,
                min_yt_out,
                min_sy_out,
                market,
                position,
                py_state,
                price_info,
                clock,
                ctx,
            );
            (yt_out, sy_change, vector[])
        }
    }

    /// Unified short entrypoint for selling YT.
    public fun sell_yt<SY: drop>(
        pool_settlements: vector<RewardSettlement>,
        yt_settlements: vector<RewardSettlement>,
        distributor: &RewardDistributor,
        yt_amount: u64,
        min_sy_out: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (Coin<SY>, vector<RewardOperation>) {
        assert_pool_yt_reward_mode_match(market, py_state);
        if (pool::reward_distributor_required(market)) {
            let mut pool_settlements = pool_settlements;
            let mut yt_settlements = yt_settlements;
            assert_reward_distributor_matches_pool(distributor, market);
            assert_reward_distributor_matches_py_state(distributor, py_state);
            let access = pool::begin_reward_operation(
                market,
                take_one_settlement(&mut pool_settlements),
            );
            let yt_access = py_state::begin_yt_reward_mutation(
                py_state,
                take_one_settlement(&mut yt_settlements),
                ctx.sender(),
                object::id(position),
            );
            let sy_coin = swap_yt_for_sy_to_position(
                yt_amount,
                min_sy_out,
                market,
                position,
                py_state,
                price_info,
                clock,
                ctx,
            );
            py_state::end_yt_reward_mutation(py_state, yt_access);
            pool::end_reward_operation(market, access);
            vector::destroy_empty(pool_settlements);
            vector::destroy_empty(yt_settlements);
            let mut post_ops = vector[];
            vector::push_back(&mut post_ops, begin_post_yt_operation(distributor, position, ctx.sender()));
            vector::push_back(&mut post_ops, begin_post_pool_operation(distributor, market));
            (sy_coin, post_ops)
        } else {
            assert_no_settlements(pool_settlements);
            assert_no_settlements(yt_settlements);
            let sy_coin = swap_yt_for_sy_to_position(
                yt_amount,
                min_sy_out,
                market,
                position,
                py_state,
                price_info,
                clock,
                ctx,
            );
            (sy_coin, vector[])
        }
    }

    /// Unified short entrypoint for frontend-routed `SY -> PT` through
    /// orderbook first, then AMM fallback.
    public fun buy_pt_route<SY: drop, PT: drop, YT: drop>(
        pool_settlements: vector<RewardSettlement>,
        orderbook_settlements: vector<RewardSettlement>,
        distributor: &RewardDistributor,
        sy_coin: Coin<SY>,
        orderbook: &mut OrderBook<SY, PT>,
        order_ids: vector<u64>,
        max_book_price_raw: u128,
        min_total_pt_out: u64,
        market_obj: &mut Market<SY, PT, YT>,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (Coin<SY>, vector<RewardOperation>) {
        assert_pool_orderbook_reward_mode_match(market, orderbook);
        if (pool::reward_distributor_required(market)) {
            let mut pool_settlements = pool_settlements;
            let mut orderbook_settlements = orderbook_settlements;
            assert_reward_distributor_matches_pool(distributor, market);
            assert_reward_distributor_matches_orderbook(distributor, orderbook);
            let access = pool::begin_reward_operation(
                market,
                take_one_settlement(&mut pool_settlements),
            );
            let book_access = orderbook::begin_reward_operation(
                orderbook,
                take_one_settlement(&mut orderbook_settlements),
            );
            let sy_change = swap_sy_for_pt_orderbook_then_amm(
                sy_coin,
                orderbook,
                order_ids,
                max_book_price_raw,
                min_total_pt_out,
                market_obj,
                market,
                position,
                py_state,
                price_info,
                clock,
                ctx,
            );
            orderbook::end_reward_operation(orderbook, book_access);
            pool::end_reward_operation(market, access);
            vector::destroy_empty(pool_settlements);
            vector::destroy_empty(orderbook_settlements);
            let mut post_ops = vector[];
            vector::push_back(&mut post_ops, begin_post_orderbook_operation(distributor, orderbook));
            vector::push_back(&mut post_ops, begin_post_pool_operation(distributor, market));
            (sy_change, post_ops)
        } else {
            assert_no_settlements(pool_settlements);
            assert_no_settlements(orderbook_settlements);
            let sy_change = swap_sy_for_pt_orderbook_then_amm(
                sy_coin,
                orderbook,
                order_ids,
                max_book_price_raw,
                min_total_pt_out,
                market_obj,
                market,
                position,
                py_state,
                price_info,
                clock,
                ctx,
            );
            (sy_change, vector[])
        }
    }

    /// Unified short entrypoint for frontend-routed `PT -> SY` through
    /// orderbook first, then AMM fallback.
    public fun sell_pt_route<SY: drop, PT: drop, YT: drop>(
        pool_settlements: vector<RewardSettlement>,
        orderbook_settlements: vector<RewardSettlement>,
        distributor: &RewardDistributor,
        pt_amount: u64,
        orderbook: &mut OrderBook<SY, PT>,
        order_ids: vector<u64>,
        min_book_price_raw: u128,
        min_total_sy_out: u64,
        market_obj: &mut Market<SY, PT, YT>,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (Coin<SY>, vector<RewardOperation>) {
        assert_pool_orderbook_reward_mode_match(market, orderbook);
        if (pool::reward_distributor_required(market)) {
            let mut pool_settlements = pool_settlements;
            let mut orderbook_settlements = orderbook_settlements;
            assert_reward_distributor_matches_pool(distributor, market);
            assert_reward_distributor_matches_orderbook(distributor, orderbook);
            let access = pool::begin_reward_operation(
                market,
                take_one_settlement(&mut pool_settlements),
            );
            let book_access = orderbook::begin_reward_operation(
                orderbook,
                take_one_settlement(&mut orderbook_settlements),
            );
            let sy_coin = swap_pt_for_sy_orderbook_then_amm(
                pt_amount,
                orderbook,
                order_ids,
                min_book_price_raw,
                min_total_sy_out,
                market_obj,
                market,
                position,
                py_state,
                price_info,
                clock,
                ctx,
            );
            orderbook::end_reward_operation(orderbook, book_access);
            pool::end_reward_operation(market, access);
            vector::destroy_empty(pool_settlements);
            vector::destroy_empty(orderbook_settlements);
            let mut post_ops = vector[];
            vector::push_back(&mut post_ops, begin_post_orderbook_operation(distributor, orderbook));
            vector::push_back(&mut post_ops, begin_post_pool_operation(distributor, market));
            (sy_coin, post_ops)
        } else {
            assert_no_settlements(pool_settlements);
            assert_no_settlements(orderbook_settlements);
            let sy_coin = swap_pt_for_sy_orderbook_then_amm(
                pt_amount,
                orderbook,
                order_ids,
                min_book_price_raw,
                min_total_sy_out,
                market_obj,
                market,
                position,
                py_state,
                price_info,
                clock,
                ctx,
            );
            (sy_coin, vector[])
        }
    }

    /// Unified short entrypoint for dual-sided LP add.
    public fun add_lp<SY: drop>(
        pool_settlements: vector<RewardSettlement>,
        lp_settlements: vector<RewardSettlement>,
        distributor: &RewardDistributor,
        sy_coin: Coin<SY>,
        pt_amount: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, u64, Coin<SY>, vector<RewardOperation>) {
        if (pool::reward_distributor_required(market)) {
            let mut pool_settlements = pool_settlements;
            let mut lp_settlements = lp_settlements;
            assert_reward_distributor_matches_pool(distributor, market);
            let access = pool::begin_reward_operation(
                market,
                take_one_settlement(&mut pool_settlements),
            );
            let lp_access = jitter_position::begin_reward_mutation(
                position,
                take_one_settlement(&mut lp_settlements),
                reward_distributor::id(distributor),
                ctx.sender(),
            );
            let (lp_amount, pt_used, sy_change) = add_liquidity_from_position(
                sy_coin,
                pt_amount,
                market,
                position,
                py_state,
                price_info,
                clock,
                ctx,
            );
            jitter_position::end_reward_mutation(position, lp_access);
            pool::end_reward_operation(market, access);
            vector::destroy_empty(pool_settlements);
            vector::destroy_empty(lp_settlements);
            let mut post_ops = vector[];
            vector::push_back(&mut post_ops, begin_post_lp_operation(distributor, position, ctx.sender()));
            vector::push_back(&mut post_ops, begin_post_pool_operation(distributor, market));
            (lp_amount, pt_used, sy_change, post_ops)
        } else {
            assert_no_settlements(pool_settlements);
            assert_no_settlements(lp_settlements);
            let (lp_amount, pt_used, sy_change) = add_liquidity_from_position(
                sy_coin,
                pt_amount,
                market,
                position,
                py_state,
                price_info,
                clock,
                ctx,
            );
            (lp_amount, pt_used, sy_change, vector[])
        }
    }

    /// Unified short entrypoint for single-SY LP add while keeping YT.
    public fun add_lp_keep_yt<SY: drop>(
        pool_settlements: vector<RewardSettlement>,
        yt_settlements: vector<RewardSettlement>,
        lp_settlements: vector<RewardSettlement>,
        distributor: &RewardDistributor,
        sy_coin: Coin<SY>,
        sy_to_mint_hint: u64,
        min_lp_out: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, u64, Coin<SY>, vector<RewardOperation>) {
        assert_pool_yt_reward_mode_match(market, py_state);
        if (pool::reward_distributor_required(market)) {
            let mut pool_settlements = pool_settlements;
            let mut yt_settlements = yt_settlements;
            let mut lp_settlements = lp_settlements;
            assert_reward_distributor_matches_pool(distributor, market);
            assert_reward_distributor_matches_py_state(distributor, py_state);
            let access = pool::begin_reward_operation(
                market,
                take_one_settlement(&mut pool_settlements),
            );
            let yt_access = py_state::begin_yt_reward_mutation(
                py_state,
                take_one_settlement(&mut yt_settlements),
                ctx.sender(),
                object::id(position),
            );
            let lp_access = jitter_position::begin_reward_mutation(
                position,
                take_one_settlement(&mut lp_settlements),
                reward_distributor::id(distributor),
                ctx.sender(),
            );
            let (lp_amount, yt_amount, sy_change) = add_liquidity_keep_yt_from_sy(
                sy_coin,
                sy_to_mint_hint,
                min_lp_out,
                market,
                position,
                py_state,
                price_info,
                clock,
                ctx,
            );
            jitter_position::end_reward_mutation(position, lp_access);
            py_state::end_yt_reward_mutation(py_state, yt_access);
            pool::end_reward_operation(market, access);
            vector::destroy_empty(pool_settlements);
            vector::destroy_empty(yt_settlements);
            vector::destroy_empty(lp_settlements);
            let mut post_ops = vector[];
            vector::push_back(&mut post_ops, begin_post_yt_operation(distributor, position, ctx.sender()));
            vector::push_back(&mut post_ops, begin_post_lp_operation(distributor, position, ctx.sender()));
            vector::push_back(&mut post_ops, begin_post_pool_operation(distributor, market));
            (lp_amount, yt_amount, sy_change, post_ops)
        } else {
            assert_no_settlements(pool_settlements);
            assert_no_settlements(yt_settlements);
            assert_no_settlements(lp_settlements);
            let (lp_amount, yt_amount, sy_change) = add_liquidity_keep_yt_from_sy(
                sy_coin,
                sy_to_mint_hint,
                min_lp_out,
                market,
                position,
                py_state,
                price_info,
                clock,
                ctx,
            );
            (lp_amount, yt_amount, sy_change, vector[])
        }
    }

    /// Unified short entrypoint for LP removal.
    public fun remove_lp<SY: drop>(
        pool_settlements: vector<RewardSettlement>,
        lp_settlements: vector<RewardSettlement>,
        distributor: &RewardDistributor,
        lp_amount: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (Coin<SY>, u64, vector<RewardOperation>) {
        if (pool::reward_distributor_required(market)) {
            let mut pool_settlements = pool_settlements;
            let mut lp_settlements = lp_settlements;
            assert_reward_distributor_matches_pool(distributor, market);
            let access = pool::begin_reward_operation(
                market,
                take_one_settlement(&mut pool_settlements),
            );
            let lp_access = jitter_position::begin_reward_mutation(
                position,
                take_one_settlement(&mut lp_settlements),
                reward_distributor::id(distributor),
                ctx.sender(),
            );
            let (sy_coin, pt_amount) = remove_liquidity_to_position(
                lp_amount,
                market,
                position,
                clock,
                ctx,
            );
            jitter_position::end_reward_mutation(position, lp_access);
            pool::end_reward_operation(market, access);
            vector::destroy_empty(pool_settlements);
            vector::destroy_empty(lp_settlements);
            let mut post_ops = vector[];
            vector::push_back(&mut post_ops, begin_post_lp_operation(distributor, position, ctx.sender()));
            vector::push_back(&mut post_ops, begin_post_pool_operation(distributor, market));
            (sy_coin, pt_amount, post_ops)
        } else {
            assert_no_settlements(pool_settlements);
            assert_no_settlements(lp_settlements);
            let (sy_coin, pt_amount) = remove_liquidity_to_position(
                lp_amount,
                market,
                position,
                clock,
                ctx,
            );
            (sy_coin, pt_amount, vector[])
        }
    }

    /// Alias kept explicit for frontends that expose a Keep YT removal mode.
    public fun remove_lp_keep_yt<SY: drop>(
        pool_settlements: vector<RewardSettlement>,
        lp_settlements: vector<RewardSettlement>,
        distributor: &RewardDistributor,
        lp_amount: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (Coin<SY>, u64, vector<RewardOperation>) {
        remove_lp(
            pool_settlements,
            lp_settlements,
            distributor,
            lp_amount,
            market,
            position,
            clock,
            ctx,
        )
    }

    fun take_one_settlement(settlements: &mut vector<RewardSettlement>): RewardSettlement {
        assert!(vector::length(settlements) == 1, E_BAD_REWARD_SETTLEMENTS);
        vector::pop_back(settlements)
    }

    fun assert_no_settlements(settlements: vector<RewardSettlement>) {
        assert!(vector::length(&settlements) == 0, E_BAD_REWARD_SETTLEMENTS);
        vector::destroy_empty(settlements);
    }

    fun assert_pool_yt_reward_mode_match<SY: drop>(
        market: &Pool<SY>,
        py_state: &PyState<SY>,
    ) {
        assert!(
            pool::reward_distributor_required(market)
                == py_state::yt_reward_distributor_required(py_state),
            E_STATE_MISMATCH,
        );
    }

    fun assert_pool_orderbook_reward_mode_match<SY: drop, PT: drop>(
        market: &Pool<SY>,
        orderbook: &OrderBook<SY, PT>,
    ) {
        assert!(
            pool::reward_distributor_required(market)
                == orderbook::reward_distributor_required(orderbook),
            E_STATE_MISMATCH,
        );
    }

    fun assert_yt_route_match<SY: drop>(
        market: &Pool<SY>,
        position: &JitterPosition,
        py_state: &PyState<SY>,
    ) {
        jitter_position::assert_state_match(position, py_state::state_id(py_state));
        assert!(pool::py_state_id(market) == py_state::state_id(py_state), E_STATE_MISMATCH);
        assert!(jitter_position::market_id(position) == py_state::market_id(py_state), E_STATE_MISMATCH);
    }

    fun assert_reward_distributor_matches_py_state<SY: drop>(
        distributor: &RewardDistributor,
        py_state: &PyState<SY>,
    ) {
        assert!(
            reward_distributor::id(distributor) == py_state::yt_reward_distributor_id(py_state),
            E_STATE_MISMATCH,
        );
    }

    fun assert_reward_distributor_matches_pool<SY: drop>(
        distributor: &RewardDistributor,
        market: &Pool<SY>,
    ) {
        assert!(
            reward_distributor::id(distributor) == pool::reward_distributor_id(market),
            E_STATE_MISMATCH,
        );
    }

    fun assert_reward_distributor_matches_orderbook<SY: drop, PT: drop>(
        distributor: &RewardDistributor,
        orderbook: &OrderBook<SY, PT>,
    ) {
        assert!(
            reward_distributor::id(distributor) == orderbook::reward_distributor_id(orderbook),
            E_STATE_MISMATCH,
        );
    }

    fun begin_post_yt_operation(
        distributor: &RewardDistributor,
        position: &JitterPosition,
        owner: address,
    ): RewardOperation {
        reward_distributor::begin_yt_operation_for_profile(
            distributor,
            jitter_position::market_id(position),
            owner,
            object::id(position),
            jitter_position::yt_balance(position),
        )
    }

    fun begin_post_lp_operation(
        distributor: &RewardDistributor,
        position: &JitterPosition,
        owner: address,
    ): RewardOperation {
        reward_distributor::begin_lp_operation_for_profile(
            distributor,
            jitter_position::pool_id(position),
            owner,
            object::id(position),
            jitter_position::lp_amount(position),
        )
    }

    fun begin_post_pool_operation<SY: drop>(
        distributor: &RewardDistributor,
        market: &Pool<SY>,
    ): RewardOperation {
        reward_distributor::begin_pool_operation_for_profile(
            distributor,
            pool::pool_id(market),
            pool::pool_id(market),
            pool::lp_supply(market),
        )
    }

    fun begin_post_orderbook_operation<SY: drop, PT: drop>(
        distributor: &RewardDistributor,
        orderbook: &OrderBook<SY, PT>,
    ): RewardOperation {
        reward_distributor::begin_orderbook_operation_for_profile(
            distributor,
            orderbook::orderbook_id(orderbook),
            orderbook::orderbook_id(orderbook),
            orderbook::order_count(orderbook),
        )
    }

    fun observe_pool_index<SY: drop>(
        market: &Pool<SY>,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
    ): u128 {
        assert!(pool::py_state_id(market) == py_state::state_id(py_state), E_STATE_MISMATCH);
        let sy_index_raw = price_info::consume(
            price_info,
            pool::market_id(market),
            clock,
        );
        py_state::update_py_index(py_state, sy_index_raw, clock)
    }

    fun solve_sy_to_mint_for_keep_yt<SY: drop>(
        total_sy_in: u64,
        market: &Pool<SY>,
        py_state: &PyState<SY>,
    ): u64 {
        let py_index_raw = py_state::py_index_stored(py_state);
        let pool_sy = pool::total_sy(market);
        let pool_pt = pool::total_pt(market);
        let raw = if (pool_sy == 0 || pool_pt == 0) {
            full_math_u128::mul_div_floor(
                total_sy_in as u128,
                FP64_ONE,
                FP64_ONE + py_index_raw,
            )
        } else {
            full_math_u128::mul_div_floor(
                total_sy_in as u128,
                (pool_pt as u128) * FP64_ONE,
                ((pool_pt as u128) * FP64_ONE) + ((pool_sy as u128) * py_index_raw),
            )
        };
        let mut sy_to_mint = raw as u64;
        if (sy_to_mint == 0) {
            sy_to_mint = 1;
        };
        if (sy_to_mint >= total_sy_in) {
            sy_to_mint = total_sy_in - 1;
        };
        sy_to_mint
    }

    fun assert_market_route_match<SY: drop, PT: drop, YT: drop>(
        orderbook: &OrderBook<SY, PT>,
        market_obj: &Market<SY, PT, YT>,
        market: &Pool<SY>,
        position: &JitterPosition,
    ) {
        let market_id = pool::market_id(market);
        jitter_position::assert_state_match(position, pool::py_state_id(market));
        assert!(market::id(market_obj) == market_id, E_STATE_MISMATCH);
        assert!(jitter_position::market_id(position) == market_id, E_STATE_MISMATCH);
        orderbook::assert_market_match(orderbook, market_id);
    }

    fun mint_yt_and_sell_pt_for_sy<SY: drop>(
        sy_coin: Coin<SY>,
        min_yt_out: u64,
        min_sy_out: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, Coin<SY>) {
        assert_yt_route_match(market, position, py_state);

        let sy_index_raw = observe_pool_index(market, py_state, price_info, clock);
        let yt_out = py_state::mint_py_with_sy_index(
            sy_coin,
            sy_index_raw,
            position,
            py_state,
            clock,
        );
        assert!(yt_out >= min_yt_out, E_SLIPPAGE);

        jitter_position::sub_pt(position, yt_out);
        let sy_out_coin = pool::swap_pt_for_sy(
            yt_out,
            min_sy_out,
            market,
            sy_index_raw,
            clock,
            ctx,
        );

        (yt_out, sy_out_coin)
    }

    fun sell_yt_for_sy_with_pt_settlement<SY: drop>(
        yt_amount: u64,
        min_sy_out: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (Coin<SY>, u64) {
        assert_yt_route_match(market, position, py_state);
        assert!(yt_amount > 0, E_ZERO_AMOUNT);

        assert!(pool::total_pt(market) > yt_amount, E_SLIPPAGE);

        // Pendle-style YT sell: burn the caller's YT together with an external
        // PT leg supplied by the pool, redeem to SY, then use part of that SY to
        // settle the PT leg against the AMM in the same transaction.
        let (sy_coin, receipt) = py_state::redeem_yt_with_external_pt_before_expiry(
            yt_amount,
            price_info,
            position,
            py_state,
            clock,
            ctx,
        );
        let gross_sy_out = coin::value(&sy_coin);
        assert!(gross_sy_out >= min_sy_out, E_SLIPPAGE);

        let max_sy_repay = gross_sy_out - min_sy_out;
        let (sy_repaid, sy_change) = pool::swap_sy_for_exact_pt(
            sy_coin,
            yt_amount,
            max_sy_repay,
            market,
            py_state::py_index_stored(py_state),
            clock,
            ctx,
        );
        py_state::settle_external_pt_redeem(py_state, receipt, yt_amount);
        assert!(coin::value(&sy_change) >= min_sy_out, E_SLIPPAGE);

        (sy_change, sy_repaid)
    }


    // ===========================================
    // SY -> PT Through the AMM
    // ===========================================

    /// Buy PT with SY through the AMM.
    public fun swap_sy_for_pt<SY: drop>(
        sy_coin: Coin<SY>,
        min_pt_out: u64,
        market: &mut Pool<SY>,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, Coin<SY>) {
        let sy_index_raw = observe_pool_index(market, py_state, price_info, clock);
        let (pt_out, sy_used, sy_change) = pool::swap_sy_for_pt(
            sy_coin, min_pt_out, market, sy_index_raw, clock, ctx,
        );

        sui::event::emit(RouterSwapEvent {
            user: ctx.sender(),
            direction: 0,
            amount_in: sy_used,
            amount_out: pt_out,
        });

        (pt_out, sy_change)
    }

    public fun swap_sy_for_exact_pt<SY: drop>(
        sy_coin: Coin<SY>,
        pt_out: u64,
        max_sy_in: u64,
        market: &mut Pool<SY>,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, Coin<SY>) {
        let sy_index_raw = observe_pool_index(market, py_state, price_info, clock);
        let (sy_used, sy_change) = pool::swap_sy_for_exact_pt(
            sy_coin,
            pt_out,
            max_sy_in,
            market,
            sy_index_raw,
            clock,
            ctx,
        );

        sui::event::emit(RouterSwapEvent {
            user: ctx.sender(),
            direction: 0,
            amount_in: sy_used,
            amount_out: pt_out,
        });

        (sy_used, sy_change)
    }

    /// Sell PT for SY through the AMM.
    public(package) fun swap_pt_for_sy<SY: drop>(
        pt_amount: u64,
        min_sy_out: u64,
        market: &mut Pool<SY>,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): Coin<SY> {
        let sy_index_raw = observe_pool_index(market, py_state, price_info, clock);
        let sy_coin = pool::swap_pt_for_sy(
            pt_amount, min_sy_out, market, sy_index_raw, clock, ctx,
        );

        sui::event::emit(RouterSwapEvent {
            user: ctx.sender(),
            direction: 1,
            amount_in: pt_amount,
            amount_out: coin::value(&sy_coin),
        });

        sy_coin
    }

    public(package) fun swap_pt_for_exact_sy<SY: drop>(
        sy_out: u64,
        max_pt_in: u64,
        market: &mut Pool<SY>,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, Coin<SY>) {
        let sy_index_raw = observe_pool_index(market, py_state, price_info, clock);
        let (pt_in, sy_coin) = pool::swap_pt_for_exact_sy(
            sy_out,
            max_pt_in,
            market,
            sy_index_raw,
            clock,
            ctx,
        );

        sui::event::emit(RouterSwapEvent {
            user: ctx.sender(),
            direction: 1,
            amount_in: pt_in,
            amount_out: sy_out,
        });

        (pt_in, sy_coin)
    }

    // ===========================================
    // Liquidity
    // ===========================================

    /// Add dual-sided liquidity: `SY + PT -> LP`.
    public(package) fun add_liquidity<SY: drop>(
        sy_coin: Coin<SY>,
        pt_amount: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        price_info: PriceInfo<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (u64, u64, Coin<SY>) {
        let sy_index_raw = observe_pool_index(market, py_state, price_info, clock);
        let (lp_amount, _, pt_used, sy_change) = pool::add_liquidity(
            sy_coin, pt_amount, market, position, sy_index_raw, clock,
            ctx,
        );
        (lp_amount, pt_used, sy_change)
    }

    /// Remove liquidity: `LP -> SY + PT`.
    public fun remove_liquidity<SY: drop>(
        lp_amount: u64,
        market: &mut Pool<SY>,
        position: &mut JitterPosition,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (Coin<SY>, u64) {
        pool::remove_liquidity(
            lp_amount, market, position, clock, ctx,
        )
    }

    // ===========================================
    // Redemption
    // ===========================================

    /// Redeem PT and YT for SY before expiry.
    public fun redeem_before_expiry<SY: drop>(
        pt_amount: u64,
        price_info: PriceInfo<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): Coin<SY> {
        py_state::redeem_py_before_expiry(
            pt_amount, price_info, position, py_state, clock, ctx,
        )
    }

    public fun redeem_before_expiry_after_yt_reward_settlement<SY: drop>(
        yt_settlement: RewardSettlement,
        distributor: &RewardDistributor,
        pt_amount: u64,
        price_info: PriceInfo<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): (Coin<SY>, RewardOperation) {
        assert_reward_distributor_matches_py_state(distributor, py_state);
        let yt_access = py_state::begin_yt_reward_mutation(
            py_state,
            yt_settlement,
            ctx.sender(),
            object::id(position),
        );
        let sy_coin = redeem_before_expiry(
            pt_amount,
            price_info,
            position,
            py_state,
            clock,
            ctx,
        );
        py_state::end_yt_reward_mutation(py_state, yt_access);
        (sy_coin, begin_post_yt_operation(distributor, position, ctx.sender()))
    }

    /// Redeem PT for SY after expiry.
    public fun redeem_after_expiry<SY: drop>(
        pt_amount: u64,
        price_info: PriceInfo<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): Coin<SY> {
        py_state::redeem_py_after_expiry(
            pt_amount, price_info, position, py_state, clock, ctx,
        )
    }

    /// Claim accrued YT interest in SY.
    public fun claim_yt_interest<SY: drop>(
        price_info: PriceInfo<SY>,
        position: &mut JitterPosition,
        py_state: &mut PyState<SY>,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext,
    ): Coin<SY> {
        py_state::claim_interest(
            price_info, position, py_state, clock, ctx,
        )
    }

}
