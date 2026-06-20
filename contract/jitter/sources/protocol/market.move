/// market - canonical container for a single Jitter market
///
/// A market owns the treasury capabilities for the SY/PT/YT token trio and
/// keeps the core metadata that other protocol modules need to mint, burn,
/// and settle positions against the same market object.
module jitter::market;

// ===========================================
// Standard Library Imports
// ===========================================
use std::type_name::{Self, TypeName};
use sui::coin::{Self, Coin, TreasuryCap};
use sui::event;

// ===========================================
// Jitter Package Imports
// ===========================================
use jitter_admin::admin::AdminCap;

// ===========================================
//  Error Codes
// ===========================================
const E_INVALID_EXPIRY: u64 = 1900;
const E_ZERO_AMOUNT: u64 = 1901;

// Structs
public struct Market<phantom SY: drop, phantom PT: drop, phantom YT: drop,> has key, store {
    id: UID,
    expiry: u64,
    sy_type: TypeName,
    pt_type: TypeName,
    yt_type: TypeName,
    sy_treasury: TreasuryCap<SY>,
    pt_treasury: TreasuryCap<PT>,
    yt_treasury: TreasuryCap<YT>,
}

// Events
public struct MarketCreatedEvent has copy, drop {
    market_id: ID,
    expiry: u64,
    created_by: address,
    sy_type: TypeName,
    pt_type: TypeName,
    yt_type: TypeName,
}

public fun create_by_admin_cap<SY: drop, PT: drop, YT: drop>(
    _admin_cap: &AdminCap,
    expiry: u64,
    sy_treasury: TreasuryCap<SY>,
    pt_treasury: TreasuryCap<PT>,
    yt_treasury: TreasuryCap<YT>,
    ctx: &mut TxContext,
): Market<SY, PT, YT> {
    create<SY, PT, YT>(expiry, sy_treasury, pt_treasury, yt_treasury, ctx)
}

// Package Functions
public(package) fun mint_sy<SY: drop, PT: drop, YT: drop>(
    market: &mut Market<SY, PT, YT>,
    amount: u64,
    ctx: &mut TxContext,
): Coin<SY> {
    assert!(amount > 0, E_ZERO_AMOUNT);
    coin::mint(&mut market.sy_treasury, amount, ctx)
}

public(package) fun burn_sy<SY: drop, PT: drop, YT: drop>(
    market: &mut Market<SY, PT, YT>,
    coin_in: Coin<SY>,
): u64 {
    coin::burn(&mut market.sy_treasury, coin_in)
}

public(package) fun mint_pt<SY: drop, PT: drop, YT: drop>(
    market: &mut Market<SY, PT, YT>,
    amount: u64,
    ctx: &mut TxContext,
): Coin<PT> {
    assert!(amount > 0, E_ZERO_AMOUNT);
    coin::mint(&mut market.pt_treasury, amount, ctx)
}

public(package) fun burn_pt<SY: drop, PT: drop, YT: drop>(
    market: &mut Market<SY, PT, YT>,
    coin_in: Coin<PT>,
): u64 {
    coin::burn(&mut market.pt_treasury, coin_in)
}

public(package) fun mint_yt<SY: drop, PT: drop, YT: drop>(
    market: &mut Market<SY, PT, YT>,
    amount: u64,
    ctx: &mut TxContext,
): Coin<YT> {
    assert!(amount > 0, E_ZERO_AMOUNT);
    coin::mint(&mut market.yt_treasury, amount, ctx)
}

public(package) fun burn_yt< SY: drop, PT: drop, YT: drop>(
    market: &mut Market<SY, PT, YT>,
    coin_in: Coin<YT>,
): u64 {
    coin::burn(&mut market.yt_treasury, coin_in)
}

// getters
public fun id< SY: drop, PT: drop, YT: drop>(
    market: &Market<SY, PT, YT>
): ID {
    object::id(market)
}

public fun expiry<  SY: drop,PT: drop,YT: drop>(
    market: &Market<SY, PT, YT>
): u64 {
    market.expiry
}

public fun sy_type_name< SY: drop, PT: drop, YT: drop>(
    market: &Market<SY, PT, YT>
): TypeName {
    market.sy_type
}

public fun pt_type_name<
    SY: drop,
    PT: drop,
    YT: drop,
>(market: &Market<SY, PT, YT>): TypeName {
    market.pt_type
}

public fun yt_type_name< SY: drop, PT: drop, YT: drop>(
    market: &Market<SY, PT, YT>
): TypeName {
    market.yt_type
}

public fun sy_treasury_id< SY: drop, PT: drop, YT: drop>(
    market: &Market<SY, PT, YT>
): ID {
    object::id(&market.sy_treasury)
}

public fun pt_treasury_id< SY: drop, PT: drop, YT: drop>(
    market: &Market<SY, PT, YT>
): ID {
    object::id(&market.pt_treasury)
}

public fun yt_treasury_id< SY: drop, PT: drop, YT: drop>(
    market: &Market<SY, PT, YT>
): ID {
    object::id(&market.yt_treasury)
}

public fun sy_total_supply< SY: drop, PT: drop, YT: drop>(
    market: &Market<SY, PT, YT>
): u64 {
    coin::total_supply(&market.sy_treasury)
}

public fun pt_total_supply<SY: drop,PT: drop,YT: drop>(
    market: &Market<SY, PT, YT>
): u64 {
    coin::total_supply(&market.pt_treasury)
}

public fun yt_total_supply< SY: drop, PT: drop, YT: drop>(
    market: &Market<SY, PT, YT>
): u64 {
    coin::total_supply(&market.yt_treasury)
}

// Helper function
// helper function to create a market(return) and emit the event
fun create<SY: drop, PT: drop, YT: drop>(
    expiry: u64,
    sy_treasury: TreasuryCap<SY>,
    pt_treasury: TreasuryCap<PT>,
    yt_treasury: TreasuryCap<YT>,
    ctx: &mut TxContext,
): Market<SY, PT, YT> {
    assert!(expiry > 0, E_INVALID_EXPIRY);

    let market = Market<SY, PT, YT> {
        id: object::new(ctx),
        expiry,
        sy_type: type_name::with_defining_ids<SY>(),
        pt_type: type_name::with_defining_ids<PT>(),
        yt_type: type_name::with_defining_ids<YT>(),
        sy_treasury,
        pt_treasury,
        yt_treasury,
    };

    event::emit(MarketCreatedEvent {
        market_id: object::id(&market),
        expiry: market.expiry,
        created_by: ctx.sender(),
        sy_type: market.sy_type,
        pt_type: market.pt_type,
        yt_type: market.yt_type,
    });
    market
}
