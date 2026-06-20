/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * Optional LiquidLink v2 point extension for Jitter.
 * 
 * Core Jitter objects and normal router entrypoints stay unchanged. Projects that
 * opt in call these extension entrypoints instead.
 * 
 * YT points are pushed to LiquidLink as a linear stream because YT exposure only
 * changes when the user's position is touched. LP points are tracked by a
 * pool-level accumulator because LP exposure changes whenever pool.total_sy
 * changes; users claim settled LP points into LiquidLink explicitly.
 */

import { MoveStruct, MoveTuple, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as point_cap from './deps/liquidlink_incentive_system/point_cap.js';
import * as reward_distributor from './deps/jitter/reward_distributor.js';
import * as reward_distributor_1 from './deps/jitter/reward_distributor.js';
import * as reward_distributor_2 from './deps/jitter/reward_distributor.js';
const $moduleName = 'jitter/jitter-extensions::liquidlink_points';
export const PointConfig = new MoveStruct({ name: `${$moduleName}::PointConfig`, fields: {
        id: bcs.Address,
        point_cap: point_cap.PointCap,
        yt_settlement_cap: bcs.option(reward_distributor.RewarderSettlementCap),
        yt_multiplier_bps: bcs.u64(),
        lp_multiplier_bps: bcs.u64(),
        duration: bcs.u64(),
        enabled: bcs.bool(),
        total_yt_amount: bcs.u256(),
        total_yt_base: bcs.u256(),
        config_version: bcs.u64()
    } });
export const LpPointState = new MoveStruct({ name: `${$moduleName}::LpPointState<phantom SY>`, fields: {
        id: bcs.Address,
        point_config_id: bcs.Address,
        pool_id: bcs.Address,
        lp_settlement_cap: bcs.option(reward_distributor_1.RewarderSettlementCap),
        pool_settlement_cap: bcs.option(reward_distributor_2.RewarderSettlementCap),
        lp_multiplier_bps: bcs.u64(),
        acc_point_per_lp: bcs.u128(),
        last_updated_ms: bcs.u64(),
        total_lp_points_accrued: bcs.u64(),
        point_config_version: bcs.u64()
    } });
export const UserKey = new MoveTuple({ name: `${$moduleName}::UserKey`, fields: [bcs.Address] });
export const PositionKey = new MoveTuple({ name: `${$moduleName}::PositionKey`, fields: [bcs.Address] });
export const YtPointWeightKey = new MoveTuple({ name: `${$moduleName}::YtPointWeightKey`, fields: [bcs.Address] });
export const YtMarketAllowedKey = new MoveTuple({ name: `${$moduleName}::YtMarketAllowedKey`, fields: [bcs.Address] });
export const YtPointWeight = new MoveStruct({ name: `${$moduleName}::YtPointWeight`, fields: {
        multiplier_bps: bcs.u64()
    } });
export const UserYtExposure = new MoveStruct({ name: `${$moduleName}::UserYtExposure`, fields: {
        yt_base: bcs.u256()
    } });
export const YtPositionContribution = new MoveStruct({ name: `${$moduleName}::YtPositionContribution`, fields: {
        owner: bcs.Address,
        raw_amount: bcs.u256(),
        base_amount: bcs.u256()
    } });
export const YtMarketExposure = new MoveStruct({ name: `${$moduleName}::YtMarketExposure`, fields: {
        yt_amount: bcs.u256(),
        yt_base: bcs.u256()
    } });
export const LpLegPointRecord = new MoveStruct({ name: `${$moduleName}::LpLegPointRecord`, fields: {
        owner: bcs.Address,
        lp_amount: bcs.u64(),
        reward_debt: bcs.u128(),
        pending_points: bcs.u64()
    } });
export const PointConfigCreatedEvent = new MoveStruct({ name: `${$moduleName}::PointConfigCreatedEvent`, fields: {
        config_id: bcs.Address,
        owner: bcs.Address,
        yt_multiplier_bps: bcs.u64(),
        lp_multiplier_bps: bcs.u64(),
        duration: bcs.u64(),
        enabled: bcs.bool(),
        total_yt_amount: bcs.u256(),
        total_yt_base: bcs.u256(),
        config_version: bcs.u64()
    } });
export const PointConfigUpdatedEvent = new MoveStruct({ name: `${$moduleName}::PointConfigUpdatedEvent`, fields: {
        config_id: bcs.Address,
        yt_multiplier_bps: bcs.u64(),
        lp_multiplier_bps: bcs.u64(),
        duration: bcs.u64(),
        enabled: bcs.bool(),
        total_yt_amount: bcs.u256(),
        total_yt_base: bcs.u256(),
        config_version: bcs.u64()
    } });
export const LpPointStateCreatedEvent = new MoveStruct({ name: `${$moduleName}::LpPointStateCreatedEvent`, fields: {
        state_id: bcs.Address,
        config_id: bcs.Address,
        pool_id: bcs.Address,
        lp_multiplier_bps: bcs.u64()
    } });
export const YtPointWeightConfiguredEvent = new MoveStruct({ name: `${$moduleName}::YtPointWeightConfiguredEvent`, fields: {
        config_id: bcs.Address,
        market_id: bcs.Address,
        multiplier_bps: bcs.u64()
    } });
export const YtMarketAllowedEvent = new MoveStruct({ name: `${$moduleName}::YtMarketAllowedEvent`, fields: {
        config_id: bcs.Address,
        market_id: bcs.Address
    } });
export const LpPointWeightConfiguredEvent = new MoveStruct({ name: `${$moduleName}::LpPointWeightConfiguredEvent`, fields: {
        state_id: bcs.Address,
        pool_id: bcs.Address,
        multiplier_bps: bcs.u64()
    } });
export const YtPointsSyncedEvent = new MoveStruct({ name: `${$moduleName}::YtPointsSyncedEvent`, fields: {
        config_id: bcs.Address,
        position_id: bcs.Address,
        owner: bcs.Address,
        previous_base_amount: bcs.u256(),
        new_base_amount: bcs.u256(),
        owner_score_per_duration: bcs.u256()
    } });
export const LpPointAccumulatorUpdatedEvent = new MoveStruct({ name: `${$moduleName}::LpPointAccumulatorUpdatedEvent`, fields: {
        state_id: bcs.Address,
        pool_id: bcs.Address,
        elapsed_ms: bcs.u64(),
        total_sy: bcs.u64(),
        lp_supply: bcs.u64(),
        points_accrued: bcs.u64(),
        acc_point_per_lp: bcs.u128()
    } });
export const LpLegPointsSettledEvent = new MoveStruct({ name: `${$moduleName}::LpLegPointsSettledEvent`, fields: {
        state_id: bcs.Address,
        position_id: bcs.Address,
        owner: bcs.Address,
        pending_added: bcs.u64(),
        pending_total: bcs.u64(),
        lp_amount: bcs.u64(),
        reward_debt: bcs.u128()
    } });
export const LpPointsClaimedEvent = new MoveStruct({ name: `${$moduleName}::LpPointsClaimedEvent`, fields: {
        state_id: bcs.Address,
        position_id: bcs.Address,
        owner: bcs.Address,
        points: bcs.u64()
    } });
export interface CreateAndShareDefaultByAdminArguments {
    pointCap: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
}
export interface CreateAndShareDefaultByAdminOptions {
    package?: string;
    arguments: CreateAndShareDefaultByAdminArguments | [
        pointCap: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>
    ];
}
export function createAndShareDefaultByAdmin(options: CreateAndShareDefaultByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["pointCap", "globalConfig", "AdminCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'create_and_share_default_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface CreateAndShareByAdminArguments {
    pointCap: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
    ytMultiplierBps: RawTransactionArgument<number | bigint>;
    lpMultiplierBps: RawTransactionArgument<number | bigint>;
    duration: RawTransactionArgument<number | bigint>;
}
export interface CreateAndShareByAdminOptions {
    package?: string;
    arguments: CreateAndShareByAdminArguments | [
        pointCap: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>,
        ytMultiplierBps: RawTransactionArgument<number | bigint>,
        lpMultiplierBps: RawTransactionArgument<number | bigint>,
        duration: RawTransactionArgument<number | bigint>
    ];
}
export function createAndShareByAdmin(options: CreateAndShareByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        'u64',
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["pointCap", "globalConfig", "AdminCap", "ytMultiplierBps", "lpMultiplierBps", "duration"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'create_and_share_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface CreateLpPointStateByAdminArguments {
    pointConfig: RawTransactionArgument<string>;
    pool: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
}
export interface CreateLpPointStateByAdminOptions {
    package?: string;
    arguments: CreateLpPointStateByAdminArguments | [
        pointConfig: RawTransactionArgument<string>,
        pool: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function createLpPointStateByAdmin(options: CreateLpPointStateByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["pointConfig", "pool", "globalConfig", "AdminCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'create_lp_point_state_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SetMultipliersByAdminArguments {
    config: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
    ytMultiplierBps: RawTransactionArgument<number | bigint>;
    lpMultiplierBps: RawTransactionArgument<number | bigint>;
    duration: RawTransactionArgument<number | bigint>;
}
export interface SetMultipliersByAdminOptions {
    package?: string;
    arguments: SetMultipliersByAdminArguments | [
        config: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>,
        ytMultiplierBps: RawTransactionArgument<number | bigint>,
        lpMultiplierBps: RawTransactionArgument<number | bigint>,
        duration: RawTransactionArgument<number | bigint>
    ];
}
export function setMultipliersByAdmin(options: SetMultipliersByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        'u64',
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "globalConfig", "AdminCap", "ytMultiplierBps", "lpMultiplierBps", "duration"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'set_multipliers_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SetEnabledByAclArguments {
    config: RawTransactionArgument<string>;
    scoreboard: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    liquidlinkGlobalConfig: RawTransactionArgument<string>;
    acl: RawTransactionArgument<string>;
    enabled: RawTransactionArgument<boolean>;
}
export interface SetEnabledByAclOptions {
    package?: string;
    arguments: SetEnabledByAclArguments | [
        config: RawTransactionArgument<string>,
        scoreboard: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        liquidlinkGlobalConfig: RawTransactionArgument<string>,
        acl: RawTransactionArgument<string>,
        enabled: RawTransactionArgument<boolean>
    ];
}
export function setEnabledByAcl(options: SetEnabledByAclOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        'bool',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "scoreboard", "globalConfig", "liquidlinkGlobalConfig", "acl", "enabled"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'set_enabled_by_acl',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SetEnabledByAdminArguments {
    config: RawTransactionArgument<string>;
    scoreboard: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    liquidlinkGlobalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
    enabled: RawTransactionArgument<boolean>;
}
export interface SetEnabledByAdminOptions {
    package?: string;
    arguments: SetEnabledByAdminArguments | [
        config: RawTransactionArgument<string>,
        scoreboard: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        liquidlinkGlobalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>,
        enabled: RawTransactionArgument<boolean>
    ];
}
export function setEnabledByAdmin(options: SetEnabledByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        'bool',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "scoreboard", "globalConfig", "liquidlinkGlobalConfig", "AdminCap", "enabled"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'set_enabled_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SetYtMarketMultiplierByAdminArguments {
    config: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
    marketId: RawTransactionArgument<string>;
    multiplierBps: RawTransactionArgument<number | bigint>;
}
export interface SetYtMarketMultiplierByAdminOptions {
    package?: string;
    arguments: SetYtMarketMultiplierByAdminArguments | [
        config: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>,
        marketId: RawTransactionArgument<string>,
        multiplierBps: RawTransactionArgument<number | bigint>
    ];
}
export function setYtMarketMultiplierByAdmin(options: SetYtMarketMultiplierByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        '0x2::object::ID',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "globalConfig", "AdminCap", "marketId", "multiplierBps"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'set_yt_market_multiplier_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AllowYtMarketByAdminArguments {
    config: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
    marketId: RawTransactionArgument<string>;
}
export interface AllowYtMarketByAdminOptions {
    package?: string;
    arguments: AllowYtMarketByAdminArguments | [
        config: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>,
        marketId: RawTransactionArgument<string>
    ];
}
export function allowYtMarketByAdmin(options: AllowYtMarketByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "globalConfig", "AdminCap", "marketId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'allow_yt_market_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SetLpStateMultiplierByAdminArguments {
    state: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
    multiplierBps: RawTransactionArgument<number | bigint>;
}
export interface SetLpStateMultiplierByAdminOptions {
    package?: string;
    arguments: SetLpStateMultiplierByAdminArguments | [
        state: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>,
        multiplierBps: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
export function setLpStateMultiplierByAdmin(options: SetLpStateMultiplierByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["state", "globalConfig", "AdminCap", "multiplierBps"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'set_lp_state_multiplier_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RegisterYtRewarderByAdminArguments {
    distributor: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    pointConfig: RawTransactionArgument<string>;
    adminCap: RawTransactionArgument<string>;
}
export interface RegisterYtRewarderByAdminOptions {
    package?: string;
    arguments: RegisterYtRewarderByAdminArguments | [
        distributor: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        pointConfig: RawTransactionArgument<string>,
        adminCap: RawTransactionArgument<string>
    ];
}
export function registerYtRewarderByAdmin(options: RegisterYtRewarderByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "globalConfig", "pointConfig", "adminCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'register_yt_rewarder_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RegisterLpRewarderByAdminArguments {
    distributor: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    lpPointState: RawTransactionArgument<string>;
    adminCap: RawTransactionArgument<string>;
}
export interface RegisterLpRewarderByAdminOptions {
    package?: string;
    arguments: RegisterLpRewarderByAdminArguments | [
        distributor: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        lpPointState: RawTransactionArgument<string>,
        adminCap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function registerLpRewarderByAdmin(options: RegisterLpRewarderByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "globalConfig", "lpPointState", "adminCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'register_lp_rewarder_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RegisterPoolRewarderByAdminArguments {
    distributor: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    lpPointState: RawTransactionArgument<string>;
    adminCap: RawTransactionArgument<string>;
}
export interface RegisterPoolRewarderByAdminOptions {
    package?: string;
    arguments: RegisterPoolRewarderByAdminArguments | [
        distributor: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        lpPointState: RawTransactionArgument<string>,
        adminCap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function registerPoolRewarderByAdmin(options: RegisterPoolRewarderByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["distributor", "globalConfig", "lpPointState", "adminCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'register_pool_rewarder_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SettleYtRewardOperationArguments {
    globalConfig: RawTransactionArgument<string>;
    liquidlinkGlobalConfig: RawTransactionArgument<string>;
    pointConfig: RawTransactionArgument<string>;
    scoreboard: RawTransactionArgument<string>;
    distributor: RawTransactionArgument<string>;
    operation: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
}
export interface SettleYtRewardOperationOptions {
    package?: string;
    arguments: SettleYtRewardOperationArguments | [
        globalConfig: RawTransactionArgument<string>,
        liquidlinkGlobalConfig: RawTransactionArgument<string>,
        pointConfig: RawTransactionArgument<string>,
        scoreboard: RawTransactionArgument<string>,
        distributor: RawTransactionArgument<string>,
        operation: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function settleYtRewardOperation(options: SettleYtRewardOperationOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "liquidlinkGlobalConfig", "pointConfig", "scoreboard", "distributor", "operation", "position", "pyState"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'settle_yt_reward_operation',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SettleLpRewardOperationArguments {
    globalConfig: RawTransactionArgument<string>;
    liquidlinkGlobalConfig: RawTransactionArgument<string>;
    pointConfig: RawTransactionArgument<string>;
    lpPointState: RawTransactionArgument<string>;
    scoreboard: RawTransactionArgument<string>;
    distributor: RawTransactionArgument<string>;
    operation: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
}
export interface SettleLpRewardOperationOptions {
    package?: string;
    arguments: SettleLpRewardOperationArguments | [
        globalConfig: RawTransactionArgument<string>,
        liquidlinkGlobalConfig: RawTransactionArgument<string>,
        pointConfig: RawTransactionArgument<string>,
        lpPointState: RawTransactionArgument<string>,
        scoreboard: RawTransactionArgument<string>,
        distributor: RawTransactionArgument<string>,
        operation: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function settleLpRewardOperation(options: SettleLpRewardOperationOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "liquidlinkGlobalConfig", "pointConfig", "lpPointState", "scoreboard", "distributor", "operation", "market", "position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'settle_lp_reward_operation',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SettlePoolRewardOperationArguments {
    globalConfig: RawTransactionArgument<string>;
    pointConfig: RawTransactionArgument<string>;
    lpPointState: RawTransactionArgument<string>;
    distributor: RawTransactionArgument<string>;
    operation: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
}
export interface SettlePoolRewardOperationOptions {
    package?: string;
    arguments: SettlePoolRewardOperationArguments | [
        globalConfig: RawTransactionArgument<string>,
        pointConfig: RawTransactionArgument<string>,
        lpPointState: RawTransactionArgument<string>,
        distributor: RawTransactionArgument<string>,
        operation: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function settlePoolRewardOperation(options: SettlePoolRewardOperationOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["globalConfig", "pointConfig", "lpPointState", "distributor", "operation", "market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'settle_pool_reward_operation',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RefreshPoolLpPointsWithPointsArguments {
    pointConfig: RawTransactionArgument<string>;
    lpPointState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
}
export interface RefreshPoolLpPointsWithPointsOptions {
    package?: string;
    arguments: RefreshPoolLpPointsWithPointsArguments | [
        pointConfig: RawTransactionArgument<string>,
        lpPointState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function refreshPoolLpPointsWithPoints(options: RefreshPoolLpPointsWithPointsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["pointConfig", "lpPointState", "globalConfig", "market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'refresh_pool_lp_points_with_points',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SettleLpPositionWithPointsArguments {
    pointConfig: RawTransactionArgument<string>;
    lpPointState: RawTransactionArgument<string>;
    scoreboard: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    liquidlinkGlobalConfig: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
}
export interface SettleLpPositionWithPointsOptions {
    package?: string;
    arguments: SettleLpPositionWithPointsArguments | [
        pointConfig: RawTransactionArgument<string>,
        lpPointState: RawTransactionArgument<string>,
        scoreboard: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        liquidlinkGlobalConfig: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function settleLpPositionWithPoints(options: SettleLpPositionWithPointsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["pointConfig", "lpPointState", "scoreboard", "globalConfig", "liquidlinkGlobalConfig", "market", "position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'settle_lp_position_with_points',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SettleLpPositionOwnerWithPointsArguments {
    pointConfig: RawTransactionArgument<string>;
    lpPointState: RawTransactionArgument<string>;
    scoreboard: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    liquidlinkGlobalConfig: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    owner: RawTransactionArgument<string>;
}
export interface SettleLpPositionOwnerWithPointsOptions {
    package?: string;
    arguments: SettleLpPositionOwnerWithPointsArguments | [
        pointConfig: RawTransactionArgument<string>,
        lpPointState: RawTransactionArgument<string>,
        scoreboard: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        liquidlinkGlobalConfig: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        owner: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function settleLpPositionOwnerWithPoints(options: SettleLpPositionOwnerWithPointsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        'address',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["pointConfig", "lpPointState", "scoreboard", "globalConfig", "liquidlinkGlobalConfig", "market", "position", "owner"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'settle_lp_position_owner_with_points',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ClaimLpPointsWithPointsArguments {
    pointConfig: RawTransactionArgument<string>;
    lpPointState: RawTransactionArgument<string>;
    scoreboard: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    liquidlinkGlobalConfig: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
}
export interface ClaimLpPointsWithPointsOptions {
    package?: string;
    arguments: ClaimLpPointsWithPointsArguments | [
        pointConfig: RawTransactionArgument<string>,
        lpPointState: RawTransactionArgument<string>,
        scoreboard: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        liquidlinkGlobalConfig: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function claimLpPointsWithPoints(options: ClaimLpPointsWithPointsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["pointConfig", "lpPointState", "scoreboard", "globalConfig", "liquidlinkGlobalConfig", "market", "position"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'claim_lp_points_with_points',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SyncPyPositionWithPointsArguments {
    pointConfig: RawTransactionArgument<string>;
    scoreboard: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    liquidlinkGlobalConfig: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
}
export interface SyncPyPositionWithPointsOptions {
    package?: string;
    arguments: SyncPyPositionWithPointsArguments | [
        pointConfig: RawTransactionArgument<string>,
        scoreboard: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        liquidlinkGlobalConfig: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function syncPyPositionWithPoints(options: SyncPyPositionWithPointsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["pointConfig", "scoreboard", "globalConfig", "liquidlinkGlobalConfig", "position", "pyState"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'sync_py_position_with_points',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SyncPyPositionOwnerWithPointsArguments {
    pointConfig: RawTransactionArgument<string>;
    scoreboard: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    liquidlinkGlobalConfig: RawTransactionArgument<string>;
    position: RawTransactionArgument<string>;
    pyState: RawTransactionArgument<string>;
    owner: RawTransactionArgument<string>;
}
export interface SyncPyPositionOwnerWithPointsOptions {
    package?: string;
    arguments: SyncPyPositionOwnerWithPointsArguments | [
        pointConfig: RawTransactionArgument<string>,
        scoreboard: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        liquidlinkGlobalConfig: RawTransactionArgument<string>,
        position: RawTransactionArgument<string>,
        pyState: RawTransactionArgument<string>,
        owner: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function syncPyPositionOwnerWithPoints(options: SyncPyPositionOwnerWithPointsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        null,
        'address',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["pointConfig", "scoreboard", "globalConfig", "liquidlinkGlobalConfig", "position", "pyState", "owner"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'sync_py_position_owner_with_points',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RefreshUserYtScoreWithPointsArguments {
    pointConfig: RawTransactionArgument<string>;
    scoreboard: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    liquidlinkGlobalConfig: RawTransactionArgument<string>;
    owner: RawTransactionArgument<string>;
}
export interface RefreshUserYtScoreWithPointsOptions {
    package?: string;
    arguments: RefreshUserYtScoreWithPointsArguments | [
        pointConfig: RawTransactionArgument<string>,
        scoreboard: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        liquidlinkGlobalConfig: RawTransactionArgument<string>,
        owner: RawTransactionArgument<string>
    ];
}
export function refreshUserYtScoreWithPoints(options: RefreshUserYtScoreWithPointsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        'address',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["pointConfig", "scoreboard", "globalConfig", "liquidlinkGlobalConfig", "owner"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'refresh_user_yt_score_with_points',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface YtMultiplierBpsArguments {
    config: RawTransactionArgument<string>;
}
export interface YtMultiplierBpsOptions {
    package?: string;
    arguments: YtMultiplierBpsArguments | [
        config: RawTransactionArgument<string>
    ];
}
export function ytMultiplierBps(options: YtMultiplierBpsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["config"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'yt_multiplier_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface LpMultiplierBpsArguments {
    config: RawTransactionArgument<string>;
}
export interface LpMultiplierBpsOptions {
    package?: string;
    arguments: LpMultiplierBpsArguments | [
        config: RawTransactionArgument<string>
    ];
}
export function lpMultiplierBps(options: LpMultiplierBpsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["config"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'lp_multiplier_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface DurationArguments {
    config: RawTransactionArgument<string>;
}
export interface DurationOptions {
    package?: string;
    arguments: DurationArguments | [
        config: RawTransactionArgument<string>
    ];
}
export function duration(options: DurationOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["config"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'duration',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface EnabledArguments {
    config: RawTransactionArgument<string>;
}
export interface EnabledOptions {
    package?: string;
    arguments: EnabledArguments | [
        config: RawTransactionArgument<string>
    ];
}
export function enabled(options: EnabledOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["config"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'enabled',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface TotalYtAmountArguments {
    config: RawTransactionArgument<string>;
}
export interface TotalYtAmountOptions {
    package?: string;
    arguments: TotalYtAmountArguments | [
        config: RawTransactionArgument<string>
    ];
}
export function totalYtAmount(options: TotalYtAmountOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["config"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'total_yt_amount',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface TotalYtBaseArguments {
    config: RawTransactionArgument<string>;
}
export interface TotalYtBaseOptions {
    package?: string;
    arguments: TotalYtBaseArguments | [
        config: RawTransactionArgument<string>
    ];
}
export function totalYtBase(options: TotalYtBaseOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["config"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'total_yt_base',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface ConfigVersionArguments {
    config: RawTransactionArgument<string>;
}
export interface ConfigVersionOptions {
    package?: string;
    arguments: ConfigVersionArguments | [
        config: RawTransactionArgument<string>
    ];
}
export function configVersion(options: ConfigVersionOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["config"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'config_version',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface YtMarketMultiplierBpsArguments {
    config: RawTransactionArgument<string>;
    marketId: RawTransactionArgument<string>;
}
export interface YtMarketMultiplierBpsOptions {
    package?: string;
    arguments: YtMarketMultiplierBpsArguments | [
        config: RawTransactionArgument<string>,
        marketId: RawTransactionArgument<string>
    ];
}
export function ytMarketMultiplierBps(options: YtMarketMultiplierBpsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "marketId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'yt_market_multiplier_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface YtMarketAllowedArguments {
    config: RawTransactionArgument<string>;
    marketId: RawTransactionArgument<string>;
}
export interface YtMarketAllowedOptions {
    package?: string;
    arguments: YtMarketAllowedArguments | [
        config: RawTransactionArgument<string>,
        marketId: RawTransactionArgument<string>
    ];
}
export function ytMarketAllowed(options: YtMarketAllowedOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "marketId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'yt_market_allowed',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface LpStateMultiplierBpsArguments {
    state: RawTransactionArgument<string>;
}
export interface LpStateMultiplierBpsOptions {
    package?: string;
    arguments: LpStateMultiplierBpsArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function lpStateMultiplierBps(options: LpStateMultiplierBpsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'lp_state_multiplier_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface LpAccPointPerLpArguments {
    state: RawTransactionArgument<string>;
}
export interface LpAccPointPerLpOptions {
    package?: string;
    arguments: LpAccPointPerLpArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function lpAccPointPerLp(options: LpAccPointPerLpOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'lp_acc_point_per_lp',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface LpLastUpdatedMsArguments {
    state: RawTransactionArgument<string>;
}
export interface LpLastUpdatedMsOptions {
    package?: string;
    arguments: LpLastUpdatedMsArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function lpLastUpdatedMs(options: LpLastUpdatedMsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'lp_last_updated_ms',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface TotalLpPointsAccruedArguments {
    state: RawTransactionArgument<string>;
}
export interface TotalLpPointsAccruedOptions {
    package?: string;
    arguments: TotalLpPointsAccruedArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function totalLpPointsAccrued(options: TotalLpPointsAccruedOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'total_lp_points_accrued',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface LpPointConfigVersionArguments {
    state: RawTransactionArgument<string>;
}
export interface LpPointConfigVersionOptions {
    package?: string;
    arguments: LpPointConfigVersionArguments | [
        state: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function lpPointConfigVersion(options: LpPointConfigVersionOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'lp_point_config_version',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface UserYtBaseArguments {
    config: RawTransactionArgument<string>;
    owner: RawTransactionArgument<string>;
}
export interface UserYtBaseOptions {
    package?: string;
    arguments: UserYtBaseArguments | [
        config: RawTransactionArgument<string>,
        owner: RawTransactionArgument<string>
    ];
}
export function userYtBase(options: UserYtBaseOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        'address'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "owner"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'user_yt_base',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface YtPositionBaseArguments {
    config: RawTransactionArgument<string>;
    positionId: RawTransactionArgument<string>;
}
export interface YtPositionBaseOptions {
    package?: string;
    arguments: YtPositionBaseArguments | [
        config: RawTransactionArgument<string>,
        positionId: RawTransactionArgument<string>
    ];
}
export function ytPositionBase(options: YtPositionBaseOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "positionId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'yt_position_base',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface YtPositionAmountArguments {
    config: RawTransactionArgument<string>;
    positionId: RawTransactionArgument<string>;
}
export interface YtPositionAmountOptions {
    package?: string;
    arguments: YtPositionAmountArguments | [
        config: RawTransactionArgument<string>,
        positionId: RawTransactionArgument<string>
    ];
}
export function ytPositionAmount(options: YtPositionAmountOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "positionId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'yt_position_amount',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface YtMarketBaseArguments {
    config: RawTransactionArgument<string>;
    marketId: RawTransactionArgument<string>;
}
export interface YtMarketBaseOptions {
    package?: string;
    arguments: YtMarketBaseArguments | [
        config: RawTransactionArgument<string>,
        marketId: RawTransactionArgument<string>
    ];
}
export function ytMarketBase(options: YtMarketBaseOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "marketId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'yt_market_base',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface YtMarketAmountArguments {
    config: RawTransactionArgument<string>;
    marketId: RawTransactionArgument<string>;
}
export interface YtMarketAmountOptions {
    package?: string;
    arguments: YtMarketAmountArguments | [
        config: RawTransactionArgument<string>,
        marketId: RawTransactionArgument<string>
    ];
}
export function ytMarketAmount(options: YtMarketAmountOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "marketId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'yt_market_amount',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface LpPendingPointsArguments {
    state: RawTransactionArgument<string>;
    positionId: RawTransactionArgument<string>;
}
export interface LpPendingPointsOptions {
    package?: string;
    arguments: LpPendingPointsArguments | [
        state: RawTransactionArgument<string>,
        positionId: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function lpPendingPoints(options: LpPendingPointsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-extensions';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["state", "positionId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'liquidlink_points',
        function: 'lp_pending_points',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}