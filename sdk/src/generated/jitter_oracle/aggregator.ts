/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/** aggregator - market-scoped oracle policy and aggregation execution. */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as type_name from './deps/std/type_name.js';
import * as vec_map from './deps/sui/vec_map.js';
import * as type_name_1 from './deps/std/type_name.js';
const $moduleName = 'jitter/jitter-oracle::aggregator';
export const SourceRule = new MoveStruct({ name: `${$moduleName}::SourceRule`, fields: {
        weight_bps: bcs.u16(),
        required: bcs.bool(),
        enabled: bcs.bool()
    } });
export const AggregatorCreatedEvent = new MoveStruct({ name: `${$moduleName}::AggregatorCreatedEvent`, fields: {
        aggregator_id: bcs.Address,
        market_id: bcs.Address,
        max_staleness_ms: bcs.u64(),
        min_total_weight_bps: bcs.u64(),
        outlier_tolerance_bps: bcs.u64()
    } });
export const AggregatorPolicyUpdatedEvent = new MoveStruct({ name: `${$moduleName}::AggregatorPolicyUpdatedEvent`, fields: {
        aggregator_id: bcs.Address,
        enabled: bcs.bool(),
        max_staleness_ms: bcs.u64(),
        min_total_weight_bps: bcs.u64(),
        outlier_tolerance_bps: bcs.u64()
    } });
export const SourceRuleUpdatedEvent = new MoveStruct({ name: `${$moduleName}::SourceRuleUpdatedEvent`, fields: {
        aggregator_id: bcs.Address,
        source_type: type_name.TypeName,
        weight_bps: bcs.u16(),
        required: bcs.bool(),
        enabled: bcs.bool()
    } });
export const PriceAggregatedEvent = new MoveStruct({ name: `${$moduleName}::PriceAggregatedEvent`, fields: {
        aggregator_id: bcs.Address,
        market_id: bcs.Address,
        source_count: bcs.u64(),
        total_weight_bps: bcs.u64(),
        sy_index: bcs.u128(),
        updated_at: bcs.u64()
    } });
export const PriceAggregator = new MoveStruct({ name: `${$moduleName}::PriceAggregator<phantom SY>`, fields: {
        id: bcs.Address,
        market_id: bcs.Address,
        enabled: bcs.bool(),
        max_staleness_ms: bcs.u64(),
        source_rules: vec_map.VecMap(type_name_1.TypeName, SourceRule),
        min_total_weight_bps: bcs.u64(),
        outlier_tolerance_bps: bcs.u64()
    } });
export interface CreateAggregatorBy_ACLArguments {
    acl: RawTransactionArgument<string>;
    marketId: RawTransactionArgument<string>;
    maxStalenessMs: RawTransactionArgument<number | bigint>;
    minTotalWeightBps: RawTransactionArgument<number | bigint>;
    outlierToleranceBps: RawTransactionArgument<number | bigint>;
}
export interface CreateAggregatorBy_ACLOptions {
    package?: string;
    arguments: CreateAggregatorBy_ACLArguments | [
        acl: RawTransactionArgument<string>,
        marketId: RawTransactionArgument<string>,
        maxStalenessMs: RawTransactionArgument<number | bigint>,
        minTotalWeightBps: RawTransactionArgument<number | bigint>,
        outlierToleranceBps: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
/** Create a new market-scoped aggregator. */
export function createAggregatorBy_ACL(options: CreateAggregatorBy_ACLOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null,
        '0x2::object::ID',
        'u64',
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["acl", "marketId", "maxStalenessMs", "minTotalWeightBps", "outlierToleranceBps"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'aggregator',
        function: 'create_aggregator_by_ACL',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface CreateAggregatorByAdminCapArguments {
    AdminCap: RawTransactionArgument<string>;
    marketId: RawTransactionArgument<string>;
    maxStalenessMs: RawTransactionArgument<number | bigint>;
    minTotalWeightBps: RawTransactionArgument<number | bigint>;
    outlierToleranceBps: RawTransactionArgument<number | bigint>;
}
export interface CreateAggregatorByAdminCapOptions {
    package?: string;
    arguments: CreateAggregatorByAdminCapArguments | [
        AdminCap: RawTransactionArgument<string>,
        marketId: RawTransactionArgument<string>,
        maxStalenessMs: RawTransactionArgument<number | bigint>,
        minTotalWeightBps: RawTransactionArgument<number | bigint>,
        outlierToleranceBps: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
export function createAggregatorByAdminCap(options: CreateAggregatorByAdminCapOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null,
        '0x2::object::ID',
        'u64',
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["AdminCap", "marketId", "maxStalenessMs", "minTotalWeightBps", "outlierToleranceBps"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'aggregator',
        function: 'create_aggregator_by_admin_cap',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SetEnabledArguments {
    acl: RawTransactionArgument<string>;
    aggregator: RawTransactionArgument<string>;
    enabled: RawTransactionArgument<boolean>;
}
export interface SetEnabledOptions {
    package?: string;
    arguments: SetEnabledArguments | [
        acl: RawTransactionArgument<string>,
        aggregator: RawTransactionArgument<string>,
        enabled: RawTransactionArgument<boolean>
    ];
    typeArguments: [
        string
    ];
}
export function setEnabled(options: SetEnabledOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null,
        null,
        'bool'
    ] satisfies (string | null)[];
    const parameterNames = ["acl", "aggregator", "enabled"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'aggregator',
        function: 'set_enabled',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SetMaxStalenessMsArguments {
    acl: RawTransactionArgument<string>;
    aggregator: RawTransactionArgument<string>;
    maxStalenessMs: RawTransactionArgument<number | bigint>;
}
export interface SetMaxStalenessMsOptions {
    package?: string;
    arguments: SetMaxStalenessMsArguments | [
        acl: RawTransactionArgument<string>,
        aggregator: RawTransactionArgument<string>,
        maxStalenessMs: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
export function setMaxStalenessMs(options: SetMaxStalenessMsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null,
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["acl", "aggregator", "maxStalenessMs"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'aggregator',
        function: 'set_max_staleness_ms',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SetMinTotalWeightBpsArguments {
    acl: RawTransactionArgument<string>;
    aggregator: RawTransactionArgument<string>;
    minTotalWeightBps: RawTransactionArgument<number | bigint>;
}
export interface SetMinTotalWeightBpsOptions {
    package?: string;
    arguments: SetMinTotalWeightBpsArguments | [
        acl: RawTransactionArgument<string>,
        aggregator: RawTransactionArgument<string>,
        minTotalWeightBps: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
export function setMinTotalWeightBps(options: SetMinTotalWeightBpsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null,
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["acl", "aggregator", "minTotalWeightBps"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'aggregator',
        function: 'set_min_total_weight_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SetOutlierToleranceBpsArguments {
    acl: RawTransactionArgument<string>;
    aggregator: RawTransactionArgument<string>;
    outlierToleranceBps: RawTransactionArgument<number | bigint>;
}
export interface SetOutlierToleranceBpsOptions {
    package?: string;
    arguments: SetOutlierToleranceBpsArguments | [
        acl: RawTransactionArgument<string>,
        aggregator: RawTransactionArgument<string>,
        outlierToleranceBps: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string
    ];
}
export function setOutlierToleranceBps(options: SetOutlierToleranceBpsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null,
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["acl", "aggregator", "outlierToleranceBps"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'aggregator',
        function: 'set_outlier_tolerance_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SetSourceRuleArguments {
    acl: RawTransactionArgument<string>;
    aggregator: RawTransactionArgument<string>;
    weightBps: RawTransactionArgument<number>;
    required: RawTransactionArgument<boolean>;
    enabled: RawTransactionArgument<boolean>;
}
export interface SetSourceRuleOptions {
    package?: string;
    arguments: SetSourceRuleArguments | [
        acl: RawTransactionArgument<string>,
        aggregator: RawTransactionArgument<string>,
        weightBps: RawTransactionArgument<number>,
        required: RawTransactionArgument<boolean>,
        enabled: RawTransactionArgument<boolean>
    ];
    typeArguments: [
        string,
        string
    ];
}
/** Configure one source rule for this aggregator. */
export function setSourceRule(options: SetSourceRuleOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null,
        null,
        'u16',
        'bool',
        'bool'
    ] satisfies (string | null)[];
    const parameterNames = ["acl", "aggregator", "weightBps", "required", "enabled"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'aggregator',
        function: 'set_source_rule',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RemoveSourceRuleArguments {
    acl: RawTransactionArgument<string>;
    aggregator: RawTransactionArgument<string>;
}
export interface RemoveSourceRuleOptions {
    package?: string;
    arguments: RemoveSourceRuleArguments | [
        acl: RawTransactionArgument<string>,
        aggregator: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
/** Remove one source rule from this aggregator. */
export function removeSourceRule(options: RemoveSourceRuleOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["acl", "aggregator"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'aggregator',
        function: 'remove_source_rule',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface AggregateArguments {
    aggregator: RawTransactionArgument<string>;
    collector: RawTransactionArgument<string>;
}
export interface AggregateOptions {
    package?: string;
    arguments: AggregateArguments | [
        aggregator: RawTransactionArgument<string>,
        collector: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Aggregate one collector into the final market `PriceInfo`. */
export function aggregate(options: AggregateOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["aggregator", "collector"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'aggregator',
        function: 'aggregate',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface MarketIdArguments {
    aggregator: RawTransactionArgument<string>;
}
export interface MarketIdOptions {
    package?: string;
    arguments: MarketIdArguments | [
        aggregator: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function marketId(options: MarketIdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["aggregator"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'aggregator',
        function: 'market_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EnabledArguments {
    aggregator: RawTransactionArgument<string>;
}
export interface EnabledOptions {
    package?: string;
    arguments: EnabledArguments | [
        aggregator: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function enabled(options: EnabledOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["aggregator"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'aggregator',
        function: 'enabled',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface MaxStalenessMsArguments {
    aggregator: RawTransactionArgument<string>;
}
export interface MaxStalenessMsOptions {
    package?: string;
    arguments: MaxStalenessMsArguments | [
        aggregator: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function maxStalenessMs(options: MaxStalenessMsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["aggregator"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'aggregator',
        function: 'max_staleness_ms',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface MinTotalWeightBpsArguments {
    aggregator: RawTransactionArgument<string>;
}
export interface MinTotalWeightBpsOptions {
    package?: string;
    arguments: MinTotalWeightBpsArguments | [
        aggregator: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function minTotalWeightBps(options: MinTotalWeightBpsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["aggregator"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'aggregator',
        function: 'min_total_weight_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface OutlierToleranceBpsArguments {
    aggregator: RawTransactionArgument<string>;
}
export interface OutlierToleranceBpsOptions {
    package?: string;
    arguments: OutlierToleranceBpsArguments | [
        aggregator: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function outlierToleranceBps(options: OutlierToleranceBpsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["aggregator"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'aggregator',
        function: 'outlier_tolerance_bps',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SourceRulesArguments {
    aggregator: RawTransactionArgument<string>;
}
export interface SourceRulesOptions {
    package?: string;
    arguments: SourceRulesArguments | [
        aggregator: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function sourceRules(options: SourceRulesOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["aggregator"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'aggregator',
        function: 'source_rules',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}