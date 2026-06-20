/// orderbook - on-chain PT/SY limit order custody.
///
/// Orders escrow real `Coin<SY>` or `Coin<PT>` so takers can fill without the
/// maker signing again. Router hybrid flows bridge these coin fills back into
/// the unified `JitterPosition` + AMM accounting.
module jitter::orderbook;

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::dynamic_field as df;
use sui::event;
use sui::clock::Clock;

use jitter_framework::keyed_big_vector::{Self, KeyedBigVector};
use jitter::market::{Self, Market};
use jitter::reward_distributor::{Self, RewardDistributor, RewardOperation, RewardSettlement};
use jitter_admin::acl::ACL;
use jitter_admin::admin::AdminCap;

const E_ZERO_AMOUNT: u64 = 3100;
const E_BAD_PRICE: u64 = 3101;
const E_ORDER_NOT_FOUND: u64 = 3102;
const E_WRONG_SIDE: u64 = 3103;
const E_NOT_OWNER: u64 = 3104;
const E_SLIPPAGE: u64 = 3105;
const E_EXPIRED: u64 = 3106;
const E_BOOK_PAUSED: u64 = 3107;
const E_MARKET_MISMATCH: u64 = 3108;
const E_ORDER_EXISTS: u64 = 3109;
const E_REWARD_DISTRIBUTOR_REQUIRED: u64 = 3110;
const E_REWARD_GATE_OPEN: u64 = 3111;
const E_REWARD_GATE_CLOSED: u64 = 3112;
const E_REWARD_DISTRIBUTOR_MISMATCH: u64 = 3113;
const E_ORDER_NOT_FILLED: u64 = 3114;
const E_ORDER_NOT_EXPIRED: u64 = 3115;
const E_ORDER_INDEX_MISMATCH: u64 = 3116;

const SIDE_BID: u8 = 0;
const SIDE_ASK: u8 = 1;
const FP64_ONE: u128 = 1 << 64;
const ACTIVE_ORDER_INDEX_SLICE_SIZE: u32 = 256;

public struct OrderBook<phantom SY: drop, phantom PT: drop> has key, store {
    id: UID,
    market_id: ID,
    next_order_id: u64,
    active_order_count: u64,
    active_order_ids: KeyedBigVector,
    paused: bool,
    emergency_paused: bool,
}

public struct OrderKey(u64) has copy, drop, store;

public struct RewardRequiredKey() has copy, drop, store;

public struct RewardGateKey() has copy, drop, store;

public struct RewardRequired has store {
    distributor_id: ID,
}

public struct RewardOrderbookOperation {
    orderbook_id: ID,
    distributor_id: ID,
}

public struct LimitOrder<phantom SY: drop, phantom PT: drop> has store {
    id: u64,
    owner: address,
    side: u8,
    price_raw: u128,
    remaining_pt: u64,
    escrow_sy: Balance<SY>,
    escrow_pt: Balance<PT>,
    claimable_sy: Balance<SY>,
    claimable_pt: Balance<PT>,
    created_at: u64,
    expiry_ms: u64,
}

public struct OrderSummary has copy, drop, store {
    id: u64,
    owner: address,
    side: u8,
    price_raw: u128,
    remaining_pt: u64,
    escrow_sy: u64,
    escrow_pt: u64,
    claimable_sy: u64,
    claimable_pt: u64,
    created_at: u64,
    expiry_ms: u64,
}

public struct OrderBookCreatedEvent has copy, drop {
    orderbook_id: ID,
    market_id: ID,
    creator: address,
}

public struct LimitOrderPlacedEvent has copy, drop {
    orderbook_id: ID,
    order_id: u64,
    owner: address,
    side: u8,
    price_raw: u128,
    remaining_pt: u64,
    escrow_amount: u64,
    expiry_ms: u64,
}

public struct LimitOrderFilledEvent has copy, drop {
    orderbook_id: ID,
    order_id: u64,
    maker: address,
    taker: address,
    side: u8,
    pt_amount: u64,
    sy_amount: u64,
    remaining_pt: u64,
}

public struct LimitOrderCancelledEvent has copy, drop {
    orderbook_id: ID,
    order_id: u64,
    owner: address,
}

public struct LimitOrderClaimedEvent has copy, drop {
    orderbook_id: ID,
    order_id: u64,
    owner: address,
    sy_amount: u64,
    pt_amount: u64,
}

public struct LimitOrderClosedEvent has copy, drop {
    orderbook_id: ID,
    order_id: u64,
    owner: address,
    sy_amount: u64,
    pt_amount: u64,
    closed_by: address,
}

public struct ExpiredLimitOrderSweptEvent has copy, drop {
    orderbook_id: ID,
    order_id: u64,
    owner: address,
    sy_amount: u64,
    pt_amount: u64,
    swept_by: address,
}

public struct OrderBookPauseStatusChangedEvent has copy, drop {
    orderbook_id: ID,
    paused: bool,
    actor: address,
}

public struct OrderBookEmergencyPausedEvent has copy, drop {
    orderbook_id: ID,
    actor: address,
    reason: vector<u8>,
}

public struct OrderBookEmergencyPauseStatusChangedEvent has copy, drop {
    orderbook_id: ID,
    emergency_paused: bool,
    actor: address,
    reason: vector<u8>,
}

public struct RewardDistributorRequiredEvent has copy, drop {
    orderbook_id: ID,
    distributor_id: ID,
}

#[allow(lint(share_owned))]
public fun create_orderbook_by_admin<SY: drop, PT: drop, YT: drop>(
    market: &Market<SY, PT, YT>,
    _admin_cap: &AdminCap,
    ctx: &mut TxContext,
) {
    let book = create_orderbook_internal<SY, PT, YT>(market, ctx);

    event::emit(OrderBookCreatedEvent {
        orderbook_id: object::id(&book),
        market_id: market::id(market),
        creator: ctx.sender(),
    });

    transfer::share_object(book);
}

#[allow(lint(share_owned))]
public fun create_yt_orderbook_by_admin<SY: drop, PT: drop, YT: drop>(
    market: &Market<SY, PT, YT>,
    _admin_cap: &AdminCap,
    ctx: &mut TxContext,
) {
    let book = create_yt_orderbook_internal<SY, PT, YT>(market, ctx);

    event::emit(OrderBookCreatedEvent {
        orderbook_id: object::id(&book),
        market_id: market::id(market),
        creator: ctx.sender(),
    });

    transfer::share_object(book);
}

public fun place_bid<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    sy_coin: Coin<SY>,
    price_raw: u128,
    min_pt_amount: u64,
    expiry_ms: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): u64 {
    assert_active(book);
    assert_reward_mutation_allowed(book);
    assert!(price_raw > 0, E_BAD_PRICE);
    let now = sui::clock::timestamp_ms(clock);
    assert!(expiry_ms == 0 || expiry_ms > now, E_EXPIRED);

    let sy_amount = coin::value(&sy_coin);
    assert!(sy_amount > 0, E_ZERO_AMOUNT);
    let max_pt = pt_for_sy(sy_amount, price_raw);
    assert!(max_pt >= min_pt_amount && max_pt > 0, E_SLIPPAGE);

    let order_id = book.next_order_id;
    book.next_order_id = order_id + 1;
    assert!(!order_exists(book, order_id), E_ORDER_EXISTS);
    book.active_order_count = book.active_order_count + 1;
    add_active_order_id(book, order_id);
    df::add(&mut book.id, OrderKey(order_id), LimitOrder<SY, PT> {
        id: order_id,
        owner: ctx.sender(),
        side: SIDE_BID,
        price_raw,
        remaining_pt: max_pt,
        escrow_sy: coin::into_balance(sy_coin),
        escrow_pt: balance::zero(),
        claimable_sy: balance::zero(),
        claimable_pt: balance::zero(),
        created_at: now,
        expiry_ms,
    });

    event::emit(LimitOrderPlacedEvent {
        orderbook_id: object::id(book),
        order_id,
        owner: ctx.sender(),
        side: SIDE_BID,
        price_raw,
        remaining_pt: max_pt,
        escrow_amount: sy_amount,
        expiry_ms,
    });

    order_id
}

public fun place_ask<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    pt_coin: Coin<PT>,
    price_raw: u128,
    expiry_ms: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): u64 {
    assert_active(book);
    assert_reward_mutation_allowed(book);
    assert!(price_raw > 0, E_BAD_PRICE);
    let now = sui::clock::timestamp_ms(clock);
    assert!(expiry_ms == 0 || expiry_ms > now, E_EXPIRED);

    let pt_amount = coin::value(&pt_coin);
    assert!(pt_amount > 0, E_ZERO_AMOUNT);

    let order_id = book.next_order_id;
    book.next_order_id = order_id + 1;
    assert!(!order_exists(book, order_id), E_ORDER_EXISTS);
    book.active_order_count = book.active_order_count + 1;
    add_active_order_id(book, order_id);
    df::add(&mut book.id, OrderKey(order_id), LimitOrder<SY, PT> {
        id: order_id,
        owner: ctx.sender(),
        side: SIDE_ASK,
        price_raw,
        remaining_pt: pt_amount,
        escrow_sy: balance::zero(),
        escrow_pt: coin::into_balance(pt_coin),
        claimable_sy: balance::zero(),
        claimable_pt: balance::zero(),
        created_at: now,
        expiry_ms,
    });

    event::emit(LimitOrderPlacedEvent {
        orderbook_id: object::id(book),
        order_id,
        owner: ctx.sender(),
        side: SIDE_ASK,
        price_raw,
        remaining_pt: pt_amount,
        escrow_amount: pt_amount,
        expiry_ms,
    });

    order_id
}

public fun place_bid_after_reward_settlement<SY: drop, PT: drop>(
    settlement: RewardSettlement,
    distributor: &RewardDistributor,
    book: &mut OrderBook<SY, PT>,
    sy_coin: Coin<SY>,
    price_raw: u128,
    min_pt_amount: u64,
    expiry_ms: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): (u64, RewardOperation) {
    assert_reward_distributor_matches(distributor, book);
    let access = begin_reward_operation(book, settlement);
    let order_id = place_bid(
        book,
        sy_coin,
        price_raw,
        min_pt_amount,
        expiry_ms,
        clock,
        ctx,
    );
    end_reward_operation(book, access);
    (order_id, begin_post_operation(distributor, book))
}

public fun place_ask_after_reward_settlement<SY: drop, PT: drop>(
    settlement: RewardSettlement,
    distributor: &RewardDistributor,
    book: &mut OrderBook<SY, PT>,
    pt_coin: Coin<PT>,
    price_raw: u128,
    expiry_ms: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): (u64, RewardOperation) {
    assert_reward_distributor_matches(distributor, book);
    let access = begin_reward_operation(book, settlement);
    let order_id = place_ask(
        book,
        pt_coin,
        price_raw,
        expiry_ms,
        clock,
        ctx,
    );
    end_reward_operation(book, access);
    (order_id, begin_post_operation(distributor, book))
}

public fun fill_bid_exact_pt<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    order_id: u64,
    mut pt_coin: Coin<PT>,
    pt_amount: u64,
    min_price_raw: u128,
    clock: &Clock,
    ctx: &mut TxContext,
): (Coin<SY>, Coin<PT>) {
    assert_active(book);
    assert_reward_mutation_allowed(book);
    assert!(pt_amount > 0, E_ZERO_AMOUNT);
    assert!(coin::value(&pt_coin) >= pt_amount, E_ZERO_AMOUNT);

    let book_id = object::id(book);
    let (maker, sy_out_coin, pt_fill, sy_out, remaining_pt) = {
        let order = borrow_order_mut(book, order_id);
        assert_order_live(order, clock);
        assert!(order.side == SIDE_BID, E_WRONG_SIDE);
        assert!(order.price_raw >= min_price_raw, E_SLIPPAGE);
        assert!(order.remaining_pt >= pt_amount, E_ZERO_AMOUNT);

        let sy_out = sy_for_pt(pt_amount, order.price_raw);
        assert!(balance::value(&order.escrow_sy) >= sy_out, E_SLIPPAGE);
        let pt_fill = coin::split(&mut pt_coin, pt_amount, ctx);
        let sy_out_coin = coin::from_balance(balance::split(&mut order.escrow_sy, sy_out), ctx);
        order.remaining_pt = order.remaining_pt - pt_amount;
        (order.owner, sy_out_coin, pt_fill, sy_out, order.remaining_pt)
    };
    transfer_coin_or_destroy_zero(pt_fill, maker);

    event::emit(LimitOrderFilledEvent {
        orderbook_id: book_id,
        order_id,
        maker,
        taker: ctx.sender(),
        side: SIDE_BID,
        pt_amount,
        sy_amount: sy_out,
        remaining_pt,
    });

    if (remaining_pt == 0) {
        close_order_to_owner_unchecked(book, order_id, ctx.sender(), ctx);
    };

    (sy_out_coin, pt_coin)
}

public fun fill_bid_exact_pt_after_reward_settlement<SY: drop, PT: drop>(
    settlement: RewardSettlement,
    distributor: &RewardDistributor,
    book: &mut OrderBook<SY, PT>,
    order_id: u64,
    pt_coin: Coin<PT>,
    pt_amount: u64,
    min_price_raw: u128,
    clock: &Clock,
    ctx: &mut TxContext,
): (Coin<SY>, Coin<PT>, RewardOperation) {
    assert_reward_distributor_matches(distributor, book);
    let access = begin_reward_operation(book, settlement);
    let (sy_out, pt_change) = fill_bid_exact_pt(
        book,
        order_id,
        pt_coin,
        pt_amount,
        min_price_raw,
        clock,
        ctx,
    );
    end_reward_operation(book, access);
    (sy_out, pt_change, begin_post_operation(distributor, book))
}

public fun fill_ask_exact_pt<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    order_id: u64,
    mut sy_coin: Coin<SY>,
    pt_amount: u64,
    max_price_raw: u128,
    clock: &Clock,
    ctx: &mut TxContext,
): (Coin<PT>, Coin<SY>) {
    assert_active(book);
    assert_reward_mutation_allowed(book);
    assert!(pt_amount > 0, E_ZERO_AMOUNT);

    let book_id = object::id(book);
    let (maker, pt_out_coin, sy_fill, sy_in, remaining_pt) = {
        let order = borrow_order_mut(book, order_id);
        assert_order_live(order, clock);
        assert!(order.side == SIDE_ASK, E_WRONG_SIDE);
        assert!(order.price_raw <= max_price_raw, E_SLIPPAGE);
        assert!(order.remaining_pt >= pt_amount, E_ZERO_AMOUNT);

        let sy_in = sy_for_pt(pt_amount, order.price_raw);
        assert!(coin::value(&sy_coin) >= sy_in, E_SLIPPAGE);
        let sy_fill = coin::split(&mut sy_coin, sy_in, ctx);
        let pt_out_coin = coin::from_balance(balance::split(&mut order.escrow_pt, pt_amount), ctx);
        order.remaining_pt = order.remaining_pt - pt_amount;
        (order.owner, pt_out_coin, sy_fill, sy_in, order.remaining_pt)
    };
    transfer_coin_or_destroy_zero(sy_fill, maker);

    event::emit(LimitOrderFilledEvent {
        orderbook_id: book_id,
        order_id,
        maker,
        taker: ctx.sender(),
        side: SIDE_ASK,
        pt_amount,
        sy_amount: sy_in,
        remaining_pt,
    });

    if (remaining_pt == 0) {
        close_order_to_owner_unchecked(book, order_id, ctx.sender(), ctx);
    };

    (pt_out_coin, sy_coin)
}

public fun fill_ask_exact_pt_after_reward_settlement<SY: drop, PT: drop>(
    settlement: RewardSettlement,
    distributor: &RewardDistributor,
    book: &mut OrderBook<SY, PT>,
    order_id: u64,
    sy_coin: Coin<SY>,
    pt_amount: u64,
    max_price_raw: u128,
    clock: &Clock,
    ctx: &mut TxContext,
): (Coin<PT>, Coin<SY>, RewardOperation) {
    assert_reward_distributor_matches(distributor, book);
    let access = begin_reward_operation(book, settlement);
    let (pt_out, sy_change) = fill_ask_exact_pt(
        book,
        order_id,
        sy_coin,
        pt_amount,
        max_price_raw,
        clock,
        ctx,
    );
    end_reward_operation(book, access);
    (pt_out, sy_change, begin_post_operation(distributor, book))
}

public fun claim_order<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    order_id: u64,
    ctx: &mut TxContext,
): (Coin<SY>, Coin<PT>) {
    assert_reward_mutation_allowed(book);
    let book_id = object::id(book);
    let order = borrow_order_mut(book, order_id);
    assert!(order.owner == ctx.sender(), E_NOT_OWNER);

    let sy_amount = balance::value(&order.claimable_sy);
    let pt_amount = balance::value(&order.claimable_pt);
    let sy_coin = take_all_sy(&mut order.claimable_sy, ctx);
    let pt_coin = take_all_pt(&mut order.claimable_pt, ctx);

    event::emit(LimitOrderClaimedEvent {
        orderbook_id: book_id,
        order_id,
        owner: ctx.sender(),
        sy_amount,
        pt_amount,
    });

    (sy_coin, pt_coin)
}

public fun claim_order_after_reward_settlement<SY: drop, PT: drop>(
    settlement: RewardSettlement,
    distributor: &RewardDistributor,
    book: &mut OrderBook<SY, PT>,
    order_id: u64,
    ctx: &mut TxContext,
): (Coin<SY>, Coin<PT>, RewardOperation) {
    assert_reward_distributor_matches(distributor, book);
    let access = begin_reward_operation(book, settlement);
    let (sy_coin, pt_coin) = claim_order(book, order_id, ctx);
    end_reward_operation(book, access);
    (sy_coin, pt_coin, begin_post_operation(distributor, book))
}

public fun cancel_order<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    order_id: u64,
    ctx: &mut TxContext,
): (Coin<SY>, Coin<PT>) {
    assert_reward_mutation_allowed(book);
    let order_ref = borrow_order(book, order_id);
    assert!(order_ref.owner == ctx.sender(), E_NOT_OWNER);

    let order = remove_order(book, order_id);
    let LimitOrder {
        id: _,
        owner,
        side: _,
        price_raw: _,
        remaining_pt: _,
        escrow_sy,
        escrow_pt,
        claimable_sy,
        claimable_pt,
        created_at: _,
        expiry_ms: _,
    } = order;

    let mut sy_balance = escrow_sy;
    let mut pt_balance = escrow_pt;
    balance::join(&mut sy_balance, claimable_sy);
    balance::join(&mut pt_balance, claimable_pt);

    event::emit(LimitOrderCancelledEvent {
        orderbook_id: object::id(book),
        order_id,
        owner,
    });

    (
        coin::from_balance(sy_balance, ctx),
        coin::from_balance(pt_balance, ctx),
    )
}

public fun cancel_order_after_reward_settlement<SY: drop, PT: drop>(
    settlement: RewardSettlement,
    distributor: &RewardDistributor,
    book: &mut OrderBook<SY, PT>,
    order_id: u64,
    ctx: &mut TxContext,
): (Coin<SY>, Coin<PT>, RewardOperation) {
    assert_reward_distributor_matches(distributor, book);
    let access = begin_reward_operation(book, settlement);
    let (sy_coin, pt_coin) = cancel_order(book, order_id, ctx);
    end_reward_operation(book, access);
    (sy_coin, pt_coin, begin_post_operation(distributor, book))
}

/// Delete a fully-filled order and transfer maker proceeds to the order owner.
/// Anyone may call this because funds never go to the caller.
public fun close_filled_order<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    order_id: u64,
    ctx: &mut TxContext,
) {
    assert_reward_mutation_allowed(book);
    let order_ref = borrow_order(book, order_id);
    assert!(order_ref.remaining_pt == 0, E_ORDER_NOT_FILLED);

    close_order_to_owner_unchecked(book, order_id, ctx.sender(), ctx);
}

public fun close_filled_order_after_reward_settlement<SY: drop, PT: drop>(
    settlement: RewardSettlement,
    distributor: &RewardDistributor,
    book: &mut OrderBook<SY, PT>,
    order_id: u64,
    ctx: &mut TxContext,
): RewardOperation {
    assert_reward_distributor_matches(distributor, book);
    let access = begin_reward_operation(book, settlement);
    close_filled_order(book, order_id, ctx);
    end_reward_operation(book, access);
    begin_post_operation(distributor, book)
}

/// Delete an expired order and transfer all escrow/proceeds to the maker.
/// This keeps stale dynamic fields from accumulating without trusting the
/// caller with custody.
public fun sweep_expired_order_to_owner<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    order_id: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    assert_reward_mutation_allowed(book);
    let order_ref = borrow_order(book, order_id);
    assert!(!is_live(order_ref, clock), E_ORDER_NOT_EXPIRED);

    let order = remove_order(book, order_id);
    let (owner, sy_coin, pt_coin, sy_amount, pt_amount) = consume_order_to_coins(order, ctx);
    transfer_coin_or_destroy_zero(sy_coin, owner);
    transfer_coin_or_destroy_zero(pt_coin, owner);

    event::emit(ExpiredLimitOrderSweptEvent {
        orderbook_id: object::id(book),
        order_id,
        owner,
        sy_amount,
        pt_amount,
        swept_by: ctx.sender(),
    });
}

public fun sweep_expired_order_to_owner_after_reward_settlement<SY: drop, PT: drop>(
    settlement: RewardSettlement,
    distributor: &RewardDistributor,
    book: &mut OrderBook<SY, PT>,
    order_id: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): RewardOperation {
    assert_reward_distributor_matches(distributor, book);
    let access = begin_reward_operation(book, settlement);
    sweep_expired_order_to_owner(book, order_id, clock, ctx);
    end_reward_operation(book, access);
    begin_post_operation(distributor, book)
}

public fun pause_orderbook_by_acl<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    acl: &ACL,
    ctx: &TxContext,
) {
    acl.assert_has_role(ctx.sender(), std::string::utf8(b"orderbook.pause"));
    set_paused(book, true, ctx.sender());
}

public fun unpause_orderbook_by_acl<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    acl: &ACL,
    ctx: &TxContext,
) {
    acl.assert_has_role(ctx.sender(), std::string::utf8(b"orderbook.unpause"));
    set_paused(book, false, ctx.sender());
}

public fun emergency_pause_orderbook_by_acl<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    acl: &ACL,
    reason: vector<u8>,
    ctx: &TxContext,
) {
    acl.assert_has_role(ctx.sender(), std::string::utf8(b"orderbook.emergency_pause"));
    set_emergency_paused(book, true, ctx.sender(), copy reason);
    event::emit(OrderBookEmergencyPausedEvent {
        orderbook_id: object::id(book),
        actor: ctx.sender(),
        reason,
    });
}

public fun emergency_unpause_orderbook_by_acl<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    acl: &ACL,
    ctx: &TxContext,
) {
    acl.assert_has_role(ctx.sender(), std::string::utf8(b"orderbook.emergency_unpause"));
    set_emergency_paused(book, false, ctx.sender(), b"acl recovery");
}

public fun pause_orderbook_by_admin<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    _admin_cap: &AdminCap,
    ctx: &TxContext,
) {
    set_paused(book, true, ctx.sender());
}

public fun unpause_orderbook_by_admin<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    _admin_cap: &AdminCap,
    ctx: &TxContext,
) {
    set_paused(book, false, ctx.sender());
}

public fun emergency_pause_orderbook_by_admin<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    _admin_cap: &AdminCap,
    reason: vector<u8>,
    ctx: &TxContext,
) {
    set_emergency_paused(book, true, ctx.sender(), copy reason);
    event::emit(OrderBookEmergencyPausedEvent {
        orderbook_id: object::id(book),
        actor: ctx.sender(),
        reason,
    });
}

public fun emergency_unpause_orderbook_by_admin<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    _admin_cap: &AdminCap,
    ctx: &TxContext,
) {
    set_emergency_paused(book, false, ctx.sender(), b"admin recovery");
}

public fun require_reward_distributor_by_admin<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    distributor_id: ID,
    _admin_cap: &AdminCap,
) {
    require_reward_distributor(book, distributor_id);
}

public fun fillable_bid_pt<SY: drop, PT: drop>(
    book: &OrderBook<SY, PT>,
    order_id: u64,
    max_pt_in: u64,
    min_price_raw: u128,
    clock: &Clock,
): u64 {
    if (max_pt_in == 0) return 0;
    if (!order_exists(book, order_id)) return 0;
    let order = borrow_order(book, order_id);
    if (!is_live(order, clock) || order.side != SIDE_BID || order.price_raw < min_price_raw) {
        return 0
    };

    let by_escrow = pt_for_sy(balance::value(&order.escrow_sy), order.price_raw);
    min_u64(max_pt_in, min_u64(order.remaining_pt, by_escrow))
}

public fun fillable_ask_pt<SY: drop, PT: drop>(
    book: &OrderBook<SY, PT>,
    order_id: u64,
    sy_available: u64,
    max_price_raw: u128,
    clock: &Clock,
): u64 {
    if (sy_available == 0) return 0;
    if (!order_exists(book, order_id)) return 0;
    let order = borrow_order(book, order_id);
    if (!is_live(order, clock) || order.side != SIDE_ASK || order.price_raw > max_price_raw) {
        return 0
    };

    let by_sy = pt_for_sy(sy_available, order.price_raw);
    min_u64(order.remaining_pt, by_sy)
}

public fun summaries<SY: drop, PT: drop>(book: &OrderBook<SY, PT>): vector<OrderSummary> {
    summaries_paginated(book, 0, keyed_big_vector::length(&book.active_order_ids))
}

public fun summaries_paginated<SY: drop, PT: drop>(
    book: &OrderBook<SY, PT>,
    offset: u64,
    limit: u64,
): vector<OrderSummary> {
    let mut out = vector[];
    let len = keyed_big_vector::length(&book.active_order_ids);
    let mut i = offset;
    while (i < len && vector::length(&out) < limit) {
        let (order_id, _) = keyed_big_vector::borrow<u64, u64>(&book.active_order_ids, i);
        vector::push_back(&mut out, summary(book, order_id));
        i = i + 1;
    };
    out
}

public fun order_ids<SY: drop, PT: drop>(book: &OrderBook<SY, PT>): vector<u64> {
    order_ids_paginated(book, 0, keyed_big_vector::length(&book.active_order_ids))
}

public fun order_ids_paginated<SY: drop, PT: drop>(
    book: &OrderBook<SY, PT>,
    offset: u64,
    limit: u64,
): vector<u64> {
    let mut out = vector[];
    let len = keyed_big_vector::length(&book.active_order_ids);
    let mut i = offset;
    while (i < len && vector::length(&out) < limit) {
        let (order_id, _) = keyed_big_vector::borrow<u64, u64>(&book.active_order_ids, i);
        vector::push_back(&mut out, order_id);
        i = i + 1;
    };
    out
}

public fun summary<SY: drop, PT: drop>(
    book: &OrderBook<SY, PT>,
    order_id: u64,
): OrderSummary {
    let order = borrow_order(book, order_id);
    OrderSummary {
        id: order.id,
        owner: order.owner,
        side: order.side,
        price_raw: order.price_raw,
        remaining_pt: order.remaining_pt,
        escrow_sy: balance::value(&order.escrow_sy),
        escrow_pt: balance::value(&order.escrow_pt),
        claimable_sy: balance::value(&order.claimable_sy),
        claimable_pt: balance::value(&order.claimable_pt),
        created_at: order.created_at,
        expiry_ms: order.expiry_ms,
    }
}

public fun orderbook_id<SY: drop, PT: drop>(book: &OrderBook<SY, PT>): ID {
    object::id(book)
}

public fun market_id<SY: drop, PT: drop>(book: &OrderBook<SY, PT>): ID {
    book.market_id
}

public fun order_count<SY: drop, PT: drop>(book: &OrderBook<SY, PT>): u64 {
    book.active_order_count
}

public fun is_paused<SY: drop, PT: drop>(book: &OrderBook<SY, PT>): bool {
    book.paused || book.emergency_paused
}

public fun is_normally_paused<SY: drop, PT: drop>(book: &OrderBook<SY, PT>): bool {
    book.paused
}

public fun is_emergency_paused<SY: drop, PT: drop>(book: &OrderBook<SY, PT>): bool {
    book.emergency_paused
}

public fun reward_distributor_required<SY: drop, PT: drop>(book: &OrderBook<SY, PT>): bool {
    df::exists<RewardRequiredKey>(&book.id, RewardRequiredKey())
}

public fun reward_distributor_id<SY: drop, PT: drop>(book: &OrderBook<SY, PT>): ID {
    assert!(reward_distributor_required(book), E_REWARD_DISTRIBUTOR_REQUIRED);
    df::borrow<RewardRequiredKey, RewardRequired>(&book.id, RewardRequiredKey()).distributor_id
}

public fun reward_gate_open<SY: drop, PT: drop>(book: &OrderBook<SY, PT>): bool {
    df::exists<RewardGateKey>(&book.id, RewardGateKey())
}

public(package) fun assert_market_match<SY: drop, PT: drop>(
    book: &OrderBook<SY, PT>,
    expected_market_id: ID,
) {
    assert!(book.market_id == expected_market_id, E_MARKET_MISMATCH);
}

public(package) fun begin_reward_operation<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    settlement: RewardSettlement,
): RewardOrderbookOperation {
    assert!(reward_distributor_required(book), E_REWARD_DISTRIBUTOR_REQUIRED);
    assert!(!reward_gate_open(book), E_REWARD_GATE_OPEN);
    let orderbook_id = object::id(book);
    let distributor_id = reward_distributor::consume_orderbook_settlement(
        settlement,
        reward_distributor_id(book),
        orderbook_id,
    );
    df::add(&mut book.id, RewardGateKey(), distributor_id);
    RewardOrderbookOperation { orderbook_id, distributor_id }
}

public(package) fun end_reward_operation<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    operation: RewardOrderbookOperation,
) {
    let RewardOrderbookOperation { orderbook_id, distributor_id } = operation;
    assert!(orderbook_id == object::id(book), E_MARKET_MISMATCH);
    assert!(reward_gate_open(book), E_REWARD_GATE_CLOSED);
    let gate_distributor_id = df::remove<RewardGateKey, ID>(&mut book.id, RewardGateKey());
    assert!(gate_distributor_id == distributor_id, E_REWARD_DISTRIBUTOR_MISMATCH);
}

fun require_reward_distributor<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    distributor_id: ID,
) {
    assert!(!reward_gate_open(book), E_REWARD_GATE_OPEN);
    if (!reward_distributor_required(book)) {
        df::add(&mut book.id, RewardRequiredKey(), RewardRequired { distributor_id });
    } else {
        let required = df::borrow_mut<RewardRequiredKey, RewardRequired>(
            &mut book.id,
            RewardRequiredKey(),
        );
        required.distributor_id = distributor_id;
    };
    event::emit(RewardDistributorRequiredEvent {
        orderbook_id: object::id(book),
        distributor_id,
    });
}

fun assert_reward_mutation_allowed<SY: drop, PT: drop>(book: &OrderBook<SY, PT>) {
    if (reward_distributor_required(book)) {
        assert!(reward_gate_open(book), E_REWARD_DISTRIBUTOR_REQUIRED);
    };
}

fun assert_reward_distributor_matches<SY: drop, PT: drop>(
    distributor: &RewardDistributor,
    book: &OrderBook<SY, PT>,
) {
    assert!(
        reward_distributor::id(distributor) == reward_distributor_id(book),
        E_REWARD_DISTRIBUTOR_MISMATCH,
    );
}

fun begin_post_operation<SY: drop, PT: drop>(
    distributor: &RewardDistributor,
    book: &OrderBook<SY, PT>,
): RewardOperation {
    reward_distributor::begin_orderbook_operation(
        distributor,
        object::id(book),
        book.active_order_count,
    )
}

fun create_orderbook_internal<SY: drop, PT: drop, YT: drop>(
    market: &Market<SY, PT, YT>,
    ctx: &mut TxContext,
): OrderBook<SY, PT> {
    OrderBook<SY, PT> {
        id: object::new(ctx),
        market_id: market::id(market),
        next_order_id: 1,
        active_order_count: 0,
        active_order_ids: new_active_order_ids(ctx),
        paused: false,
        emergency_paused: false,
    }
}

fun create_yt_orderbook_internal<SY: drop, PT: drop, YT: drop>(
    market: &Market<SY, PT, YT>,
    ctx: &mut TxContext,
): OrderBook<SY, YT> {
    OrderBook<SY, YT> {
        id: object::new(ctx),
        market_id: market::id(market),
        next_order_id: 1,
        active_order_count: 0,
        active_order_ids: new_active_order_ids(ctx),
        paused: false,
        emergency_paused: false,
    }
}

fun new_active_order_ids(ctx: &mut TxContext): KeyedBigVector {
    keyed_big_vector::new<u64, u64>(ACTIVE_ORDER_INDEX_SLICE_SIZE, ctx)
}

fun order_exists<SY: drop, PT: drop>(
    book: &OrderBook<SY, PT>,
    order_id: u64,
): bool {
    df::exists<OrderKey>(&book.id, OrderKey(order_id))
}

fun borrow_order<SY: drop, PT: drop>(
    book: &OrderBook<SY, PT>,
    order_id: u64,
): &LimitOrder<SY, PT> {
    assert!(order_exists(book, order_id), E_ORDER_NOT_FOUND);
    df::borrow<OrderKey, LimitOrder<SY, PT>>(&book.id, OrderKey(order_id))
}

fun borrow_order_mut<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    order_id: u64,
): &mut LimitOrder<SY, PT> {
    assert!(order_exists(book, order_id), E_ORDER_NOT_FOUND);
    df::borrow_mut<OrderKey, LimitOrder<SY, PT>>(&mut book.id, OrderKey(order_id))
}

fun remove_order<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    order_id: u64,
): LimitOrder<SY, PT> {
    assert!(order_exists(book, order_id), E_ORDER_NOT_FOUND);
    book.active_order_count = book.active_order_count - 1;
    remove_active_order_id(book, order_id);
    df::remove<OrderKey, LimitOrder<SY, PT>>(&mut book.id, OrderKey(order_id))
}

fun remove_active_order_id<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    order_id: u64,
) {
    let removed = keyed_big_vector::swap_remove_by_key<u64, u64>(
        &mut book.active_order_ids,
        order_id,
    );
    assert!(removed == order_id, E_ORDER_INDEX_MISMATCH);
}

fun add_active_order_id<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    order_id: u64,
) {
    keyed_big_vector::push_back<u64, u64>(&mut book.active_order_ids, order_id, order_id);
}

fun close_order_to_owner_unchecked<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    order_id: u64,
    closed_by: address,
    ctx: &mut TxContext,
) {
    let order = remove_order(book, order_id);
    let (owner, sy_coin, pt_coin, sy_amount, pt_amount) = consume_order_to_coins(order, ctx);
    transfer_coin_or_destroy_zero(sy_coin, owner);
    transfer_coin_or_destroy_zero(pt_coin, owner);

    event::emit(LimitOrderClosedEvent {
        orderbook_id: object::id(book),
        order_id,
        owner,
        sy_amount,
        pt_amount,
        closed_by,
    });
}

fun consume_order_to_coins<SY: drop, PT: drop>(
    order: LimitOrder<SY, PT>,
    ctx: &mut TxContext,
): (address, Coin<SY>, Coin<PT>, u64, u64) {
    let LimitOrder {
        id: _,
        owner,
        side: _,
        price_raw: _,
        remaining_pt: _,
        escrow_sy,
        escrow_pt,
        claimable_sy,
        claimable_pt,
        created_at: _,
        expiry_ms: _,
    } = order;

    let mut sy_balance = escrow_sy;
    let mut pt_balance = escrow_pt;
    balance::join(&mut sy_balance, claimable_sy);
    balance::join(&mut pt_balance, claimable_pt);
    let sy_amount = balance::value(&sy_balance);
    let pt_amount = balance::value(&pt_balance);
    (
        owner,
        coin::from_balance(sy_balance, ctx),
        coin::from_balance(pt_balance, ctx),
        sy_amount,
        pt_amount,
    )
}

fun transfer_coin_or_destroy_zero<T: drop>(coin: Coin<T>, recipient: address) {
    if (coin::value(&coin) == 0) {
        coin::destroy_zero(coin);
    } else {
        transfer::public_transfer(coin, recipient);
    };
}

fun assert_active<SY: drop, PT: drop>(book: &OrderBook<SY, PT>) {
    assert!(!is_paused(book), E_BOOK_PAUSED);
}

fun set_paused<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    paused: bool,
    actor: address,
) {
    book.paused = paused;
    event::emit(OrderBookPauseStatusChangedEvent {
        orderbook_id: object::id(book),
        paused,
        actor,
    });
}

fun set_emergency_paused<SY: drop, PT: drop>(
    book: &mut OrderBook<SY, PT>,
    emergency_paused: bool,
    actor: address,
    reason: vector<u8>,
) {
    book.emergency_paused = emergency_paused;
    event::emit(OrderBookEmergencyPauseStatusChangedEvent {
        orderbook_id: object::id(book),
        emergency_paused,
        actor,
        reason,
    });
}

fun assert_order_live<SY: drop, PT: drop>(
    order: &LimitOrder<SY, PT>,
    clock: &Clock,
) {
    assert!(is_live(order, clock), E_EXPIRED);
}

fun is_live<SY: drop, PT: drop>(
    order: &LimitOrder<SY, PT>,
    clock: &Clock,
): bool {
    order.expiry_ms == 0 || order.expiry_ms > sui::clock::timestamp_ms(clock)
}

fun sy_for_pt(pt_amount: u64, price_raw: u128): u64 {
    assert!(price_raw > 0, E_BAD_PRICE);
    let numerator = (pt_amount as u256) * (price_raw as u256);
    let denominator = FP64_ONE as u256;
    let rounded = (numerator + denominator - 1) / denominator;
    assert!(rounded > 0, E_ZERO_AMOUNT);
    rounded as u64
}

fun pt_for_sy(sy_amount: u64, price_raw: u128): u64 {
    assert!(price_raw > 0, E_BAD_PRICE);
    (((sy_amount as u256) * (FP64_ONE as u256) / (price_raw as u256)) as u64)
}

fun min_u64(a: u64, b: u64): u64 {
    if (a < b) { a } else { b }
}

fun take_all_sy<SY: drop>(balance_in: &mut Balance<SY>, ctx: &mut TxContext): Coin<SY> {
    let amount = balance::value(balance_in);
    if (amount == 0) {
        return coin::from_balance(balance::zero(), ctx)
    };
    coin::from_balance(balance::split(balance_in, amount), ctx)
}

fun take_all_pt<PT: drop>(balance_in: &mut Balance<PT>, ctx: &mut TxContext): Coin<PT> {
    let amount = balance::value(balance_in);
    if (amount == 0) {
        return coin::from_balance(balance::zero(), ctx)
    };
    coin::from_balance(balance::split(balance_in, amount), ctx)
}

#[test_only]
public struct DummySY has drop {}

#[test_only]
public struct DummyPT has drop {}

#[test_only]
public fun create_for_testing<SY: drop, PT: drop, YT: drop>(
    market: &Market<SY, PT, YT>,
    ctx: &mut TxContext,
): OrderBook<SY, PT> {
    create_orderbook_internal(market, ctx)
}

#[test_only]
public fun create_with_market_id_for_testing<SY: drop, PT: drop>(
    market_id: ID,
    ctx: &mut TxContext,
): OrderBook<SY, PT> {
    OrderBook<SY, PT> {
        id: object::new(ctx),
        market_id,
        next_order_id: 1,
        active_order_count: 0,
        active_order_ids: new_active_order_ids(ctx),
        paused: false,
        emergency_paused: false,
    }
}

#[test_only]
public fun destroy_for_testing<SY: drop, PT: drop>(book: OrderBook<SY, PT>) {
    let OrderBook {
        id,
        market_id: _,
        next_order_id: _,
        active_order_count,
        active_order_ids,
        paused: _,
        emergency_paused: _,
    } = book;
    assert!(active_order_count == 0, E_ORDER_NOT_FOUND);
    assert!(keyed_big_vector::length(&active_order_ids) == 0, E_ORDER_NOT_FOUND);
    keyed_big_vector::destroy_empty<u64>(active_order_ids);
    object::delete(id);
}

#[test]
fun summaries_track_active_order_index() {
    let ctx = &mut tx_context::dummy();
    let mut clock = sui::clock::create_for_testing(ctx);
    sui::clock::set_for_testing(&mut clock, 1_000);
    let mut book = create_with_market_id_for_testing<DummySY, DummyPT>(
        object::id_from_address(@0x1),
        ctx,
    );

    let bid_id = place_bid<DummySY, DummyPT>(
        &mut book,
        coin::mint_for_testing<DummySY>(100, ctx),
        FP64_ONE,
        100,
        0,
        &clock,
        ctx,
    );
    let ask_id = place_ask<DummySY, DummyPT>(
        &mut book,
        coin::mint_for_testing<DummyPT>(50, ctx),
        FP64_ONE,
        0,
        &clock,
        ctx,
    );

    let ids = order_ids(&book);
    assert!(vector::length(&ids) == 2, 10);
    assert!(*vector::borrow(&ids, 0) == bid_id, 11);
    assert!(*vector::borrow(&ids, 1) == ask_id, 12);

    let all = summaries(&book);
    assert!(vector::length(&all) == 2, 13);
    assert!(vector::borrow(&all, 0).id == bid_id, 14);
    assert!(vector::borrow(&all, 1).id == ask_id, 15);

    let page = summaries_paginated(&book, 1, 1);
    assert!(vector::length(&page) == 1, 16);
    assert!(vector::borrow(&page, 0).id == ask_id, 17);

    let empty_page = order_ids_paginated(&book, 3, 10);
    assert!(vector::length(&empty_page) == 0, 18);

    let (bid_sy, bid_pt) = cancel_order(&mut book, bid_id, ctx);
    coin::burn_for_testing(bid_sy);
    coin::burn_for_testing(bid_pt);

    let remaining_ids = order_ids(&book);
    assert!(vector::length(&remaining_ids) == 1, 19);
    assert!(*vector::borrow(&remaining_ids, 0) == ask_id, 20);
    let remaining = summaries(&book);
    assert!(vector::length(&remaining) == 1, 21);
    assert!(vector::borrow(&remaining, 0).id == ask_id, 22);

    let (ask_sy, ask_pt) = cancel_order(&mut book, ask_id, ctx);
    coin::burn_for_testing(ask_sy);
    coin::burn_for_testing(ask_pt);
    destroy_for_testing(book);
    sui::clock::destroy_for_testing(clock);
}

#[test, expected_failure(abort_code = E_REWARD_DISTRIBUTOR_REQUIRED)]
fun reward_required_blocks_without_gate() {
    let ctx = &mut tx_context::dummy();
    let distributor = reward_distributor::create_for_testing(ctx);
    let mut book = create_with_market_id_for_testing<DummySY, DummyPT>(
        object::id_from_address(@0x1),
        ctx,
    );
    require_reward_distributor(&mut book, reward_distributor::id(&distributor));
    assert_reward_mutation_allowed(&book);
    destroy_for_testing(book);
    reward_distributor::destroy_for_testing(distributor);
}

#[test]
fun reward_gate_allows_orderbook_mutation_scope() {
    let ctx = &mut tx_context::dummy();
    let distributor = reward_distributor::create_for_testing(ctx);
    let mut book = create_with_market_id_for_testing<DummySY, DummyPT>(
        object::id_from_address(@0x1),
        ctx,
    );
    require_reward_distributor(&mut book, reward_distributor::id(&distributor));
    let operation = reward_distributor::begin_orderbook_operation(
        &distributor,
        object::id(&book),
        0,
    );
    let settlement = reward_distributor::finish_operation(operation);
    let access = begin_reward_operation(&mut book, settlement);
    assert_reward_mutation_allowed(&book);
    end_reward_operation(&mut book, access);
    assert!(!reward_gate_open(&book), 0);
    let required = df::remove<RewardRequiredKey, RewardRequired>(&mut book.id, RewardRequiredKey());
    let RewardRequired { distributor_id: _ } = required;
    destroy_for_testing(book);
    reward_distributor::destroy_for_testing(distributor);
}

#[test]
fun reward_settled_place_and_cancel_bid_use_wrappers() {
    let ctx = &mut tx_context::dummy();
    let mut clock = sui::clock::create_for_testing(ctx);
    sui::clock::set_for_testing(&mut clock, 1_000);
    let distributor = reward_distributor::create_for_testing(ctx);
    let mut book = create_with_market_id_for_testing<DummySY, DummyPT>(
        object::id_from_address(@0x1),
        ctx,
    );
    require_reward_distributor(&mut book, reward_distributor::id(&distributor));

    let placement_operation = reward_distributor::begin_orderbook_operation(
        &distributor,
        object::id(&book),
        order_count(&book),
    );
    let placement_settlement = reward_distributor::finish_operation(placement_operation);
    let bid_sy = coin::mint_for_testing<DummySY>(50, ctx);
    let (order_id, post_placement_operation) = place_bid_after_reward_settlement(
        placement_settlement,
        &distributor,
        &mut book,
        bid_sy,
        FP64_ONE,
        50,
        0,
        &clock,
        ctx,
    );
    assert!(order_id == 1, 20);
    assert!(order_count(&book) == 1, 21);
    assert!(reward_distributor::pending_rewarder_count(&post_placement_operation) == 0, 22);
    let post_placement_settlement = reward_distributor::finish_operation(
        post_placement_operation,
    );
    reward_distributor::destroy_settlement(post_placement_settlement);

    let cancel_operation = reward_distributor::begin_orderbook_operation(
        &distributor,
        object::id(&book),
        order_count(&book),
    );
    let cancel_settlement = reward_distributor::finish_operation(cancel_operation);
    let (cancel_sy, cancel_pt, post_cancel_operation) = cancel_order_after_reward_settlement(
        cancel_settlement,
        &distributor,
        &mut book,
        order_id,
        ctx,
    );
    assert!(coin::value(&cancel_sy) == 50, 23);
    assert!(coin::value(&cancel_pt) == 0, 24);
    assert!(order_count(&book) == 0, 25);
    assert!(reward_distributor::pending_rewarder_count(&post_cancel_operation) == 0, 26);
    let post_cancel_settlement = reward_distributor::finish_operation(post_cancel_operation);
    reward_distributor::destroy_settlement(post_cancel_settlement);

    coin::burn_for_testing(cancel_sy);
    coin::burn_for_testing(cancel_pt);
    let required = df::remove<RewardRequiredKey, RewardRequired>(&mut book.id, RewardRequiredKey());
    let RewardRequired { distributor_id: _ } = required;
    destroy_for_testing(book);
    reward_distributor::destroy_for_testing(distributor);
    sui::clock::destroy_for_testing(clock);
}
