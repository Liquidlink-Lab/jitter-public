/// pool - PT/SY AMM pool state and transitions.
///
/// `Pool<T>` is the shared object for a single PT/SY pool. Each pool is
/// bound to one `PyState` with the same SY type and expiry.
///
/// The pool tracks:
///   - SY balance
///   - virtual PT inventory via `total_pt`
///   - total LP supply
///   - curve parameters such as `scalar_root`, `initial_anchor`, and fee rate
///
/// Compared with the earlier Nemo-inspired layout, this version keeps farming
/// state separate, books fees directly into SY, and computes transient cache
/// values with pure helpers instead of storing extra structs.
module jitter::pool;

// ===========================================
// Standard Library Imports
// ===========================================
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::dynamic_field as df;

// ===========================================
// Internal Package Imports
// ===========================================
use jitter::amm_math;
use jitter::jitter_position::{Self, JitterPosition};

use jitter::py_state::{Self, PyState};
use jitter::market::{Self, Market};
use jitter::reward_distributor::{Self, RewardSettlement};

// ===========================================
// Jitter Package Imports
// ===========================================
use jitter_admin::admin::AdminCap;
use jitter_admin::acl::ACL;
use jitter_math::fixed_point64::{Self, FixedPoint64};
use jitter_math::fixed_point64_with_sign::{Self, FixedPoint64WithSign};
use jitter_math::full_math_u128;

// ===========================================
//  Error Codes
// ===========================================

const E_ZERO_AMOUNT: u64 = 1500;
const E_INSUFFICIENT_SY: u64 = 1501;
const E_INSUFFICIENT_PT: u64 = 1502;
const E_INSUFFICIENT_LP: u64 = 1503;
const E_POOL_PAUSED: u64 = 1700;
const E_EXPIRED: u64 = 1701;
const E_INSUFFICIENT_OUTPUT: u64 = 1703;
const E_SLIPPAGE: u64 = 1704;
const E_TRADE_KIND: u64 = 1709;
const E_REWARD_DISTRIBUTOR_REQUIRED: u64 = 1710;
const E_REWARD_GATE_OPEN: u64 = 1711;
const E_REWARD_GATE_CLOSED: u64 = 1712;
const E_POOL_REWARD_GATE_MISMATCH: u64 = 1713;
const E_REWARD_DISTRIBUTOR_MISMATCH: u64 = 1714;
const E_MARKET_STATE_MISMATCH: u64 = 1715;
const E_MARKET_CAP_EXCEEDED: u64 = 1716;

/// FP64 representation of 1.0.
const FP64_ONE: u128 = 1 << 64;
/// Bootstrap floor for annualized `ln(implied_rate)` so balanced demo pools
/// do not start from a zero-rate state that rejects `SY -> PT` quotes.
const MIN_BOOTSTRAP_LN_IMPLIED_RATE_RAW: u128 = FP64_ONE / 10;
const MINIMUM_LIQUIDITY: u64 = 1;
const TRADE_EXACT_PT_FOR_SY: u8 = 0;
const TRADE_PT_FOR_EXACT_SY: u8 = 1;
const TRADE_EXACT_SY_FOR_PT: u8 = 2;
const TRADE_SY_FOR_EXACT_PT: u8 = 3;

// ===========================================
// Core Struct
// ===========================================

/// Shared PT/SY AMM pool state.
/// `T` is the SY coin type.
public struct Pool<phantom T: drop> has key, store {
    id: UID,
    /// Bound `PyState` object ID.
    py_state_id: ID,
    /// Bound `Market` ID
    market_id: ID,
    /// Expiry timestamp in milliseconds.
    expiry: u64,
    /// Virtual PT inventory tracked by the AMM.
    total_pt: u64,
    /// SY balance held by the pool.
    total_sy: Balance<T>,
    /// Protocol/reserve fee vault carved out of swap fees.
    reserve_fee_vault: Balance<T>,
    /// Total LP supply.
    lp_supply: u64,
    /// Last `ln(implied_rate)` snapshot, stored as FP64 raw.
    last_ln_implied_rate: FixedPoint64,
    /// `scalar_root` curve parameter, stored as signed FP64.
    scalar_root: FixedPoint64WithSign,
    /// `initial_anchor` curve parameter, stored as signed FP64.
    initial_anchor: FixedPoint64WithSign,
    /// Fee rate as `ln(1 + fee%)`, stored as unsigned FP64 raw.
    ln_fee_rate_root: FixedPoint64,
    /// Treasury address that can receive collected reserve fees.
    treasury: address,
    /// Protocol share of AMM swap fees, stored as FP64 raw.
    protocol_fee_rate: FixedPoint64,
    /// Maximum raw SY allowed in the pool. `0` disables the cap.
    market_cap: u64,
    /// Whether swaps and liquidity actions are normally paused.
    paused: bool,
    /// Emergency pause is independent from normal pause and requires a
    /// dedicated recovery path.
    emergency_paused: bool,
}

/// Package-local receipt proving a reward wrapper opened the pool mutation gate.
public struct RewardPoolOperation {
    pool_id: ID,
    distributor_id: ID,
}

public struct RewardRequiredKey() has copy, drop, store;

public struct RewardGateKey() has copy, drop, store;

public struct RewardRequired has store {
    distributor_id: ID,
}

// ===========================================
// Events
// ===========================================

public struct PoolCreatedEvent has copy, drop {
    pool_id: ID,
    py_state_id: ID,
    expiry: u64,
}

public struct RewardDistributorRequiredEvent has copy, drop {
    pool_id: ID,
    distributor_id: ID,
}

public struct SwapEvent has copy, drop {
    pool_id: ID,
    is_pt_to_sy: bool,
    amount_in: u64,
    amount_out: u64,
    fee: u64,
    reserve_fee: u64,
    trader: address,
}

public struct AddLiquidityEvent has copy, drop {
    pool_id: ID,
    position_id: ID,
    sy_amount: u64,
    pt_amount: u64,
    lp_amount: u64,
    locked_lp_amount: u64,
    sy_refund: u64,
    pt_refund: u64,
}

public struct RemoveLiquidityEvent has copy, drop {
    pool_id: ID,
    position_id: ID,
    sy_amount: u64,
    pt_amount: u64,
    lp_amount: u64,
    provider: address,
}

/// Emitted every time `last_ln_implied_rate` is recomputed (on every swap
/// and initial liquidity). Indexers use this to build a true historical APY
/// curve without devInspect replay.
public struct ImpliedRateUpdatedEvent has copy, drop {
    pool_id: ID,
    ln_implied_rate_raw: u128,
    pt_price_raw: u128,
    total_pt: u64,
    total_sy: u64,
    lp_supply: u64,
}

/// Emitted whenever pool pause status flips. Frontends / indexers listen
/// to this to disable trade UI and surface banners without polling state.
public struct PoolPauseStatusChangedEvent has copy, drop {
    pool_id: ID,
    paused: bool,
    actor: address,
}

public struct PoolEmergencyPausedEvent has copy, drop {
    pool_id: ID,
    actor: address,
    reason: vector<u8>,
}

public struct PoolEmergencyPauseStatusChangedEvent has copy, drop {
    pool_id: ID,
    emergency_paused: bool,
    actor: address,
    reason: vector<u8>,
}

public struct ReserveFeeCollectedEvent has copy, drop {
    pool_id: ID,
    treasury: address,
    amount: u64,
    collector: address,
}

public struct MarketCapUpdatedEvent has copy, drop {
    pool_id: ID,
    market_cap: u64,
    actor: address,
}

public struct TradeResult has copy, drop {
    is_pt_to_sy: bool,
    amount_in: u64,
    amount_out: u64,
    sy_amount: u64,
    pt_amount: u64,
    fee: u64,
    reserve_fee: u64,
    new_ln_implied_rate: FixedPoint64,
    time_to_expiry_ms: u64,
}

/// Create and share a new pool with embedded AMM parameters.
#[allow(lint(share_owned))]
public fun create_pool_by_admin<SY: drop, PT: drop, YT: drop>(
    py_state: &PyState<SY>,
    market: &Market<SY, PT, YT>,
    _admin_cap: &AdminCap,
    scalar_root: FixedPoint64WithSign,
    initial_anchor: FixedPoint64WithSign,
    ln_fee_rate_root: FixedPoint64,
    treasury: address,
    protocol_fee_rate: FixedPoint64,
    expiry: u64,
    ctx: &mut TxContext,
) {
    let state = create_pool_internal<SY, PT, YT>(
        py_state,
        market,
        expiry,
        scalar_root,
        initial_anchor,
        ln_fee_rate_root,
        treasury,
        protocol_fee_rate,
        0,
        ctx,
    );

    sui::event::emit(PoolCreatedEvent {
        pool_id: object::id(&state),
        py_state_id: py_state::id(py_state),
        expiry,
    });

    transfer::share_object(state);
}

/// Create and share a new pool with a raw-SY market cap. A cap of `0`
/// disables the guard.
#[allow(lint(share_owned))]
public fun create_pool_with_market_cap_by_admin<SY: drop, PT: drop, YT: drop>(
    py_state: &PyState<SY>,
    market: &Market<SY, PT, YT>,
    _admin_cap: &AdminCap,
    scalar_root: FixedPoint64WithSign,
    initial_anchor: FixedPoint64WithSign,
    ln_fee_rate_root: FixedPoint64,
    treasury: address,
    protocol_fee_rate: FixedPoint64,
    market_cap: u64,
    expiry: u64,
    ctx: &mut TxContext,
) {
    let state = create_pool_internal<SY, PT, YT>(
        py_state,
        market,
        expiry,
        scalar_root,
        initial_anchor,
        ln_fee_rate_root,
        treasury,
        protocol_fee_rate,
        market_cap,
        ctx,
    );

    sui::event::emit(PoolCreatedEvent {
        pool_id: object::id(&state),
        py_state_id: py_state::id(py_state),
        expiry,
    });

    transfer::share_object(state);
}

// ===========================================
// Swaps
// ===========================================

fun execute_trade_core<T: drop>(
    state: &Pool<T>,
    trade_kind: u8,
    amount: u64,
    limit_amount: u64,
    sy_index_raw: u128,
    clock: &sui::clock::Clock,
): TradeResult {
    assert!(!is_paused(state), E_POOL_PAUSED);
    let now = sui::clock::timestamp_ms(clock);
    assert!(expiry(state) > now, E_EXPIRED);
    assert!(amount > 0, E_ZERO_AMOUNT);

    let time_to_expiry_ms = expiry(state) - now;
    if (trade_kind == TRADE_EXACT_PT_FOR_SY) {
        let (sy_out, fee, new_ln_implied_rate) = amm_math::quote_exact_pt_for_sy_indexed(
            total_pt(state),
            total_sy(state),
            sy_index_raw,
            last_ln_implied_rate(state),
            scalar_root(state),
            initial_anchor(state),
            ln_fee_rate_root(state),
            amount,
            time_to_expiry_ms,
        );
        assert!(sy_out >= limit_amount, E_SLIPPAGE);
        assert!(sy_out > 0, E_INSUFFICIENT_OUTPUT);
        return TradeResult {
            is_pt_to_sy: true,
            amount_in: amount,
            amount_out: sy_out,
            sy_amount: sy_out,
            pt_amount: amount,
            fee,
            reserve_fee: reserve_fee_from_fee(state, fee),
            new_ln_implied_rate,
            time_to_expiry_ms,
        }
    };

    if (trade_kind == TRADE_PT_FOR_EXACT_SY) {
        let (pt_in, fee, new_ln_implied_rate) = amm_math::quote_pt_for_exact_sy_indexed(
            total_pt(state),
            total_sy(state),
            sy_index_raw,
            last_ln_implied_rate(state),
            scalar_root(state),
            initial_anchor(state),
            ln_fee_rate_root(state),
            amount,
            time_to_expiry_ms,
        );
        assert!(pt_in > 0, E_INSUFFICIENT_OUTPUT);
        assert!(pt_in <= limit_amount, E_SLIPPAGE);
        return TradeResult {
            is_pt_to_sy: true,
            amount_in: pt_in,
            amount_out: amount,
            sy_amount: amount,
            pt_amount: pt_in,
            fee,
            reserve_fee: reserve_fee_from_fee(state, fee),
            new_ln_implied_rate,
            time_to_expiry_ms,
        }
    };

    if (trade_kind == TRADE_EXACT_SY_FOR_PT) {
        let (pt_out, sy_used, fee, new_ln_implied_rate) = amm_math::quote_exact_sy_for_pt_indexed(
            total_pt(state),
            total_sy(state),
            sy_index_raw,
            last_ln_implied_rate(state),
            scalar_root(state),
            initial_anchor(state),
            ln_fee_rate_root(state),
            amount,
            time_to_expiry_ms,
        );
        assert!(pt_out >= limit_amount, E_SLIPPAGE);
        assert!(pt_out > 0, E_INSUFFICIENT_OUTPUT);
        return TradeResult {
            is_pt_to_sy: false,
            amount_in: sy_used,
            amount_out: pt_out,
            sy_amount: sy_used,
            pt_amount: pt_out,
            fee,
            reserve_fee: reserve_fee_from_fee(state, fee),
            new_ln_implied_rate,
            time_to_expiry_ms,
        }
    };

    if (trade_kind == TRADE_SY_FOR_EXACT_PT) {
        let (sy_in, fee, new_ln_implied_rate) = amm_math::quote_sy_for_exact_pt_indexed(
            total_pt(state),
            total_sy(state),
            sy_index_raw,
            last_ln_implied_rate(state),
            scalar_root(state),
            initial_anchor(state),
            ln_fee_rate_root(state),
            amount,
            time_to_expiry_ms,
        );
        assert!(sy_in > 0, E_INSUFFICIENT_OUTPUT);
        assert!(sy_in <= limit_amount, E_SLIPPAGE);
        return TradeResult {
            is_pt_to_sy: false,
            amount_in: sy_in,
            amount_out: amount,
            sy_amount: sy_in,
            pt_amount: amount,
            fee,
            reserve_fee: reserve_fee_from_fee(state, fee),
            new_ln_implied_rate,
            time_to_expiry_ms,
        }
    };

    abort E_TRADE_KIND
}

public(package) fun swap_pt_for_sy<T: drop>(
    pt_amount: u64,
    min_sy_out: u64,
    state: &mut Pool<T>,
    sy_index_raw: u128,
    clock: &sui::clock::Clock,
    ctx: &mut TxContext,
): Coin<T> {
    assert_pool_mutation_allowed(state);
    let result = execute_trade_core(
        state,
        TRADE_EXACT_PT_FOR_SY,
        pt_amount,
        min_sy_out,
        sy_index_raw,
        clock,
    );

    add_pt(state, result.pt_amount);
    let sy_coin = split_sy(state, result.sy_amount, ctx);
    collect_reserve_fee_from_pool(state, result.reserve_fee);
    set_last_ln_implied_rate(
        state,
        result.new_ln_implied_rate,
        result.time_to_expiry_ms,
        sy_index_raw,
    );

    sui::event::emit(SwapEvent {
        pool_id: pool_id(state),
        is_pt_to_sy: result.is_pt_to_sy,
        amount_in: result.amount_in,
        amount_out: result.amount_out,
        fee: result.fee,
        reserve_fee: result.reserve_fee,
        trader: ctx.sender(),
    });

    sy_coin
}

public(package) fun swap_pt_for_exact_sy<T: drop>(
    sy_out: u64,
    max_pt_in: u64,
    state: &mut Pool<T>,
    sy_index_raw: u128,
    clock: &sui::clock::Clock,
    ctx: &mut TxContext,
): (u64, Coin<T>) {
    assert_pool_mutation_allowed(state);
    let result = execute_trade_core(
        state,
        TRADE_PT_FOR_EXACT_SY,
        sy_out,
        max_pt_in,
        sy_index_raw,
        clock,
    );

    add_pt(state, result.pt_amount);
    let sy_coin = split_sy(state, result.sy_amount, ctx);
    collect_reserve_fee_from_pool(state, result.reserve_fee);
    set_last_ln_implied_rate(
        state,
        result.new_ln_implied_rate,
        result.time_to_expiry_ms,
        sy_index_raw,
    );

    sui::event::emit(SwapEvent {
        pool_id: pool_id(state),
        is_pt_to_sy: result.is_pt_to_sy,
        amount_in: result.amount_in,
        amount_out: result.amount_out,
        fee: result.fee,
        reserve_fee: result.reserve_fee,
        trader: ctx.sender(),
    });

    (result.pt_amount, sy_coin)
}

public(package) fun swap_sy_for_pt<T: drop>(
    sy_coin: Coin<T>,
    min_pt_out: u64,
    state: &mut Pool<T>,
    sy_index_raw: u128,
    clock: &sui::clock::Clock,
    ctx: &mut TxContext,
): (u64, u64, Coin<T>) {
    assert_pool_mutation_allowed(state);
    let sy_in = coin::value(&sy_coin);
    let result = execute_trade_core(
        state,
        TRADE_EXACT_SY_FOR_PT,
        sy_in,
        min_pt_out,
        sy_index_raw,
        clock,
    );

    let mut sy_coin = sy_coin;
    let sy_to_pool = coin::split(&mut sy_coin, result.sy_amount, ctx);
    join_sy(state, sy_to_pool);
    remove_pt(state, result.pt_amount);
    collect_reserve_fee_from_pool(state, result.reserve_fee);
    check_market_cap(state);
    set_last_ln_implied_rate(
        state,
        result.new_ln_implied_rate,
        result.time_to_expiry_ms,
        sy_index_raw,
    );

    sui::event::emit(SwapEvent {
        pool_id: pool_id(state),
        is_pt_to_sy: result.is_pt_to_sy,
        amount_in: result.amount_in,
        amount_out: result.amount_out,
        fee: result.fee,
        reserve_fee: result.reserve_fee,
        trader: ctx.sender(),
    });

    (result.pt_amount, result.sy_amount, sy_coin)
}

public(package) fun swap_sy_for_exact_pt<T: drop>(
    mut sy_coin: Coin<T>,
    pt_out: u64,
    max_sy_in: u64,
    state: &mut Pool<T>,
    sy_index_raw: u128,
    clock: &sui::clock::Clock,
    ctx: &mut TxContext,
): (u64, Coin<T>) {
    assert_pool_mutation_allowed(state);
    let result = execute_trade_core(
        state,
        TRADE_SY_FOR_EXACT_PT,
        pt_out,
        max_sy_in,
        sy_index_raw,
        clock,
    );

    assert!(coin::value(&sy_coin) >= result.sy_amount, E_SLIPPAGE);

    let sy_to_pool = coin::split(&mut sy_coin, result.sy_amount, ctx);
    join_sy(state, sy_to_pool);
    remove_pt(state, result.pt_amount);
    collect_reserve_fee_from_pool(state, result.reserve_fee);
    check_market_cap(state);
    set_last_ln_implied_rate(
        state,
        result.new_ln_implied_rate,
        result.time_to_expiry_ms,
        sy_index_raw,
    );

    sui::event::emit(SwapEvent {
        pool_id: pool_id(state),
        is_pt_to_sy: result.is_pt_to_sy,
        amount_in: result.amount_in,
        amount_out: result.amount_out,
        fee: result.fee,
        reserve_fee: result.reserve_fee,
        trader: ctx.sender(),
    });

    (result.sy_amount, sy_coin)
}

// ===========================================
// Liquidity
// ===========================================

public(package) fun add_liquidity<T: drop>(
    mut sy_coin: Coin<T>,
    pt_amount: u64,
    state: &mut Pool<T>,
    position: &mut JitterPosition,
    sy_index_raw: u128,
    clock: &sui::clock::Clock,
    ctx: &mut TxContext,
): (u64, u64, u64, Coin<T>) {
    assert_pool_mutation_allowed(state);
    assert!(!is_paused(state), E_POOL_PAUSED);
    let now = sui::clock::timestamp_ms(clock);
    assert!(expiry(state) > now, E_EXPIRED);
    jitter_position::bind_pool_if_empty(position, pool_id(state));
    jitter_position::assert_pool_match(position, pool_id(state));
    assert_lp_reward_mutation_allowed(state, position);

    let sy_amount = coin::value(&sy_coin);
    assert!(sy_amount > 0 && pt_amount > 0, E_ZERO_AMOUNT);

    let is_initial_liquidity = lp_supply(state) == 0;
    let (lp_amount, locked_lp_amount, sy_used, pt_used, sy_change) =
        if (is_initial_liquidity) {
            let total_lp_to_mint = amm_math::calc_lp_amount(
                0,
                0,
                0,
                sy_amount,
                pt_amount,
            );
            assert!(total_lp_to_mint > MINIMUM_LIQUIDITY, E_ZERO_AMOUNT);
            let lp_amount = total_lp_to_mint - MINIMUM_LIQUIDITY;
            let sy_change = coin::from_balance(balance::zero(), ctx);
            join_sy(state, sy_coin);
            add_pt(state, pt_amount);
            mint_lp(state, total_lp_to_mint);
            jitter_position::add_lp(position, lp_amount);
            check_market_cap(state);
            (lp_amount, MINIMUM_LIQUIDITY, sy_amount, pt_amount, sy_change)
        } else {
            let total_lp_before = lp_supply(state);
            let total_sy_before = total_sy(state);
            let total_pt_before = total_pt(state);
            assert!(total_sy_before > 0 && total_pt_before > 0, E_ZERO_AMOUNT);
            let lp_amount = amm_math::calc_lp_amount(
                total_lp_before,
                total_sy_before,
                total_pt_before,
                sy_amount,
                pt_amount,
            );
            assert!(lp_amount > 0, E_ZERO_AMOUNT);
            let sy_used = full_math_u128::mul_div_ceil(
                lp_amount as u128,
                total_sy_before as u128,
                total_lp_before as u128,
            ) as u64;
            let pt_used = full_math_u128::mul_div_ceil(
                lp_amount as u128,
                total_pt_before as u128,
                total_lp_before as u128,
            ) as u64;
            assert!(sy_used <= sy_amount && pt_used <= pt_amount, E_SLIPPAGE);
            let sy_to_pool = coin::split(&mut sy_coin, sy_used, ctx);
            join_sy(state, sy_to_pool);
            add_pt(state, pt_used);
            mint_lp(state, lp_amount);
            jitter_position::add_lp(position, lp_amount);
            check_market_cap(state);
            (lp_amount, 0, sy_used, pt_used, sy_coin)
        };

    if (is_initial_liquidity) {
        let time_to_expiry_ms = expiry(state) - now;
        let total_sy_asset = amm_math::sy_to_asset_amount(total_sy(state), sy_index_raw);
        let initial_ln_implied_rate = amm_math::get_initial_ln_implied_rate(
            total_pt(state),
            total_sy_asset,
            scalar_root(state),
            initial_anchor(state),
            time_to_expiry_ms,
        );
        set_last_ln_implied_rate(
            state,
            bootstrap_ln_implied_rate(initial_ln_implied_rate),
            time_to_expiry_ms,
            sy_index_raw,
        );
    };

    sui::event::emit(AddLiquidityEvent {
        pool_id: pool_id(state),
        position_id: object::id(position),
        sy_amount: sy_used,
        pt_amount: pt_used,
        lp_amount,
        locked_lp_amount,
        sy_refund: coin::value(&sy_change),
        pt_refund: pt_amount - pt_used,
    });

    (lp_amount, sy_used, pt_used, sy_change)
}

public(package) fun remove_liquidity<T: drop>(
    lp_amount_value: u64,
    state: &mut Pool<T>,
    position: &mut JitterPosition,
    _clock: &sui::clock::Clock,
    ctx: &mut TxContext,
): (Coin<T>, u64) {
    assert_pool_mutation_allowed(state);
    assert!(!is_paused(state), E_POOL_PAUSED);
    jitter_position::assert_pool_match(position, pool_id(state));
    assert_lp_reward_mutation_allowed(state, position);
    assert!(lp_amount_value > 0, E_ZERO_AMOUNT);

    let total_lp = lp_supply(state);
    let total_sy_amount = total_sy(state);
    let total_pt_amount = total_pt(state);

    let sy_out = (((lp_amount_value as u128) * (total_sy_amount as u128) / (total_lp as u128)) as u64);
    let pt_out = (((lp_amount_value as u128) * (total_pt_amount as u128) / (total_lp as u128)) as u64);

    burn_lp(state, lp_amount_value);
    remove_pt(state, pt_out);
    let sy_coin = split_sy(state, sy_out, ctx);
    jitter_position::sub_lp(position, lp_amount_value);

    sui::event::emit(RemoveLiquidityEvent {
        pool_id: pool_id(state),
        position_id: object::id(position),
        sy_amount: sy_out,
        pt_amount: pt_out,
        lp_amount: lp_amount_value,
        provider: ctx.sender(),
    });

    (sy_coin, pt_out)
}

// ===========================================
// SY Helpers - package internal
// ===========================================

public(package) fun join_sy<T: drop>(state: &mut Pool<T>, coin: Coin<T>) {
    balance::join(&mut state.total_sy, coin::into_balance(coin));
}

public(package) fun split_sy<T: drop>(
    state: &mut Pool<T>,
    amount: u64,
    ctx: &mut TxContext,
): Coin<T> {
    assert!(balance::value(&state.total_sy) >= amount, E_INSUFFICIENT_SY);
    coin::from_balance(balance::split(&mut state.total_sy, amount), ctx)
}

fun reserve_fee_from_fee<T: drop>(state: &Pool<T>, fee: u64): u64 {
    let protocol_fee_rate_raw = fixed_point64::get_raw_value(state.protocol_fee_rate);
    if (fee == 0 || protocol_fee_rate_raw == 0) {
        return 0
    };
    let amount = full_math_u128::mul_div_floor(
        fee as u128,
        protocol_fee_rate_raw,
        FP64_ONE,
    ) as u64;
    if (amount > fee) { fee } else { amount }
}

fun collect_reserve_fee_from_pool<T: drop>(state: &mut Pool<T>, amount: u64) {
    if (amount == 0) {
        return
    };
    assert!(balance::value(&state.total_sy) >= amount, E_INSUFFICIENT_SY);
    let reserve_fee = balance::split(&mut state.total_sy, amount);
    balance::join(&mut state.reserve_fee_vault, reserve_fee);
}

fun collect_reserve_fees<T: drop>(
    state: &mut Pool<T>,
    ctx: &mut TxContext,
): Coin<T> {
    let amount = balance::value(&state.reserve_fee_vault);
    let reserve_fee = if (amount == 0) {
        balance::zero()
    } else {
        balance::split(&mut state.reserve_fee_vault, amount)
    };
    sui::event::emit(ReserveFeeCollectedEvent {
        pool_id: pool_id(state),
        treasury: state.treasury,
        amount,
        collector: ctx.sender(),
    });
    coin::from_balance(reserve_fee, ctx)
}

// ===========================================
// PT Helpers - package internal
// ===========================================

public(package) fun add_pt<T: drop>(state: &mut Pool<T>, amount: u64) {
    state.total_pt = state.total_pt + amount;
}

public(package) fun remove_pt<T: drop>(state: &mut Pool<T>, amount: u64) {
    assert!(state.total_pt >= amount, E_INSUFFICIENT_PT);
    state.total_pt = state.total_pt - amount;
}

// ===========================================
// LP Helpers - package internal
// ===========================================

public(package) fun mint_lp<T: drop>(state: &mut Pool<T>, amount: u64) {
    state.lp_supply = state.lp_supply + amount;
}

public(package) fun burn_lp<T: drop>(state: &mut Pool<T>, amount: u64) {
    assert!(state.lp_supply >= amount, E_INSUFFICIENT_LP);
    state.lp_supply = state.lp_supply - amount;
}

fun bootstrap_ln_implied_rate(value: FixedPoint64): FixedPoint64 {
    fixed_point64::max(
        value,
        fixed_point64::create_from_raw_value(MIN_BOOTSTRAP_LN_IMPLIED_RATE_RAW),
    )
}

// ===========================================
// Curve Parameter Updates - package internal
// ===========================================

public(package) fun set_last_ln_implied_rate<T: drop>(
    state: &mut Pool<T>,
    rate: FixedPoint64,
    time_to_expiry_ms: u64,
    sy_index_raw: u128,
) {
    state.last_ln_implied_rate = rate;
    let total_sy = balance::value(&state.total_sy);
    let pt_price_raw = if (state.total_pt == 0 || total_sy == 0 || time_to_expiry_ms == 0) {
        FP64_ONE
    } else {
        amm_math::spot_pt_price_in_sy_indexed(
            state.total_pt,
            total_sy,
            sy_index_raw,
            rate,
            state.scalar_root,
            state.initial_anchor,
            time_to_expiry_ms,
        )
    };

    sui::event::emit(ImpliedRateUpdatedEvent {
        pool_id: pool_id(state),
        ln_implied_rate_raw: fixed_point64::get_raw_value(rate),
        pt_price_raw,
        total_pt: state.total_pt,
        total_sy,
        lp_supply: state.lp_supply,
    });
}

public(package) fun set_paused<T: drop>(state: &mut Pool<T>, paused: bool) {
    state.paused = paused;
}

public(package) fun set_emergency_paused<T: drop>(
    state: &mut Pool<T>,
    emergency_paused: bool,
) {
    state.emergency_paused = emergency_paused;
}

public(package) fun require_reward_distributor<T: drop>(
    state: &mut Pool<T>,
    distributor_id: ID,
) {
    assert!(!reward_gate_open(state), E_REWARD_GATE_OPEN);
    if (!reward_distributor_required(state)) {
        df::add(&mut state.id, RewardRequiredKey(), RewardRequired { distributor_id });
    } else {
        let required = df::borrow_mut<RewardRequiredKey, RewardRequired>(
            &mut state.id,
            RewardRequiredKey(),
        );
        required.distributor_id = distributor_id;
    };
    sui::event::emit(RewardDistributorRequiredEvent {
        pool_id: pool_id(state),
        distributor_id,
    });
}

public(package) fun begin_reward_operation<T: drop>(
    state: &mut Pool<T>,
    settlement: RewardSettlement,
): RewardPoolOperation {
    assert!(reward_distributor_required(state), E_REWARD_DISTRIBUTOR_REQUIRED);
    assert!(!reward_gate_open(state), E_REWARD_GATE_OPEN);
    let pool_id = pool_id(state);
    let distributor_id = reward_distributor::consume_pool_settlement(
        settlement,
        reward_distributor_id(state),
        pool_id,
    );
    df::add(&mut state.id, RewardGateKey(), true);
    RewardPoolOperation { pool_id, distributor_id }
}

public(package) fun end_reward_operation<T: drop>(
    state: &mut Pool<T>,
    operation: RewardPoolOperation,
) {
    let RewardPoolOperation { pool_id, distributor_id } = operation;
    assert!(pool_id == pool_id(state), E_POOL_REWARD_GATE_MISMATCH);
    assert!(
        reward_distributor_id(state) == distributor_id,
        E_REWARD_DISTRIBUTOR_MISMATCH,
    );
    assert!(reward_gate_open(state), E_REWARD_GATE_CLOSED);
    let gate = df::remove<RewardGateKey, bool>(&mut state.id, RewardGateKey());
    assert!(gate, E_REWARD_GATE_CLOSED);
}

fun assert_pool_mutation_allowed<T: drop>(state: &Pool<T>) {
    if (reward_distributor_required(state)) {
        assert!(reward_gate_open(state), E_REWARD_DISTRIBUTOR_REQUIRED);
    };
}

fun assert_lp_reward_mutation_allowed<T: drop>(
    state: &Pool<T>,
    position: &JitterPosition,
) {
    if (reward_distributor_required(state)) {
        jitter_position::assert_reward_mutation_allowed(position, reward_distributor_id(state));
    };
}

// ===========================================
// Views
// ===========================================

public fun pool_id<T: drop>(state: &Pool<T>): ID { object::id(state) }
public fun py_state_id<T: drop>(state: &Pool<T>): ID { state.py_state_id }
public fun market_id<T: drop>(state: &Pool<T>): ID { state.market_id }
public fun expiry<T: drop>(state: &Pool<T>): u64 { state.expiry }
public fun total_pt<T: drop>(state: &Pool<T>): u64 { state.total_pt }
public fun total_sy<T: drop>(state: &Pool<T>): u64 {
    balance::value(&state.total_sy)
}
public fun reserve_fee_amount<T: drop>(state: &Pool<T>): u64 {
    balance::value(&state.reserve_fee_vault)
}
public fun lp_supply<T: drop>(state: &Pool<T>): u64 { state.lp_supply }
public fun last_ln_implied_rate<T: drop>(state: &Pool<T>): FixedPoint64 {
    state.last_ln_implied_rate
}
public fun last_ln_implied_rate_raw<T: drop>(state: &Pool<T>): u128 {
    fixed_point64::get_raw_value(state.last_ln_implied_rate)
}
public fun scalar_root<T: drop>(state: &Pool<T>): FixedPoint64WithSign {
    state.scalar_root
}
public fun scalar_root_value<T: drop>(state: &Pool<T>): u128 {
    fixed_point64_with_sign::get_raw_value(state.scalar_root)
}
public fun scalar_root_positive<T: drop>(state: &Pool<T>): bool {
    fixed_point64_with_sign::is_positive(state.scalar_root)
}
public fun initial_anchor<T: drop>(state: &Pool<T>): FixedPoint64WithSign {
    state.initial_anchor
}
public fun initial_anchor_value<T: drop>(state: &Pool<T>): u128 {
    fixed_point64_with_sign::get_raw_value(state.initial_anchor)
}
public fun initial_anchor_positive<T: drop>(state: &Pool<T>): bool {
    fixed_point64_with_sign::is_positive(state.initial_anchor)
}
public fun ln_fee_rate_root<T: drop>(state: &Pool<T>): FixedPoint64 {
    state.ln_fee_rate_root
}
public(package) fun ln_fee_rate_root_raw<T: drop>(state: &Pool<T>): u128 {
    fixed_point64::get_raw_value(state.ln_fee_rate_root)
}
public fun treasury<T: drop>(state: &Pool<T>): address { state.treasury }
public fun protocol_fee_rate<T: drop>(state: &Pool<T>): FixedPoint64 {
    state.protocol_fee_rate
}
public fun protocol_fee_rate_raw<T: drop>(state: &Pool<T>): u128 {
    fixed_point64::get_raw_value(state.protocol_fee_rate)
}
public fun is_paused<T: drop>(state: &Pool<T>): bool {
    state.paused || state.emergency_paused
}
public fun is_normally_paused<T: drop>(state: &Pool<T>): bool { state.paused }
public fun is_emergency_paused<T: drop>(state: &Pool<T>): bool { state.emergency_paused }
public fun reward_distributor_required<T: drop>(state: &Pool<T>): bool {
    df::exists<RewardRequiredKey>(&state.id, RewardRequiredKey())
}
public fun reward_distributor_id<T: drop>(state: &Pool<T>): ID {
    assert!(reward_distributor_required(state), E_REWARD_DISTRIBUTOR_REQUIRED);
    df::borrow<RewardRequiredKey, RewardRequired>(&state.id, RewardRequiredKey()).distributor_id
}
public fun reward_gate_open<T: drop>(state: &Pool<T>): bool {
    df::exists<RewardGateKey>(&state.id, RewardGateKey())
}

// ===========================================
// Creation - package internal
// ===========================================

/// Internal: construct a `Pool` without sharing it.
fun create_pool_internal<SY: drop, PT: drop, YT: drop>(
    py_state: &PyState<SY>,
    market: &Market<SY, PT, YT>,
    expiry: u64,
    scalar_root: FixedPoint64WithSign,
    initial_anchor: FixedPoint64WithSign,
    ln_fee_rate_root: FixedPoint64,
    treasury: address,
    protocol_fee_rate: FixedPoint64,
    market_cap: u64,
    ctx: &mut TxContext,
): Pool<SY> {
    assert_market_state_match(py_state, market, expiry);
    Pool {
        id: object::new(ctx),
        py_state_id: py_state::id(py_state),
        market_id: market::id(market),
        expiry,
        total_pt: 0,
        total_sy: balance::zero(),
        reserve_fee_vault: balance::zero(),
        lp_supply: 0,
        last_ln_implied_rate: fixed_point64::zero(),
        scalar_root,
        initial_anchor,
        ln_fee_rate_root,
        treasury,
        protocol_fee_rate,
        market_cap,
        paused: false,
        emergency_paused: false,
    }
}

fun assert_market_state_match<SY: drop, PT: drop, YT: drop>(
    py_state: &PyState<SY>,
    market: &Market<SY, PT, YT>,
    expiry: u64,
) {
    assert!(py_state::market_id(py_state) == market::id(market), E_MARKET_STATE_MISMATCH);
    assert!(py_state::expiry(py_state) == market::expiry(market), E_MARKET_STATE_MISMATCH);
    assert!(expiry == market::expiry(market), E_MARKET_STATE_MISMATCH);
}

// ===========================================
// Admin Controls
// ===========================================

/// Pause all swaps and LP actions on this pool. Requires `pool.pause` ACL role.
public fun pause_pool_by_acl<T: drop>(
    state: &mut Pool<T>,
    acl: &ACL,
    ctx: &TxContext,
) {
    acl.assert_has_role(ctx.sender(), std::string::utf8(b"pool.pause"));
    set_paused(state, true);
    sui::event::emit(PoolPauseStatusChangedEvent {
        pool_id: pool_id(state),
        paused: true,
        actor: ctx.sender(),
    });
}

/// Resume normal pause on this pool. Emergency pause has a dedicated recovery path.
public fun unpause_pool_by_acl<T: drop>(
    state: &mut Pool<T>,
    acl: &ACL,
    ctx: &TxContext,
) {
    acl.assert_has_role(ctx.sender(), std::string::utf8(b"pool.unpause"));
    set_paused(state, false);
    sui::event::emit(PoolPauseStatusChangedEvent {
        pool_id: pool_id(state),
        paused: false,
        actor: ctx.sender(),
    });
}

public fun emergency_pause_pool_by_acl<T: drop>(
    state: &mut Pool<T>,
    acl: &ACL,
    reason: vector<u8>,
    ctx: &TxContext,
) {
    acl.assert_has_role(ctx.sender(), std::string::utf8(b"pool.emergency_pause"));
    set_emergency_paused(state, true);
    sui::event::emit(PoolEmergencyPauseStatusChangedEvent {
        pool_id: pool_id(state),
        emergency_paused: true,
        actor: ctx.sender(),
        reason: copy reason,
    });
    sui::event::emit(PoolEmergencyPausedEvent {
        pool_id: pool_id(state),
        actor: ctx.sender(),
        reason,
    });
}

public fun emergency_unpause_pool_by_acl<T: drop>(
    state: &mut Pool<T>,
    acl: &ACL,
    ctx: &TxContext,
) {
    acl.assert_has_role(ctx.sender(), std::string::utf8(b"pool.emergency_unpause"));
    set_emergency_paused(state, false);
    sui::event::emit(PoolEmergencyPauseStatusChangedEvent {
        pool_id: pool_id(state),
        emergency_paused: false,
        actor: ctx.sender(),
        reason: b"acl recovery",
    });
}

public fun collect_reserve_fees_by_acl<T: drop>(
    state: &mut Pool<T>,
    acl: &ACL,
    ctx: &mut TxContext,
): Coin<T> {
    acl.assert_has_role(ctx.sender(), std::string::utf8(b"treasury.collect"));
    collect_reserve_fees(state, ctx)
}

/// Pause with AdminCap.
public fun pause_pool_by_admin<T: drop>(
    state: &mut Pool<T>,
    _admin_cap: &AdminCap,
    ctx: &TxContext,
) {
    set_paused(state, true);
    sui::event::emit(PoolPauseStatusChangedEvent {
        pool_id: pool_id(state),
        paused: true,
        actor: ctx.sender(),
    });
}

/// Unpause normal pause with AdminCap. Emergency pause remains active.
public fun unpause_pool_by_admin<T: drop>(
    state: &mut Pool<T>,
    _admin_cap: &AdminCap,
    ctx: &TxContext,
) {
    set_paused(state, false);
    sui::event::emit(PoolPauseStatusChangedEvent {
        pool_id: pool_id(state),
        paused: false,
        actor: ctx.sender(),
    });
}

public fun emergency_pause_pool_by_admin<T: drop>(
    state: &mut Pool<T>,
    _admin_cap: &AdminCap,
    reason: vector<u8>,
    ctx: &TxContext,
) {
    set_emergency_paused(state, true);
    sui::event::emit(PoolEmergencyPauseStatusChangedEvent {
        pool_id: pool_id(state),
        emergency_paused: true,
        actor: ctx.sender(),
        reason: copy reason,
    });
    sui::event::emit(PoolEmergencyPausedEvent {
        pool_id: pool_id(state),
        actor: ctx.sender(),
        reason,
    });
}

public fun emergency_unpause_pool_by_admin<T: drop>(
    state: &mut Pool<T>,
    _admin_cap: &AdminCap,
    ctx: &TxContext,
) {
    set_emergency_paused(state, false);
    sui::event::emit(PoolEmergencyPauseStatusChangedEvent {
        pool_id: pool_id(state),
        emergency_paused: false,
        actor: ctx.sender(),
        reason: b"admin recovery",
    });
}

public fun require_reward_distributor_by_admin<T: drop>(
    state: &mut Pool<T>,
    distributor_id: ID,
    _admin_cap: &AdminCap,
) {
    require_reward_distributor(state, distributor_id);
}

public fun collect_reserve_fees_by_admin<T: drop>(
    state: &mut Pool<T>,
    _admin_cap: &AdminCap,
    ctx: &mut TxContext,
): Coin<T> {
    collect_reserve_fees(state, ctx)
}

// ===========================================
// Test Helpers
// ===========================================

#[test_only]
public struct DummySY has drop {}

#[test_only]
public fun create_for_testing<SY: drop, PT: drop, YT: drop>(
    py_state: &PyState<SY>,
    market: &Market<SY, PT, YT>,
    expiry: u64,
    ctx: &mut TxContext,
) : Pool<SY> {
    create_pool_internal(
        py_state,
        market,
        expiry,
        fixed_point64_with_sign::create_from_raw_value(FP64_ONE / 100, true), // scalar_root = 0.01
        fixed_point64_with_sign::create_from_raw_value(FP64_ONE, true), // anchor = 1.0
        fixed_point64::create_from_raw_value(FP64_ONE / 1000), // fee = 0.001
        @0x0,
        fixed_point64::zero(),
        ctx,
    )
}

#[test_only]
public fun create_with_ids_for_testing<SY: drop>(
    py_state_id: ID,
    market_id: ID,
    expiry: u64,
    ctx: &mut TxContext,
): Pool<SY> {
    Pool {
        id: object::new(ctx),
        py_state_id,
        market_id,
        expiry,
        total_pt: 0,
        total_sy: balance::zero(),
        reserve_fee_vault: balance::zero(),
        lp_supply: 0,
        last_ln_implied_rate: fixed_point64::zero(),
        scalar_root: fixed_point64_with_sign::create_from_raw_value(FP64_ONE / 100, true),
        initial_anchor: fixed_point64_with_sign::create_from_raw_value(FP64_ONE, true),
        ln_fee_rate_root: fixed_point64::create_from_raw_value(FP64_ONE / 1000),
        treasury: @0x0,
        protocol_fee_rate: fixed_point64::zero(),
        paused: false,
        emergency_paused: false,
    }
}

#[test_only]
public fun destroy_empty_for_testing<SY: drop>(state: Pool<SY>) {
    let Pool {
        id,
        py_state_id: _,
        market_id: _,
        expiry: _,
        total_pt,
        total_sy,
        reserve_fee_vault,
        lp_supply,
        last_ln_implied_rate: _,
        scalar_root: _,
        initial_anchor: _,
        ln_fee_rate_root: _,
        treasury: _,
        protocol_fee_rate: _,
        paused: _,
        emergency_paused: _,
    } = state;
    assert!(total_pt == 0, E_INSUFFICIENT_PT);
    assert!(lp_supply == 0, E_INSUFFICIENT_LP);
    balance::destroy_zero(total_sy);
    balance::destroy_zero(reserve_fee_vault);
    object::delete(id);
}

#[test]
fun bootstrap_ln_implied_rate_promotes_zero_rate() {
    let resolved = bootstrap_ln_implied_rate(
        fixed_point64::create_from_raw_value(0),
    );
    assert!(
        fixed_point64::get_raw_value(resolved) == MIN_BOOTSTRAP_LN_IMPLIED_RATE_RAW,
        0,
    );
}

#[test]
fun bootstrap_ln_implied_rate_preserves_higher_rate() {
    let higher_rate = fixed_point64::create_from_raw_value(
        MIN_BOOTSTRAP_LN_IMPLIED_RATE_RAW * 2,
    );
    let resolved = bootstrap_ln_implied_rate(higher_rate);
    assert!(
        fixed_point64::get_raw_value(resolved) == MIN_BOOTSTRAP_LN_IMPLIED_RATE_RAW * 2,
        1,
    );
}

#[test]
fun add_liquidity_refunds_excess_side_and_preserves_pool_ratio() {
    let ctx = &mut tx_context::dummy();
    let mut clock = sui::clock::create_for_testing(ctx);
    sui::clock::set_for_testing(&mut clock, 1_000);
    let mut state = create_with_ids_for_testing<DummySY>(
        object::id_from_address(@0x1),
        object::id_from_address(@0x2),
        1_000_000,
        ctx,
    );
    let mut first_position = jitter_position::create_lp_for_testing(
        pool_id(&state),
        expiry(&state),
        ctx,
    );

    let first_sy = coin::mint_for_testing<DummySY>(100, ctx);
    let (first_lp, first_sy_used, first_pt_used, first_change) = add_liquidity(
        first_sy,
        100,
        &mut state,
        &mut first_position,
        FP64_ONE,
        &clock,
        ctx,
    );
    assert!(first_lp == 99, 10);
    assert!(first_sy_used == 100, 11);
    assert!(first_pt_used == 100, 12);
    assert!(coin::value(&first_change) == 0, 13);
    assert!(total_sy(&state) == 100, 14);
    assert!(total_pt(&state) == 100, 15);
    assert!(lp_supply(&state) == 100, 16);

    let mut second_position = jitter_position::create_lp_for_testing(
        pool_id(&state),
        expiry(&state),
        ctx,
    );
    let second_sy = coin::mint_for_testing<DummySY>(100, ctx);
    let (second_lp, second_sy_used, second_pt_used, second_change) = add_liquidity(
        second_sy,
        50,
        &mut state,
        &mut second_position,
        FP64_ONE,
        &clock,
        ctx,
    );
    assert!(second_lp == 50, 17);
    assert!(second_sy_used == 50, 18);
    assert!(second_pt_used == 50, 19);
    assert!(coin::value(&second_change) == 50, 20);
    assert!(total_sy(&state) == 150, 21);
    assert!(total_pt(&state) == 150, 22);
    assert!(lp_supply(&state) == 150, 23);
    assert!(jitter_position::lp_amount(&first_position) == 99, 24);
    assert!(jitter_position::lp_amount(&second_position) == 50, 25);

    coin::burn_for_testing(first_change);
    coin::burn_for_testing(second_change);
    jitter_position::destroy_for_testing(first_position);
    jitter_position::destroy_for_testing(second_position);
    transfer::share_object(state);
    sui::clock::destroy_for_testing(clock);
}

#[test]
fun reward_gate_allows_wrapper_scope() {
    let ctx = &mut tx_context::dummy();
    let distributor = reward_distributor::create_for_testing(ctx);
    let distributor_id = reward_distributor::id(&distributor);
    let mut state = create_with_ids_for_testing<DummySY>(
        object::id_from_address(@0x1),
        object::id_from_address(@0x2),
        1_000_000,
        ctx,
    );
    require_reward_distributor(&mut state, distributor_id);
    let operation = reward_distributor::begin_pool_operation(
        &distributor,
        pool_id(&state),
        total_sy(&state),
    );
    let settlement = reward_distributor::finish_operation(operation);
    let access = begin_reward_operation(&mut state, settlement);
    assert!(reward_gate_open(&state), 6);
    end_reward_operation(&mut state, access);
    assert!(!reward_gate_open(&state), 7);
    let required = df::remove<RewardRequiredKey, RewardRequired>(&mut state.id, RewardRequiredKey());
    let RewardRequired { distributor_id: removed_distributor_id } = required;
    assert!(removed_distributor_id == distributor_id, 8);
    destroy_empty_for_testing(state);
    reward_distributor::destroy_for_testing(distributor);
}

#[test, expected_failure(abort_code = E_REWARD_DISTRIBUTOR_REQUIRED)]
fun reward_required_pool_blocks_without_gate() {
    let ctx = &mut tx_context::dummy();
    let distributor_id = object::id_from_address(@0x9);
    let mut state = create_with_ids_for_testing<DummySY>(
        object::id_from_address(@0x1),
        object::id_from_address(@0x2),
        1_000_000,
        ctx,
    );
    require_reward_distributor(&mut state, distributor_id);
    assert_pool_mutation_allowed(&state);
    let required = df::remove<RewardRequiredKey, RewardRequired>(&mut state.id, RewardRequiredKey());
    let RewardRequired { distributor_id: removed_distributor_id } = required;
    assert!(removed_distributor_id == distributor_id, 9);
    destroy_empty_for_testing(state);
}

#[test, expected_failure(abort_code = 1903, location = jitter::jitter_position)]
fun reward_required_add_liquidity_requires_lp_settlement() {
    let ctx = &mut tx_context::dummy();
    let mut clock = sui::clock::create_for_testing(ctx);
    sui::clock::set_for_testing(&mut clock, 1_000);
    let distributor = reward_distributor::create_for_testing(ctx);
    let mut state = create_with_ids_for_testing<DummySY>(
        object::id_from_address(@0x1),
        object::id_from_address(@0x2),
        1_000_000,
        ctx,
    );
    require_reward_distributor(&mut state, reward_distributor::id(&distributor));
    let pool_operation = reward_distributor::begin_pool_operation(
        &distributor,
        pool_id(&state),
        total_sy(&state),
    );
    let pool_settlement = reward_distributor::finish_operation(pool_operation);
    let pool_access = begin_reward_operation(&mut state, pool_settlement);
    let mut position = jitter_position::create_lp_for_testing(
        pool_id(&state),
        expiry(&state),
        ctx,
    );
    let sy_coin = coin::mint_for_testing<DummySY>(100, ctx);
    let (_lp_amount, _pt_used, _sy_used, sy_change) = add_liquidity(
        sy_coin,
        100,
        &mut state,
        &mut position,
        FP64_ONE,
        &clock,
        ctx,
    );
    end_reward_operation(&mut state, pool_access);
    coin::burn_for_testing(sy_change);
    jitter_position::destroy_for_testing(position);
    destroy_empty_for_testing(state);
    reward_distributor::destroy_for_testing(distributor);
    sui::clock::destroy_for_testing(clock);
}

#[test]
fun reward_settled_add_liquidity_opens_pool_and_lp_gates() {
    let ctx = &mut tx_context::dummy();
    let mut clock = sui::clock::create_for_testing(ctx);
    sui::clock::set_for_testing(&mut clock, 1_000);
    let distributor = reward_distributor::create_for_testing(ctx);
    let distributor_id = reward_distributor::id(&distributor);
    let mut state = create_with_ids_for_testing<DummySY>(
        object::id_from_address(@0x1),
        object::id_from_address(@0x2),
        1_000_000,
        ctx,
    );
    require_reward_distributor(&mut state, distributor_id);
    let mut position = jitter_position::create_lp_for_testing(
        pool_id(&state),
        expiry(&state),
        ctx,
    );

    let pool_operation = reward_distributor::begin_pool_operation(
        &distributor,
        pool_id(&state),
        total_sy(&state),
    );
    let pool_settlement = reward_distributor::finish_operation(pool_operation);
    let pool_access = begin_reward_operation(&mut state, pool_settlement);
    let lp_operation = reward_distributor::begin_lp_operation(
        &distributor,
        ctx.sender(),
        object::id(&position),
        jitter_position::lp_amount(&position),
    );
    let lp_settlement = reward_distributor::finish_operation(lp_operation);
    let lp_access = jitter_position::begin_reward_mutation(
        &mut position,
        lp_settlement,
        distributor_id,
        ctx.sender(),
    );

    let sy_coin = coin::mint_for_testing<DummySY>(100, ctx);
    let (lp_amount, pt_used, sy_used, sy_change) = add_liquidity(
        sy_coin,
        100,
        &mut state,
        &mut position,
        FP64_ONE,
        &clock,
        ctx,
    );
    assert!(lp_amount == 99, 20);
    assert!(pt_used == 100, 21);
    assert!(sy_used == 100, 22);
    assert!(coin::value(&sy_change) == 0, 23);
    assert!(jitter_position::lp_amount(&position) == 99, 24);
    end_reward_operation(&mut state, pool_access);
    jitter_position::end_reward_mutation(&mut position, lp_access);
    assert!(!reward_gate_open(&state), 25);
    assert!(!jitter_position::reward_gate_open(&position), 26);

    coin::burn_for_testing(sy_change);
    jitter_position::destroy_for_testing(position);
    transfer::share_object(state);
    reward_distributor::destroy_for_testing(distributor);
    sui::clock::destroy_for_testing(clock);
}
