/// py_state - shared PT/YT accounting state for one expiry and one SY type.
///
/// Each `PyState<T>` tracks:
///   - PT and YT total supply
///   - the SY interest pool balance
///   - the stored high-water `py_index`
///   - the global interest accumulator
///   - treasury interest accrued by the protocol
///
/// Compared with the earlier Nemo-style layout, this version stores interest
/// indexes directly as raw `u128` FP64 values, uses `PyState` itself as the
/// shared object instead of a nested bag, and records explicit settlement state.
module jitter::py_state;

// ===========================================
// Standard Library Imports
// ===========================================
use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::dynamic_field as df;
use sui::event;
// ===========================================
// Internal Package Imports
// ===========================================
use jitter::jitter_position::{Self, JitterPosition};

use jitter::reward_distributor::{Self, RewardSettlement};
use jitter::market::{Self, Market};

// ===========================================
// Jitter Package Imports
// ===========================================
use jitter_admin::admin::AdminCap;
use jitter_admin::acl::ACL;

use jitter_oracle::price_info::{Self, PriceInfo};

// ===========================================
//  Error Codes
// ===========================================
const E_ALREADY_SETTLED: u64 = 700;
const E_NOT_EXPIRED: u64 = 701;
const E_INSUFFICIENT_PT: u64 = 702;
const E_INSUFFICIENT_YT: u64 = 703;
const E_ZERO_AMOUNT: u64 = 704;
const E_INSUFFICIENT_SY_BALANCE: u64 = 705;
const E_EXPIRED: u64 = 1100;
const E_ALREADY_EXPIRED: u64 = 1201;
const EInsufficientYT: u64 = 1202;
const EInsufficientPT: u64 = 1203;
const E_STATE_MISMATCH: u64 = 1204;
const E_YT_REWARD_REQUIRED: u64 = 1205;
const E_YT_REWARD_GATE_OPEN: u64 = 1206;
const E_YT_REWARD_GATE_CLOSED: u64 = 1207;
const E_YT_REWARD_DISTRIBUTOR_MISMATCH: u64 = 1208;
const E_PY_STATE_PAUSED: u64 = 1209;
const E_FEE_RATE_TOO_HIGH: u64 = 1210;
const E_ZERO_EXPIRY_DIVISOR: u64 = 1211;
const E_INVALID_EXPIRY: u64 = 1212;

/// FP64 representation of 1.0.
const FP64_ONE: u128 = 1 << 64;
const MAX_FEE_RATE: u128 = (1 << 64) / 5;

// ===========================================
// Core Struct
// ===========================================

/// Shared PT/YT state for one SY market.
/// `T` is the SY token type.
public struct PyState<phantom T: drop> has key, store {
    id: UID,
    market_id: ID,
    /// Expiry timestamp in milliseconds.
    expiry: u64,
    /// Treasury fee rate taken from accrued YT interest, stored as FP64 raw.
    interest_fee_rate: u128,
    /// Expiry must be divisible by this value at setup.
    expiry_divisor: u64,
    /// Treasury address for protocol interest accounting.
    treasury: address,
    /// Total PT supply.
    pt_supply: u64,
    /// Total YT supply.
    yt_supply: u64,
    /// SY interest pool that holds collected interest.
    sy_balance: Balance<T>,
    /// Stored high-water `py_index`, stored as FP64 raw.
    py_index_stored: u128,
    /// Timestamp of the most recent `py_index` update.
    py_index_last_updated: u64,
    /// `py_index` snapshot from the previous interest collection.
    last_collect_interest_index: u128,
    /// Accumulated treasury interest, stored as FP64 raw.
    total_treasury_interest: u128,
    /// Timestamp of the last interest operation.
    last_interest_timestamp: u64,
    /// Global interest accumulator, stored as FP64 raw.
    global_interest_index: u128,
    /// Whether the market has been settled after expiry.
    is_settled: bool,
    /// `py_index` captured at settlement time.
    settled_py_index: u128,
    /// Whether mint/redeem/claim operations are normally paused.
    paused: bool,
    /// Emergency pause is independent from normal pause and requires a
    /// dedicated recovery path.
    emergency_paused: bool,
}

// ===========================================
// Events
// ===========================================

public struct PyStateCreatedEvent has copy, drop {
    state_id: ID,
    market_id: ID,
    expiry: u64,
}

public struct InterestCollectedEvent has copy, drop {
    state_id: ID,
    user_interest_raw: u128,
    treasury_interest_raw: u128,
    py_index_raw: u128,
}

public struct SettledEvent has copy, drop {
    state_id: ID,
    market_id: ID,
    settled_py_index: u128,
    treasury_interest_collected_raw: u128,
    settled_at_ms: u64,
}

public struct MintPyEvent has copy, drop {
    py_state_id: ID,
    position_id: ID,
    sy_amount_in: u64,
    pt_amount: u64,
    yt_amount: u64,
    expiry: u64,
}

public struct RedeemPyEvent has copy, drop {
    py_state_id: ID,
    position_id: ID,
    pt_amount: u64,
    yt_amount: u64,
    sy_amount_out: u64,
    expiry: u64,
    redeemer: address,
}

public struct InterestClaimedEvent has copy, drop {
    py_state_id: ID,
    position_id: ID,
    sy_amount: u64,
    receiver: address,
}

public struct SettlementEvent has copy, drop {
    py_state_id: ID,
    settled_py_index: u128,
}

public struct ExternalPtRedeemReceipt {
    state_id: ID,
    pt_amount: u64,
}

public struct YtRewardRequiredKey() has copy, drop, store;

public struct YtRewardGateKey() has copy, drop, store;

public struct YtRewardRequired has store {
    distributor_id: ID,
}

public struct YtRewardMutation {
    state_id: ID,
    distributor_id: ID,
}

/// Emitted whenever protocol treasury interest is collected. Provides an
/// on-chain audit trail distinct from the resulting coin transfer.
public struct TreasuryInterestCollectedEvent has copy, drop {
    py_state_id: ID,
    market_id: ID,
    amount: u64,
    /// Remaining FP64-raw treasury dust after collection.
    dust_remainder_raw: u128,
    collected_by: address,
}

public struct YtRewardDistributorRequiredEvent has copy, drop {
    py_state_id: ID,
    distributor_id: ID,
}

public struct PyStatePauseStatusChangedEvent has copy, drop {
    py_state_id: ID,
    paused: bool,
    actor: address,
}

public struct PyStateEmergencyPausedEvent has copy, drop {
    py_state_id: ID,
    actor: address,
    reason: vector<u8>,
}

public struct PyStateEmergencyPauseStatusChangedEvent has copy, drop {
    py_state_id: ID,
    emergency_paused: bool,
    actor: address,
    reason: vector<u8>,
}

// ===========================================
// Creation
// ===========================================

public fun create_py_state_by_admin_cap<SY: drop, PT: drop, YT: drop>(
    _admin_cap: &AdminCap,
    market: &Market<SY, PT, YT>,
    interest_fee_rate: u128,
    expiry_divisor: u64,
    treasury: address,
    ctx: &mut TxContext,
): PyState<SY> {
    create_py_state_internal(
        market::id(market),
        market::expiry(market),
        interest_fee_rate,
        expiry_divisor,
        treasury,
        ctx,
    )
}

public fun require_yt_reward_distributor_by_admin<T: drop>(
    state: &mut PyState<T>,
    distributor_id: ID,
    _admin_cap: &AdminCap,
) {
    require_yt_reward_distributor(state, distributor_id);
}

// ===========================================
// Admin Controls
// ===========================================

public fun pause_by_admin<T: drop>(
    state: &mut PyState<T>,
    _admin_cap: &AdminCap,
    ctx: &TxContext,
) {
    set_paused(state, true, ctx.sender());
}

public fun unpause_by_admin<T: drop>(
    state: &mut PyState<T>,
    _admin_cap: &AdminCap,
    ctx: &TxContext,
) {
    set_paused(state, false, ctx.sender());
}

public fun emergency_pause_by_admin<T: drop>(
    state: &mut PyState<T>,
    _admin_cap: &AdminCap,
    reason: vector<u8>,
    ctx: &TxContext,
) {
    set_emergency_paused(state, true, ctx.sender(), copy reason);
    event::emit(PyStateEmergencyPausedEvent {
        py_state_id: state_id(state),
        actor: ctx.sender(),
        reason,
    });
}

public fun emergency_unpause_by_admin<T: drop>(
    state: &mut PyState<T>,
    _admin_cap: &AdminCap,
    ctx: &TxContext,
) {
    set_emergency_paused(state, false, ctx.sender(), b"admin recovery");
}

public fun pause_by_acl<T: drop>(
    state: &mut PyState<T>,
    acl: &ACL,
    ctx: &TxContext,
) {
    acl.assert_has_role(ctx.sender(), std::string::utf8(b"py_state.pause"));
    set_paused(state, true, ctx.sender());
}

public fun unpause_by_acl<T: drop>(
    state: &mut PyState<T>,
    acl: &ACL,
    ctx: &TxContext,
) {
    acl.assert_has_role(ctx.sender(), std::string::utf8(b"py_state.unpause"));
    set_paused(state, false, ctx.sender());
}

public fun emergency_pause_by_acl<T: drop>(
    state: &mut PyState<T>,
    acl: &ACL,
    reason: vector<u8>,
    ctx: &TxContext,
) {
    acl.assert_has_role(ctx.sender(), std::string::utf8(b"py_state.emergency_pause"));
    set_emergency_paused(state, true, ctx.sender(), copy reason);
    event::emit(PyStateEmergencyPausedEvent {
        py_state_id: state_id(state),
        actor: ctx.sender(),
        reason,
    });
}

public fun emergency_unpause_by_acl<T: drop>(
    state: &mut PyState<T>,
    acl: &ACL,
    ctx: &TxContext,
) {
    acl.assert_has_role(ctx.sender(), std::string::utf8(b"py_state.emergency_unpause"));
    set_emergency_paused(state, false, ctx.sender(), b"acl recovery");
}

// ===========================================
// Pure Interest Helpers
// ===========================================

public fun calc_interest(
    amount_raw: u128,
    old_index_raw: u128,
    new_index_raw: u128,
): u128 {
    if (old_index_raw == 0 || new_index_raw == 0) {
        return 0
    };
    if (new_index_raw <= old_index_raw) {
        return 0
    };

    let diff = new_index_raw - old_index_raw;
    let product = (old_index_raw as u256) * (new_index_raw as u256);
    assert!(product > 0, E_ZERO_AMOUNT);

    let numerator = (amount_raw as u256) * (diff as u256);
    let result = numerator * (FP64_ONE as u256) / product;
    result as u128
}

public fun current_py_index(
    sy_index_raw: u128,
    stored_py_index_raw: u128,
): u128 {
    if (sy_index_raw > stored_py_index_raw) {
        sy_index_raw
    } else {
        stored_py_index_raw
    }
}

public fun update_global_interest_index(
    current_global_index_raw: u128,
    interest_for_users_raw: u128,
    yt_supply: u64,
): u128 {
    let mut index = current_global_index_raw;
    if (index == 0) {
        index = FP64_ONE;
    };
    if (yt_supply == 0 || interest_for_users_raw == 0) {
        return index
    };

    let yt_supply_fp = (yt_supply as u128) * FP64_ONE;
    let delta = (interest_for_users_raw as u256) * (FP64_ONE as u256)
        / (yt_supply_fp as u256);
    index + (delta as u128)
}

public fun calc_user_accrued(
    current_accrued_raw: u128,
    yt_balance: u64,
    global_index_raw: u128,
    user_index_raw: u128,
): u128 {
    if (user_index_raw == 0 || global_index_raw <= user_index_raw) {
        return current_accrued_raw
    };
    let delta_index = global_index_raw - user_index_raw;
    let additional = (yt_balance as u128) * delta_index;
    current_accrued_raw + additional
}

/// Deprecated typo alias; kept so external callers don't break.
/// Prefer `calc_user_accrued` (audit finding L-3).
public fun calc_user_accured(
    current_accured_raw: u128,
    yt_balance: u64,
    global_index_raw: u128,
    user_index_raw: u128,
): u128 {
    calc_user_accrued(current_accured_raw, yt_balance, global_index_raw, user_index_raw)
}

public fun split_interest_fee(
    total_interest_raw: u128,
    fee_rate_raw: u128,
): (u128, u128) {
    if (total_interest_raw == 0) {
        return (0, 0)
    };
    let treasury = (total_interest_raw as u256) * (fee_rate_raw as u256)
        / (FP64_ONE as u256);
    let treasury_u128 = treasury as u128;
    let user = total_interest_raw - treasury_u128;
    (user, treasury_u128)
}

public fun sy_to_asset(
    exchange_rate_raw: u128,
    sy_amount_raw: u128,
): u128 {
    ((sy_amount_raw as u256) * (exchange_rate_raw as u256)
        / (FP64_ONE as u256) as u128)
}

public fun asset_to_sy(
    exchange_rate_raw: u128,
    asset_amount_raw: u128,
): u128 {
    assert!(exchange_rate_raw > 0, E_ZERO_AMOUNT);
    ((asset_amount_raw as u256) * (FP64_ONE as u256)
        / (exchange_rate_raw as u256) as u128)
}

public fun is_expired(expiry_ms: u64, now_ms: u64): bool {
    now_ms >= expiry_ms
}

// ===========================================
// Mint / Redeem Flows
// ===========================================

public fun mint_py<T: drop>(
    sy_coin: Coin<T>,
    price_info_in: PriceInfo<T>,
    position: &mut JitterPosition,
    state: &mut PyState<T>,
    clock: &sui::clock::Clock,
): u64 {
    let sy_index_raw = price_info::consume(
        price_info_in,
        market_id(state),
        clock,
    );

    mint_py_with_sy_index(
        sy_coin,
        sy_index_raw,
        position,
        state,
        clock,
    )
}

public(package) fun mint_py_with_sy_index<T: drop>(
    sy_coin: Coin<T>,
    sy_index_raw: u128,
    position: &mut JitterPosition,
    state: &mut PyState<T>,
    clock: &sui::clock::Clock,
): u64 {
    assert_not_paused(state);
    let now = sui::clock::timestamp_ms(clock);
    assert!(!is_expired(expiry(state), now), E_EXPIRED);
    jitter_position::assert_state_match(position, state_id(state));

    let sy_amount = coin::value(&sy_coin);
    assert!(sy_amount > 0, E_ZERO_AMOUNT);

    let py_index = current_py_index(
        sy_index_raw,
        py_index_stored(state),
    );
    let sy_amount_fp = (sy_amount as u128) * FP64_ONE;
    let py_amount = (sy_to_asset(py_index, sy_amount_fp) / FP64_ONE) as u64;
    assert!(py_amount > 0, E_ZERO_AMOUNT);
    let interest_fee_rate = state.interest_fee_rate;

    join_sy(state, sy_coin);

    update_user_interest(
        state,
        position,
        interest_fee_rate,
        sy_index_raw,
        clock,
    );

    mint_py_supply(state, position, py_amount);

    sui::event::emit(MintPyEvent {
        py_state_id: state_id(state),
        position_id: object::id(position),
        sy_amount_in: sy_amount,
        pt_amount: py_amount,
        yt_amount: py_amount,
        expiry: expiry(state),
    });

    py_amount
}

public fun calc_sy_amount_for_py<T: drop>(
    py_amount: u64,
    sy_index_raw: u128,
    state: &PyState<T>,
): u64 {
    let py_index = current_py_index(
        sy_index_raw,
        py_index_stored(state),
    );
    let py_amount_fp = (py_amount as u128) * FP64_ONE;
    let sy_needed_fp = asset_to_sy(py_index, py_amount_fp);
    (((sy_needed_fp + FP64_ONE - 1) / FP64_ONE) as u64)
}

public fun calc_py_amount_for_sy<T: drop>(
    sy_amount: u64,
    sy_index_raw: u128,
    state: &PyState<T>,
): u64 {
    if (sy_amount == 0) {
        return 0
    };

    let py_index = current_py_index(
        sy_index_raw,
        py_index_stored(state),
    );
    let sy_amount_fp = (sy_amount as u128) * FP64_ONE;
    (sy_to_asset(py_index, sy_amount_fp) / FP64_ONE) as u64
}

public fun redeem_py_before_expiry<T: drop>(
    out_amount: u64,
    price_info_in: PriceInfo<T>,
    position: &mut JitterPosition,
    state: &mut PyState<T>,
    clock: &sui::clock::Clock,
    ctx: &mut TxContext,
): Coin<T> {
    assert_not_paused(state);
    let now = sui::clock::timestamp_ms(clock);
    assert!(!is_expired(expiry(state), now), E_ALREADY_EXPIRED);
    jitter_position::assert_state_match(position, state_id(state));
    assert!(out_amount > 0, E_ZERO_AMOUNT);

    if (position.yt_balance() < out_amount) {
        abort EInsufficientYT
    };

    if (position.pt_balance() < out_amount) {
        abort EInsufficientPT
    };

    let redeem_amount = out_amount;
    assert_yt_reward_mutation_allowed(state);

    let sy_index_raw = price_info::consume(
        price_info_in,
        market_id(state),
        clock,
    );
    let interest_fee_rate = state.interest_fee_rate;

    update_user_interest(
        state,
        position,
        interest_fee_rate,
        sy_index_raw,
        clock,
    );

    burn_py(state, position, redeem_amount, redeem_amount);

    let py_index = current_py_index(
        sy_index_raw,
        py_index_stored(state),
    );
    let amount_fp = (redeem_amount as u128) * FP64_ONE;
    let sy_out_fp = asset_to_sy(py_index, amount_fp);
    let sy_out = (sy_out_fp / FP64_ONE) as u64;

    let sy_coin = split_sy(state, sy_out, ctx);

    sui::event::emit(RedeemPyEvent {
        py_state_id: state_id(state),
        position_id: object::id(position),
        pt_amount: redeem_amount,
        yt_amount: redeem_amount,
        sy_amount_out: sy_out,
        expiry: expiry(state),
        redeemer: ctx.sender(),
    });

    sy_coin
}

/// Redeem the caller's YT with a matching PT leg supplied by another protocol
/// component, such as the AMM pool in the router's YT sell path.
public(package) fun redeem_yt_with_external_pt_before_expiry<T: drop>(
    out_amount: u64,
    price_info_in: PriceInfo<T>,
    position: &mut JitterPosition,
    state: &mut PyState<T>,
    clock: &sui::clock::Clock,
    ctx: &mut TxContext,
): (Coin<T>, ExternalPtRedeemReceipt) {
    assert_not_paused(state);
    let now = sui::clock::timestamp_ms(clock);
    assert!(!is_expired(expiry(state), now), E_ALREADY_EXPIRED);
    jitter_position::assert_state_match(position, state_id(state));
    assert!(out_amount > 0, E_ZERO_AMOUNT);

    if (position.yt_balance() < out_amount) {
        abort EInsufficientYT
    };

    let redeem_amount = out_amount;

    let sy_index_raw = price_info::consume(
        price_info_in,
        market_id(state),
        clock,
    );
    let interest_fee_rate = state.interest_fee_rate;

    update_user_interest(
        state,
        position,
        interest_fee_rate,
        sy_index_raw,
        clock,
    );

    assert!(state.pt_supply >= redeem_amount, E_INSUFFICIENT_PT);
    assert!(state.yt_supply >= redeem_amount, E_INSUFFICIENT_YT);
    state.pt_supply = state.pt_supply - redeem_amount;
    state.yt_supply = state.yt_supply - redeem_amount;
    jitter_position::sub_yt(position, redeem_amount);

    let py_index = current_py_index(
        sy_index_raw,
        py_index_stored(state),
    );
    let amount_fp = (redeem_amount as u128) * FP64_ONE;
    let sy_out_fp = asset_to_sy(py_index, amount_fp);
    let sy_out = (sy_out_fp / FP64_ONE) as u64;

    let sy_coin = split_sy(state, sy_out, ctx);

    sui::event::emit(RedeemPyEvent {
        py_state_id: state_id(state),
        position_id: object::id(position),
        pt_amount: redeem_amount,
        yt_amount: redeem_amount,
        sy_amount_out: sy_out,
        expiry: expiry(state),
        redeemer: ctx.sender(),
    });

    (
        sy_coin,
        ExternalPtRedeemReceipt {
            state_id: state_id(state),
            pt_amount: redeem_amount,
        },
    )
}

public(package) fun settle_external_pt_redeem<T: drop>(
    state: &PyState<T>,
    receipt: ExternalPtRedeemReceipt,
    pt_amount: u64,
) {
    let ExternalPtRedeemReceipt { state_id, pt_amount: receipt_pt_amount } = receipt;
    assert!(state_id == state_id(state), E_STATE_MISMATCH);
    assert!(receipt_pt_amount == pt_amount, E_INSUFFICIENT_PT);
}

public fun redeem_py_after_expiry<T: drop>(
    pt_amount: u64,
    price_info_in: PriceInfo<T>,
    position: &mut JitterPosition,
    state: &mut PyState<T>,
    clock: &sui::clock::Clock,
    ctx: &mut TxContext,
): Coin<T> {
    assert_not_paused(state);
    let now = sui::clock::timestamp_ms(clock);
    assert!(is_expired(expiry(state), now), E_NOT_EXPIRED);
    jitter_position::assert_state_match(position, state_id(state));
    assert!(pt_amount > 0, E_ZERO_AMOUNT);

    let sy_index_raw = price_info::consume(
        price_info_in,
        market_id(state),
        clock,
    );
    let interest_fee_rate = state.interest_fee_rate;

    if (!is_settled(state)) {
        settle(
            state,
            interest_fee_rate,
            sy_index_raw,
            clock,
        );
        sui::event::emit(SettlementEvent {
            py_state_id: state_id(state),
            settled_py_index: settled_py_index(state),
        });
    };

    update_user_interest(
        state,
        position,
        interest_fee_rate,
        sy_index_raw,
        clock,
    );

    burn_py(state, position, pt_amount, 0);

    let settled_index = settled_py_index(state);
    let amount_fp = (pt_amount as u128) * FP64_ONE;
    let sy_out_fp = asset_to_sy(settled_index, amount_fp);
    let sy_out = (sy_out_fp / FP64_ONE) as u64;

    let sy_coin = split_sy(state, sy_out, ctx);

    sui::event::emit(RedeemPyEvent {
        py_state_id: state_id(state),
        position_id: object::id(position),
        pt_amount,
        yt_amount: 0,
        sy_amount_out: sy_out,
        expiry: expiry(state),
        redeemer: ctx.sender(),
    });

    sy_coin
}

public fun claim_interest<T: drop>(
    price_info_in: PriceInfo<T>,
    position: &mut JitterPosition,
    state: &mut PyState<T>,
    clock: &sui::clock::Clock,
    ctx: &mut TxContext,
): Coin<T> {
    assert_not_paused(state);
    jitter_position::assert_state_match(position, state_id(state));

    let sy_index_raw = price_info::consume(
        price_info_in,
        market_id(state),
        clock,
    );
    let interest_fee_rate = state.interest_fee_rate;

    if (is_expired(expiry(state), sui::clock::timestamp_ms(clock))) {
        if (!is_settled(state)) {
            settle(
                state,
                interest_fee_rate,
                sy_index_raw,
                clock,
            );
        };
    };

    update_user_interest(
        state,
        position,
        interest_fee_rate,
        sy_index_raw,
        clock,
    );

    let interest_coin = redeem_due_interest(state, position, ctx);
    let amount = coin::value(&interest_coin);

    sui::event::emit(InterestClaimedEvent {
        py_state_id: state_id(state),
        position_id: object::id(position),
        sy_amount: amount,
        receiver: ctx.sender(),
    });

    interest_coin
}

// ===========================================
// PT / YT Supply Helpers - package internal
// ===========================================

/// Mint PT and YT by increasing supply and updating the position.
public(package) fun mint_py_supply<T: drop>(
    state: &mut PyState<T>,
    position: &mut JitterPosition,
    amount: u64,
) {
    assert!(amount > 0, E_ZERO_AMOUNT);
    assert_yt_reward_mutation_allowed(state);
    state.pt_supply = state.pt_supply + amount;
    state.yt_supply = state.yt_supply + amount;
    jitter_position::add_pt(position, amount);
    jitter_position::add_yt(position, amount);
}

/// Burn PT and YT by reducing supply and updating the position.
public(package) fun burn_py<T: drop>(
    state: &mut PyState<T>,
    position: &mut JitterPosition,
    pt_amount: u64,
    yt_amount: u64,
) {
    assert!(state.pt_supply >= pt_amount, E_INSUFFICIENT_PT);
    assert!(state.yt_supply >= yt_amount, E_INSUFFICIENT_YT);
    if (yt_amount > 0) {
        assert_yt_reward_mutation_allowed(state);
    };
    state.pt_supply = state.pt_supply - pt_amount;
    state.yt_supply = state.yt_supply - yt_amount;
    if (pt_amount > 0) {
        jitter_position::sub_pt(position, pt_amount);
    };
    if (yt_amount > 0) {
        jitter_position::sub_yt(position, yt_amount);
    };
}

// ===========================================
// SY Balance Helpers - package internal
// ===========================================

/// Join SY into the interest pool.
public(package) fun join_sy<T: drop>(
    state: &mut PyState<T>,
    coin: Coin<T>,
) {
    balance::join(&mut state.sy_balance, coin::into_balance(coin));
}

/// Split SY out of the interest pool.
public(package) fun split_sy<T: drop>(
    state: &mut PyState<T>,
    amount: u64,
    ctx: &mut TxContext,
): Coin<T> {
    assert!(
        balance::value(&state.sy_balance) >= amount,
        E_INSUFFICIENT_SY_BALANCE,
    );
    coin::from_balance(balance::split(&mut state.sy_balance, amount), ctx)
}

// ===========================================
// Interest Index Updates
// ===========================================

/// Update the stored high-water `py_index`.
public(package) fun update_py_index<T: drop>(
    state: &mut PyState<T>,
    current_sy_index_raw: u128,
    clock: &sui::clock::Clock,
): u128 {
    let new_py_index = current_py_index(
        current_sy_index_raw,
        state.py_index_stored,
    );
    state.py_index_stored = new_py_index;
    state.py_index_last_updated = sui::clock::timestamp_ms(clock);
    new_py_index
}

/// Collect interest and update the global accumulator.
///
/// Returns `(new_global_index, new_py_index, treasury_interest)`.
public(package) fun update_interest_index<T: drop>(
    state: &mut PyState<T>,
    interest_fee_rate_raw: u128,
    current_sy_index_raw: u128,
    clock: &sui::clock::Clock,
): (u128, u128, u128) {
    state.last_interest_timestamp = sui::clock::timestamp_ms(clock);

    // Step 1: update the stored `py_index`
    let new_py_index = update_py_index(state, current_sy_index_raw, clock);

    // Step 2: collect newly accrued interest
    let old_index = state.last_collect_interest_index;
    let mut user_interest: u128 = 0;
    let mut treasury_interest: u128 = 0;

    if (old_index > 0 && new_py_index > old_index) {
        let yt_supply_fp = (state.yt_supply as u128) * FP64_ONE;
        let total_interest = calc_interest(
            yt_supply_fp,
            old_index,
            new_py_index,
        );

        // Step 3: split treasury and user interest
        let mut fee_rate = interest_fee_rate_raw;
        // After settlement, route the entire remainder to treasury accounting.
        if (state.is_settled) {
            fee_rate = FP64_ONE; // 100% to treasury after settlement
        };
        let (user_part, treasury_part) = split_interest_fee(
            total_interest,
            fee_rate,
        );
        user_interest = user_part;
        treasury_interest = treasury_part;
        state.total_treasury_interest = state.total_treasury_interest + treasury_part;
    };

    state.last_collect_interest_index = new_py_index;

    // Step 4: update the global interest accumulator
    let new_global_index = update_global_interest_index(
        state.global_interest_index,
        user_interest,
        state.yt_supply,
    );
    state.global_interest_index = new_global_index;

    sui::event::emit(InterestCollectedEvent {
        state_id: object::id(state),
        user_interest_raw: user_interest,
        treasury_interest_raw: treasury_interest,
        py_index_raw: new_py_index,
    });

    (new_global_index, new_py_index, treasury_interest)
}

/// Update user-level interest before any balance-changing action.
public(package) fun update_user_interest<T: drop>(
    state: &mut PyState<T>,
    position: &mut JitterPosition,
    interest_fee_rate_raw: u128,
    current_sy_index_raw: u128,
    clock: &sui::clock::Clock,
): u128 {
    let (new_global_index, new_py_index, treasury_interest) =
        update_interest_index(
            state,
            interest_fee_rate_raw,
            current_sy_index_raw,
            clock,
        );

    let user_index = jitter_position::index(position);

    // First interaction: initialize snapshots only.
    if (user_index == 0) {
        jitter_position::set_index(position, new_global_index);
        jitter_position::set_py_index(position, new_py_index);
        return treasury_interest
    };

    // Nothing new accrued if the index did not move.
    if (user_index == new_global_index) {
        return treasury_interest
    };

    // Apply newly accrued user interest.
    let new_accrued = calc_user_accrued(
        jitter_position::accrued(position),
        jitter_position::yt_balance(position),
        new_global_index,
        user_index,
    );

    jitter_position::set_accrued(position, new_accrued);
    jitter_position::set_index(position, new_global_index);
    jitter_position::set_py_index(position, new_py_index);

    treasury_interest
}

// ===========================================
// Settlement
// ===========================================

/// Settle an expired market once and freeze the settlement index.
public(package) fun settle<T: drop>(
    state: &mut PyState<T>,
    interest_fee_rate_raw: u128,
    current_sy_index_raw: u128,
    clock: &sui::clock::Clock,
): u128 {
    assert!(!state.is_settled, E_ALREADY_SETTLED);
    assert!(is_expired(state.expiry, sui::clock::timestamp_ms(clock)), E_NOT_EXPIRED);

    // Perform the final interest update before freezing settlement state.
    let (_, new_py_index, treasury_interest) = update_interest_index(
        state,
        interest_fee_rate_raw,
        current_sy_index_raw,
        clock,
    );

    state.is_settled = true;
    state.settled_py_index = new_py_index;

    sui::event::emit(SettledEvent {
        state_id: object::id(state),
        market_id: state.market_id,
        settled_py_index: new_py_index,
        treasury_interest_collected_raw: treasury_interest,
        settled_at_ms: sui::clock::timestamp_ms(clock),
    });

    treasury_interest
}

/// Redeem user interest from the SY interest pool.
public(package) fun redeem_due_interest<T: drop>(
    state: &mut PyState<T>,
    position: &mut JitterPosition,
    ctx: &mut TxContext,
): Coin<T> {
    let accrued_raw = jitter_position::accrued(position);
    jitter_position::clear_accrued(position);

    // Convert FP64 raw SY units into an integer coin amount by truncation.
    let amount = (accrued_raw / FP64_ONE) as u64;
    if (amount == 0) {
        return coin::from_balance(balance::zero(), ctx)
    };

    split_sy(state, amount, ctx)
}

// ===========================================
// Treasury Fee Collection
// ===========================================

/// Collect accumulated treasury interest fees. Requires AdminCap.
/// The accrued amount is stored as FP64 raw; we truncate to integer SY units.
public fun collect_treasury_interest_by_admin<T: drop>(
    state: &mut PyState<T>,
    _admin_cap: &AdminCap,
    ctx: &mut TxContext,
): Coin<T> {
    let amount_raw = state.total_treasury_interest;
    let amount = (amount_raw / FP64_ONE) as u64;
    if (amount == 0) {
        return coin::from_balance(balance::zero(), ctx)
    };
    // Subtract only the integer portion; fractional remainder stays.
    let deducted_raw = (amount as u128) * FP64_ONE;
    state.total_treasury_interest = amount_raw - deducted_raw;
    event::emit(TreasuryInterestCollectedEvent {
        py_state_id: object::id(state),
        market_id: state.market_id,
        amount,
        dust_remainder_raw: state.total_treasury_interest,
        collected_by: ctx.sender(),
    });
    split_sy(state, amount, ctx)
}

/// Collect accumulated treasury interest fees. Requires the `treasury.collect` ACL role.
public fun collect_treasury_interest_by_acl<T: drop>(
    state: &mut PyState<T>,
    acl: &ACL,
    ctx: &mut TxContext,
): Coin<T> {
    acl.assert_has_role(ctx.sender(), std::string::utf8(b"treasury.collect"));
    let amount_raw = state.total_treasury_interest;
    let amount = (amount_raw / FP64_ONE) as u64;
    if (amount == 0) {
        return coin::from_balance(balance::zero(), ctx)
    };
    let deducted_raw = (amount as u128) * FP64_ONE;
    state.total_treasury_interest = amount_raw - deducted_raw;
    event::emit(TreasuryInterestCollectedEvent {
        py_state_id: object::id(state),
        market_id: state.market_id,
        amount,
        dust_remainder_raw: state.total_treasury_interest,
        collected_by: ctx.sender(),
    });
    split_sy(state, amount, ctx)
}

// ===========================================
// Admin-triggered Settlement (audit finding H-5)
// ===========================================
//
// These entrypoints let an operator seal the settlement index before the first
// user-facing redeem runs. They still consume a `PriceInfo`, so the staleness
// guard on the oracle applies — but relying on admins to settle bounds the
// "first caller sets settlement" surface to the freshness window rather than
// the entire post-expiry period.

/// Settle an expired market using the `py_state.settle` ACL role.
public fun settle_expired_market_by_acl<T: drop>(
    state: &mut PyState<T>,
    price_info_in: PriceInfo<T>,
    acl: &ACL,
    clock: &sui::clock::Clock,
    ctx: &TxContext,
) {
    acl.assert_has_role(ctx.sender(), std::string::utf8(b"py_state.settle"));
    let sy_index_raw = price_info::consume(
        price_info_in,
        state.market_id,
        clock,
    );
    let interest_fee_rate = state.interest_fee_rate;
    settle(state, interest_fee_rate, sy_index_raw, clock);
    event::emit(SettlementEvent {
        py_state_id: object::id(state),
        settled_py_index: state.settled_py_index,
    });
}

/// Settle an expired market using the `AdminCap`. Mirror of the ACL path for
/// deployments that have not yet handed out the `py_state.settle` role.
public fun settle_expired_market_by_admin<T: drop>(
    state: &mut PyState<T>,
    price_info_in: PriceInfo<T>,
    _admin_cap: &AdminCap,
    clock: &sui::clock::Clock,
) {
    let sy_index_raw = price_info::consume(
        price_info_in,
        state.market_id,
        clock,
    );
    let interest_fee_rate = state.interest_fee_rate;
    settle(state, interest_fee_rate, sy_index_raw, clock);
    event::emit(SettlementEvent {
        py_state_id: object::id(state),
        settled_py_index: state.settled_py_index,
    });
}

// ===========================================
// Views
// ===========================================

public fun id<T: drop>(state: &PyState<T>): ID {
    object::id(state)
}
public fun expiry<T: drop>(state: &PyState<T>): u64 {
    state.expiry
}

public fun interest_fee_rate<T: drop>(state: &PyState<T>): u128 {
    state.interest_fee_rate
}

public fun expiry_divisor<T: drop>(state: &PyState<T>): u64 {
    state.expiry_divisor
}

public fun treasury<T: drop>(state: &PyState<T>): address {
    state.treasury
}

public fun pt_supply<T: drop>(state: &PyState<T>): u64 {
    state.pt_supply
}

public fun yt_supply<T: drop>(state: &PyState<T>): u64 {
    state.yt_supply
}

public fun sy_balance_value<T: drop>(state: &PyState<T>): u64 {
    balance::value(&state.sy_balance)
}

public fun py_index_stored<T: drop>(state: &PyState<T>): u128 {
    state.py_index_stored
}

public fun global_interest_index<T: drop>(state: &PyState<T>): u128 {
    state.global_interest_index
}

public fun total_treasury_interest<T: drop>(state: &PyState<T>): u128 {
    state.total_treasury_interest
}

public fun is_settled<T: drop>(state: &PyState<T>): bool {
    state.is_settled
}

public fun settled_py_index<T: drop>(state: &PyState<T>): u128 {
    state.settled_py_index
}

public fun py_index_last_updated<T: drop>(state: &PyState<T>): u64 {
    state.py_index_last_updated
}

public fun last_interest_timestamp<T: drop>(state: &PyState<T>): u64 {
    state.last_interest_timestamp
}

public fun last_collect_interest_index<T: drop>(state: &PyState<T>): u128 {
    state.last_collect_interest_index
}

public fun state_id<T: drop>(state: &PyState<T>): ID {
    object::id(state)
}

public fun market_id<T: drop>(state: &PyState<T>): ID {
    state.market_id
}

public fun yt_reward_distributor_required<T: drop>(state: &PyState<T>): bool {
    df::exists<YtRewardRequiredKey>(&state.id, YtRewardRequiredKey())
}

public fun yt_reward_distributor_id<T: drop>(state: &PyState<T>): ID {
    assert!(yt_reward_distributor_required(state), E_YT_REWARD_REQUIRED);
    df::borrow<YtRewardRequiredKey, YtRewardRequired>(
        &state.id,
        YtRewardRequiredKey(),
    ).distributor_id
}

public fun yt_reward_gate_open<T: drop>(state: &PyState<T>): bool {
    df::exists<YtRewardGateKey>(&state.id, YtRewardGateKey())
}

public fun is_paused<T: drop>(state: &PyState<T>): bool {
    state.paused || state.emergency_paused
}

public fun is_normally_paused<T: drop>(state: &PyState<T>): bool { state.paused }

public fun is_emergency_paused<T: drop>(state: &PyState<T>): bool {
    state.emergency_paused
}

/// Return whether the market expiry has passed.
public fun is_expired_state<T: drop>(state: &PyState<T>, clock: &sui::clock::Clock): bool {
    is_expired(state.expiry, sui::clock::timestamp_ms(clock))
}

// ===========================================
// Internal Helpers
// ===========================================
public fun create_py_state_internal<SY: drop>(
    market_id: ID,
    expiry: u64,
    interest_fee_rate: u128,
    expiry_divisor: u64,
    treasury: address,
    ctx: &mut TxContext,
): PyState<SY> {
    assert!(interest_fee_rate <= MAX_FEE_RATE, E_FEE_RATE_TOO_HIGH);
    assert!(expiry_divisor > 0, E_ZERO_EXPIRY_DIVISOR);
    assert!(expiry % expiry_divisor == 0, E_INVALID_EXPIRY);
    let state = PyState {
        id: object::new(ctx),
        market_id,
        expiry,
        interest_fee_rate,
        expiry_divisor,
        treasury,
        pt_supply: 0,
        yt_supply: 0,
        sy_balance: balance::zero(),
        py_index_stored: 0,
        py_index_last_updated: 0,
        last_collect_interest_index: 0,
        total_treasury_interest: 0,
        last_interest_timestamp: 0,
        global_interest_index: 0,
        is_settled: false,
        settled_py_index: 0,
        paused: false,
        emergency_paused: false,
    };

    event::emit(PyStateCreatedEvent {
        state_id: object::id(&state),
        market_id,
        expiry,
    });

    state
}

public(package) fun begin_yt_reward_mutation<T: drop>(
    state: &mut PyState<T>,
    settlement: RewardSettlement,
    owner: address,
    position_id: ID,
): YtRewardMutation {
    assert!(yt_reward_distributor_required(state), E_YT_REWARD_REQUIRED);
    assert!(!yt_reward_gate_open(state), E_YT_REWARD_GATE_OPEN);
    let distributor_id = reward_distributor::consume_yt_settlement(
        settlement,
        yt_reward_distributor_id(state),
        position_id,
        owner,
    );
    df::add(&mut state.id, YtRewardGateKey(), true);
    YtRewardMutation { state_id: state_id(state), distributor_id }
}

public(package) fun end_yt_reward_mutation<T: drop>(
    state: &mut PyState<T>,
    mutation: YtRewardMutation,
) {
    let YtRewardMutation { state_id, distributor_id } = mutation;
    assert!(state_id == state_id(state), E_STATE_MISMATCH);
    assert!(yt_reward_distributor_id(state) == distributor_id, E_YT_REWARD_DISTRIBUTOR_MISMATCH);
    assert!(yt_reward_gate_open(state), E_YT_REWARD_GATE_CLOSED);
    let gate = df::remove<YtRewardGateKey, bool>(&mut state.id, YtRewardGateKey());
    assert!(gate, E_YT_REWARD_GATE_CLOSED);
}

fun require_yt_reward_distributor<T: drop>(state: &mut PyState<T>, distributor_id: ID) {
    assert!(!yt_reward_gate_open(state), E_YT_REWARD_GATE_OPEN);
    if (!yt_reward_distributor_required(state)) {
        df::add(&mut state.id, YtRewardRequiredKey(), YtRewardRequired { distributor_id });
    } else {
        let required = df::borrow_mut<YtRewardRequiredKey, YtRewardRequired>(
            &mut state.id,
            YtRewardRequiredKey(),
        );
        required.distributor_id = distributor_id;
    };
    event::emit(YtRewardDistributorRequiredEvent {
        py_state_id: state_id(state),
        distributor_id,
    });
}

fun assert_yt_reward_mutation_allowed<T: drop>(state: &PyState<T>) {
    if (yt_reward_distributor_required(state)) {
        assert!(yt_reward_gate_open(state), E_YT_REWARD_REQUIRED);
    };
}

fun assert_not_paused<T: drop>(state: &PyState<T>) {
    assert!(!is_paused(state), E_PY_STATE_PAUSED);
}

fun set_paused<T: drop>(state: &mut PyState<T>, paused: bool, actor: address) {
    state.paused = paused;
    event::emit(PyStatePauseStatusChangedEvent {
        py_state_id: state_id(state),
        paused,
        actor,
    });
}

fun set_emergency_paused<T: drop>(
    state: &mut PyState<T>,
    emergency_paused: bool,
    actor: address,
    reason: vector<u8>,
) {
    state.emergency_paused = emergency_paused;
    event::emit(PyStateEmergencyPauseStatusChangedEvent {
        py_state_id: state_id(state),
        emergency_paused,
        actor,
        reason,
    });
}

// ===========================================
// Test Helpers
// ===========================================

#[test_only]
public fun create_for_testing<T: drop>(
    market_id: ID,
    expiry: u64,
    ctx: &mut TxContext,
): PyState<T> {
    PyState {
        id: object::new(ctx),
        market_id,
        expiry,
        interest_fee_rate: 0,
        expiry_divisor: 1,
        treasury: @0x0,
        pt_supply: 0,
        yt_supply: 0,
        sy_balance: balance::zero(),
        py_index_stored: 0,
        py_index_last_updated: 0,
        last_collect_interest_index: 0,
        total_treasury_interest: 0,
        last_interest_timestamp: 0,
        global_interest_index: 0,
        is_settled: false,
        settled_py_index: 0,
        paused: false,
        emergency_paused: false,
    }
}

#[test_only]
public fun destroy_for_testing<T: drop>(state: PyState<T>) {
    let PyState {
        id,
        market_id: _,
        expiry: _,
        interest_fee_rate: _,
        expiry_divisor: _,
        treasury: _,
        pt_supply: _,
        yt_supply: _,
        sy_balance,
        py_index_stored: _,
        py_index_last_updated: _,
        last_collect_interest_index: _,
        total_treasury_interest: _,
        last_interest_timestamp: _,
        global_interest_index: _,
        is_settled: _,
        settled_py_index: _,
        paused: _,
        emergency_paused: _,
    } = state;
    balance::destroy_zero(sy_balance);
    object::delete(id);
}

#[test_only]
public fun set_supply_for_testing<T: drop>(
    state: &mut PyState<T>,
    pt_supply: u64,
    yt_supply: u64,
) {
    state.pt_supply = pt_supply;
    state.yt_supply = yt_supply;
}

#[test_only]
public struct DummySY has drop {}

#[test, expected_failure(abort_code = E_YT_REWARD_REQUIRED)]
fun yt_reward_required_blocks_mint_without_gate() {
    let ctx = &mut tx_context::dummy();
    let distributor = reward_distributor::create_for_testing(ctx);
    let mut state = create_for_testing<DummySY>(
        object::id_from_address(@0x1),
        1_000_000,
        ctx,
    );
    let mut position = jitter_position::create_py_for_testing(
        state_id(&state),
        market_id(&state),
        expiry(&state),
        ctx,
    );
    require_yt_reward_distributor(&mut state, reward_distributor::id(&distributor));
    mint_py_supply(&mut state, &mut position, 1);
    jitter_position::destroy_for_testing(position);
    destroy_for_testing(state);
    reward_distributor::destroy_for_testing(distributor);
}

#[test]
fun yt_reward_gate_allows_mint() {
    let ctx = &mut tx_context::dummy();
    let distributor = reward_distributor::create_for_testing(ctx);
    let mut state = create_for_testing<DummySY>(
        object::id_from_address(@0x1),
        1_000_000,
        ctx,
    );
    let mut position = jitter_position::create_py_for_testing(
        state_id(&state),
        market_id(&state),
        expiry(&state),
        ctx,
    );
    require_yt_reward_distributor(&mut state, reward_distributor::id(&distributor));
    let operation = reward_distributor::begin_yt_operation(
        &distributor,
        @0x123,
        object::id(&position),
        0,
    );
    let settlement = reward_distributor::finish_operation(operation);
    let access = begin_yt_reward_mutation(
        &mut state,
        settlement,
        @0x123,
        object::id(&position),
    );
    mint_py_supply(&mut state, &mut position, 1);
    end_yt_reward_mutation(&mut state, access);
    assert!(yt_supply(&state) == 1, 0);
    jitter_position::destroy_for_testing(position);
    destroy_for_testing(state);
    reward_distributor::destroy_for_testing(distributor);
}

#[test]
fun emergency_pause_requires_dedicated_py_state_recovery() {
    let ctx = &mut tx_context::dummy();
    let admin_cap = jitter_admin::admin::create_for_testing(ctx);
    let mut state = create_for_testing<DummySY>(
        object::id_from_address(@0x1),
        1_000_000,
        ctx,
    );

    pause_by_admin(&mut state, &admin_cap, ctx);
    assert!(is_paused(&state), 10);
    assert!(is_normally_paused(&state), 11);
    assert!(!is_emergency_paused(&state), 12);

    emergency_pause_by_admin(&mut state, &admin_cap, b"oracle halt", ctx);
    assert!(is_paused(&state), 13);
    assert!(is_normally_paused(&state), 14);
    assert!(is_emergency_paused(&state), 15);

    unpause_by_admin(&mut state, &admin_cap, ctx);
    assert!(is_paused(&state), 16);
    assert!(!is_normally_paused(&state), 17);
    assert!(is_emergency_paused(&state), 18);

    emergency_unpause_by_admin(&mut state, &admin_cap, ctx);
    assert!(!is_paused(&state), 19);
    assert!(!is_normally_paused(&state), 20);
    assert!(!is_emergency_paused(&state), 21);

    transfer::public_transfer(admin_cap, @0x0);
    destroy_for_testing(state);
}

#[test, expected_failure(abort_code = E_PY_STATE_PAUSED)]
fun paused_py_state_blocks_mint() {
    let ctx = &mut tx_context::dummy();
    let mut clock = sui::clock::create_for_testing(ctx);
    sui::clock::set_for_testing(&mut clock, 1_000);
    let admin_cap = jitter_admin::admin::create_for_testing(ctx);
    let mut state = create_for_testing<DummySY>(
        object::id_from_address(@0x1),
        1_000_000,
        ctx,
    );
    let mut position = jitter_position::create_py_for_testing(
        state_id(&state),
        market_id(&state),
        expiry(&state),
        ctx,
    );
    pause_by_admin(&mut state, &admin_cap, ctx);
    let sy_coin = coin::mint_for_testing<DummySY>(10, ctx);
    let _minted = mint_py_with_sy_index(
        sy_coin,
        FP64_ONE,
        &mut position,
        &mut state,
        &clock,
    );

    jitter_position::destroy_for_testing(position);
    transfer::public_transfer(admin_cap, @0x0);
    transfer::share_object(state);
    sui::clock::destroy_for_testing(clock);
}
