#[test_only]
module jitter::jitter_tests;

use std::unit_test::assert_eq;

use jitter::jitter_position;
use jitter::py_state;

use jitter::orderbook;
use jitter::pool;
use jitter::market;
use jitter::router;
use jitter::reward_distributor;
use jitter::sy;
use jitter_admin::admin;
use jitter_oracle::price_info;
use sui::balance;
use sui::clock;
use sui::coin;

const FP64_ONE: u128 = 1 << 64;
const EApprox: u64 = 0;

public struct DummySY has drop {}
public struct DummyPT has drop {}
public struct DummyYT has drop {}

fun approx_eq_u128(left: u128, right: u128, tolerance: u128) {
    let diff = if (left >= right) { left - right } else { right - left };
    assert!(diff <= tolerance, EApprox);
}

#[test]
fun sy_conversion_roundtrip_uses_fp64_index() {
    let sy_index = 2 * FP64_ONE;
    let sy_amount = sy::underlying_to_sy_amount(100, sy_index);
    assert_eq!(sy_amount, 50);

    let underlying_amount = sy::sy_to_underlying_amount(sy_amount, sy_index);
    assert_eq!(underlying_amount, 100);
}

#[test]
fun py_state_interest_helpers_track_growth() {
    let old_index = FP64_ONE;
    let new_index = 2 * FP64_ONE;
    let amount_raw = 10 * FP64_ONE;

    let interest = py_state::calc_interest(amount_raw, old_index, new_index);
    assert_eq!(interest, 5 * FP64_ONE);

    let current = py_state::current_py_index(new_index, old_index);
    assert_eq!(current, new_index);

    let global = py_state::update_global_interest_index(FP64_ONE, interest, 10);
    approx_eq_u128(global, ((3 * FP64_ONE) / 2), 1);
}

#[test, expected_failure(abort_code = 902, location = jitter_oracle::price_info)]
fun oracle_rejects_wrong_market_for_py_mint() {
    let ctx = &mut tx_context::dummy();
    let mut clock = clock::create_for_testing(ctx);
    clock::set_for_testing(&mut clock, 1_000);

    let market_uid = object::new(ctx);
    let market_id = object::uid_to_inner(&market_uid);
    let wrong_market_id = object::id_from_address(@0xbad);
    let expiry = 31_536_001_000;
    let mut state = py_state::create_for_testing<DummySY>(market_id, expiry, ctx);
    let mut position = jitter_position::create_py_for_testing(
        py_state::state_id(&state),
        market_id,
        expiry,
        ctx,
    );
    let price_info = price_info::create_for_testing<DummySY>(
        wrong_market_id,
        FP64_ONE,
        1_000,
        10_000,
    );
    let sy_coin = coin::mint_for_testing<DummySY>(10, ctx);

    let _minted = py_state::mint_py(
        sy_coin,
        price_info,
        &mut position,
        &mut state,
        &clock,
    );
    jitter_position::destroy_for_testing(position);
    transfer::public_share_object(state);
    object::delete(market_uid);
    clock::destroy_for_testing(clock);
}

#[test, expected_failure(abort_code = 900, location = jitter_oracle::price_info)]
fun oracle_rejects_stale_price_for_py_mint() {
    let ctx = &mut tx_context::dummy();
    let mut clock = clock::create_for_testing(ctx);
    clock::set_for_testing(&mut clock, 1_000);

    let market_uid = object::new(ctx);
    let market_id = object::uid_to_inner(&market_uid);
    let expiry = 1_000_000;
    let mut state = py_state::create_for_testing<DummySY>(market_id, expiry, ctx);
    let mut position = jitter_position::create_py_for_testing(
        py_state::state_id(&state),
        market_id,
        expiry,
        ctx,
    );
    let price_info = price_info::create_for_testing<DummySY>(
        market_id,
        FP64_ONE,
        0,
        999,
    );
    let sy_coin = coin::mint_for_testing<DummySY>(10, ctx);

    let _minted = py_state::mint_py(
        sy_coin,
        price_info,
        &mut position,
        &mut state,
        &clock,
    );
    jitter_position::destroy_for_testing(position);
    transfer::public_share_object(state);
    object::delete(market_uid);
    clock::destroy_for_testing(clock);
}

#[test]
fun external_pt_redeem_burns_yt_without_touching_user_pt() {
    let ctx = &mut tx_context::dummy();
    let mut clock = clock::create_for_testing(ctx);
    clock::set_for_testing(&mut clock, 1_000);

    let market_uid = object::new(ctx);
    let market_id = object::uid_to_inner(&market_uid);
    let expiry = 1_000_000;
    let mut state = py_state::create_for_testing<DummySY>(market_id, expiry, ctx);
    let mut position = jitter_position::create_py_for_testing(
        py_state::state_id(&state),
        market_id,
        expiry,
        ctx,
    );

    let sy_coin = coin::mint_for_testing<DummySY>(140, ctx);
    let minted = py_state::mint_py_with_sy_index(
        sy_coin,
        FP64_ONE,
        &mut position,
        &mut state,
        &clock,
    );
    assert_eq!(minted, 140);

    jitter_position::sub_pt(&mut position, 40);
    let price_info = price_info::create_for_testing<DummySY>(
        market_id,
        FP64_ONE,
        1_000,
        10_000,
    );
    let (sy_out, receipt) = py_state::redeem_yt_with_external_pt_before_expiry(
        40,
        price_info,
        &mut position,
        &mut state,
        &clock,
        ctx,
    );
    py_state::settle_external_pt_redeem(&state, receipt, 40);

    assert_eq!(coin::value(&sy_out), 40);
    assert_eq!(jitter_position::pt_balance(&position), 100);
    assert_eq!(jitter_position::yt_balance(&position), 100);
    assert_eq!(py_state::pt_supply(&state), 100);
    assert_eq!(py_state::yt_supply(&state), 100);
    coin::burn_for_testing(sy_out);

    let cleanup_price_info = price_info::create_for_testing<DummySY>(
        market_id,
        FP64_ONE,
        1_000,
        10_000,
    );
    let cleanup_sy = py_state::redeem_py_before_expiry(
        100,
        cleanup_price_info,
        &mut position,
        &mut state,
        &clock,
        ctx,
    );
    assert_eq!(coin::value(&cleanup_sy), 100);
    coin::burn_for_testing(cleanup_sy);
    jitter_position::destroy_for_testing(position);
    py_state::destroy_for_testing(state);
    object::delete(market_uid);
    clock::destroy_for_testing(clock);
}

#[test]
fun orderbook_fill_ask_swaps_sy_for_pt_coin() {
    let ctx = &mut tx_context::dummy();
    let mut clock = clock::create_for_testing(ctx);
    clock::set_for_testing(&mut clock, 1_000);

    let market_uid = object::new(ctx);
    let market_id = object::uid_to_inner(&market_uid);
    let mut book = orderbook::create_with_market_id_for_testing<DummySY, DummyPT>(
        market_id,
        ctx,
    );

    let ask_pt = coin::mint_for_testing<DummyPT>(100, ctx);
    let order_id = orderbook::place_ask<DummySY, DummyPT>(
        &mut book,
        ask_pt,
        FP64_ONE,
        0,
        &clock,
        ctx,
    );
    assert_eq!(orderbook::order_count(&book), 1);

    let taker_sy = coin::mint_for_testing<DummySY>(40, ctx);
    let (pt_out, sy_change) = orderbook::fill_ask_exact_pt(
        &mut book,
        order_id,
        taker_sy,
        40,
        FP64_ONE,
        &clock,
        ctx,
    );
    assert_eq!(coin::value(&pt_out), 40);
    assert_eq!(coin::value(&sy_change), 0);

    let (claim_sy, claim_pt) = orderbook::claim_order(&mut book, order_id, ctx);
    assert_eq!(coin::value(&claim_sy), 0);
    assert_eq!(coin::value(&claim_pt), 0);

    let (cancel_sy, cancel_pt) = orderbook::cancel_order(&mut book, order_id, ctx);
    assert_eq!(coin::value(&cancel_sy), 0);
    assert_eq!(coin::value(&cancel_pt), 60);
    assert_eq!(orderbook::order_count(&book), 0);

    coin::burn_for_testing(pt_out);
    coin::burn_for_testing(sy_change);
    coin::burn_for_testing(claim_sy);
    coin::burn_for_testing(claim_pt);
    coin::burn_for_testing(cancel_sy);
    coin::burn_for_testing(cancel_pt);
    orderbook::destroy_for_testing(book);
    object::delete(market_uid);
    clock::destroy_for_testing(clock);
}

#[test]
fun orderbook_full_fill_ask_pushes_payout_and_closes_order() {
    let ctx = &mut tx_context::dummy();
    let mut clock = clock::create_for_testing(ctx);
    clock::set_for_testing(&mut clock, 1_000);

    let market_uid = object::new(ctx);
    let market_id = object::uid_to_inner(&market_uid);
    let mut book = orderbook::create_with_market_id_for_testing<DummySY, DummyPT>(
        market_id,
        ctx,
    );

    let order_id = orderbook::place_ask<DummySY, DummyPT>(
        &mut book,
        coin::mint_for_testing<DummyPT>(100, ctx),
        FP64_ONE,
        0,
        &clock,
        ctx,
    );
    let (pt_out, sy_change) = orderbook::fill_ask_exact_pt(
        &mut book,
        order_id,
        coin::mint_for_testing<DummySY>(100, ctx),
        100,
        FP64_ONE,
        &clock,
        ctx,
    );

    assert_eq!(coin::value(&pt_out), 100);
    assert_eq!(coin::value(&sy_change), 0);
    assert_eq!(orderbook::order_count(&book), 0);
    assert_eq!(orderbook::fillable_ask_pt(&book, order_id, 100, FP64_ONE, &clock), 0);
    let ids = orderbook::order_ids(&book);
    assert_eq!(vector::length(&ids), 0);

    coin::burn_for_testing(pt_out);
    coin::burn_for_testing(sy_change);
    orderbook::destroy_for_testing(book);
    object::delete(market_uid);
    clock::destroy_for_testing(clock);
}

#[test]
fun frontend_routed_buy_pt_uses_explicit_order_fill_and_position_guard() {
    let ctx = &mut tx_context::dummy();
    let mut clock = clock::create_for_testing(ctx);
    clock::set_for_testing(&mut clock, 1_000);
    let admin_cap = admin::create_for_testing(ctx);
    let expiry = 1_000_000;
    let sy_cap = coin::create_treasury_cap_for_testing<DummySY>(ctx);
    let pt_cap = coin::create_treasury_cap_for_testing<DummyPT>(ctx);
    let yt_cap = coin::create_treasury_cap_for_testing<DummyYT>(ctx);
    let mut market_obj = market::create_by_admin_cap<DummySY, DummyPT, DummyYT>(
        &admin_cap,
        expiry,
        sy_cap,
        pt_cap,
        yt_cap,
        ctx,
    );
    let market_id = market::id(&market_obj);
    let py_state_uid = object::new(ctx);
    let py_state_id = object::uid_to_inner(&py_state_uid);
    let mut position = jitter_position::create_py_for_testing(
        py_state_id,
        market_id,
        expiry,
        ctx,
    );
    let mut book = orderbook::create_with_market_id_for_testing<DummySY, DummyPT>(
        market_id,
        ctx,
    );

    let ask_pt = market::mint_pt(&mut market_obj, 40, ctx);
    let order_id = orderbook::place_ask<DummySY, DummyPT>(
        &mut book,
        ask_pt,
        FP64_ONE,
        0,
        &clock,
        ctx,
    );
    let sy_in = coin::mint_for_testing<DummySY>(50, ctx);
    let initial_pt = jitter_position::pt_balance(&position);
    let (pt_out, sy_change) = orderbook::fill_ask_exact_pt(
        &mut book,
        order_id,
        sy_in,
        40,
        FP64_ONE,
        &clock,
        ctx,
    );
    jitter_position::burn_pt_in(
        pt_out,
        &mut position,
        py_state_id,
        &mut market_obj,
    );

    let pt_delta = router::assert_pt_delta_at_least(&position, initial_pt, 40);
    assert_eq!(pt_delta, 40);
    let sy_refund = router::assert_coin_min_value(&sy_change, 10);
    assert_eq!(sy_refund, 10);

    coin::burn_for_testing(sy_change);
    assert_eq!(orderbook::order_count(&book), 0);

    orderbook::destroy_for_testing(book);
    jitter_position::destroy_for_testing(position);
    object::delete(py_state_uid);
    transfer::public_transfer(market_obj, @0x0);
    transfer::public_transfer(admin_cap, @0x0);
    clock::destroy_for_testing(clock);
}

#[test, expected_failure(abort_code = 3001, location = jitter::router)]
fun route_guard_rejects_under_min_coin_output() {
    let ctx = &mut tx_context::dummy();
    let coin = coin::mint_for_testing<DummySY>(1, ctx);
    router::assert_coin_min_value(&coin, 2);
    coin::burn_for_testing(coin);
}

#[test]
fun route_deadline_guard_allows_current_timestamp_and_zero_deadline() {
    let ctx = &mut tx_context::dummy();
    let mut clock = clock::create_for_testing(ctx);
    clock::set_for_testing(&mut clock, 1_000);

    assert_eq!(router::assert_before(1_000, &clock), 1_000);
    assert_eq!(router::assert_before(0, &clock), 1_000);

    clock::destroy_for_testing(clock);
}

#[test, expected_failure(abort_code = 3004, location = jitter::router)]
fun route_deadline_guard_rejects_expired_route() {
    let ctx = &mut tx_context::dummy();
    let mut clock = clock::create_for_testing(ctx);
    clock::set_for_testing(&mut clock, 1_000);

    router::assert_before(999, &clock);

    clock::destroy_for_testing(clock);
}

#[test]
fun short_sell_pt_accepts_empty_settlements_when_reward_is_off() {
    let ctx = &mut tx_context::dummy();
    let mut clock = clock::create_for_testing(ctx);
    clock::set_for_testing(&mut clock, 1_000);
    let distributor = reward_distributor::create_for_testing(ctx);
    let market_uid = object::new(ctx);
    let market_id = object::uid_to_inner(&market_uid);
    let expiry = 1_000_000;
    let mut state = py_state::create_for_testing<DummySY>(market_id, expiry, ctx);
    let mut pool_state = pool::create_with_ids_for_testing<DummySY>(
        py_state::state_id(&state),
        market_id,
        expiry,
        ctx,
    );
    let mut position = jitter_position::create_py_for_testing(
        py_state::state_id(&state),
        market_id,
        expiry,
        ctx,
    );
    let mut lp_position = jitter::jitter_position::create_lp_for_testing(
        pool::pool_id(&pool_state),
        expiry,
        ctx,
    );
    let (_, _, _, initial_change) = pool::add_liquidity(
        coin::mint_for_testing<DummySY>(500_000_000, ctx),
        2_000_000_000,
        &mut pool_state,
        &mut lp_position,
        FP64_ONE,
        &clock,
        ctx,
    );
    coin::burn_for_testing(initial_change);

    jitter_position::add_pt(&mut position, 10_000_000);
    let (sy_out, post_ops) = router::sell_pt(
        vector[],
        &distributor,
        10_000_000,
        1,
        &mut pool_state,
        &mut position,
        &mut state,
        price_info::create_for_testing<DummySY>(
            market_id,
            FP64_ONE,
            1_000,
            10_000,
        ),
        &clock,
        ctx,
    );
    assert!(coin::value(&sy_out) >= 1, 0);
    assert_eq!(vector::length(&post_ops), 0);

    coin::burn_for_testing(sy_out);
    vector::destroy_empty(post_ops);
    transfer::public_share_object(pool_state);
    jitter::jitter_position::destroy_for_testing(lp_position);
    jitter_position::destroy_for_testing(position);
    transfer::public_share_object(state);
    reward_distributor::destroy_for_testing(distributor);
    object::delete(market_uid);
    clock::destroy_for_testing(clock);
}

#[test]
fun short_sell_pt_consumes_pool_settlement_when_reward_is_on() {
    let ctx = &mut tx_context::dummy();
    let mut clock = clock::create_for_testing(ctx);
    clock::set_for_testing(&mut clock, 1_000);
    let admin_cap = admin::create_for_testing(ctx);
    let distributor = reward_distributor::create_for_testing(ctx);
    let market_uid = object::new(ctx);
    let market_id = object::uid_to_inner(&market_uid);
    let expiry = 31_536_001_000;
    let mut state = py_state::create_for_testing<DummySY>(market_id, expiry, ctx);
    let mut pool_state = pool::create_with_ids_for_testing<DummySY>(
        py_state::state_id(&state),
        market_id,
        expiry,
        ctx,
    );
    let mut position = jitter_position::create_py_for_testing(
        py_state::state_id(&state),
        market_id,
        expiry,
        ctx,
    );
    let mut lp_position = jitter::jitter_position::create_lp_for_testing(
        pool::pool_id(&pool_state),
        expiry,
        ctx,
    );
    let (_, _, _, initial_change) = pool::add_liquidity(
        coin::mint_for_testing<DummySY>(500_000_000, ctx),
        2_000_000_000,
        &mut pool_state,
        &mut lp_position,
        FP64_ONE,
        &clock,
        ctx,
    );
    coin::burn_for_testing(initial_change);
    pool::require_reward_distributor_by_admin(
        &mut pool_state,
        reward_distributor::id(&distributor),
        &admin_cap,
    );

    let pool_operation = reward_distributor::begin_pool_operation(
        &distributor,
        pool::pool_id(&pool_state),
        pool::lp_supply(&pool_state),
    );
    let pool_settlement = reward_distributor::finish_operation(pool_operation);
    jitter_position::add_pt(&mut position, 10_000_000);
    let (sy_out, post_ops) = router::sell_pt(
        vector[pool_settlement],
        &distributor,
        10_000_000,
        1,
        &mut pool_state,
        &mut position,
        &mut state,
        price_info::create_for_testing<DummySY>(
            market_id,
            FP64_ONE,
            1_000,
            10_000,
        ),
        &clock,
        ctx,
    );
    assert!(coin::value(&sy_out) >= 1, 1);
    assert_eq!(vector::length(&post_ops), 1);

    let mut post_ops = post_ops;
    let post_pool_operation = vector::pop_back(&mut post_ops);
    let post_pool_settlement = reward_distributor::finish_operation(post_pool_operation);
    reward_distributor::destroy_settlement(post_pool_settlement);

    coin::burn_for_testing(sy_out);
    vector::destroy_empty(post_ops);
    transfer::public_share_object(pool_state);
    jitter::jitter_position::destroy_for_testing(lp_position);
    jitter_position::destroy_for_testing(position);
    transfer::public_share_object(state);
    reward_distributor::destroy_for_testing(distributor);
    transfer::public_transfer(admin_cap, @0x0);
    object::delete(market_uid);
    clock::destroy_for_testing(clock);
}

#[test]
fun orderbook_sweeps_expired_order_to_owner_and_deletes_it() {
    let ctx = &mut tx_context::dummy();
    let mut clock = clock::create_for_testing(ctx);
    clock::set_for_testing(&mut clock, 1_000);

    let market_uid = object::new(ctx);
    let market_id = object::uid_to_inner(&market_uid);
    let mut book = orderbook::create_with_market_id_for_testing<DummySY, DummyPT>(
        market_id,
        ctx,
    );

    let ask_pt = coin::mint_for_testing<DummyPT>(100, ctx);
    let order_id = orderbook::place_ask<DummySY, DummyPT>(
        &mut book,
        ask_pt,
        FP64_ONE,
        1_500,
        &clock,
        ctx,
    );
    assert_eq!(orderbook::order_count(&book), 1);

    clock::set_for_testing(&mut clock, 2_000);
    orderbook::sweep_expired_order_to_owner(&mut book, order_id, &clock, ctx);
    assert_eq!(orderbook::order_count(&book), 0);

    orderbook::destroy_for_testing(book);
    object::delete(market_uid);
    clock::destroy_for_testing(clock);
}

#[test]
fun frontend_routed_sell_pt_uses_bid_then_amm_fallback_and_coin_guard() {
    let ctx = &mut tx_context::dummy();
    let mut clock = clock::create_for_testing(ctx);
    clock::set_for_testing(&mut clock, 1_000);
    let admin_cap = admin::create_for_testing(ctx);
    let expiry = 31_536_001_000;
    let sy_cap = coin::create_treasury_cap_for_testing<DummySY>(ctx);
    let pt_cap = coin::create_treasury_cap_for_testing<DummyPT>(ctx);
    let yt_cap = coin::create_treasury_cap_for_testing<DummyYT>(ctx);
    let mut market_obj = market::create_by_admin_cap<DummySY, DummyPT, DummyYT>(
        &admin_cap,
        expiry,
        sy_cap,
        pt_cap,
        yt_cap,
        ctx,
    );
    let market_id = market::id(&market_obj);
    let mut state = py_state::create_for_testing<DummySY>(market_id, expiry, ctx);
    let mut position = jitter_position::create_py_for_testing(
        py_state::state_id(&state),
        market_id,
        expiry,
        ctx,
    );

    let sy_for_py = coin::mint_for_testing<DummySY>(100_000_000, ctx);
    let minted = py_state::mint_py_with_sy_index(
        sy_for_py,
        FP64_ONE,
        &mut position,
        &mut state,
        &clock,
    );
    assert_eq!(minted, 100_000_000);

    let mut pool_state = pool::create_with_ids_for_testing<DummySY>(
        py_state::state_id(&state),
        market_id,
        expiry,
        ctx,
    );
    let mut lp_position = jitter::jitter_position::create_lp_for_testing(
        pool::pool_id(&pool_state),
        expiry,
        ctx,
    );
    let initial_pool_sy = coin::mint_for_testing<DummySY>(500_000_000, ctx);
    let (_, _, _, initial_sy_change) = pool::add_liquidity(
        initial_pool_sy,
        500_000_000,
        &mut pool_state,
        &mut lp_position,
        FP64_ONE,
        &clock,
        ctx,
    );
    coin::burn_for_testing(initial_sy_change);

    let mut book = orderbook::create_with_market_id_for_testing<DummySY, DummyPT>(
        market_id,
        ctx,
    );
    let bid_sy = coin::mint_for_testing<DummySY>(30_000_000, ctx);
    let order_id = orderbook::place_bid<DummySY, DummyPT>(
        &mut book,
        bid_sy,
        FP64_ONE,
        30_000_000,
        0,
        &clock,
        ctx,
    );

    let sy_out = router::swap_pt_for_sy_orderbook_then_amm<DummySY, DummyPT, DummyYT>(
        40_000_000,
        &mut book,
        vector[order_id],
        FP64_ONE,
        31_000_000,
        &mut market_obj,
        &mut pool_state,
        &mut position,
        &mut state,
        price_info::create_for_testing<DummySY>(
            market_id,
            FP64_ONE,
            1_000,
            10_000,
        ),
        &clock,
        ctx,
    );
    assert!(router::assert_coin_min_value(&sy_out, 31_000_000) >= 31_000_000, 0);
    assert_eq!(jitter_position::pt_balance(&position), 60_000_000);

    coin::burn_for_testing(sy_out);
    assert_eq!(orderbook::order_count(&book), 0);

    orderbook::destroy_for_testing(book);
    transfer::public_share_object(pool_state);
    jitter::jitter_position::destroy_for_testing(lp_position);
    jitter_position::destroy_for_testing(position);
    transfer::public_share_object(state);
    transfer::public_transfer(market_obj, @0x0);
    transfer::public_transfer(admin_cap, @0x0);
    clock::destroy_for_testing(clock);
}

#[test]
fun frontend_routed_buy_yt_uses_orderbook_fill_and_position_guard() {
    let ctx = &mut tx_context::dummy();
    let mut clock = clock::create_for_testing(ctx);
    clock::set_for_testing(&mut clock, 1_000);
    let admin_cap = admin::create_for_testing(ctx);
    let expiry = 1_000_000;
    let sy_cap = coin::create_treasury_cap_for_testing<DummySY>(ctx);
    let pt_cap = coin::create_treasury_cap_for_testing<DummyPT>(ctx);
    let yt_cap = coin::create_treasury_cap_for_testing<DummyYT>(ctx);
    let mut market_obj = market::create_by_admin_cap<DummySY, DummyPT, DummyYT>(
        &admin_cap,
        expiry,
        sy_cap,
        pt_cap,
        yt_cap,
        ctx,
    );
    let market_id = market::id(&market_obj);
    let py_state_uid = object::new(ctx);
    let py_state_id = object::uid_to_inner(&py_state_uid);
    let mut position = jitter_position::create_py_for_testing(
        py_state_id,
        market_id,
        expiry,
        ctx,
    );
    let mut yt_book = orderbook::create_with_market_id_for_testing<DummySY, DummyYT>(
        market_id,
        ctx,
    );

    let ask_yt = market::mint_yt(&mut market_obj, 25, ctx);
    let order_id = orderbook::place_ask<DummySY, DummyYT>(
        &mut yt_book,
        ask_yt,
        FP64_ONE,
        0,
        &clock,
        ctx,
    );
    let sy_in = coin::mint_for_testing<DummySY>(25, ctx);
    let initial_yt = jitter_position::yt_balance(&position);
    let (yt_out, sy_change) = orderbook::fill_ask_exact_pt(
        &mut yt_book,
        order_id,
        sy_in,
        25,
        FP64_ONE,
        &clock,
        ctx,
    );
    jitter_position::burn_yt_in(
        yt_out,
        &mut position,
        py_state_id,
        &mut market_obj,
    );

    let yt_delta = router::assert_yt_delta_at_least(&position, initial_yt, 25);
    assert_eq!(yt_delta, 25);
    assert_eq!(router::assert_coin_min_value(&sy_change, 0), 0);

    coin::burn_for_testing(sy_change);
    assert_eq!(orderbook::order_count(&yt_book), 0);

    orderbook::destroy_for_testing(yt_book);
    jitter_position::destroy_for_testing(position);
    object::delete(py_state_uid);
    transfer::public_transfer(market_obj, @0x0);
    transfer::public_transfer(admin_cap, @0x0);
    clock::destroy_for_testing(clock);
}

#[test]
fun frontend_routed_sell_yt_uses_orderbook_and_amm_output_guard() {
    let ctx = &mut tx_context::dummy();
    let mut clock = clock::create_for_testing(ctx);
    clock::set_for_testing(&mut clock, 1_000);
    let admin_cap = admin::create_for_testing(ctx);
    let expiry = 31_536_001_000;
    let sy_cap = coin::create_treasury_cap_for_testing<DummySY>(ctx);
    let pt_cap = coin::create_treasury_cap_for_testing<DummyPT>(ctx);
    let yt_cap = coin::create_treasury_cap_for_testing<DummyYT>(ctx);
    let mut market_obj = market::create_by_admin_cap<DummySY, DummyPT, DummyYT>(
        &admin_cap,
        expiry,
        sy_cap,
        pt_cap,
        yt_cap,
        ctx,
    );
    let market_id = market::id(&market_obj);
    let mut state = py_state::create_for_testing<DummySY>(market_id, expiry, ctx);
    let mut position = jitter_position::create_py_for_testing(
        py_state::state_id(&state),
        market_id,
        expiry,
        ctx,
    );

    let sy_for_py = coin::mint_for_testing<DummySY>(100_000_000, ctx);
    let minted = py_state::mint_py_with_sy_index(
        sy_for_py,
        FP64_ONE,
        &mut position,
        &mut state,
        &clock,
    );
    assert_eq!(minted, 100_000_000);

    let mut pool_state = pool::create_with_ids_for_testing<DummySY>(
        py_state::state_id(&state),
        market_id,
        expiry,
        ctx,
    );
    let mut lp_position = jitter::jitter_position::create_lp_for_testing(
        pool::pool_id(&pool_state),
        expiry,
        ctx,
    );
    let initial_pool_sy = coin::mint_for_testing<DummySY>(100_000_000, ctx);
    let (_, _, _, initial_sy_change) = pool::add_liquidity(
        initial_pool_sy,
        500_000_000,
        &mut pool_state,
        &mut lp_position,
        FP64_ONE,
        &clock,
        ctx,
    );
    coin::burn_for_testing(initial_sy_change);

    let mut yt_book = orderbook::create_with_market_id_for_testing<DummySY, DummyYT>(
        market_id,
        ctx,
    );
    let bid_sy = coin::mint_for_testing<DummySY>(10_000_000, ctx);
    let order_id = orderbook::place_bid<DummySY, DummyYT>(
        &mut yt_book,
        bid_sy,
        FP64_ONE,
        10_000_000,
        0,
        &clock,
        ctx,
    );

    let yt_for_book = jitter_position::redeem_yt_out(
        10_000_000,
        &mut position,
        py_state::state_id(&state),
        &mut market_obj,
        &clock,
        ctx,
    );
    let (book_sy, yt_change) = orderbook::fill_bid_exact_pt(
        &mut yt_book,
        order_id,
        yt_for_book,
        10_000_000,
        FP64_ONE,
        &clock,
        ctx,
    );
    coin::destroy_zero(yt_change);

    let amm_sy = router::swap_yt_for_sy_to_position(
        10_000_000,
        0,
        &mut pool_state,
        &mut position,
        &mut state,
        price_info::create_for_testing<DummySY>(
            market_id,
            FP64_ONE,
            1_000,
            10_000,
        ),
        &clock,
        ctx,
    );
    let mut sy_balance = coin::into_balance(book_sy);
    balance::join(&mut sy_balance, coin::into_balance(amm_sy));
    let sy_out = coin::from_balance(sy_balance, ctx);
    assert!(router::assert_coin_min_value(&sy_out, 10_000_000) >= 10_000_000, 0);
    assert_eq!(jitter_position::yt_balance(&position), 80_000_000);

    coin::burn_for_testing(sy_out);
    assert_eq!(orderbook::order_count(&yt_book), 0);

    orderbook::destroy_for_testing(yt_book);
    transfer::public_share_object(pool_state);
    jitter::jitter_position::destroy_for_testing(lp_position);
    jitter_position::destroy_for_testing(position);
    transfer::public_share_object(state);
    transfer::public_transfer(market_obj, @0x0);
    transfer::public_transfer(admin_cap, @0x0);
    clock::destroy_for_testing(clock);
}

#[test]
fun frontend_routed_add_liquidity_uses_lp_delta_guard() {
    let ctx = &mut tx_context::dummy();
    let mut clock = clock::create_for_testing(ctx);
    clock::set_for_testing(&mut clock, 1_000);

    let market_uid = object::new(ctx);
    let market_id = object::uid_to_inner(&market_uid);
    let py_state_uid = object::new(ctx);
    let py_state_id = object::uid_to_inner(&py_state_uid);
    let expiry = 1_000_000;
    let mut pool_state = pool::create_with_ids_for_testing<DummySY>(
        py_state_id,
        market_id,
        expiry,
        ctx,
    );
    let mut lp_position = jitter::jitter_position::create_lp_for_testing(
        pool::pool_id(&pool_state),
        expiry,
        ctx,
    );

    let initial_lp = jitter::jitter_position::lp_amount(&lp_position);
    let sy_coin = coin::mint_for_testing<DummySY>(100, ctx);
    let (lp_amount, sy_used, pt_used, sy_change) = pool::add_liquidity(
        sy_coin,
        100,
        &mut pool_state,
        &mut lp_position,
        FP64_ONE,
        &clock,
        ctx,
    );
    assert_eq!(sy_used, 100);
    assert_eq!(pt_used, 100);
    assert_eq!(
        router::assert_lp_delta_at_least(&lp_position, initial_lp, 1),
        lp_amount,
    );

    coin::burn_for_testing(sy_change);
    transfer::public_share_object(pool_state);
    jitter::jitter_position::destroy_for_testing(lp_position);
    object::delete(market_uid);
    object::delete(py_state_uid);
    clock::destroy_for_testing(clock);
}

#[test]
fun reward_profile_empty_scope_falls_back_to_global_rewarders() {
    let ctx = &mut tx_context::dummy();
    let admin_cap = admin::create_for_testing(ctx);
    let mut distributor = reward_distributor::create_for_testing(ctx);
    let profile_id = object::id_from_address(@0x11);
    let yt_rewarder_id = object::id_from_address(@0x12);
    let lp_rewarder_id = object::id_from_address(@0x13);

    reward_distributor::register_rewarder_by_admin(
        &mut distributor,
        &admin_cap,
        reward_distributor::yt_scope(),
        yt_rewarder_id,
    );
    reward_distributor::register_rewarder_by_admin(
        &mut distributor,
        &admin_cap,
        reward_distributor::lp_scope(),
        lp_rewarder_id,
    );
    reward_distributor::register_profile_rewarder_by_admin(
        &mut distributor,
        &admin_cap,
        profile_id,
        reward_distributor::yt_scope(),
        yt_rewarder_id,
    );

    let subject_id = object::id_from_address(@0x14);
    let mut operation = reward_distributor::begin_lp_operation_for_profile(
        &distributor,
        profile_id,
        @0xa,
        subject_id,
        77,
    );
    assert_eq!(reward_distributor::pending_rewarder_count(&operation), 1);
    assert_eq!(reward_distributor::operation_scope(&operation), reward_distributor::lp_scope());
    assert_eq!(reward_distributor::operation_subject(&operation), subject_id);
    assert_eq!(reward_distributor::previous_exposure(&operation), 77);

    reward_distributor::settle_lp_rewarder(&distributor, &mut operation, lp_rewarder_id);
    let settlement = reward_distributor::finish_operation(operation);
    assert_eq!(reward_distributor::settlement_scope(&settlement), reward_distributor::lp_scope());
    assert_eq!(reward_distributor::settlement_subject(&settlement), subject_id);
    reward_distributor::destroy_settlement(settlement);

    transfer::public_transfer(admin_cap, @0x0);
    reward_distributor::destroy_for_testing(distributor);
}

#[test]
fun reward_profile_specific_scope_overrides_global_rewarders() {
    let ctx = &mut tx_context::dummy();
    let admin_cap = admin::create_for_testing(ctx);
    let mut distributor = reward_distributor::create_for_testing(ctx);
    let profile_id = object::id_from_address(@0x21);
    let profile_rewarder_id = object::id_from_address(@0x22);
    let global_only_rewarder_id = object::id_from_address(@0x23);

    reward_distributor::register_rewarder_by_admin(
        &mut distributor,
        &admin_cap,
        reward_distributor::yt_scope(),
        profile_rewarder_id,
    );
    reward_distributor::register_rewarder_by_admin(
        &mut distributor,
        &admin_cap,
        reward_distributor::yt_scope(),
        global_only_rewarder_id,
    );
    reward_distributor::register_profile_rewarder_by_admin(
        &mut distributor,
        &admin_cap,
        profile_id,
        reward_distributor::yt_scope(),
        profile_rewarder_id,
    );

    let subject_id = object::id_from_address(@0x24);
    let mut operation = reward_distributor::begin_yt_operation_for_profile(
        &distributor,
        profile_id,
        @0xb,
        subject_id,
        9,
    );
    assert_eq!(reward_distributor::pending_rewarder_count(&operation), 1);

    reward_distributor::settle_yt_rewarder(
        &distributor,
        &mut operation,
        profile_rewarder_id,
    );
    let settlement = reward_distributor::finish_operation(operation);
    assert_eq!(reward_distributor::settlement_scope(&settlement), reward_distributor::yt_scope());
    assert_eq!(reward_distributor::settlement_previous_exposure(&settlement), 9);
    reward_distributor::destroy_settlement(settlement);

    transfer::public_transfer(admin_cap, @0x0);
    reward_distributor::destroy_for_testing(distributor);
}

#[test]
fun rewarded_orderbook_place_and_fill_use_settlement_gate() {
    let ctx = &mut tx_context::dummy();
    let mut clock = clock::create_for_testing(ctx);
    clock::set_for_testing(&mut clock, 1_000);
    let admin_cap = admin::create_for_testing(ctx);
    let distributor = reward_distributor::create_for_testing(ctx);

    let market_uid = object::new(ctx);
    let market_id = object::uid_to_inner(&market_uid);
    let mut book = orderbook::create_with_market_id_for_testing<DummySY, DummyPT>(
        market_id,
        ctx,
    );
    orderbook::require_reward_distributor_by_admin(
        &mut book,
        reward_distributor::id(&distributor),
        &admin_cap,
    );

    let placement_operation = reward_distributor::begin_orderbook_operation(
        &distributor,
        orderbook::orderbook_id(&book),
        orderbook::order_count(&book),
    );
    let placement_settlement = reward_distributor::finish_operation(placement_operation);
    let (order_id, post_placement_operation) = orderbook::place_ask_after_reward_settlement(
        placement_settlement,
        &distributor,
        &mut book,
        coin::mint_for_testing<DummyPT>(50, ctx),
        FP64_ONE,
        0,
        &clock,
        ctx,
    );
    assert_eq!(orderbook::order_count(&book), 1);
    assert_eq!(reward_distributor::pending_rewarder_count(&post_placement_operation), 0);
    reward_distributor::destroy_settlement(
        reward_distributor::finish_operation(post_placement_operation),
    );

    let fill_operation = reward_distributor::begin_orderbook_operation(
        &distributor,
        orderbook::orderbook_id(&book),
        orderbook::order_count(&book),
    );
    let fill_settlement = reward_distributor::finish_operation(fill_operation);
    let (pt_out, sy_change, post_fill_operation) = orderbook::fill_ask_exact_pt_after_reward_settlement(
        fill_settlement,
        &distributor,
        &mut book,
        order_id,
        coin::mint_for_testing<DummySY>(50, ctx),
        50,
        FP64_ONE,
        &clock,
        ctx,
    );
    assert_eq!(coin::value(&pt_out), 50);
    assert_eq!(coin::value(&sy_change), 0);
    assert_eq!(orderbook::order_count(&book), 0);
    assert_eq!(reward_distributor::pending_rewarder_count(&post_fill_operation), 0);
    reward_distributor::destroy_settlement(
        reward_distributor::finish_operation(post_fill_operation),
    );

    coin::burn_for_testing(pt_out);
    coin::burn_for_testing(sy_change);
    orderbook::destroy_for_testing(book);
    object::delete(market_uid);
    reward_distributor::destroy_for_testing(distributor);
    transfer::public_transfer(admin_cap, @0x0);
    clock::destroy_for_testing(clock);
}

#[test]
fun orderbook_fill_bid_swaps_pt_for_sy_coin() {
    let ctx = &mut tx_context::dummy();
    let mut clock = clock::create_for_testing(ctx);
    clock::set_for_testing(&mut clock, 1_000);

    let market_uid = object::new(ctx);
    let market_id = object::uid_to_inner(&market_uid);
    let mut book = orderbook::create_with_market_id_for_testing<DummySY, DummyPT>(
        market_id,
        ctx,
    );

    let bid_sy = coin::mint_for_testing<DummySY>(100, ctx);
    let order_id = orderbook::place_bid<DummySY, DummyPT>(
        &mut book,
        bid_sy,
        FP64_ONE,
        100,
        0,
        &clock,
        ctx,
    );
    assert_eq!(orderbook::order_count(&book), 1);

    let taker_pt = coin::mint_for_testing<DummyPT>(25, ctx);
    let (sy_out, pt_change) = orderbook::fill_bid_exact_pt(
        &mut book,
        order_id,
        taker_pt,
        25,
        FP64_ONE,
        &clock,
        ctx,
    );
    assert_eq!(coin::value(&sy_out), 25);
    assert_eq!(coin::value(&pt_change), 0);

    let (claim_sy, claim_pt) = orderbook::claim_order(&mut book, order_id, ctx);
    assert_eq!(coin::value(&claim_sy), 0);
    assert_eq!(coin::value(&claim_pt), 0);

    let (cancel_sy, cancel_pt) = orderbook::cancel_order(&mut book, order_id, ctx);
    assert_eq!(coin::value(&cancel_sy), 75);
    assert_eq!(coin::value(&cancel_pt), 0);
    assert_eq!(orderbook::order_count(&book), 0);

    coin::burn_for_testing(sy_out);
    coin::burn_for_testing(pt_change);
    coin::burn_for_testing(claim_sy);
    coin::burn_for_testing(claim_pt);
    coin::burn_for_testing(cancel_sy);
    coin::burn_for_testing(cancel_pt);
    orderbook::destroy_for_testing(book);
    object::delete(market_uid);
    clock::destroy_for_testing(clock);
}

#[test]
fun orderbook_full_fill_bid_pushes_payout_and_closes_order() {
    let ctx = &mut tx_context::dummy();
    let mut clock = clock::create_for_testing(ctx);
    clock::set_for_testing(&mut clock, 1_000);

    let market_uid = object::new(ctx);
    let market_id = object::uid_to_inner(&market_uid);
    let mut book = orderbook::create_with_market_id_for_testing<DummySY, DummyPT>(
        market_id,
        ctx,
    );

    let order_id = orderbook::place_bid<DummySY, DummyPT>(
        &mut book,
        coin::mint_for_testing<DummySY>(100, ctx),
        FP64_ONE,
        100,
        0,
        &clock,
        ctx,
    );
    let (sy_out, pt_change) = orderbook::fill_bid_exact_pt(
        &mut book,
        order_id,
        coin::mint_for_testing<DummyPT>(100, ctx),
        100,
        FP64_ONE,
        &clock,
        ctx,
    );

    assert_eq!(coin::value(&sy_out), 100);
    assert_eq!(coin::value(&pt_change), 0);
    assert_eq!(orderbook::order_count(&book), 0);
    assert_eq!(orderbook::fillable_bid_pt(&book, order_id, 100, FP64_ONE, &clock), 0);
    let ids = orderbook::order_ids(&book);
    assert_eq!(vector::length(&ids), 0);

    coin::burn_for_testing(sy_out);
    coin::burn_for_testing(pt_change);
    orderbook::destroy_for_testing(book);
    object::delete(market_uid);
    clock::destroy_for_testing(clock);
}

#[test]
fun emergency_pause_requires_dedicated_recovery() {
    let ctx = &mut tx_context::dummy();
    let market_uid = object::new(ctx);
    let market_id = object::uid_to_inner(&market_uid);
    let py_state_uid = object::new(ctx);
    let py_state_id = object::uid_to_inner(&py_state_uid);
    let admin_cap = admin::create_for_testing(ctx);

    let mut book = orderbook::create_with_market_id_for_testing<DummySY, DummyPT>(
        market_id,
        ctx,
    );
    orderbook::emergency_pause_orderbook_by_admin(
        &mut book,
        &admin_cap,
        b"test halt",
        ctx,
    );
    assert!(orderbook::is_paused(&book), 10);
    assert!(orderbook::is_emergency_paused(&book), 11);
    orderbook::unpause_orderbook_by_admin(&mut book, &admin_cap, ctx);
    assert!(orderbook::is_paused(&book), 12);
    assert!(!orderbook::is_normally_paused(&book), 13);
    assert!(orderbook::is_emergency_paused(&book), 14);
    orderbook::emergency_unpause_orderbook_by_admin(&mut book, &admin_cap, ctx);
    assert!(!orderbook::is_paused(&book), 15);
    orderbook::destroy_for_testing(book);

    let mut pool_state = pool::create_with_ids_for_testing<DummySY>(
        py_state_id,
        market_id,
        1_000_000,
        ctx,
    );
    pool::emergency_pause_pool_by_admin(
        &mut pool_state,
        &admin_cap,
        b"test halt",
        ctx,
    );
    assert!(pool::is_paused(&pool_state), 16);
    assert!(pool::is_emergency_paused(&pool_state), 17);
    pool::unpause_pool_by_admin(&mut pool_state, &admin_cap, ctx);
    assert!(pool::is_paused(&pool_state), 18);
    assert!(!pool::is_normally_paused(&pool_state), 19);
    assert!(pool::is_emergency_paused(&pool_state), 20);
    pool::emergency_unpause_pool_by_admin(&mut pool_state, &admin_cap, ctx);
    assert!(!pool::is_paused(&pool_state), 21);
    pool::destroy_empty_for_testing(pool_state);

    transfer::public_transfer(admin_cap, @0x0);
    object::delete(market_uid);
    object::delete(py_state_uid);
}

#[test, expected_failure(abort_code = 3106, location = jitter::orderbook)]
fun orderbook_rejects_expired_ask_on_placement() {
    let ctx = &mut tx_context::dummy();
    let mut clock = clock::create_for_testing(ctx);
    clock::set_for_testing(&mut clock, 1_000);

    let market_uid = object::new(ctx);
    let market_id = object::uid_to_inner(&market_uid);
    let mut book = orderbook::create_with_market_id_for_testing<DummySY, DummyPT>(
        market_id,
        ctx,
    );

    let ask_pt = coin::mint_for_testing<DummyPT>(100, ctx);
    let order_id = orderbook::place_ask<DummySY, DummyPT>(
        &mut book,
        ask_pt,
        FP64_ONE,
        999,
        &clock,
        ctx,
    );
    let (cancel_sy, cancel_pt) = orderbook::cancel_order(&mut book, order_id, ctx);
    coin::burn_for_testing(cancel_sy);
    coin::burn_for_testing(cancel_pt);
    orderbook::destroy_for_testing(book);
    object::delete(market_uid);
    clock::destroy_for_testing(clock);
}
