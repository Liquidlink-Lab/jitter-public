module jitter::sy;

use std::type_name::{Self, TypeName};
use sui::event;
use sui::coin::Coin;
use sui::vec_map::{Self, VecMap};
use sui::clock::Clock;

use jitter::market::{Self, Market};
use jitter_oracle::price_info::{Self, PriceInfo};
use jitter_admin::admin::AdminCap;
use jitter_math::full_math_u128;

const EAlreadyRegistered: u64 = 601;
const EZeroAmount: u64 = 602;
const EInvalidSyIndex: u64 = 604;
const EInvalidSign: u64 = 605;
const ENotRegistered: u64 = 606;

const FP64_ONE: u128 = 1 << 64;

/// SY registry shared object.
///
/// This module no longer custodies underlying assets. It only records
/// `Underlying -> SY` bindings, exposes conversion helpers, and mints a
/// linear capability that external adapter packages can hold to mint/burn SY
/// through the market object.
public struct SyState has key, store {
    id: UID,
    sy_info: VecMap<TypeName, SyInfo>,
}

public struct SyInfo has copy, drop, store {
    underlying_type: TypeName,
    sign_type: TypeName,
}
public struct MintSyRequest<phantom SY: drop> { amount: u64 }
public struct BurnSyRequest<phantom SY: drop> { amount: u64 }

public struct SyRegisteredEvent has copy, drop {
    sy_type: TypeName,
    underlying_type: TypeName,
    sign_type: TypeName,
}

public struct SyUnregisteredEvent has copy, drop {
    sy_type: TypeName,
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(SyState {
        id: object::new(ctx),
        sy_info: vec_map::empty(),
    });
}

public fun register_new_sy<Underlying: drop, SY: drop, Sign: drop>(
    state: &mut SyState,
    _admin_cap: &AdminCap,
    _ctx: &mut TxContext,
) {
    let sy_type = type_name::with_defining_ids<SY>();
    let underlying_type = type_name::with_defining_ids<Underlying>();
    let sign_type = type_name::with_defining_ids<Sign>();

    if (state.sy_info.contains(&sy_type)) {
        abort EAlreadyRegistered
    };

    state.sy_info.insert(sy_type, SyInfo {
        underlying_type,
        sign_type,
    });

    event::emit(SyRegisteredEvent {
        sy_type,
        underlying_type,
        sign_type,
    });
}

/// Remove an SY registration. Intended for deprecating a misconfigured
/// adapter before any liquidity is onboarded; new mints via this SY type will
/// fail at `destroy_mint_request` (no sign_type match), and callers holding
/// outstanding `MintSyRequest`/`BurnSyRequest` should be settled first.
/// (audit finding M-2)
public fun unregister_sy<SY: drop>(
    state: &mut SyState,
    _admin_cap: &AdminCap,
    _ctx: &mut TxContext,
) {
    let sy_type = type_name::with_defining_ids<SY>();
    assert!(state.sy_info.contains(&sy_type), ENotRegistered);
    let (_, _removed) = state.sy_info.remove(&sy_type);

    event::emit(SyUnregisteredEvent { sy_type });
}

public fun mint_sy_exact_in<SY: drop, PT: drop, YT: drop>(
    market: &mut Market<SY, PT, YT>,
    price_info: PriceInfo<SY>,
    exact_in: u64,
    clock: &Clock,
    ctx: &mut TxContext,
): (Coin<SY>, MintSyRequest<SY>) {
    assert!(exact_in > 0, EZeroAmount);
    let sy_index = price_info::consume(price_info, market.id(), clock);
    let sy_out_amount = underlying_to_sy_amount(exact_in, sy_index);
    let request = MintSyRequest { amount: exact_in };
    let sy_out = market::mint_sy(market, sy_out_amount, ctx);
    (sy_out, request)
}

public fun burn_sy_exact_in<SY: drop, PT: drop, YT: drop>(
    market: &mut Market<SY, PT, YT>,
    price_info: PriceInfo<SY>,
    sy_in: Coin<SY>,
    clock: &Clock,
): BurnSyRequest<SY> {
    let amount = market::burn_sy(market, sy_in);
    assert!(amount > 0, EZeroAmount);

    let sy_index = price_info::consume(price_info, market.id(), clock);
    let underlying_out = sy_to_underlying_amount(amount, sy_index);
    assert!(underlying_out > 0, EZeroAmount);

    BurnSyRequest { amount: underlying_out }
}

// Helper and Getter functions
public fun underlying_to_sy_amount(
    underlying_amount: u64,
    sy_index_raw: u128,
): u64 {
    assert!(sy_index_raw > 0, EInvalidSyIndex);
    full_math_u128::mul_div_floor(
        underlying_amount as u128,
        FP64_ONE,
        sy_index_raw,
    ) as u64
}

public fun sy_to_underlying_amount(
    sy_amount: u64,
    sy_index_raw: u128,
): u64 {
    assert!(sy_index_raw > 0, EInvalidSyIndex);
    full_math_u128::mul_div_floor(
        sy_amount as u128,
        sy_index_raw,
        FP64_ONE,
    ) as u64
}

public fun get_mint_request_amount<SY: drop>(request: &MintSyRequest<SY>): u64 {
    request.amount
}

public fun get_burn_request_amount<SY: drop>(request: &BurnSyRequest<SY>): u64 {
    request.amount
}

public fun destroy_mint_request<SY: drop, Sign: drop>(request: MintSyRequest<SY>, _sign: Sign, sy_state: &mut SyState): u64 {
    let sy_type = type_name::with_defining_ids<SY>();
    let sign_type = type_name::with_defining_ids<Sign>();
    assert!(sy_state.sy_info.get(&sy_type).sign_type == sign_type, EInvalidSign);
    let MintSyRequest { amount } = request;
    amount
}

public fun destroy_burn_request<SY: drop, Sign: drop>(request: BurnSyRequest<SY>, _sign: Sign, sy_state: &mut SyState): u64 {
    let sy_type = type_name::with_defining_ids<SY>();
    let sign_type = type_name::with_defining_ids<Sign>();
    assert!(sy_state.sy_info.get(&sy_type).sign_type == sign_type, EInvalidSign);
    let BurnSyRequest { amount } = request;
    amount
}

#[test_only]
public struct DummyUnderlying has drop {}

#[test_only]
public struct DummySY has drop {}

#[test_only]
public struct RegisteredSign has drop {}

#[test_only]
public struct WrongSign has drop {}

#[test]
fun mint_request_registered_sign_returns_underlying_amount() {
    let ctx = &mut tx_context::dummy();
    let mut state = SyState {
        id: object::new(ctx),
        sy_info: vec_map::empty(),
    };
    let sy_type = type_name::with_defining_ids<DummySY>();
    state.sy_info.insert(sy_type, SyInfo {
        underlying_type: type_name::with_defining_ids<DummyUnderlying>(),
        sign_type: type_name::with_defining_ids<RegisteredSign>(),
    });

    let request = MintSyRequest<DummySY> { amount: 42 };
    let amount = destroy_mint_request<DummySY, RegisteredSign>(
        request,
        RegisteredSign {},
        &mut state,
    );
    assert!(amount == 42, 10);

    let (_key, _info) = state.sy_info.remove(&sy_type);
    let SyState { id, sy_info } = state;
    vec_map::destroy_empty(sy_info);
    object::delete(id);
}

#[test, expected_failure(abort_code = EInvalidSign)]
fun mint_request_rejects_unregistered_adapter_sign() {
    let ctx = &mut tx_context::dummy();
    let mut state = SyState {
        id: object::new(ctx),
        sy_info: vec_map::empty(),
    };
    let sy_type = type_name::with_defining_ids<DummySY>();
    state.sy_info.insert(sy_type, SyInfo {
        underlying_type: type_name::with_defining_ids<DummyUnderlying>(),
        sign_type: type_name::with_defining_ids<RegisteredSign>(),
    });

    let request = MintSyRequest<DummySY> { amount: 1 };
    let _amount = destroy_mint_request<DummySY, WrongSign>(
        request,
        WrongSign {},
        &mut state,
    );

    let (_key, _info) = state.sy_info.remove(&sy_type);
    let SyState { id, sy_info } = state;
    vec_map::destroy_empty(sy_info);
    object::delete(id);
}
