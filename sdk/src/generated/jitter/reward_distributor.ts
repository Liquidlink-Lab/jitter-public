/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * reward_distributor - no-stake reward coordination layer.
 * 
 * This module does not custody user principal. It only coordinates rewarder
 * settlement around position or pool mutations. Rewarder implementations live in
 * separate modules and must mark their own rewarder ID as settled before the
 * hot-potato operation can be destroyed.
 */

import { MoveStruct, MoveTuple, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as vec_set from './deps/sui/vec_set.js';
import * as vec_set_1 from './deps/sui/vec_set.js';
const $moduleName = 'jitter/jitter::reward_distributor';
export const RewardDistributor = new MoveStruct({ name: `${$moduleName}::RewardDistributor`, fields: {
        id: bcs.Address,
        config_version: bcs.u64(),
        enabled: bcs.bool()
    } });
export const RewardOperation = new MoveStruct({ name: `${$moduleName}::RewardOperation`, fields: {
        distributor_id: bcs.Address,
        profile_id: bcs.option(bcs.Address),
        scope: bcs.u8(),
        owner: bcs.Address,
        subject_id: bcs.Address,
        previous_exposure: bcs.u64(),
        guard: bcs.u64(),
        config_version: bcs.u64(),
        pending_rewarder_ids: vec_set.VecSet(bcs.Address)
    } });
export const RewardSettlement = new MoveStruct({ name: `${$moduleName}::RewardSettlement`, fields: {
        distributor_id: bcs.Address,
        profile_id: bcs.option(bcs.Address),
        scope: bcs.u8(),
        owner: bcs.Address,
        subject_id: bcs.Address,
        previous_exposure: bcs.u64(),
        guard: bcs.u64(),
        config_version: bcs.u64()
    } });
export const RewarderMetadataKey = new MoveTuple({ name: `${$moduleName}::RewarderMetadataKey`, fields: [bcs.Address] });
export const ScopeRewarderSetKey = new MoveTuple({ name: `${$moduleName}::ScopeRewarderSetKey`, fields: [bcs.u8()] });
export const ProfileScopeRewarderSetKey = new MoveTuple({ name: `${$moduleName}::ProfileScopeRewarderSetKey`, fields: [bcs.Address, bcs.u8()] });
export const RewarderSet = new MoveStruct({ name: `${$moduleName}::RewarderSet`, fields: {
        ids: vec_set_1.VecSet(bcs.Address)
    } });
export const RewarderMetadata = new MoveStruct({ name: `${$moduleName}::RewarderMetadata`, fields: {
        rewarder_id: bcs.Address,
        scope: bcs.u8(),
        kind: bcs.vector(bcs.u8()),
        label: bcs.vector(bcs.u8())
    } });
export const RewarderSettlementCap = new MoveStruct({ name: `${$moduleName}::RewarderSettlementCap`, fields: {
        distributor_id: bcs.Address,
        scope: bcs.u8(),
        rewarder_id: bcs.Address
    } });
export const RewardProfileKey = new MoveTuple({ name: `${$moduleName}::RewardProfileKey`, fields: [bcs.Address] });
export const RewardProfile = new MoveStruct({ name: `${$moduleName}::RewardProfile`, fields: {
        profile_id: bcs.Address
    } });
export const RewardDistributorCreatedEvent = new MoveStruct({ name: `${$moduleName}::RewardDistributorCreatedEvent`, fields: {
        distributor_id: bcs.Address,
        owner: bcs.Address
    } });
export const RewardDistributorStatusChangedEvent = new MoveStruct({ name: `${$moduleName}::RewardDistributorStatusChangedEvent`, fields: {
        distributor_id: bcs.Address,
        enabled: bcs.bool()
    } });
export const RewarderRegisteredEvent = new MoveStruct({ name: `${$moduleName}::RewarderRegisteredEvent`, fields: {
        distributor_id: bcs.Address,
        rewarder_id: bcs.Address,
        scope: bcs.u8(),
        kind: bcs.vector(bcs.u8()),
        label: bcs.vector(bcs.u8())
    } });
export const RewarderUnregisteredEvent = new MoveStruct({ name: `${$moduleName}::RewarderUnregisteredEvent`, fields: {
        distributor_id: bcs.Address,
        rewarder_id: bcs.Address,
        scope: bcs.u8()
    } });
export const RewardProfileCreatedEvent = new MoveStruct({ name: `${$moduleName}::RewardProfileCreatedEvent`, fields: {
        distributor_id: bcs.Address,
        profile_id: bcs.Address
    } });
export const ProfileRewarderRegisteredEvent = new MoveStruct({ name: `${$moduleName}::ProfileRewarderRegisteredEvent`, fields: {
        distributor_id: bcs.Address,
        profile_id: bcs.Address,
        rewarder_id: bcs.Address,
        scope: bcs.u8(),
        kind: bcs.vector(bcs.u8()),
        label: bcs.vector(bcs.u8())
    } });
export const ProfileRewarderUnregisteredEvent = new MoveStruct({ name: `${$moduleName}::ProfileRewarderUnregisteredEvent`, fields: {
        distributor_id: bcs.Address,
        profile_id: bcs.Address,
        rewarder_id: bcs.Address,
        scope: bcs.u8()
    } });
export const RewarderSettledEvent = new MoveStruct({ name: `${$moduleName}::RewarderSettledEvent`, fields: {
        distributor_id: bcs.Address,
        rewarder_id: bcs.Address,
        scope: bcs.u8(),
        owner: bcs.Address,
        subject_id: bcs.Address,
        previous_exposure: bcs.u64()
    } });
export const RewardOperationFinishedEvent = new MoveStruct({ name: `${$moduleName}::RewardOperationFinishedEvent`, fields: {
        distributor_id: bcs.Address,
        scope: bcs.u8(),
        owner: bcs.Address,
        subject_id: bcs.Address,
        previous_exposure: bcs.u64()
    } });
export interface CreateAndShareByAdminArguments {
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
}
export interface CreateAndShareByAdminOptions {
    package?: string;
    arguments: CreateAndShareByAdminArguments | [
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>
    ];
}
export function createAndShareByAdmin(options: CreateAndShareByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "AdminCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'create_and_share_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SetEnabledByAdminArguments {
    distributor: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
    enabled: RawTransactionArgument<boolean>;
}
export interface SetEnabledByAdminOptions {
    package?: string;
    arguments: SetEnabledByAdminArguments | [
        distributor: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>,
        enabled: RawTransactionArgument<boolean>
    ];
}
export function setEnabledByAdmin(options: SetEnabledByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        'bool'
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "globalConfig", "AdminCap", "enabled"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'set_enabled_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RegisterRewarderByAdminArguments {
    distributor: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
    scope: RawTransactionArgument<number>;
    rewarderId: RawTransactionArgument<string>;
}
export interface RegisterRewarderByAdminOptions {
    package?: string;
    arguments: RegisterRewarderByAdminArguments | [
        distributor: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>,
        scope: RawTransactionArgument<number>,
        rewarderId: RawTransactionArgument<string>
    ];
}
export function registerRewarderByAdmin(options: RegisterRewarderByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        'u8',
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "globalConfig", "AdminCap", "scope", "rewarderId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'register_rewarder_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RegisterRewarderWithMetadataByAdminArguments {
    distributor: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
    scope: RawTransactionArgument<number>;
    rewarderId: RawTransactionArgument<string>;
    kind: RawTransactionArgument<Array<number>>;
    label: RawTransactionArgument<Array<number>>;
}
export interface RegisterRewarderWithMetadataByAdminOptions {
    package?: string;
    arguments: RegisterRewarderWithMetadataByAdminArguments | [
        distributor: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>,
        scope: RawTransactionArgument<number>,
        rewarderId: RawTransactionArgument<string>,
        kind: RawTransactionArgument<Array<number>>,
        label: RawTransactionArgument<Array<number>>
    ];
}
export function registerRewarderWithMetadataByAdmin(options: RegisterRewarderWithMetadataByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        'u8',
        '0x2::object::ID',
        'vector<u8>',
        'vector<u8>'
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "globalConfig", "AdminCap", "scope", "rewarderId", "kind", "label"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'register_rewarder_with_metadata_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RegisterRewarderWithSettlementCapByAdminArguments {
    distributor: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
    scope: RawTransactionArgument<number>;
    rewarderId: RawTransactionArgument<string>;
    kind: RawTransactionArgument<Array<number>>;
    label: RawTransactionArgument<Array<number>>;
}
export interface RegisterRewarderWithSettlementCapByAdminOptions {
    package?: string;
    arguments: RegisterRewarderWithSettlementCapByAdminArguments | [
        distributor: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>,
        scope: RawTransactionArgument<number>,
        rewarderId: RawTransactionArgument<string>,
        kind: RawTransactionArgument<Array<number>>,
        label: RawTransactionArgument<Array<number>>
    ];
}
export function registerRewarderWithSettlementCapByAdmin(options: RegisterRewarderWithSettlementCapByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        'u8',
        '0x2::object::ID',
        'vector<u8>',
        'vector<u8>'
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "globalConfig", "AdminCap", "scope", "rewarderId", "kind", "label"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'register_rewarder_with_settlement_cap_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UnregisterRewarderByAdminArguments {
    distributor: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
    scope: RawTransactionArgument<number>;
    rewarderId: RawTransactionArgument<string>;
}
export interface UnregisterRewarderByAdminOptions {
    package?: string;
    arguments: UnregisterRewarderByAdminArguments | [
        distributor: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>,
        scope: RawTransactionArgument<number>,
        rewarderId: RawTransactionArgument<string>
    ];
}
export function unregisterRewarderByAdmin(options: UnregisterRewarderByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        'u8',
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "globalConfig", "AdminCap", "scope", "rewarderId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'unregister_rewarder_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RegisterProfileRewarderByAdminArguments {
    distributor: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
    profileId: RawTransactionArgument<string>;
    scope: RawTransactionArgument<number>;
    rewarderId: RawTransactionArgument<string>;
}
export interface RegisterProfileRewarderByAdminOptions {
    package?: string;
    arguments: RegisterProfileRewarderByAdminArguments | [
        distributor: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>,
        profileId: RawTransactionArgument<string>,
        scope: RawTransactionArgument<number>,
        rewarderId: RawTransactionArgument<string>
    ];
}
export function registerProfileRewarderByAdmin(options: RegisterProfileRewarderByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        '0x2::object::ID',
        'u8',
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "globalConfig", "AdminCap", "profileId", "scope", "rewarderId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'register_profile_rewarder_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RegisterProfileRewarderWithMetadataByAdminArguments {
    distributor: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
    profileId: RawTransactionArgument<string>;
    scope: RawTransactionArgument<number>;
    rewarderId: RawTransactionArgument<string>;
    kind: RawTransactionArgument<Array<number>>;
    label: RawTransactionArgument<Array<number>>;
}
export interface RegisterProfileRewarderWithMetadataByAdminOptions {
    package?: string;
    arguments: RegisterProfileRewarderWithMetadataByAdminArguments | [
        distributor: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>,
        profileId: RawTransactionArgument<string>,
        scope: RawTransactionArgument<number>,
        rewarderId: RawTransactionArgument<string>,
        kind: RawTransactionArgument<Array<number>>,
        label: RawTransactionArgument<Array<number>>
    ];
}
export function registerProfileRewarderWithMetadataByAdmin(options: RegisterProfileRewarderWithMetadataByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        '0x2::object::ID',
        'u8',
        '0x2::object::ID',
        'vector<u8>',
        'vector<u8>'
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "globalConfig", "AdminCap", "profileId", "scope", "rewarderId", "kind", "label"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'register_profile_rewarder_with_metadata_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UnregisterProfileRewarderByAdminArguments {
    distributor: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
    profileId: RawTransactionArgument<string>;
    scope: RawTransactionArgument<number>;
    rewarderId: RawTransactionArgument<string>;
}
export interface UnregisterProfileRewarderByAdminOptions {
    package?: string;
    arguments: UnregisterProfileRewarderByAdminArguments | [
        distributor: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>,
        profileId: RawTransactionArgument<string>,
        scope: RawTransactionArgument<number>,
        rewarderId: RawTransactionArgument<string>
    ];
}
export function unregisterProfileRewarderByAdmin(options: UnregisterProfileRewarderByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        '0x2::object::ID',
        'u8',
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "globalConfig", "AdminCap", "profileId", "scope", "rewarderId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'unregister_profile_rewarder_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface BeginScopedOperationArguments {
    distributor: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    scope: RawTransactionArgument<number>;
    owner: RawTransactionArgument<string>;
    subjectId: RawTransactionArgument<string>;
    previousExposure: RawTransactionArgument<number | bigint>;
}
export interface BeginScopedOperationOptions {
    package?: string;
    arguments: BeginScopedOperationArguments | [
        distributor: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        scope: RawTransactionArgument<number>,
        owner: RawTransactionArgument<string>,
        subjectId: RawTransactionArgument<string>,
        previousExposure: RawTransactionArgument<number | bigint>
    ];
}
export function beginScopedOperation(options: BeginScopedOperationOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        'u8',
        'address',
        '0x2::object::ID',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "globalConfig", "scope", "owner", "subjectId", "previousExposure"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'begin_scoped_operation',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface BeginScopedOperationWithGuardArguments {
    distributor: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    scope: RawTransactionArgument<number>;
    owner: RawTransactionArgument<string>;
    subjectId: RawTransactionArgument<string>;
    previousExposure: RawTransactionArgument<number | bigint>;
    guard: RawTransactionArgument<number | bigint>;
}
export interface BeginScopedOperationWithGuardOptions {
    package?: string;
    arguments: BeginScopedOperationWithGuardArguments | [
        distributor: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        scope: RawTransactionArgument<number>,
        owner: RawTransactionArgument<string>,
        subjectId: RawTransactionArgument<string>,
        previousExposure: RawTransactionArgument<number | bigint>,
        guard: RawTransactionArgument<number | bigint>
    ];
}
export function beginScopedOperationWithGuard(options: BeginScopedOperationWithGuardOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        'u8',
        'address',
        '0x2::object::ID',
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "globalConfig", "scope", "owner", "subjectId", "previousExposure", "guard"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'begin_scoped_operation_with_guard',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface BeginScopedOperationForProfileArguments {
    distributor: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    profileId: RawTransactionArgument<string>;
    scope: RawTransactionArgument<number>;
    owner: RawTransactionArgument<string>;
    subjectId: RawTransactionArgument<string>;
    previousExposure: RawTransactionArgument<number | bigint>;
}
export interface BeginScopedOperationForProfileOptions {
    package?: string;
    arguments: BeginScopedOperationForProfileArguments | [
        distributor: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        profileId: RawTransactionArgument<string>,
        scope: RawTransactionArgument<number>,
        owner: RawTransactionArgument<string>,
        subjectId: RawTransactionArgument<string>,
        previousExposure: RawTransactionArgument<number | bigint>
    ];
}
export function beginScopedOperationForProfile(options: BeginScopedOperationForProfileOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        '0x2::object::ID',
        'u8',
        'address',
        '0x2::object::ID',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "globalConfig", "profileId", "scope", "owner", "subjectId", "previousExposure"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'begin_scoped_operation_for_profile',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface BeginScopedOperationForProfileWithGuardArguments {
    distributor: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    profileId: RawTransactionArgument<string>;
    scope: RawTransactionArgument<number>;
    owner: RawTransactionArgument<string>;
    subjectId: RawTransactionArgument<string>;
    previousExposure: RawTransactionArgument<number | bigint>;
    guard: RawTransactionArgument<number | bigint>;
}
export interface BeginScopedOperationForProfileWithGuardOptions {
    package?: string;
    arguments: BeginScopedOperationForProfileWithGuardArguments | [
        distributor: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        profileId: RawTransactionArgument<string>,
        scope: RawTransactionArgument<number>,
        owner: RawTransactionArgument<string>,
        subjectId: RawTransactionArgument<string>,
        previousExposure: RawTransactionArgument<number | bigint>,
        guard: RawTransactionArgument<number | bigint>
    ];
}
export function beginScopedOperationForProfileWithGuard(options: BeginScopedOperationForProfileWithGuardOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        '0x2::object::ID',
        'u8',
        'address',
        '0x2::object::ID',
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "globalConfig", "profileId", "scope", "owner", "subjectId", "previousExposure", "guard"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'begin_scoped_operation_for_profile_with_guard',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface FinishOperationArguments {
    globalConfig: RawTransactionArgument<string>;
    operation: RawTransactionArgument<string>;
}
export interface FinishOperationOptions {
    package?: string;
    arguments: FinishOperationArguments | [
        globalConfig: RawTransactionArgument<string>,
        operation: RawTransactionArgument<string>
    ];
}
export function finishOperation(options: FinishOperationOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "operation"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'finish_operation',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface DestroySettlementArguments {
    globalConfig: RawTransactionArgument<string>;
    settlement: RawTransactionArgument<string>;
}
export interface DestroySettlementOptions {
    package?: string;
    arguments: DestroySettlementArguments | [
        globalConfig: RawTransactionArgument<string>,
        settlement: RawTransactionArgument<string>
    ];
}
export function destroySettlement(options: DestroySettlementOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "settlement"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'destroy_settlement',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SettleRewarderWithCapArguments {
    distributor: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    operation: RawTransactionArgument<string>;
    cap: RawTransactionArgument<string>;
}
export interface SettleRewarderWithCapOptions {
    package?: string;
    arguments: SettleRewarderWithCapArguments | [
        distributor: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        operation: RawTransactionArgument<string>,
        cap: RawTransactionArgument<string>
    ];
}
export function settleRewarderWithCap(options: SettleRewarderWithCapOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "globalConfig", "operation", "cap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'settle_rewarder_with_cap',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertSubjectArguments {
    operation: RawTransactionArgument<string>;
    subjectId: RawTransactionArgument<string>;
}
export interface AssertSubjectOptions {
    package?: string;
    arguments: AssertSubjectArguments | [
        operation: RawTransactionArgument<string>,
        subjectId: RawTransactionArgument<string>
    ];
}
export function assertSubject(options: AssertSubjectOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["operation", "subjectId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'assert_subject',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertOwnerArguments {
    operation: RawTransactionArgument<string>;
    owner: RawTransactionArgument<string>;
}
export interface AssertOwnerOptions {
    package?: string;
    arguments: AssertOwnerArguments | [
        operation: RawTransactionArgument<string>,
        owner: RawTransactionArgument<string>
    ];
}
export function assertOwner(options: AssertOwnerOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["operation", "owner"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'assert_owner',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertOperationProfileMatchesArguments {
    operation: RawTransactionArgument<string>;
    expectedProfileId: RawTransactionArgument<string>;
}
export interface AssertOperationProfileMatchesOptions {
    package?: string;
    arguments: AssertOperationProfileMatchesArguments | [
        operation: RawTransactionArgument<string>,
        expectedProfileId: RawTransactionArgument<string>
    ];
}
export function assertOperationProfileMatches(options: AssertOperationProfileMatchesOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["operation", "expectedProfileId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'assert_operation_profile_matches',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertSettlementPreviousExposureArguments {
    settlement: RawTransactionArgument<string>;
    expectedPreviousExposure: RawTransactionArgument<number | bigint>;
}
export interface AssertSettlementPreviousExposureOptions {
    package?: string;
    arguments: AssertSettlementPreviousExposureArguments | [
        settlement: RawTransactionArgument<string>,
        expectedPreviousExposure: RawTransactionArgument<number | bigint>
    ];
}
export function assertSettlementPreviousExposure(options: AssertSettlementPreviousExposureOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["settlement", "expectedPreviousExposure"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'assert_settlement_previous_exposure',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertSettlementGuardArguments {
    settlement: RawTransactionArgument<string>;
    expectedGuard: RawTransactionArgument<number | bigint>;
}
export interface AssertSettlementGuardOptions {
    package?: string;
    arguments: AssertSettlementGuardArguments | [
        settlement: RawTransactionArgument<string>,
        expectedGuard: RawTransactionArgument<number | bigint>
    ];
}
export function assertSettlementGuard(options: AssertSettlementGuardOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["settlement", "expectedGuard"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'assert_settlement_guard',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertSettlementScopeArguments {
    settlement: RawTransactionArgument<string>;
    expectedScope: RawTransactionArgument<number>;
}
export interface AssertSettlementScopeOptions {
    package?: string;
    arguments: AssertSettlementScopeArguments | [
        settlement: RawTransactionArgument<string>,
        expectedScope: RawTransactionArgument<number>
    ];
}
export function assertSettlementScope(options: AssertSettlementScopeOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u8'
    ] satisfies (string | null)[];
    const parameterNames = ["settlement", "expectedScope"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'assert_settlement_scope',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertSettlementSubjectArguments {
    settlement: RawTransactionArgument<string>;
    expectedSubjectId: RawTransactionArgument<string>;
}
export interface AssertSettlementSubjectOptions {
    package?: string;
    arguments: AssertSettlementSubjectArguments | [
        settlement: RawTransactionArgument<string>,
        expectedSubjectId: RawTransactionArgument<string>
    ];
}
export function assertSettlementSubject(options: AssertSettlementSubjectOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["settlement", "expectedSubjectId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'assert_settlement_subject',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertSettlementOwnerArguments {
    settlement: RawTransactionArgument<string>;
    expectedOwner: RawTransactionArgument<string>;
}
export interface AssertSettlementOwnerOptions {
    package?: string;
    arguments: AssertSettlementOwnerArguments | [
        settlement: RawTransactionArgument<string>,
        expectedOwner: RawTransactionArgument<string>
    ];
}
export function assertSettlementOwner(options: AssertSettlementOwnerOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["settlement", "expectedOwner"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'assert_settlement_owner',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertSettlementProfileMatchesArguments {
    settlement: RawTransactionArgument<string>;
    expectedProfileId: RawTransactionArgument<string>;
}
export interface AssertSettlementProfileMatchesOptions {
    package?: string;
    arguments: AssertSettlementProfileMatchesArguments | [
        settlement: RawTransactionArgument<string>,
        expectedProfileId: RawTransactionArgument<string>
    ];
}
export function assertSettlementProfileMatches(options: AssertSettlementProfileMatchesOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["settlement", "expectedProfileId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'assert_settlement_profile_matches',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IdArguments {
    distributor: RawTransactionArgument<string>;
}
export interface IdOptions {
    package?: string;
    arguments: IdArguments | [
        distributor: RawTransactionArgument<string>
    ];
}
export function id(options: IdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["distributor"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface YtScopeOptions {
    package?: string;
    arguments?: [
    ];
}
export function ytScope(options: YtScopeOptions = {}) {
    const packageAddress = options.package ?? 'jitter/jitter';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'yt_scope',
    });
}
export interface LpScopeOptions {
    package?: string;
    arguments?: [
    ];
}
export function lpScope(options: LpScopeOptions = {}) {
    const packageAddress = options.package ?? 'jitter/jitter';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'lp_scope',
    });
}
export interface PoolScopeOptions {
    package?: string;
    arguments?: [
    ];
}
export function poolScope(options: PoolScopeOptions = {}) {
    const packageAddress = options.package ?? 'jitter/jitter';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'pool_scope',
    });
}
export interface OrderbookScopeOptions {
    package?: string;
    arguments?: [
    ];
}
export function orderbookScope(options: OrderbookScopeOptions = {}) {
    const packageAddress = options.package ?? 'jitter/jitter';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'orderbook_scope',
    });
}
export interface PtScopeOptions {
    package?: string;
    arguments?: [
    ];
}
export function ptScope(options: PtScopeOptions = {}) {
    const packageAddress = options.package ?? 'jitter/jitter';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'pt_scope',
    });
}
export interface EnabledArguments {
    distributor: RawTransactionArgument<string>;
}
export interface EnabledOptions {
    package?: string;
    arguments: EnabledArguments | [
        distributor: RawTransactionArgument<string>
    ];
}
export function enabled(options: EnabledOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["distributor"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'enabled',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ConfigVersionArguments {
    distributor: RawTransactionArgument<string>;
}
export interface ConfigVersionOptions {
    package?: string;
    arguments: ConfigVersionArguments | [
        distributor: RawTransactionArgument<string>
    ];
}
export function configVersion(options: ConfigVersionOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["distributor"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'config_version',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OperationOwnerArguments {
    operation: RawTransactionArgument<string>;
}
export interface OperationOwnerOptions {
    package?: string;
    arguments: OperationOwnerArguments | [
        operation: RawTransactionArgument<string>
    ];
}
export function operationOwner(options: OperationOwnerOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["operation"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'operation_owner',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OperationSubjectArguments {
    operation: RawTransactionArgument<string>;
}
export interface OperationSubjectOptions {
    package?: string;
    arguments: OperationSubjectArguments | [
        operation: RawTransactionArgument<string>
    ];
}
export function operationSubject(options: OperationSubjectOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["operation"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'operation_subject',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OperationDistributorIdArguments {
    operation: RawTransactionArgument<string>;
}
export interface OperationDistributorIdOptions {
    package?: string;
    arguments: OperationDistributorIdArguments | [
        operation: RawTransactionArgument<string>
    ];
}
export function operationDistributorId(options: OperationDistributorIdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["operation"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'operation_distributor_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OperationScopeArguments {
    operation: RawTransactionArgument<string>;
}
export interface OperationScopeOptions {
    package?: string;
    arguments: OperationScopeArguments | [
        operation: RawTransactionArgument<string>
    ];
}
export function operationScope(options: OperationScopeOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["operation"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'operation_scope',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PreviousExposureArguments {
    operation: RawTransactionArgument<string>;
}
export interface PreviousExposureOptions {
    package?: string;
    arguments: PreviousExposureArguments | [
        operation: RawTransactionArgument<string>
    ];
}
export function previousExposure(options: PreviousExposureOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["operation"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'previous_exposure',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OperationGuardArguments {
    operation: RawTransactionArgument<string>;
}
export interface OperationGuardOptions {
    package?: string;
    arguments: OperationGuardArguments | [
        operation: RawTransactionArgument<string>
    ];
}
export function operationGuard(options: OperationGuardOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["operation"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'operation_guard',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PendingRewarderCountArguments {
    operation: RawTransactionArgument<string>;
}
export interface PendingRewarderCountOptions {
    package?: string;
    arguments: PendingRewarderCountArguments | [
        operation: RawTransactionArgument<string>
    ];
}
export function pendingRewarderCount(options: PendingRewarderCountOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["operation"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'pending_rewarder_count',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SettlementScopeArguments {
    settlement: RawTransactionArgument<string>;
}
export interface SettlementScopeOptions {
    package?: string;
    arguments: SettlementScopeArguments | [
        settlement: RawTransactionArgument<string>
    ];
}
export function settlementScope(options: SettlementScopeOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["settlement"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'settlement_scope',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SettlementSubjectArguments {
    settlement: RawTransactionArgument<string>;
}
export interface SettlementSubjectOptions {
    package?: string;
    arguments: SettlementSubjectArguments | [
        settlement: RawTransactionArgument<string>
    ];
}
export function settlementSubject(options: SettlementSubjectOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["settlement"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'settlement_subject',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SettlementDistributorIdArguments {
    settlement: RawTransactionArgument<string>;
}
export interface SettlementDistributorIdOptions {
    package?: string;
    arguments: SettlementDistributorIdArguments | [
        settlement: RawTransactionArgument<string>
    ];
}
export function settlementDistributorId(options: SettlementDistributorIdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["settlement"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'settlement_distributor_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SettlementOwnerArguments {
    settlement: RawTransactionArgument<string>;
}
export interface SettlementOwnerOptions {
    package?: string;
    arguments: SettlementOwnerArguments | [
        settlement: RawTransactionArgument<string>
    ];
}
export function settlementOwner(options: SettlementOwnerOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["settlement"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'settlement_owner',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SettlementProfileIdArguments {
    settlement: RawTransactionArgument<string>;
}
export interface SettlementProfileIdOptions {
    package?: string;
    arguments: SettlementProfileIdArguments | [
        settlement: RawTransactionArgument<string>
    ];
}
export function settlementProfileId(options: SettlementProfileIdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["settlement"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'settlement_profile_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SettlementPreviousExposureArguments {
    settlement: RawTransactionArgument<string>;
}
export interface SettlementPreviousExposureOptions {
    package?: string;
    arguments: SettlementPreviousExposureArguments | [
        settlement: RawTransactionArgument<string>
    ];
}
export function settlementPreviousExposure(options: SettlementPreviousExposureOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["settlement"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'settlement_previous_exposure',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SettlementGuardArguments {
    settlement: RawTransactionArgument<string>;
}
export interface SettlementGuardOptions {
    package?: string;
    arguments: SettlementGuardArguments | [
        settlement: RawTransactionArgument<string>
    ];
}
export function settlementGuard(options: SettlementGuardOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["settlement"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'settlement_guard',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SettlementConfigVersionArguments {
    settlement: RawTransactionArgument<string>;
}
export interface SettlementConfigVersionOptions {
    package?: string;
    arguments: SettlementConfigVersionArguments | [
        settlement: RawTransactionArgument<string>
    ];
}
export function settlementConfigVersion(options: SettlementConfigVersionOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["settlement"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'settlement_config_version',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertSettlementConfigCurrentArguments {
    distributor: RawTransactionArgument<string>;
    settlement: RawTransactionArgument<string>;
}
export interface AssertSettlementConfigCurrentOptions {
    package?: string;
    arguments: AssertSettlementConfigCurrentArguments | [
        distributor: RawTransactionArgument<string>,
        settlement: RawTransactionArgument<string>
    ];
}
export function assertSettlementConfigCurrent(options: AssertSettlementConfigCurrentOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "settlement"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'assert_settlement_config_current',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RewarderRegisteredArguments {
    distributor: RawTransactionArgument<string>;
    scope: RawTransactionArgument<number>;
    rewarderId: RawTransactionArgument<string>;
}
export interface RewarderRegisteredOptions {
    package?: string;
    arguments: RewarderRegisteredArguments | [
        distributor: RawTransactionArgument<string>,
        scope: RawTransactionArgument<number>,
        rewarderId: RawTransactionArgument<string>
    ];
}
export function rewarderRegistered(options: RewarderRegisteredOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u8',
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "scope", "rewarderId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'rewarder_registered',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RewarderCountArguments {
    distributor: RawTransactionArgument<string>;
    scope: RawTransactionArgument<number>;
}
export interface RewarderCountOptions {
    package?: string;
    arguments: RewarderCountArguments | [
        distributor: RawTransactionArgument<string>,
        scope: RawTransactionArgument<number>
    ];
}
export function rewarderCount(options: RewarderCountOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u8'
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "scope"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'rewarder_count',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ProfileExistsArguments {
    distributor: RawTransactionArgument<string>;
    profileId: RawTransactionArgument<string>;
}
export interface ProfileExistsOptions {
    package?: string;
    arguments: ProfileExistsArguments | [
        distributor: RawTransactionArgument<string>,
        profileId: RawTransactionArgument<string>
    ];
}
export function profileExists(options: ProfileExistsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "profileId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'profile_exists',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ProfileRewarderRegisteredArguments {
    distributor: RawTransactionArgument<string>;
    profileId: RawTransactionArgument<string>;
    scope: RawTransactionArgument<number>;
    rewarderId: RawTransactionArgument<string>;
}
export interface ProfileRewarderRegisteredOptions {
    package?: string;
    arguments: ProfileRewarderRegisteredArguments | [
        distributor: RawTransactionArgument<string>,
        profileId: RawTransactionArgument<string>,
        scope: RawTransactionArgument<number>,
        rewarderId: RawTransactionArgument<string>
    ];
}
export function profileRewarderRegistered(options: ProfileRewarderRegisteredOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        '0x2::object::ID',
        'u8',
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "profileId", "scope", "rewarderId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'profile_rewarder_registered',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ProfileRewarderCountArguments {
    distributor: RawTransactionArgument<string>;
    profileId: RawTransactionArgument<string>;
    scope: RawTransactionArgument<number>;
}
export interface ProfileRewarderCountOptions {
    package?: string;
    arguments: ProfileRewarderCountArguments | [
        distributor: RawTransactionArgument<string>,
        profileId: RawTransactionArgument<string>,
        scope: RawTransactionArgument<number>
    ];
}
export function profileRewarderCount(options: ProfileRewarderCountOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        '0x2::object::ID',
        'u8'
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "profileId", "scope"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'profile_rewarder_count',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ScopeRewarderIdsArguments {
    distributor: RawTransactionArgument<string>;
    scope: RawTransactionArgument<number>;
}
export interface ScopeRewarderIdsOptions {
    package?: string;
    arguments: ScopeRewarderIdsArguments | [
        distributor: RawTransactionArgument<string>,
        scope: RawTransactionArgument<number>
    ];
}
export function scopeRewarderIds(options: ScopeRewarderIdsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u8'
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "scope"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'scope_rewarder_ids',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RewarderMetadataArguments {
    distributor: RawTransactionArgument<string>;
    rewarderId: RawTransactionArgument<string>;
}
export interface RewarderMetadataOptions {
    package?: string;
    arguments: RewarderMetadataArguments | [
        distributor: RawTransactionArgument<string>,
        rewarderId: RawTransactionArgument<string>
    ];
}
export function rewarderMetadata(options: RewarderMetadataOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "rewarderId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'rewarder_metadata',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ConsumeScopedSubjectSettlementArguments {
    settlement: RawTransactionArgument<string>;
    expectedDistributorId: RawTransactionArgument<string>;
    expectedScope: RawTransactionArgument<number>;
    expectedSubjectId: RawTransactionArgument<string>;
}
export interface ConsumeScopedSubjectSettlementOptions {
    package?: string;
    arguments: ConsumeScopedSubjectSettlementArguments | [
        settlement: RawTransactionArgument<string>,
        expectedDistributorId: RawTransactionArgument<string>,
        expectedScope: RawTransactionArgument<number>,
        expectedSubjectId: RawTransactionArgument<string>
    ];
}
export function consumeScopedSubjectSettlement(options: ConsumeScopedSubjectSettlementOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        '0x2::object::ID',
        'u8',
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["settlement", "expectedDistributorId", "expectedScope", "expectedSubjectId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'reward_distributor',
        function: 'consume_scoped_subject_settlement',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}