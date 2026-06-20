/// market_registry - canonical on-chain project and market registry.
///
/// The registry does not custody assets. It gives deployment tooling, SDKs, and
/// indexers one source of truth for project-level reward configuration and the
/// object IDs that make up each market.
module jitter::market_registry;

use sui::dynamic_field as df;

use jitter::market::{Self, Market};
use jitter::orderbook::{Self, OrderBook};
use jitter::pool::{Self, Pool};
use jitter::py_state::{Self, PyState};
use jitter_admin::admin::AdminCap;

const E_PROJECT_NOT_FOUND: u64 = 3200;
const E_MARKET_ALREADY_REGISTERED: u64 = 3201;
const E_MARKET_NOT_FOUND: u64 = 3202;
const E_MARKET_MISMATCH: u64 = 3203;
const E_REWARD_DISTRIBUTOR_REQUIRED: u64 = 3204;
const E_REWARD_DISTRIBUTOR_MISMATCH: u64 = 3205;
const E_INVALID_PROJECT: u64 = 3206;

public struct MarketRegistry has key, store {
    id: UID,
    next_project_id: u64,
    project_count: u64,
    market_count: u64,
}

public struct ProjectKey(u64) has copy, drop, store;

public struct MarketKey(ID) has copy, drop, store;

public struct Project has copy, drop, store {
    project_id: u64,
    owner: address,
    name: vector<u8>,
    metadata_uri: vector<u8>,
    rewards_enabled: bool,
    reward_distributor_id: ID,
}

public struct MarketRecord has copy, drop, store {
    project_id: u64,
    market_id: ID,
    py_state_id: ID,
    pool_id: ID,
    pt_orderbook_id: ID,
    yt_orderbook_id: ID,
    reward_distributor_id: ID,
    expiry: u64,
}

// === Creation ===

public fun create_by_admin(_admin_cap: &AdminCap, ctx: &mut TxContext): MarketRegistry {
    create(ctx)
}

public fun create_and_share_by_admin(_admin_cap: &AdminCap, ctx: &mut TxContext): ID {
    let registry = create(ctx);
    let registry_id = object::id(&registry);
    transfer::share_object(registry);
    registry_id
}

// === Project Configuration ===

public fun register_project_by_admin(
    registry: &mut MarketRegistry,
    _admin_cap: &AdminCap,
    name: vector<u8>,
    metadata_uri: vector<u8>,
    rewards_enabled: bool,
    reward_distributor_id: ID,
    ctx: &TxContext,
): u64 {
    register_project(
        registry,
        name,
        metadata_uri,
        rewards_enabled,
        reward_distributor_id,
        ctx.sender(),
    )
}

public fun set_project_rewards_by_admin(
    registry: &mut MarketRegistry,
    _admin_cap: &AdminCap,
    project_id: u64,
    rewards_enabled: bool,
    reward_distributor_id: ID,
) {
    set_project_rewards(registry, project_id, rewards_enabled, reward_distributor_id);
}

// === Market Registration ===

public fun register_market_by_admin<SY: drop, PT: drop, YT: drop>(
    registry: &mut MarketRegistry,
    _admin_cap: &AdminCap,
    project_id: u64,
    market: &Market<SY, PT, YT>,
    py_state: &PyState<SY>,
    pool: &Pool<SY>,
) {
    register_market(registry, project_id, market, py_state, pool);
}

public fun require_market_reward_gates_by_admin<SY: drop, PT: drop, YT: drop>(
    registry: &MarketRegistry,
    admin_cap: &AdminCap,
    market: &Market<SY, PT, YT>,
    py_state: &mut PyState<SY>,
    pool: &mut Pool<SY>,
) {
    let reward_distributor_id = assert_project_reward_config(
        registry,
        market,
        py_state,
        pool,
    );
    py_state::require_yt_reward_distributor_by_admin(
        py_state,
        reward_distributor_id,
        admin_cap,
    );
    pool::require_reward_distributor_by_admin(
        pool,
        reward_distributor_id,
        admin_cap,
    );
}

public fun require_market_reward_gates_with_orderbooks_by_admin<
    SY: drop,
    PT: drop,
    YT: drop,
>(
    registry: &MarketRegistry,
    admin_cap: &AdminCap,
    market: &Market<SY, PT, YT>,
    py_state: &mut PyState<SY>,
    pool: &mut Pool<SY>,
    pt_orderbook: &mut OrderBook<SY, PT>,
    yt_orderbook: &mut OrderBook<SY, YT>,
) {
    let reward_distributor_id = assert_full_project_reward_config(
        registry,
        market,
        py_state,
        pool,
        pt_orderbook,
        yt_orderbook,
    );
    py_state::require_yt_reward_distributor_by_admin(
        py_state,
        reward_distributor_id,
        admin_cap,
    );
    pool::require_reward_distributor_by_admin(
        pool,
        reward_distributor_id,
        admin_cap,
    );
    orderbook::require_reward_distributor_by_admin(
        pt_orderbook,
        reward_distributor_id,
        admin_cap,
    );
    orderbook::require_reward_distributor_by_admin(
        yt_orderbook,
        reward_distributor_id,
        admin_cap,
    );
}

public fun set_pt_orderbook_by_admin<SY: drop, PT: drop, YT: drop>(
    registry: &mut MarketRegistry,
    _admin_cap: &AdminCap,
    market: &Market<SY, PT, YT>,
    orderbook: &OrderBook<SY, PT>,
) {
    let market_id = market::id(market);
    assert!(orderbook::market_id(orderbook) == market_id, E_MARKET_MISMATCH);
    let record = borrow_market_record_mut(registry, market_id);
    record.pt_orderbook_id = orderbook::orderbook_id(orderbook);
}

public fun set_yt_orderbook_by_admin<SY: drop, PT: drop, YT: drop>(
    registry: &mut MarketRegistry,
    _admin_cap: &AdminCap,
    market: &Market<SY, PT, YT>,
    orderbook: &OrderBook<SY, YT>,
) {
    let market_id = market::id(market);
    assert!(orderbook::market_id(orderbook) == market_id, E_MARKET_MISMATCH);
    let record = borrow_market_record_mut(registry, market_id);
    record.yt_orderbook_id = orderbook::orderbook_id(orderbook);
}

// === Views ===

public fun id(registry: &MarketRegistry): ID { object::id(registry) }
public fun project_count(registry: &MarketRegistry): u64 { registry.project_count }
public fun market_count(registry: &MarketRegistry): u64 { registry.market_count }

public fun project_exists(registry: &MarketRegistry, project_id: u64): bool {
    df::exists(&registry.id, ProjectKey(project_id))
}

public fun market_registered(registry: &MarketRegistry, market_id: ID): bool {
    df::exists(&registry.id, MarketKey(market_id))
}

public fun project_rewards_enabled(registry: &MarketRegistry, project_id: u64): bool {
    project(registry, project_id).rewards_enabled
}

public fun project_reward_distributor_id(
    registry: &MarketRegistry,
    project_id: u64,
): ID {
    project(registry, project_id).reward_distributor_id
}

public fun market_project_id(registry: &MarketRegistry, market_id: ID): u64 {
    market_record(registry, market_id).project_id
}

public fun market_reward_distributor_id(
    registry: &MarketRegistry,
    market_id: ID,
): ID {
    market_record(registry, market_id).reward_distributor_id
}

public fun project(registry: &MarketRegistry, project_id: u64): Project {
    assert!(project_exists(registry, project_id), E_PROJECT_NOT_FOUND);
    *df::borrow<ProjectKey, Project>(&registry.id, ProjectKey(project_id))
}

public fun market_record(registry: &MarketRegistry, market_id: ID): MarketRecord {
    assert!(market_registered(registry, market_id), E_MARKET_NOT_FOUND);
    *df::borrow<MarketKey, MarketRecord>(&registry.id, MarketKey(market_id))
}

public fun none_id(): ID { object::id_from_address(@0x0) }

// === Internal ===

fun create(ctx: &mut TxContext): MarketRegistry {
    MarketRegistry {
        id: object::new(ctx),
        next_project_id: 1,
        project_count: 0,
        market_count: 0,
    }
}

fun register_project(
    registry: &mut MarketRegistry,
    name: vector<u8>,
    metadata_uri: vector<u8>,
    rewards_enabled: bool,
    reward_distributor_id: ID,
    owner: address,
): u64 {
    if (rewards_enabled) {
        assert!(reward_distributor_id != none_id(), E_REWARD_DISTRIBUTOR_REQUIRED);
    };
    let project_id = registry.next_project_id;
    assert!(project_id > 0, E_INVALID_PROJECT);
    registry.next_project_id = project_id + 1;
    registry.project_count = registry.project_count + 1;
    df::add(
        &mut registry.id,
        ProjectKey(project_id),
        Project {
            project_id,
            owner,
            name,
            metadata_uri,
            rewards_enabled,
            reward_distributor_id,
        },
    );
    project_id
}

fun set_project_rewards(
    registry: &mut MarketRegistry,
    project_id: u64,
    rewards_enabled: bool,
    reward_distributor_id: ID,
) {
    if (rewards_enabled) {
        assert!(reward_distributor_id != none_id(), E_REWARD_DISTRIBUTOR_REQUIRED);
    };
    assert!(project_exists(registry, project_id), E_PROJECT_NOT_FOUND);
    let project = df::borrow_mut<ProjectKey, Project>(
        &mut registry.id,
        ProjectKey(project_id),
    );
    project.rewards_enabled = rewards_enabled;
    project.reward_distributor_id = reward_distributor_id;
}

fun register_market<SY: drop, PT: drop, YT: drop>(
    registry: &mut MarketRegistry,
    project_id: u64,
    market: &Market<SY, PT, YT>,
    py_state: &PyState<SY>,
    pool: &Pool<SY>,
) {
    assert!(project_exists(registry, project_id), E_PROJECT_NOT_FOUND);
    let market_id = market::id(market);
    assert!(!market_registered(registry, market_id), E_MARKET_ALREADY_REGISTERED);
    assert!(py_state::market_id(py_state) == market_id, E_MARKET_MISMATCH);
    assert!(pool::market_id(pool) == market_id, E_MARKET_MISMATCH);
    assert!(pool::py_state_id(pool) == py_state::state_id(py_state), E_MARKET_MISMATCH);
    assert!(market::expiry(market) == py_state::expiry(py_state), E_MARKET_MISMATCH);
    assert!(market::expiry(market) == pool::expiry(pool), E_MARKET_MISMATCH);

    let project = project(registry, project_id);
    let reward_distributor_id = if (project.rewards_enabled) {
        project.reward_distributor_id
    } else {
        none_id()
    };
    let record = MarketRecord {
        project_id,
        market_id,
        py_state_id: py_state::state_id(py_state),
        pool_id: pool::pool_id(pool),
        pt_orderbook_id: none_id(),
        yt_orderbook_id: none_id(),
        reward_distributor_id,
        expiry: market::expiry(market),
    };
    df::add(&mut registry.id, MarketKey(market_id), record);
    registry.market_count = registry.market_count + 1;
}

fun borrow_market_record_mut(
    registry: &mut MarketRegistry,
    market_id: ID,
): &mut MarketRecord {
    assert!(market_registered(registry, market_id), E_MARKET_NOT_FOUND);
    df::borrow_mut<MarketKey, MarketRecord>(&mut registry.id, MarketKey(market_id))
}

fun assert_project_reward_config<SY: drop, PT: drop, YT: drop>(
    registry: &MarketRegistry,
    market: &Market<SY, PT, YT>,
    py_state: &PyState<SY>,
    pool: &Pool<SY>,
): ID {
    let record = market_record(registry, market::id(market));
    assert_market_core_record(&record, market, py_state, pool);
    let project = project(registry, record.project_id);
    assert!(project.rewards_enabled, E_REWARD_DISTRIBUTOR_REQUIRED);
    assert!(
        record.reward_distributor_id == project.reward_distributor_id,
        E_REWARD_DISTRIBUTOR_MISMATCH,
    );
    project.reward_distributor_id
}

fun assert_full_project_reward_config<SY: drop, PT: drop, YT: drop>(
    registry: &MarketRegistry,
    market: &Market<SY, PT, YT>,
    py_state: &PyState<SY>,
    pool: &Pool<SY>,
    pt_orderbook: &OrderBook<SY, PT>,
    yt_orderbook: &OrderBook<SY, YT>,
): ID {
    let market_id = market::id(market);
    let record = market_record(registry, market_id);
    assert_market_core_record(&record, market, py_state, pool);
    assert!(record.pt_orderbook_id != none_id(), E_MARKET_MISMATCH);
    assert!(record.yt_orderbook_id != none_id(), E_MARKET_MISMATCH);
    assert!(
        orderbook::orderbook_id(pt_orderbook) == record.pt_orderbook_id,
        E_MARKET_MISMATCH,
    );
    assert!(
        orderbook::orderbook_id(yt_orderbook) == record.yt_orderbook_id,
        E_MARKET_MISMATCH,
    );
    assert!(orderbook::market_id(pt_orderbook) == market_id, E_MARKET_MISMATCH);
    assert!(orderbook::market_id(yt_orderbook) == market_id, E_MARKET_MISMATCH);

    let project = project(registry, record.project_id);
    assert!(project.rewards_enabled, E_REWARD_DISTRIBUTOR_REQUIRED);
    assert!(
        record.reward_distributor_id == project.reward_distributor_id,
        E_REWARD_DISTRIBUTOR_MISMATCH,
    );
    project.reward_distributor_id
}

fun assert_market_core_record<SY: drop, PT: drop, YT: drop>(
    record: &MarketRecord,
    market: &Market<SY, PT, YT>,
    py_state: &PyState<SY>,
    pool: &Pool<SY>,
) {
    let market_id = market::id(market);
    assert!(record.market_id == market_id, E_MARKET_MISMATCH);
    assert!(record.py_state_id == py_state::state_id(py_state), E_MARKET_MISMATCH);
    assert!(record.pool_id == pool::pool_id(pool), E_MARKET_MISMATCH);
    assert!(py_state::market_id(py_state) == market_id, E_MARKET_MISMATCH);
    assert!(pool::market_id(pool) == market_id, E_MARKET_MISMATCH);
    assert!(pool::py_state_id(pool) == py_state::state_id(py_state), E_MARKET_MISMATCH);
}

// === Test Helpers ===

#[test_only]
public fun create_for_testing(ctx: &mut TxContext): MarketRegistry {
    MarketRegistry {
        id: object::new(ctx),
        next_project_id: 1,
        project_count: 0,
        market_count: 0,
    }
}

#[test_only]
public fun destroy_empty_for_testing(registry: MarketRegistry) {
    let MarketRegistry {
        id,
        next_project_id: _,
        project_count,
        market_count,
    } = registry;
    assert!(project_count == 0, E_INVALID_PROJECT);
    assert!(market_count == 0, E_MARKET_ALREADY_REGISTERED);
    object::delete(id);
}

#[test_only]
public struct DummySY has drop {}

#[test_only]
public struct DummyPT has drop {}

#[test_only]
public struct DummyYT has drop {}

#[test]
fun project_rewards_config_tracks_distributor() {
    let ctx = &mut tx_context::dummy();
    let admin_cap = jitter_admin::admin::create_for_testing(ctx);
    let mut registry = create_for_testing(ctx);
    let distributor_id = object::id_from_address(@0xcafe);

    let project_id = register_project_by_admin(
        &mut registry,
        &admin_cap,
        b"demo",
        b"ipfs://demo",
        true,
        distributor_id,
        ctx,
    );
    assert!(project_id == 1, 10);
    assert!(project_count(&registry) == 1, 11);
    let project = project(&registry, project_id);
    assert!(project.project_id == project_id, 12);
    assert!(project.owner == ctx.sender(), 13);
    assert!(project.name == b"demo", 14);
    assert!(project.metadata_uri == b"ipfs://demo", 15);
    assert!(project.rewards_enabled, 16);
    assert!(project.reward_distributor_id == distributor_id, 17);

    set_project_rewards_by_admin(
        &mut registry,
        &admin_cap,
        project_id,
        false,
        none_id(),
    );
    let project = project(&registry, project_id);
    assert!(!project.rewards_enabled, 18);
    assert!(project.reward_distributor_id == none_id(), 19);

    transfer::public_transfer(admin_cap, @0x0);
    transfer::share_object(registry);
}

#[test]
fun project_reward_gates_configure_all_market_components() {
    let ctx = &mut tx_context::dummy();
    let admin_cap = jitter_admin::admin::create_for_testing(ctx);
    let sy_treasury = sui::coin::create_treasury_cap_for_testing<DummySY>(ctx);
    let pt_treasury = sui::coin::create_treasury_cap_for_testing<DummyPT>(ctx);
    let yt_treasury = sui::coin::create_treasury_cap_for_testing<DummyYT>(ctx);
    let market = market::create_by_admin_cap<DummySY, DummyPT, DummyYT>(
        &admin_cap,
        100,
        sy_treasury,
        pt_treasury,
        yt_treasury,
        ctx,
    );
    let mut py_state = py_state::create_py_state_by_admin_cap(
        &admin_cap,
        &market,
        0,
        1,
        @0x0,
        ctx,
    );
    let mut pool = pool::create_for_testing(&py_state, &market, 100, ctx);
    let mut pt_orderbook = orderbook::create_for_testing<DummySY, DummyPT, DummyYT>(
        &market,
        ctx,
    );
    let mut yt_orderbook = orderbook::create_with_market_id_for_testing<DummySY, DummyYT>(
        market::id(&market),
        ctx,
    );
    let mut registry = create_for_testing(ctx);
    let distributor_id = object::id_from_address(@0xcafe);

    let project_id = register_project_by_admin(
        &mut registry,
        &admin_cap,
        b"demo",
        b"ipfs://demo",
        true,
        distributor_id,
        ctx,
    );
    register_market_by_admin(
        &mut registry,
        &admin_cap,
        project_id,
        &market,
        &py_state,
        &pool,
    );
    set_pt_orderbook_by_admin(
        &mut registry,
        &admin_cap,
        &market,
        &pt_orderbook,
    );
    set_yt_orderbook_by_admin(
        &mut registry,
        &admin_cap,
        &market,
        &yt_orderbook,
    );

    require_market_reward_gates_with_orderbooks_by_admin(
        &registry,
        &admin_cap,
        &market,
        &mut py_state,
        &mut pool,
        &mut pt_orderbook,
        &mut yt_orderbook,
    );

    assert!(project_reward_distributor_id(&registry, project_id) == distributor_id, 20);
    assert!(
        market_reward_distributor_id(&registry, market::id(&market)) == distributor_id,
        21,
    );
    assert!(py_state::yt_reward_distributor_id(&py_state) == distributor_id, 22);
    assert!(pool::reward_distributor_id(&pool) == distributor_id, 23);
    assert!(orderbook::reward_distributor_id(&pt_orderbook) == distributor_id, 24);
    assert!(orderbook::reward_distributor_id(&yt_orderbook) == distributor_id, 25);

    transfer::public_transfer(admin_cap, @0x0);
    transfer::public_transfer(market, @0x0);
    transfer::public_transfer(py_state, @0x0);
    transfer::public_transfer(pool, @0x0);
    transfer::public_transfer(pt_orderbook, @0x0);
    transfer::public_transfer(yt_orderbook, @0x0);
    transfer::share_object(registry);
}

#[test, expected_failure(abort_code = E_REWARD_DISTRIBUTOR_REQUIRED)]
fun project_rewards_enabled_requires_distributor() {
    let ctx = &mut tx_context::dummy();
    let admin_cap = jitter_admin::admin::create_for_testing(ctx);
    let mut registry = create_for_testing(ctx);
    let _project_id = register_project_by_admin(
        &mut registry,
        &admin_cap,
        b"demo",
        b"ipfs://demo",
        true,
        none_id(),
        ctx,
    );

    transfer::public_transfer(admin_cap, @0x0);
    transfer::share_object(registry);
}

