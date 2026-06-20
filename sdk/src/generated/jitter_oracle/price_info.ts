/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/** price_info - one-shot oracle data consumed by the Jitter core flows. */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
const $moduleName = 'jitter/jitter-oracle::price_info';
export const PriceInfo = new MoveStruct({ name: `${$moduleName}::PriceInfo<phantom SY>`, fields: {
        market_id: bcs.Address,
        sy_index: bcs.u128(),
        updated_at: bcs.u64(),
        created_at: bcs.u64(),
        max_staleness_ms: bcs.u64()
    } });
export const PriceInfoConsumedEvent = new MoveStruct({ name: `${$moduleName}::PriceInfoConsumedEvent`, fields: {
        market_id: bcs.Address,
        sy_index: bcs.u128(),
        updated_at: bcs.u64()
    } });
export interface ConsumeArguments {
    priceInfo: RawTransactionArgument<string>;
    expectedMarketId: RawTransactionArgument<string>;
}
export interface ConsumeOptions {
    package?: string;
    arguments: ConsumeArguments | [
        priceInfo: RawTransactionArgument<string>,
        expectedMarketId: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function consume(options: ConsumeOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null,
        '0x2::object::ID',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["priceInfo", "expectedMarketId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'price_info',
        function: 'consume',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface MarketIdArguments {
    priceInfo: RawTransactionArgument<string>;
}
export interface MarketIdOptions {
    package?: string;
    arguments: MarketIdArguments | [
        priceInfo: RawTransactionArgument<string>
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
    const parameterNames = ["priceInfo"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'price_info',
        function: 'market_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SyIndexArguments {
    priceInfo: RawTransactionArgument<string>;
}
export interface SyIndexOptions {
    package?: string;
    arguments: SyIndexArguments | [
        priceInfo: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function syIndex(options: SyIndexOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["priceInfo"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'price_info',
        function: 'sy_index',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface UpdatedAtArguments {
    priceInfo: RawTransactionArgument<string>;
}
export interface UpdatedAtOptions {
    package?: string;
    arguments: UpdatedAtArguments | [
        priceInfo: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function updatedAt(options: UpdatedAtOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["priceInfo"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'price_info',
        function: 'updated_at',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface CreatedAtArguments {
    priceInfo: RawTransactionArgument<string>;
}
export interface CreatedAtOptions {
    package?: string;
    arguments: CreatedAtArguments | [
        priceInfo: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function createdAt(options: CreatedAtOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["priceInfo"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'price_info',
        function: 'created_at',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface MaxStalenessMsArguments {
    priceInfo: RawTransactionArgument<string>;
}
export interface MaxStalenessMsOptions {
    package?: string;
    arguments: MaxStalenessMsArguments | [
        priceInfo: RawTransactionArgument<string>
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
    const parameterNames = ["priceInfo"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'price_info',
        function: 'max_staleness_ms',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}