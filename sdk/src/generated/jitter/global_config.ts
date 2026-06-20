/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * global_config - protocol-wide version and pause controls.
 * 
 * All mutable user flows should carry this shared object. The version check lets
 * governance disable old packages after a redeploy, while global and domain pauses
 * provide coarse-grained incident response without touching every market object.
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as vec_set from './deps/sui/vec_set.js';
const $moduleName = 'jitter/jitter::global_config';
export const DomainPause = new MoveStruct({ name: `${$moduleName}::DomainPause`, fields: {
        domain: bcs.vector(bcs.u8()),
        target: bcs.Address,
        has_target: bcs.bool(),
        paused: bcs.bool()
    } });
export const GlobalConfig = new MoveStruct({ name: `${$moduleName}::GlobalConfig`, fields: {
        id: bcs.Address,
        allowed_versions: vec_set.VecSet(bcs.u64()),
        global_paused: bcs.bool(),
        domain_pauses: bcs.vector(DomainPause)
    } });
export const GlobalConfigCreatedEvent = new MoveStruct({ name: `${$moduleName}::GlobalConfigCreatedEvent`, fields: {
        config_id: bcs.Address,
        allowed_versions: bcs.vector(bcs.u64())
    } });
export const GlobalConfigVersionUpdatedEvent = new MoveStruct({ name: `${$moduleName}::GlobalConfigVersionUpdatedEvent`, fields: {
        config_id: bcs.Address,
        version: bcs.u64(),
        allowed: bcs.bool()
    } });
export const GlobalPauseUpdatedEvent = new MoveStruct({ name: `${$moduleName}::GlobalPauseUpdatedEvent`, fields: {
        config_id: bcs.Address,
        paused: bcs.bool()
    } });
export const DomainPauseUpdatedEvent = new MoveStruct({ name: `${$moduleName}::DomainPauseUpdatedEvent`, fields: {
        config_id: bcs.Address,
        domain: bcs.vector(bcs.u8()),
        target: bcs.option(bcs.Address),
        paused: bcs.bool()
    } });
export interface AllowVersionByAdminArguments {
    config: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
    version: RawTransactionArgument<number | bigint>;
}
export interface AllowVersionByAdminOptions {
    package?: string;
    arguments: AllowVersionByAdminArguments | [
        config: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>,
        version: RawTransactionArgument<number | bigint>
    ];
}
export function allowVersionByAdmin(options: AllowVersionByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "AdminCap", "version"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'allow_version_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface DisallowVersionByAdminArguments {
    config: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
    version: RawTransactionArgument<number | bigint>;
}
export interface DisallowVersionByAdminOptions {
    package?: string;
    arguments: DisallowVersionByAdminArguments | [
        config: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>,
        version: RawTransactionArgument<number | bigint>
    ];
}
export function disallowVersionByAdmin(options: DisallowVersionByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "AdminCap", "version"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'disallow_version_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SetGlobalPauseByAdminArguments {
    config: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
    paused: RawTransactionArgument<boolean>;
}
export interface SetGlobalPauseByAdminOptions {
    package?: string;
    arguments: SetGlobalPauseByAdminArguments | [
        config: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>,
        paused: RawTransactionArgument<boolean>
    ];
}
export function setGlobalPauseByAdmin(options: SetGlobalPauseByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        'bool'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "AdminCap", "paused"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'set_global_pause_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SetDomainPauseByAdminArguments {
    config: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
    domain: RawTransactionArgument<Array<number>>;
    paused: RawTransactionArgument<boolean>;
}
export interface SetDomainPauseByAdminOptions {
    package?: string;
    arguments: SetDomainPauseByAdminArguments | [
        config: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>,
        domain: RawTransactionArgument<Array<number>>,
        paused: RawTransactionArgument<boolean>
    ];
}
export function setDomainPauseByAdmin(options: SetDomainPauseByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        'vector<u8>',
        'bool'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "AdminCap", "domain", "paused"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'set_domain_pause_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface SetTargetPauseByAdminArguments {
    config: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
    domain: RawTransactionArgument<Array<number>>;
    target: RawTransactionArgument<string>;
    paused: RawTransactionArgument<boolean>;
}
export interface SetTargetPauseByAdminOptions {
    package?: string;
    arguments: SetTargetPauseByAdminArguments | [
        config: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>,
        domain: RawTransactionArgument<Array<number>>,
        target: RawTransactionArgument<string>,
        paused: RawTransactionArgument<boolean>
    ];
}
export function setTargetPauseByAdmin(options: SetTargetPauseByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        'vector<u8>',
        '0x2::object::ID',
        'bool'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "AdminCap", "domain", "target", "paused"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'set_target_pause_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertCurrentArguments {
    config: RawTransactionArgument<string>;
}
export interface AssertCurrentOptions {
    package?: string;
    arguments: AssertCurrentArguments | [
        config: RawTransactionArgument<string>
    ];
}
export function assertCurrent(options: AssertCurrentOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["config"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'assert_current',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertPoolActiveArguments {
    config: RawTransactionArgument<string>;
    poolId: RawTransactionArgument<string>;
}
export interface AssertPoolActiveOptions {
    package?: string;
    arguments: AssertPoolActiveArguments | [
        config: RawTransactionArgument<string>,
        poolId: RawTransactionArgument<string>
    ];
}
export function assertPoolActive(options: AssertPoolActiveOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "poolId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'assert_pool_active',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertPyStateActiveArguments {
    config: RawTransactionArgument<string>;
    stateId: RawTransactionArgument<string>;
}
export interface AssertPyStateActiveOptions {
    package?: string;
    arguments: AssertPyStateActiveArguments | [
        config: RawTransactionArgument<string>,
        stateId: RawTransactionArgument<string>
    ];
}
export function assertPyStateActive(options: AssertPyStateActiveOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "stateId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'assert_py_state_active',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertOrderbookActiveArguments {
    config: RawTransactionArgument<string>;
    orderbookId: RawTransactionArgument<string>;
}
export interface AssertOrderbookActiveOptions {
    package?: string;
    arguments: AssertOrderbookActiveArguments | [
        config: RawTransactionArgument<string>,
        orderbookId: RawTransactionArgument<string>
    ];
}
export function assertOrderbookActive(options: AssertOrderbookActiveOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "orderbookId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'assert_orderbook_active',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertDomainActiveArguments {
    config: RawTransactionArgument<string>;
    domain: RawTransactionArgument<Array<number>>;
    abortCode: RawTransactionArgument<number | bigint>;
}
export interface AssertDomainActiveOptions {
    package?: string;
    arguments: AssertDomainActiveArguments | [
        config: RawTransactionArgument<string>,
        domain: RawTransactionArgument<Array<number>>,
        abortCode: RawTransactionArgument<number | bigint>
    ];
}
export function assertDomainActive(options: AssertDomainActiveOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'vector<u8>',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "domain", "abortCode"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'assert_domain_active',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AssertTargetActiveArguments {
    config: RawTransactionArgument<string>;
    domain: RawTransactionArgument<Array<number>>;
    target: RawTransactionArgument<string>;
    abortCode: RawTransactionArgument<number | bigint>;
}
export interface AssertTargetActiveOptions {
    package?: string;
    arguments: AssertTargetActiveArguments | [
        config: RawTransactionArgument<string>,
        domain: RawTransactionArgument<Array<number>>,
        target: RawTransactionArgument<string>,
        abortCode: RawTransactionArgument<number | bigint>
    ];
}
export function assertTargetActive(options: AssertTargetActiveOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'vector<u8>',
        '0x2::object::ID',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "domain", "target", "abortCode"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'assert_target_active',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface IdArguments {
    config: RawTransactionArgument<string>;
}
export interface IdOptions {
    package?: string;
    arguments: IdArguments | [
        config: RawTransactionArgument<string>
    ];
}
export function id(options: IdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["config"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface CurrentVersionOptions {
    package?: string;
    arguments?: [
    ];
}
export function currentVersion(options: CurrentVersionOptions = {}) {
    const packageAddress = options.package ?? 'jitter/jitter';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'current_version',
    });
}
export interface VersionAllowedArguments {
    config: RawTransactionArgument<string>;
    version: RawTransactionArgument<number | bigint>;
}
export interface VersionAllowedOptions {
    package?: string;
    arguments: VersionAllowedArguments | [
        config: RawTransactionArgument<string>,
        version: RawTransactionArgument<number | bigint>
    ];
}
export function versionAllowed(options: VersionAllowedOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "version"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'version_allowed',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface AllowedVersionsArguments {
    config: RawTransactionArgument<string>;
}
export interface AllowedVersionsOptions {
    package?: string;
    arguments: AllowedVersionsArguments | [
        config: RawTransactionArgument<string>
    ];
}
export function allowedVersions(options: AllowedVersionsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["config"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'allowed_versions',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface GlobalPausedArguments {
    config: RawTransactionArgument<string>;
}
export interface GlobalPausedOptions {
    package?: string;
    arguments: GlobalPausedArguments | [
        config: RawTransactionArgument<string>
    ];
}
export function globalPaused(options: GlobalPausedOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["config"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'global_paused',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PoolPausedArguments {
    config: RawTransactionArgument<string>;
}
export interface PoolPausedOptions {
    package?: string;
    arguments: PoolPausedArguments | [
        config: RawTransactionArgument<string>
    ];
}
export function poolPaused(options: PoolPausedOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["config"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'pool_paused',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PyStatePausedArguments {
    config: RawTransactionArgument<string>;
}
export interface PyStatePausedOptions {
    package?: string;
    arguments: PyStatePausedArguments | [
        config: RawTransactionArgument<string>
    ];
}
export function pyStatePaused(options: PyStatePausedOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["config"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'py_state_paused',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface OrderbookPausedArguments {
    config: RawTransactionArgument<string>;
}
export interface OrderbookPausedOptions {
    package?: string;
    arguments: OrderbookPausedArguments | [
        config: RawTransactionArgument<string>
    ];
}
export function orderbookPaused(options: OrderbookPausedOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["config"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'orderbook_paused',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface DomainPausedArguments {
    config: RawTransactionArgument<string>;
    domain: RawTransactionArgument<Array<number>>;
}
export interface DomainPausedOptions {
    package?: string;
    arguments: DomainPausedArguments | [
        config: RawTransactionArgument<string>,
        domain: RawTransactionArgument<Array<number>>
    ];
}
export function domainPaused(options: DomainPausedOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'vector<u8>'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "domain"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'domain_paused',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface TargetPausedArguments {
    config: RawTransactionArgument<string>;
    domain: RawTransactionArgument<Array<number>>;
    target: RawTransactionArgument<string>;
}
export interface TargetPausedOptions {
    package?: string;
    arguments: TargetPausedArguments | [
        config: RawTransactionArgument<string>,
        domain: RawTransactionArgument<Array<number>>,
        target: RawTransactionArgument<string>
    ];
}
export function targetPaused(options: TargetPausedOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'vector<u8>',
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "domain", "target"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'target_paused',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface PausedArguments {
    config: RawTransactionArgument<string>;
    domain: RawTransactionArgument<Array<number>>;
    target: RawTransactionArgument<string>;
}
export interface PausedOptions {
    package?: string;
    arguments: PausedArguments | [
        config: RawTransactionArgument<string>,
        domain: RawTransactionArgument<Array<number>>,
        target: RawTransactionArgument<string>
    ];
}
export function paused(options: PausedOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        'vector<u8>',
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["config", "domain", "target"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'global_config',
        function: 'paused',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}