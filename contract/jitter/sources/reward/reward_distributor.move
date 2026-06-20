/// reward_distributor - no-stake reward coordination layer.
///
/// This module does not custody user principal. It only coordinates rewarder
/// settlement around position or pool mutations. Rewarder implementations live
/// in separate modules and must mark their own rewarder ID as settled before the
/// hot-potato operation can be destroyed.
module jitter::reward_distributor;

use sui::dynamic_field as df;
use sui::event;
use sui::vec_set::{Self, VecSet};

use jitter_admin::admin::AdminCap;

const SCOPE_YT: u8 = 1;
const SCOPE_LP: u8 = 2;
const SCOPE_POOL: u8 = 3;
const SCOPE_ORDERBOOK: u8 = 4;
const MAX_REWARDERS_PER_SCOPE: u64 = 16;

const EInvalidScope: u64 = 9300;
const ETooManyRewarders: u64 = 9301;
const ERewarderAlreadyRegistered: u64 = 9302;
const ERewarderNotRegistered: u64 = 9303;
const EDistributorDisabled: u64 = 9304;
const EDistributorMismatch: u64 = 9305;
const EOperationScopeMismatch: u64 = 9306;
const EMissingRewarderSettlement: u64 = 9307;
const EInvalidSubject: u64 = 9308;
const EInvalidOwner: u64 = 9309;
const ERewarderMetadataNotFound: u64 = 9310;
const ERewardProfileNotFound: u64 = 9311;

public struct RewardDistributor has key, store {
    id: UID,
    yt_rewarder_ids: VecSet<ID>,
    lp_rewarder_ids: VecSet<ID>,
    pool_rewarder_ids: VecSet<ID>,
    orderbook_rewarder_ids: VecSet<ID>,
    enabled: bool,
}

/// Hot-potato receipt for one reward-settled operation.
public struct RewardOperation {
    distributor_id: ID,
    scope: u8,
    owner: address,
    subject_id: ID,
    previous_exposure: u64,
    pending_rewarder_ids: VecSet<ID>,
}

/// One-shot receipt proving all rewarders for an operation were settled.
public struct RewardSettlement {
    distributor_id: ID,
    scope: u8,
    owner: address,
    subject_id: ID,
    previous_exposure: u64,
}

public struct RewarderMetadataKey(ID) has copy, drop, store;

public struct RewarderMetadata has copy, drop, store {
    rewarder_id: ID,
    scope: u8,
    kind: vector<u8>,
    label: vector<u8>,
}

/// Capability held privately by external rewarder objects.
///
/// The cap lets an external package mark its own rewarder ID as settled without
/// making the raw settlement hooks public. Do not expose this cap from rewarder
/// modules; store it inside the rewarder object.
public struct RewarderSettlementCap has store {
    distributor_id: ID,
    scope: u8,
    rewarder_id: ID,
}

public struct RewardProfileKey(ID) has copy, drop, store;

public struct RewardProfile has store {
    profile_id: ID,
    yt_rewarder_ids: VecSet<ID>,
    lp_rewarder_ids: VecSet<ID>,
    pool_rewarder_ids: VecSet<ID>,
    orderbook_rewarder_ids: VecSet<ID>,
}

public struct RewardDistributorCreatedEvent has copy, drop {
    distributor_id: ID,
    owner: address,
}

public struct RewardDistributorStatusChangedEvent has copy, drop {
    distributor_id: ID,
    enabled: bool,
}

public struct RewarderRegisteredEvent has copy, drop {
    distributor_id: ID,
    rewarder_id: ID,
    scope: u8,
    kind: vector<u8>,
    label: vector<u8>,
}

public struct RewarderUnregisteredEvent has copy, drop {
    distributor_id: ID,
    rewarder_id: ID,
    scope: u8,
}

public struct RewardProfileCreatedEvent has copy, drop {
    distributor_id: ID,
    profile_id: ID,
}

public struct ProfileRewarderRegisteredEvent has copy, drop {
    distributor_id: ID,
    profile_id: ID,
    rewarder_id: ID,
    scope: u8,
    kind: vector<u8>,
    label: vector<u8>,
}

public struct ProfileRewarderUnregisteredEvent has copy, drop {
    distributor_id: ID,
    profile_id: ID,
    rewarder_id: ID,
    scope: u8,
}

public struct RewarderSettledEvent has copy, drop {
    distributor_id: ID,
    rewarder_id: ID,
    scope: u8,
    owner: address,
    subject_id: ID,
    previous_exposure: u64,
}

public struct RewardOperationFinishedEvent has copy, drop {
    distributor_id: ID,
    scope: u8,
    owner: address,
    subject_id: ID,
    previous_exposure: u64,
}

// === Creation ===

public fun create_and_share_by_admin(_admin_cap: &AdminCap, ctx: &mut TxContext) {
    create_and_share(ctx);
}

// === Admin Configuration ===

public fun set_enabled_by_admin(
    distributor: &mut RewardDistributor,
    _admin_cap: &AdminCap,
    enabled: bool,
) {
    set_enabled(distributor, enabled);
}

public fun register_rewarder_by_admin(
    distributor: &mut RewardDistributor,
    _admin_cap: &AdminCap,
    scope: u8,
    rewarder_id: ID,
) {
    register_rewarder(distributor, scope, rewarder_id, b"", b"");
}

public fun register_rewarder_with_metadata_by_admin(
    distributor: &mut RewardDistributor,
    _admin_cap: &AdminCap,
    scope: u8,
    rewarder_id: ID,
    kind: vector<u8>,
    label: vector<u8>,
) {
    register_rewarder(distributor, scope, rewarder_id, kind, label);
}

public fun register_rewarder_with_settlement_cap_by_admin(
    distributor: &mut RewardDistributor,
    _admin_cap: &AdminCap,
    scope: u8,
    rewarder_id: ID,
    kind: vector<u8>,
    label: vector<u8>,
): RewarderSettlementCap {
    register_rewarder(distributor, scope, rewarder_id, kind, label);
    RewarderSettlementCap {
        distributor_id: object::id(distributor),
        scope,
        rewarder_id,
    }
}

public fun unregister_rewarder_by_admin(
    distributor: &mut RewardDistributor,
    _admin_cap: &AdminCap,
    scope: u8,
    rewarder_id: ID,
) {
    unregister_rewarder(distributor, scope, rewarder_id);
}

public fun register_profile_rewarder_by_admin(
    distributor: &mut RewardDistributor,
    _admin_cap: &AdminCap,
    profile_id: ID,
    scope: u8,
    rewarder_id: ID,
) {
    register_profile_rewarder(distributor, profile_id, scope, rewarder_id, b"", b"");
}

public fun register_profile_rewarder_with_metadata_by_admin(
    distributor: &mut RewardDistributor,
    _admin_cap: &AdminCap,
    profile_id: ID,
    scope: u8,
    rewarder_id: ID,
    kind: vector<u8>,
    label: vector<u8>,
) {
    register_profile_rewarder(distributor, profile_id, scope, rewarder_id, kind, label);
}

public fun unregister_profile_rewarder_by_admin(
    distributor: &mut RewardDistributor,
    _admin_cap: &AdminCap,
    profile_id: ID,
    scope: u8,
    rewarder_id: ID,
) {
    unregister_profile_rewarder(distributor, profile_id, scope, rewarder_id);
}

// === Operation Lifecycle ===

public fun begin_yt_operation(
    distributor: &RewardDistributor,
    owner: address,
    subject_id: ID,
    previous_exposure: u64,
): RewardOperation {
    begin_operation(distributor, SCOPE_YT, owner, subject_id, previous_exposure)
}

public fun begin_yt_operation_for_profile(
    distributor: &RewardDistributor,
    profile_id: ID,
    owner: address,
    subject_id: ID,
    previous_exposure: u64,
): RewardOperation {
    begin_operation_for_profile(
        distributor,
        profile_id,
        SCOPE_YT,
        owner,
        subject_id,
        previous_exposure,
    )
}

public fun begin_lp_operation(
    distributor: &RewardDistributor,
    owner: address,
    subject_id: ID,
    previous_exposure: u64,
): RewardOperation {
    begin_operation(distributor, SCOPE_LP, owner, subject_id, previous_exposure)
}

public fun begin_lp_operation_for_profile(
    distributor: &RewardDistributor,
    profile_id: ID,
    owner: address,
    subject_id: ID,
    previous_exposure: u64,
): RewardOperation {
    begin_operation_for_profile(
        distributor,
        profile_id,
        SCOPE_LP,
        owner,
        subject_id,
        previous_exposure,
    )
}

public fun begin_pool_operation(
    distributor: &RewardDistributor,
    subject_id: ID,
    previous_exposure: u64,
): RewardOperation {
    begin_operation(distributor, SCOPE_POOL, @0x0, subject_id, previous_exposure)
}

public fun begin_pool_operation_for_profile(
    distributor: &RewardDistributor,
    profile_id: ID,
    subject_id: ID,
    previous_exposure: u64,
): RewardOperation {
    begin_operation_for_profile(
        distributor,
        profile_id,
        SCOPE_POOL,
        @0x0,
        subject_id,
        previous_exposure,
    )
}

public fun begin_orderbook_operation(
    distributor: &RewardDistributor,
    subject_id: ID,
    previous_exposure: u64,
): RewardOperation {
    begin_operation(distributor, SCOPE_ORDERBOOK, @0x0, subject_id, previous_exposure)
}

public fun begin_orderbook_operation_for_profile(
    distributor: &RewardDistributor,
    profile_id: ID,
    subject_id: ID,
    previous_exposure: u64,
): RewardOperation {
    begin_operation_for_profile(
        distributor,
        profile_id,
        SCOPE_ORDERBOOK,
        @0x0,
        subject_id,
        previous_exposure,
    )
}

public fun finish_operation(operation: RewardOperation): RewardSettlement {
    let RewardOperation {
        distributor_id,
        scope,
        owner,
        subject_id,
        previous_exposure,
        pending_rewarder_ids,
    } = operation;
    assert!(pending_rewarder_ids.is_empty(), EMissingRewarderSettlement);

    event::emit(RewardOperationFinishedEvent {
        distributor_id,
        scope,
        owner,
        subject_id,
        previous_exposure,
    });

    RewardSettlement {
        distributor_id,
        scope,
        owner,
        subject_id,
        previous_exposure,
    }
}

public fun destroy_settlement(settlement: RewardSettlement) {
    let RewardSettlement {
        distributor_id: _,
        scope: _,
        owner: _,
        subject_id: _,
        previous_exposure: _,
    } = settlement;
}

// === Rewarder Adapter Hooks ===

public(package) fun settle_yt_rewarder(
    distributor: &RewardDistributor,
    operation: &mut RewardOperation,
    rewarder_id: ID,
) {
    settle_rewarder(distributor, operation, SCOPE_YT, rewarder_id);
}

public(package) fun settle_lp_rewarder(
    distributor: &RewardDistributor,
    operation: &mut RewardOperation,
    rewarder_id: ID,
) {
    settle_rewarder(distributor, operation, SCOPE_LP, rewarder_id);
}

public(package) fun settle_pool_rewarder(
    distributor: &RewardDistributor,
    operation: &mut RewardOperation,
    rewarder_id: ID,
) {
    settle_rewarder(distributor, operation, SCOPE_POOL, rewarder_id);
}

public(package) fun settle_orderbook_rewarder(
    distributor: &RewardDistributor,
    operation: &mut RewardOperation,
    rewarder_id: ID,
) {
    settle_rewarder(distributor, operation, SCOPE_ORDERBOOK, rewarder_id);
}

public fun settle_rewarder_with_cap(
    distributor: &RewardDistributor,
    operation: &mut RewardOperation,
    cap: &RewarderSettlementCap,
) {
    assert!(cap.distributor_id == object::id(distributor), EDistributorMismatch);
    settle_rewarder(distributor, operation, cap.scope, cap.rewarder_id);
}

// === Assertions For Adapters ===

public fun assert_subject(operation: &RewardOperation, subject_id: ID) {
    assert!(operation.subject_id == subject_id, EInvalidSubject);
}

public fun assert_owner(operation: &RewardOperation, owner: address) {
    assert!(operation.owner == owner, EInvalidOwner);
}

// === Views ===

public fun id(distributor: &RewardDistributor): ID { object::id(distributor) }
public fun yt_scope(): u8 { SCOPE_YT }
public fun lp_scope(): u8 { SCOPE_LP }
public fun pool_scope(): u8 { SCOPE_POOL }
public fun orderbook_scope(): u8 { SCOPE_ORDERBOOK }
public fun enabled(distributor: &RewardDistributor): bool { distributor.enabled }
public fun operation_owner(operation: &RewardOperation): address { operation.owner }
public fun operation_subject(operation: &RewardOperation): ID { operation.subject_id }
public fun operation_distributor_id(operation: &RewardOperation): ID { operation.distributor_id }
public fun operation_scope(operation: &RewardOperation): u8 { operation.scope }
public fun previous_exposure(operation: &RewardOperation): u64 { operation.previous_exposure }
public fun pending_rewarder_count(operation: &RewardOperation): u64 {
    operation.pending_rewarder_ids.length()
}
public fun settlement_scope(settlement: &RewardSettlement): u8 { settlement.scope }
public fun settlement_subject(settlement: &RewardSettlement): ID { settlement.subject_id }
public fun settlement_distributor_id(settlement: &RewardSettlement): ID { settlement.distributor_id }
public fun settlement_owner(settlement: &RewardSettlement): address { settlement.owner }
public fun settlement_previous_exposure(settlement: &RewardSettlement): u64 {
    settlement.previous_exposure
}

public fun rewarder_registered(
    distributor: &RewardDistributor,
    scope: u8,
    rewarder_id: ID,
): bool {
    rewarder_ids(distributor, scope).contains(&rewarder_id)
}

public fun rewarder_count(distributor: &RewardDistributor, scope: u8): u64 {
    rewarder_ids(distributor, scope).length()
}

public fun profile_exists(distributor: &RewardDistributor, profile_id: ID): bool {
    df::exists<RewardProfileKey>(&distributor.id, RewardProfileKey(profile_id))
}

public fun profile_rewarder_registered(
    distributor: &RewardDistributor,
    profile_id: ID,
    scope: u8,
    rewarder_id: ID,
): bool {
    if (!profile_exists(distributor, profile_id)) {
        return false
    };
    profile_rewarder_ids(distributor, profile_id, scope).contains(&rewarder_id)
}

public fun profile_rewarder_count(
    distributor: &RewardDistributor,
    profile_id: ID,
    scope: u8,
): u64 {
    if (!profile_exists(distributor, profile_id)) {
        return 0
    };
    profile_rewarder_ids(distributor, profile_id, scope).length()
}

public fun yt_rewarder_ids(distributor: &RewardDistributor): VecSet<ID> {
    distributor.yt_rewarder_ids
}

public fun lp_rewarder_ids(distributor: &RewardDistributor): VecSet<ID> {
    distributor.lp_rewarder_ids
}

public fun pool_rewarder_ids(distributor: &RewardDistributor): VecSet<ID> {
    distributor.pool_rewarder_ids
}

public fun orderbook_rewarder_ids(distributor: &RewardDistributor): VecSet<ID> {
    distributor.orderbook_rewarder_ids
}

public fun rewarder_metadata(
    distributor: &RewardDistributor,
    rewarder_id: ID,
): RewarderMetadata {
    let key = RewarderMetadataKey(rewarder_id);
    assert!(df::exists<RewarderMetadataKey>(&distributor.id, key), ERewarderMetadataNotFound);
    *df::borrow<RewarderMetadataKey, RewarderMetadata>(&distributor.id, key)
}

// === Internal ===

fun create_and_share(ctx: &mut TxContext) {
    let distributor = RewardDistributor {
        id: object::new(ctx),
        yt_rewarder_ids: vec_set::empty(),
        lp_rewarder_ids: vec_set::empty(),
        pool_rewarder_ids: vec_set::empty(),
        orderbook_rewarder_ids: vec_set::empty(),
        enabled: true,
    };
    let distributor_id = object::id(&distributor);
    event::emit(RewardDistributorCreatedEvent {
        distributor_id,
        owner: ctx.sender(),
    });
    transfer::share_object(distributor);
}

fun set_enabled(distributor: &mut RewardDistributor, enabled: bool) {
    distributor.enabled = enabled;
    event::emit(RewardDistributorStatusChangedEvent {
        distributor_id: object::id(distributor),
        enabled,
    });
}

fun register_rewarder(
    distributor: &mut RewardDistributor,
    scope: u8,
    rewarder_id: ID,
    kind: vector<u8>,
    label: vector<u8>,
) {
    assert_scope(scope);
    let distributor_id = object::id(distributor);
    let ids = rewarder_ids_mut(distributor, scope);
    assert!(!ids.contains(&rewarder_id), ERewarderAlreadyRegistered);
    assert!(ids.length() < MAX_REWARDERS_PER_SCOPE, ETooManyRewarders);
    ids.insert(rewarder_id);
    set_rewarder_metadata(distributor, scope, rewarder_id, copy kind, copy label);

    event::emit(RewarderRegisteredEvent {
        distributor_id,
        rewarder_id,
        scope,
        kind,
        label,
    });
}

fun register_profile_rewarder(
    distributor: &mut RewardDistributor,
    profile_id: ID,
    scope: u8,
    rewarder_id: ID,
    _kind: vector<u8>,
    _label: vector<u8>,
) {
    assert_scope(scope);
    assert!(
        rewarder_ids(distributor, scope).contains(&rewarder_id),
        ERewarderNotRegistered,
    );
    ensure_reward_profile(distributor, profile_id);
    let distributor_id = object::id(distributor);
    {
        let profile = df::borrow_mut<RewardProfileKey, RewardProfile>(
            &mut distributor.id,
            RewardProfileKey(profile_id),
        );
        let ids = profile_rewarder_ids_mut(profile, scope);
        assert!(!ids.contains(&rewarder_id), ERewarderAlreadyRegistered);
        assert!(ids.length() < MAX_REWARDERS_PER_SCOPE, ETooManyRewarders);
        ids.insert(rewarder_id);
    };
    let RewarderMetadata {
        rewarder_id: _,
        scope: _,
        kind,
        label,
    } = rewarder_metadata(distributor, rewarder_id);

    event::emit(ProfileRewarderRegisteredEvent {
        distributor_id,
        profile_id,
        rewarder_id,
        scope,
        kind,
        label,
    });
}

fun unregister_rewarder(distributor: &mut RewardDistributor, scope: u8, rewarder_id: ID) {
    assert_scope(scope);
    let distributor_id = object::id(distributor);
    let ids = rewarder_ids_mut(distributor, scope);
    assert!(ids.contains(&rewarder_id), ERewarderNotRegistered);
    ids.remove(&rewarder_id);
    remove_rewarder_metadata_if_exists(distributor, rewarder_id);

    event::emit(RewarderUnregisteredEvent {
        distributor_id,
        rewarder_id,
        scope,
    });
}

fun unregister_profile_rewarder(
    distributor: &mut RewardDistributor,
    profile_id: ID,
    scope: u8,
    rewarder_id: ID,
) {
    assert_scope(scope);
    assert!(profile_exists(distributor, profile_id), ERewardProfileNotFound);
    let distributor_id = object::id(distributor);
    let profile = df::borrow_mut<RewardProfileKey, RewardProfile>(
        &mut distributor.id,
        RewardProfileKey(profile_id),
    );
    let ids = profile_rewarder_ids_mut(profile, scope);
    assert!(ids.contains(&rewarder_id), ERewarderNotRegistered);
    ids.remove(&rewarder_id);

    event::emit(ProfileRewarderUnregisteredEvent {
        distributor_id,
        profile_id,
        rewarder_id,
        scope,
    });
}

fun begin_operation(
    distributor: &RewardDistributor,
    scope: u8,
    owner: address,
    subject_id: ID,
    previous_exposure: u64,
): RewardOperation {
    begin_operation_with_rewarders(
        distributor,
        scope,
        owner,
        subject_id,
        previous_exposure,
        rewarder_ids(distributor, scope),
    )
}

fun begin_operation_for_profile(
    distributor: &RewardDistributor,
    profile_id: ID,
    scope: u8,
    owner: address,
    subject_id: ID,
    previous_exposure: u64,
): RewardOperation {
    begin_operation_with_rewarders(
        distributor,
        scope,
        owner,
        subject_id,
        previous_exposure,
        profile_rewarder_ids_or_global(distributor, profile_id, scope),
    )
}

fun begin_operation_with_rewarders(
    distributor: &RewardDistributor,
    scope: u8,
    owner: address,
    subject_id: ID,
    previous_exposure: u64,
    pending_rewarder_ids: VecSet<ID>,
): RewardOperation {
    assert_scope(scope);
    assert!(distributor.enabled, EDistributorDisabled);

    RewardOperation {
        distributor_id: object::id(distributor),
        scope,
        owner,
        subject_id,
        previous_exposure,
        pending_rewarder_ids,
    }
}

fun settle_rewarder(
    distributor: &RewardDistributor,
    operation: &mut RewardOperation,
    expected_scope: u8,
    rewarder_id: ID,
) {
    assert!(operation.distributor_id == object::id(distributor), EDistributorMismatch);
    assert!(operation.scope == expected_scope, EOperationScopeMismatch);
    assert!(
        operation.pending_rewarder_ids.contains(&rewarder_id),
        EMissingRewarderSettlement,
    );
    operation.pending_rewarder_ids.remove(&rewarder_id);

    event::emit(RewarderSettledEvent {
        distributor_id: object::id(distributor),
        rewarder_id,
        scope: expected_scope,
        owner: operation.owner,
        subject_id: operation.subject_id,
        previous_exposure: operation.previous_exposure,
    });
}

fun ensure_reward_profile(distributor: &mut RewardDistributor, profile_id: ID) {
    if (profile_exists(distributor, profile_id)) {
        return
    };

    df::add(
        &mut distributor.id,
        RewardProfileKey(profile_id),
        RewardProfile {
            profile_id,
            yt_rewarder_ids: vec_set::empty(),
            lp_rewarder_ids: vec_set::empty(),
            pool_rewarder_ids: vec_set::empty(),
            orderbook_rewarder_ids: vec_set::empty(),
        },
    );

    event::emit(RewardProfileCreatedEvent {
        distributor_id: object::id(distributor),
        profile_id,
    });
}

fun profile_rewarder_ids_or_global(
    distributor: &RewardDistributor,
    profile_id: ID,
    scope: u8,
): VecSet<ID> {
    if (profile_exists(distributor, profile_id)) {
        let ids = profile_rewarder_ids(distributor, profile_id, scope);
        if (!ids.is_empty()) {
            ids
        } else {
            rewarder_ids(distributor, scope)
        }
    } else {
        rewarder_ids(distributor, scope)
    }
}

fun profile_rewarder_ids(
    distributor: &RewardDistributor,
    profile_id: ID,
    scope: u8,
): VecSet<ID> {
    assert_scope(scope);
    assert!(profile_exists(distributor, profile_id), ERewardProfileNotFound);
    let profile = df::borrow<RewardProfileKey, RewardProfile>(
        &distributor.id,
        RewardProfileKey(profile_id),
    );
    if (scope == SCOPE_YT) {
        profile.yt_rewarder_ids
    } else if (scope == SCOPE_LP) {
        profile.lp_rewarder_ids
    } else if (scope == SCOPE_POOL) {
        profile.pool_rewarder_ids
    } else {
        profile.orderbook_rewarder_ids
    }
}

fun profile_rewarder_ids_mut(profile: &mut RewardProfile, scope: u8): &mut VecSet<ID> {
    assert_scope(scope);
    if (scope == SCOPE_YT) {
        &mut profile.yt_rewarder_ids
    } else if (scope == SCOPE_LP) {
        &mut profile.lp_rewarder_ids
    } else if (scope == SCOPE_POOL) {
        &mut profile.pool_rewarder_ids
    } else {
        &mut profile.orderbook_rewarder_ids
    }
}

fun rewarder_ids(distributor: &RewardDistributor, scope: u8): VecSet<ID> {
    assert_scope(scope);
    if (scope == SCOPE_YT) {
        distributor.yt_rewarder_ids
    } else if (scope == SCOPE_LP) {
        distributor.lp_rewarder_ids
    } else if (scope == SCOPE_POOL) {
        distributor.pool_rewarder_ids
    } else {
        distributor.orderbook_rewarder_ids
    }
}

fun rewarder_ids_mut(distributor: &mut RewardDistributor, scope: u8): &mut VecSet<ID> {
    assert_scope(scope);
    if (scope == SCOPE_YT) {
        &mut distributor.yt_rewarder_ids
    } else if (scope == SCOPE_LP) {
        &mut distributor.lp_rewarder_ids
    } else if (scope == SCOPE_POOL) {
        &mut distributor.pool_rewarder_ids
    } else {
        &mut distributor.orderbook_rewarder_ids
    }
}

fun assert_scope(scope: u8) {
    assert!(
        scope == SCOPE_YT || scope == SCOPE_LP
            || scope == SCOPE_POOL || scope == SCOPE_ORDERBOOK,
        EInvalidScope,
    );
}

fun set_rewarder_metadata(
    distributor: &mut RewardDistributor,
    scope: u8,
    rewarder_id: ID,
    kind: vector<u8>,
    label: vector<u8>,
) {
    let key = RewarderMetadataKey(rewarder_id);
    let metadata = RewarderMetadata { rewarder_id, scope, kind, label };
    if (df::exists<RewarderMetadataKey>(&distributor.id, key)) {
        let current = df::borrow_mut<RewarderMetadataKey, RewarderMetadata>(
            &mut distributor.id,
            key,
        );
        *current = metadata;
    } else {
        df::add(&mut distributor.id, key, metadata);
    };
}

fun remove_rewarder_metadata_if_exists(distributor: &mut RewardDistributor, rewarder_id: ID) {
    let key = RewarderMetadataKey(rewarder_id);
    if (df::exists<RewarderMetadataKey>(&distributor.id, key)) {
        let _metadata = df::remove<RewarderMetadataKey, RewarderMetadata>(
            &mut distributor.id,
            key,
        );
    };
}

public(package) fun consume_pool_settlement(
    settlement: RewardSettlement,
    expected_distributor_id: ID,
    expected_subject_id: ID,
): ID {
    let RewardSettlement {
        distributor_id,
        scope,
        owner: _,
        subject_id,
        previous_exposure: _,
    } = settlement;
    assert!(distributor_id == expected_distributor_id, EDistributorMismatch);
    assert!(scope == SCOPE_POOL, EOperationScopeMismatch);
    assert!(subject_id == expected_subject_id, EInvalidSubject);
    distributor_id
}

public(package) fun consume_yt_settlement(
    settlement: RewardSettlement,
    expected_distributor_id: ID,
    expected_subject_id: ID,
    expected_owner: address,
): ID {
    consume_position_settlement(
        settlement,
        expected_distributor_id,
        SCOPE_YT,
        expected_subject_id,
        expected_owner,
    )
}

public(package) fun consume_lp_settlement(
    settlement: RewardSettlement,
    expected_distributor_id: ID,
    expected_subject_id: ID,
    expected_owner: address,
): ID {
    consume_position_settlement(
        settlement,
        expected_distributor_id,
        SCOPE_LP,
        expected_subject_id,
        expected_owner,
    )
}

public(package) fun consume_orderbook_settlement(
    settlement: RewardSettlement,
    expected_distributor_id: ID,
    expected_subject_id: ID,
): ID {
    let RewardSettlement {
        distributor_id,
        scope,
        owner: _,
        subject_id,
        previous_exposure: _,
    } = settlement;
    assert!(distributor_id == expected_distributor_id, EDistributorMismatch);
    assert!(scope == SCOPE_ORDERBOOK, EOperationScopeMismatch);
    assert!(subject_id == expected_subject_id, EInvalidSubject);
    distributor_id
}

fun consume_position_settlement(
    settlement: RewardSettlement,
    expected_distributor_id: ID,
    expected_scope: u8,
    expected_subject_id: ID,
    expected_owner: address,
): ID {
    let RewardSettlement {
        distributor_id,
        scope,
        owner,
        subject_id,
        previous_exposure: _,
    } = settlement;
    assert!(distributor_id == expected_distributor_id, EDistributorMismatch);
    assert!(scope == expected_scope, EOperationScopeMismatch);
    assert!(subject_id == expected_subject_id, EInvalidSubject);
    assert!(owner == expected_owner, EInvalidOwner);
    distributor_id
}

// === Test Helpers ===

#[test_only]
public fun create_for_testing(ctx: &mut TxContext): RewardDistributor {
    RewardDistributor {
        id: object::new(ctx),
        yt_rewarder_ids: vec_set::empty(),
        lp_rewarder_ids: vec_set::empty(),
        pool_rewarder_ids: vec_set::empty(),
        orderbook_rewarder_ids: vec_set::empty(),
        enabled: true,
    }
}

#[test_only]
public fun destroy_for_testing(distributor: RewardDistributor) {
    let RewardDistributor {
        id,
        yt_rewarder_ids: _,
        lp_rewarder_ids: _,
        pool_rewarder_ids: _,
        orderbook_rewarder_ids: _,
        enabled: _,
    } = distributor;
    object::delete(id);
}

#[test_only]
public fun destroy_profile_for_testing(distributor: &mut RewardDistributor, profile_id: ID) {
    assert!(profile_exists(distributor, profile_id), ERewardProfileNotFound);
    let RewardProfile {
        profile_id: _,
        yt_rewarder_ids: _,
        lp_rewarder_ids: _,
        pool_rewarder_ids: _,
        orderbook_rewarder_ids: _,
    } = df::remove<RewardProfileKey, RewardProfile>(
        &mut distributor.id,
        RewardProfileKey(profile_id),
    );
}

#[test]
fun operation_requires_every_rewarder_in_scope() {
    let ctx = &mut tx_context::dummy();
    let mut distributor = create_for_testing(ctx);
    let rewarder_a = object::id_from_address(@0xa);
    let rewarder_b = object::id_from_address(@0xb);
    register_rewarder(&mut distributor, SCOPE_YT, rewarder_a, b"point", b"a");
    register_rewarder(&mut distributor, SCOPE_YT, rewarder_b, b"point", b"b");

    let mut operation = begin_yt_operation(
        &distributor,
        @0x123,
        object::id_from_address(@0x456),
        100,
    );
    assert!(pending_rewarder_count(&operation) == 2, 0);
    settle_yt_rewarder(&distributor, &mut operation, rewarder_a);
    assert!(pending_rewarder_count(&operation) == 1, 1);
    settle_yt_rewarder(&distributor, &mut operation, rewarder_b);
    let settlement = finish_operation(operation);
    destroy_settlement(settlement);
    destroy_for_testing(distributor);
}

#[test, expected_failure(abort_code = EMissingRewarderSettlement)]
fun operation_fails_if_one_rewarder_missing() {
    let ctx = &mut tx_context::dummy();
    let mut distributor = create_for_testing(ctx);
    register_rewarder(&mut distributor, SCOPE_YT, object::id_from_address(@0xa), b"", b"");
    register_rewarder(&mut distributor, SCOPE_YT, object::id_from_address(@0xb), b"", b"");

    let mut operation = begin_yt_operation(
        &distributor,
        @0x123,
        object::id_from_address(@0x456),
        100,
    );
    settle_yt_rewarder(&distributor, &mut operation, object::id_from_address(@0xa));
    let settlement = finish_operation(operation);
    destroy_settlement(settlement);
    destroy_for_testing(distributor);
}

#[test]
fun scope_lists_are_independent() {
    let ctx = &mut tx_context::dummy();
    let mut distributor = create_for_testing(ctx);
    register_rewarder(&mut distributor, SCOPE_LP, object::id_from_address(@0xa), b"", b"");

    let operation = begin_yt_operation(
        &distributor,
        @0x123,
        object::id_from_address(@0x456),
        100,
    );
    assert!(pending_rewarder_count(&operation) == 0, 0);
    let settlement = finish_operation(operation);
    destroy_settlement(settlement);
    destroy_for_testing(distributor);
}

#[test]
fun profile_rewarders_are_independent_from_global_scope() {
    let ctx = &mut tx_context::dummy();
    let admin_cap = jitter_admin::admin::create_for_testing(ctx);
    let mut distributor = create_for_testing(ctx);
    let profile_a = object::id_from_address(@0xa11ce);
    let profile_b = object::id_from_address(@0xb0b);
    let rewarder_a = object::id_from_address(@0xa);
    let rewarder_b = object::id_from_address(@0xb);
    register_rewarder(&mut distributor, SCOPE_YT, rewarder_a, b"point", b"a");
    register_rewarder(&mut distributor, SCOPE_YT, rewarder_b, b"point", b"b");

    register_profile_rewarder_by_admin(
        &mut distributor,
        &admin_cap,
        profile_a,
        SCOPE_YT,
        rewarder_a,
    );
    register_profile_rewarder_by_admin(
        &mut distributor,
        &admin_cap,
        profile_b,
        SCOPE_YT,
        rewarder_b,
    );

    assert!(profile_rewarder_count(&distributor, profile_a, SCOPE_YT) == 1, 20);
    assert!(profile_rewarder_count(&distributor, profile_b, SCOPE_YT) == 1, 21);
    assert!(rewarder_count(&distributor, SCOPE_YT) == 2, 22);

    let mut operation_a = begin_yt_operation_for_profile(
        &distributor,
        profile_a,
        @0x123,
        object::id_from_address(@0x456),
        100,
    );
    assert!(pending_rewarder_count(&operation_a) == 1, 23);
    settle_yt_rewarder(&distributor, &mut operation_a, rewarder_a);
    let settlement_a = finish_operation(operation_a);
    destroy_settlement(settlement_a);

    let mut operation_b = begin_yt_operation_for_profile(
        &distributor,
        profile_b,
        @0x123,
        object::id_from_address(@0x789),
        200,
    );
    assert!(pending_rewarder_count(&operation_b) == 1, 24);
    settle_yt_rewarder(&distributor, &mut operation_b, rewarder_b);
    let settlement_b = finish_operation(operation_b);
    destroy_settlement(settlement_b);

    destroy_profile_for_testing(&mut distributor, profile_a);
    destroy_profile_for_testing(&mut distributor, profile_b);
    transfer::public_transfer(admin_cap, @0x0);
    destroy_for_testing(distributor);
}

#[test, expected_failure(abort_code = ERewarderNotRegistered)]
fun profile_rewarder_must_be_registered_globally() {
    let ctx = &mut tx_context::dummy();
    let admin_cap = jitter_admin::admin::create_for_testing(ctx);
    let mut distributor = create_for_testing(ctx);
    register_profile_rewarder_by_admin(
        &mut distributor,
        &admin_cap,
        object::id_from_address(@0xa11ce),
        SCOPE_YT,
        object::id_from_address(@0xa),
    );
    transfer::public_transfer(admin_cap, @0x0);
    destroy_for_testing(distributor);
}

#[test]
fun empty_profile_scope_falls_back_to_global_scope() {
    let ctx = &mut tx_context::dummy();
    let admin_cap = jitter_admin::admin::create_for_testing(ctx);
    let mut distributor = create_for_testing(ctx);
    let profile_id = object::id_from_address(@0xa11ce);
    let rewarder = object::id_from_address(@0xa);
    register_rewarder(&mut distributor, SCOPE_POOL, rewarder, b"coin", b"pool");
    register_profile_rewarder_by_admin(
        &mut distributor,
        &admin_cap,
        profile_id,
        SCOPE_POOL,
        rewarder,
    );
    unregister_profile_rewarder_by_admin(
        &mut distributor,
        &admin_cap,
        profile_id,
        SCOPE_POOL,
        rewarder,
    );

    let mut operation = begin_pool_operation_for_profile(
        &distributor,
        profile_id,
        object::id_from_address(@0x456),
        100,
    );
    assert!(pending_rewarder_count(&operation) == 1, 30);
    settle_pool_rewarder(&distributor, &mut operation, rewarder);
    let settlement = finish_operation(operation);
    destroy_settlement(settlement);

    destroy_profile_for_testing(&mut distributor, profile_id);
    transfer::public_transfer(admin_cap, @0x0);
    destroy_for_testing(distributor);
}

#[test]
fun profile_operation_falls_back_to_global_scope_when_profile_missing() {
    let ctx = &mut tx_context::dummy();
    let mut distributor = create_for_testing(ctx);
    let rewarder = object::id_from_address(@0xa);
    register_rewarder(&mut distributor, SCOPE_POOL, rewarder, b"", b"");

    let mut operation = begin_pool_operation_for_profile(
        &distributor,
        object::id_from_address(@0xfeed),
        object::id_from_address(@0x456),
        100,
    );
    assert!(pending_rewarder_count(&operation) == 1, 30);
    settle_pool_rewarder(&distributor, &mut operation, rewarder);
    let settlement = finish_operation(operation);
    destroy_settlement(settlement);
    destroy_for_testing(distributor);
}

#[test]
fun rewarder_metadata_is_queryable_and_removed_on_unregister() {
    let ctx = &mut tx_context::dummy();
    let admin_cap = jitter_admin::admin::create_for_testing(ctx);
    let mut distributor = create_for_testing(ctx);
    let rewarder_id = object::id_from_address(@0xcafe);

    register_rewarder_with_metadata_by_admin(
        &mut distributor,
        &admin_cap,
        SCOPE_ORDERBOOK,
        rewarder_id,
        b"coin",
        b"orderbook rebates",
    );
    assert!(rewarder_count(&distributor, SCOPE_ORDERBOOK) == 1, 10);
    assert!(rewarder_registered(&distributor, SCOPE_ORDERBOOK, rewarder_id), 11);

    let metadata = rewarder_metadata(&distributor, rewarder_id);
    assert!(metadata.rewarder_id == rewarder_id, 12);
    assert!(metadata.scope == SCOPE_ORDERBOOK, 13);
    assert!(metadata.kind == b"coin", 14);
    assert!(metadata.label == b"orderbook rebates", 15);

    unregister_rewarder_by_admin(
        &mut distributor,
        &admin_cap,
        SCOPE_ORDERBOOK,
        rewarder_id,
    );
    assert!(rewarder_count(&distributor, SCOPE_ORDERBOOK) == 0, 16);
    assert!(!rewarder_registered(&distributor, SCOPE_ORDERBOOK, rewarder_id), 17);

    transfer::public_transfer(admin_cap, @0x0);
    destroy_for_testing(distributor);
}
