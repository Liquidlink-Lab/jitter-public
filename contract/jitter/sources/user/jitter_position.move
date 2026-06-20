/// jitter_position - unified user position object.
///
/// A `JitterPosition` owns both the PT/YT leg and the LP leg for one market.
/// The legs stay separated inside the object so PY accounting and LP accounting
/// can mutate independently without forcing unrelated reward settlement.
module jitter::jitter_position;

use sui::coin::Coin;
use sui::clock::Clock;
use sui::dynamic_field as df;

use jitter::market::{Self, Market};
use jitter::reward_distributor::{Self, RewardSettlement};

const E_INSUFFICIENT_PT: u64 = 500;
const E_INSUFFICIENT_YT: u64 = 501;
const E_STATE_MISMATCH: u64 = 502;
const E_ZERO_AMOUNT: u64 = 503;
const E_EXPIRED: u64 = 1300;
const E_MARKET_MISMATCH: u64 = 1303;
const E_INSUFFICIENT_LP: u64 = 1900;
const E_POOL_MISMATCH: u64 = 1901;
const E_REWARD_GATE_CLOSED: u64 = 1903;
const E_REWARD_GATE_OPEN: u64 = 1904;
const E_REWARD_DISTRIBUTOR_MISMATCH: u64 = 1905;

public struct PyLeg has store, drop {
    pt_balance: u64,
    yt_balance: u64,
    index: u128,
    py_index: u128,
    accrued: u128,
}

public struct LpLeg has store, drop {
    pool_id: ID,
    lp_amount: u64,
}

public struct JitterPosition has key {
    id: UID,
    py_state_id: ID,
    market_id: ID,
    expiry: u64,
    created_at: u64,
    py: PyLeg,
    lp: LpLeg,
}

public struct PositionCreatedEvent has copy, drop {
    position_id: ID,
    py_state_id: ID,
    market_id: ID,
    pool_id: ID,
    expiry: u64,
    owner: address,
}

public struct BurnPtEvent has copy, drop {
    position_id: ID,
    amount: u64,
}

public struct BurnYtEvent has copy, drop {
    position_id: ID,
    amount: u64,
}

public struct RedeemPtEvent has copy, drop {
    position_id: ID,
    amount: u64,
}

public struct RedeemYtEvent has copy, drop {
    position_id: ID,
    amount: u64,
}

public struct LpRewardGateKey() has copy, drop, store;

public struct LpRewardMutation {
    position_id: ID,
    distributor_id: ID,
}

public fun none_id(): ID { object::id_from_address(@0x0) }

public(package) fun mint(
    py_state_id: ID,
    market_id: ID,
    pool_id: ID,
    expiry: u64,
    clock: &sui::clock::Clock,
    ctx: &mut TxContext,
): JitterPosition {
    let position = JitterPosition {
        id: object::new(ctx),
        py_state_id,
        market_id,
        expiry,
        created_at: sui::clock::timestamp_ms(clock),
        py: PyLeg {
            pt_balance: 0,
            yt_balance: 0,
            index: 0,
            py_index: 0,
            accrued: 0,
        },
        lp: LpLeg {
            pool_id,
            lp_amount: 0,
        },
    };

    sui::event::emit(PositionCreatedEvent {
        position_id: object::id(&position),
        py_state_id,
        market_id,
        pool_id,
        expiry,
        owner: ctx.sender(),
    });

    position
}

public(package) fun mint_py(
    py_state_id: ID,
    market_id: ID,
    expiry: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): JitterPosition {
    mint(py_state_id, market_id, none_id(), expiry, clock, ctx)
}

public(package) fun mint_lp(
    pool_id: ID,
    py_state_id: ID,
    market_id: ID,
    expiry: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): JitterPosition {
    mint(py_state_id, market_id, pool_id, expiry, clock, ctx)
}

public(package) fun transfer_position(position: JitterPosition, recipient: address) {
    transfer::transfer(position, recipient);
}

public fun destroy_empty(position: JitterPosition) {
    assert!(is_py_empty(&position), E_INSUFFICIENT_PT);
    assert!(is_lp_empty(&position), E_INSUFFICIENT_LP);
    destroy(position);
}

public(package) fun uid(position: &JitterPosition): &UID {
    &position.id
}

public(package) fun uid_mut(position: &mut JitterPosition): &mut UID {
    &mut position.id
}

public fun id(position: &JitterPosition): ID { object::id(position) }
public fun py_state_id(position: &JitterPosition): ID { position.py_state_id }
public fun market_id(position: &JitterPosition): ID { position.market_id }
public fun expiry(position: &JitterPosition): u64 { position.expiry }
public fun created_at(position: &JitterPosition): u64 { position.created_at }

public fun pt_balance(position: &JitterPosition): u64 { position.py.pt_balance }
public fun yt_balance(position: &JitterPosition): u64 { position.py.yt_balance }
public fun index(position: &JitterPosition): u128 { position.py.index }
public fun py_index(position: &JitterPosition): u128 { position.py.py_index }
public fun accrued(position: &JitterPosition): u128 { position.py.accrued }
public fun is_py_empty(position: &JitterPosition): bool {
    position.py.pt_balance == 0 && position.py.yt_balance == 0
}

public fun pool_id(position: &JitterPosition): ID { position.lp.pool_id }
public fun lp_amount(position: &JitterPosition): u64 { position.lp.lp_amount }
public fun is_lp_empty(position: &JitterPosition): bool { position.lp.lp_amount == 0 }

public(package) fun add_pt(position: &mut JitterPosition, amount: u64) {
    assert!(amount > 0, E_ZERO_AMOUNT);
    position.py.pt_balance = position.py.pt_balance + amount;
}

public(package) fun sub_pt(position: &mut JitterPosition, amount: u64) {
    assert!(amount > 0, E_ZERO_AMOUNT);
    assert!(position.py.pt_balance >= amount, E_INSUFFICIENT_PT);
    position.py.pt_balance = position.py.pt_balance - amount;
}

public(package) fun set_pt_balance(position: &mut JitterPosition, new_balance: u64) {
    position.py.pt_balance = new_balance;
}

public(package) fun add_yt(position: &mut JitterPosition, amount: u64) {
    assert!(amount > 0, E_ZERO_AMOUNT);
    position.py.yt_balance = position.py.yt_balance + amount;
}

public(package) fun sub_yt(position: &mut JitterPosition, amount: u64) {
    assert!(amount > 0, E_ZERO_AMOUNT);
    assert!(position.py.yt_balance >= amount, E_INSUFFICIENT_YT);
    position.py.yt_balance = position.py.yt_balance - amount;
}

public(package) fun set_yt_balance(position: &mut JitterPosition, new_balance: u64) {
    position.py.yt_balance = new_balance;
}

public(package) fun set_index(position: &mut JitterPosition, new_index: u128) {
    position.py.index = new_index;
}

public(package) fun set_py_index(position: &mut JitterPosition, new_py_index: u128) {
    position.py.py_index = new_py_index;
}

public(package) fun set_accrued(position: &mut JitterPosition, new_accrued: u128) {
    position.py.accrued = new_accrued;
}

public(package) fun clear_accrued(position: &mut JitterPosition) {
    position.py.accrued = 0;
}

public(package) fun bind_pool_if_empty(
    position: &mut JitterPosition,
    expected_pool_id: ID,
) {
    if (position.lp.pool_id == none_id()) {
        assert!(position.lp.lp_amount == 0, E_POOL_MISMATCH);
        position.lp.pool_id = expected_pool_id;
    };
}

public(package) fun add_lp(position: &mut JitterPosition, amount: u64) {
    assert!(amount > 0, E_ZERO_AMOUNT);
    position.lp.lp_amount = position.lp.lp_amount + amount;
}

public(package) fun sub_lp(position: &mut JitterPosition, amount: u64) {
    assert!(amount > 0, E_ZERO_AMOUNT);
    assert!(position.lp.lp_amount >= amount, E_INSUFFICIENT_LP);
    position.lp.lp_amount = position.lp.lp_amount - amount;
}

public fun burn_pt_in<SY: drop, PT: drop, YT: drop>(
    pt_coin: Coin<PT>,
    position: &mut JitterPosition,
    expected_state_id: ID,
    market: &mut Market<SY, PT, YT>,
) {
    assert_state_match(position, expected_state_id);
    assert_market_match(position, market);

    let amount = sui::coin::value(&pt_coin);
    assert!(amount > 0, E_ZERO_AMOUNT);

    market::burn_pt(market, pt_coin);
    add_pt(position, amount);

    sui::event::emit(BurnPtEvent {
        position_id: object::id(position),
        amount,
    });
}

public fun burn_yt_in<SY: drop, PT: drop, YT: drop>(
    yt_coin: Coin<YT>,
    position: &mut JitterPosition,
    expected_state_id: ID,
    market: &mut Market<SY, PT, YT>,
) {
    assert_state_match(position, expected_state_id);
    assert_market_match(position, market);

    let amount = sui::coin::value(&yt_coin);
    assert!(amount > 0, E_ZERO_AMOUNT);

    market::burn_yt(market, yt_coin);
    add_yt(position, amount);

    sui::event::emit(BurnYtEvent {
        position_id: object::id(position),
        amount,
    });
}

public fun redeem_pt_out<SY: drop, PT: drop, YT: drop>(
    amount: u64,
    position: &mut JitterPosition,
    expected_state_id: ID,
    market: &mut Market<SY, PT, YT>,
    clock: &Clock,
    ctx: &mut TxContext,
): Coin<PT> {
    let now = sui::clock::timestamp_ms(clock);
    assert!(position.expiry > now, E_EXPIRED);
    assert_state_match(position, expected_state_id);
    assert_market_match(position, market);
    assert!(amount > 0, E_ZERO_AMOUNT);

    sub_pt(position, amount);
    let pt_coin = market::mint_pt(market, amount, ctx);

    sui::event::emit(RedeemPtEvent {
        position_id: object::id(position),
        amount,
    });

    pt_coin
}

public fun redeem_yt_out<SY: drop, PT: drop, YT: drop>(
    amount: u64,
    position: &mut JitterPosition,
    expected_state_id: ID,
    market: &mut Market<SY, PT, YT>,
    clock: &Clock,
    ctx: &mut TxContext,
): Coin<YT> {
    let now = sui::clock::timestamp_ms(clock);
    assert!(position.expiry > now, E_EXPIRED);
    assert_state_match(position, expected_state_id);
    assert_market_match(position, market);
    assert!(amount > 0, E_ZERO_AMOUNT);

    sub_yt(position, amount);
    let yt_coin = market::mint_yt(market, amount, ctx);

    sui::event::emit(RedeemYtEvent {
        position_id: object::id(position),
        amount,
    });

    yt_coin
}

public(package) fun begin_reward_mutation(
    position: &mut JitterPosition,
    settlement: RewardSettlement,
    distributor_id: ID,
    owner: address,
): LpRewardMutation {
    assert!(!reward_gate_open(position), E_REWARD_GATE_OPEN);
    let consumed_distributor_id = reward_distributor::consume_lp_settlement(
        settlement,
        distributor_id,
        object::id(position),
        owner,
    );
    df::add(uid_mut(position), LpRewardGateKey(), consumed_distributor_id);
    LpRewardMutation { position_id: object::id(position), distributor_id: consumed_distributor_id }
}

public(package) fun end_reward_mutation(
    position: &mut JitterPosition,
    mutation: LpRewardMutation,
) {
    let LpRewardMutation { position_id, distributor_id } = mutation;
    assert!(position_id == object::id(position), E_POOL_MISMATCH);
    assert!(reward_gate_open(position), E_REWARD_GATE_CLOSED);
    let gate_distributor_id = df::remove<LpRewardGateKey, ID>(
        uid_mut(position),
        LpRewardGateKey(),
    );
    assert!(gate_distributor_id == distributor_id, E_REWARD_DISTRIBUTOR_MISMATCH);
}

public(package) fun assert_reward_mutation_allowed(
    position: &JitterPosition,
    distributor_id: ID,
) {
    assert!(reward_gate_open(position), E_REWARD_GATE_CLOSED);
    let gate_distributor_id = *df::borrow<LpRewardGateKey, ID>(
        uid(position),
        LpRewardGateKey(),
    );
    assert!(gate_distributor_id == distributor_id, E_REWARD_DISTRIBUTOR_MISMATCH);
}

public fun reward_gate_open(position: &JitterPosition): bool {
    df::exists<LpRewardGateKey>(uid(position), LpRewardGateKey())
}

public fun assert_state_match(position: &JitterPosition, expected_state_id: ID) {
    assert!(position.py_state_id == expected_state_id, E_STATE_MISMATCH);
}

public fun assert_pool_match(position: &JitterPosition, expected_pool_id: ID) {
    assert!(position.lp.pool_id == expected_pool_id, E_POOL_MISMATCH);
}

fun assert_market_match<SY: drop, PT: drop, YT: drop>(
    position: &JitterPosition,
    market: &Market<SY, PT, YT>,
) {
    assert!(position.market_id == market.id(), E_MARKET_MISMATCH);
}

#[test_only]
public fun create_py_for_testing(
    py_state_id: ID,
    market_id: ID,
    expiry: u64,
    ctx: &mut TxContext,
): JitterPosition {
    create_for_testing(py_state_id, market_id, none_id(), expiry, ctx)
}

#[test_only]
public fun create_lp_for_testing(
    pool_id: ID,
    expiry: u64,
    ctx: &mut TxContext,
): JitterPosition {
    create_for_testing(none_id(), none_id(), pool_id, expiry, ctx)
}

#[test_only]
public fun create_for_testing(
    py_state_id: ID,
    market_id: ID,
    pool_id: ID,
    expiry: u64,
    ctx: &mut TxContext,
): JitterPosition {
    JitterPosition {
        id: object::new(ctx),
        py_state_id,
        market_id,
        expiry,
        created_at: 0,
        py: PyLeg {
            pt_balance: 0,
            yt_balance: 0,
            index: 0,
            py_index: 0,
            accrued: 0,
        },
        lp: LpLeg {
            pool_id,
            lp_amount: 0,
        },
    }
}

#[test_only]
public fun destroy_for_testing(position: JitterPosition) {
    destroy(position);
}

#[test_only]
public fun set_py_balances_for_testing(
    position: &mut JitterPosition,
    pt_balance: u64,
    yt_balance: u64,
) {
    position.py.pt_balance = pt_balance;
    position.py.yt_balance = yt_balance;
}

#[test_only]
public fun set_lp_amount_for_testing(position: &mut JitterPosition, lp_amount: u64) {
    position.lp.lp_amount = lp_amount;
}

fun destroy(position: JitterPosition) {
    let JitterPosition {
        id,
        py_state_id: _,
        market_id: _,
        expiry: _,
        created_at: _,
        py: _,
        lp: _,
    } = position;
    object::delete(id);
}
