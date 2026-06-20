/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/** collector - ephemeral quote bag for one market and one SY type. */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as vec_map from './deps/sui/vec_map.js';
import * as type_name from './deps/std/type_name.js';
const $moduleName = 'jitter/jitter-oracle::collector';
export const SourceQuote = new MoveStruct({ name: `${$moduleName}::SourceQuote`, fields: {
        sy_index: bcs.u128(),
        updated_at: bcs.u64()
    } });
export const PriceCollector = new MoveStruct({ name: `${$moduleName}::PriceCollector<phantom SY>`, fields: {
        market_id: bcs.Address,
        quotes: vec_map.VecMap(type_name.TypeName, SourceQuote)
    } });
export interface NewArguments {
    marketId: RawTransactionArgument<string>;
}
export interface NewOptions {
    package?: string;
    arguments: NewArguments | [
        marketId: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Create an empty collector for one market. */
export function _new(options: NewOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        '0x2::object::ID'
    ] satisfies (string | null)[];
    const parameterNames = ["marketId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'collector',
        function: 'new',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface CollectArguments {
    collector: RawTransactionArgument<string>;
    syIndex: RawTransactionArgument<number | bigint>;
    updatedAt: RawTransactionArgument<number | bigint>;
}
export interface CollectOptions {
    package?: string;
    arguments: CollectArguments | [
        collector: RawTransactionArgument<string>,
        syIndex: RawTransactionArgument<number | bigint>,
        updatedAt: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string,
        string
    ];
}
/** Insert or replace the quote for one source rule. */
export function collect(options: CollectOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null,
        'u128',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["collector", "syIndex", "updatedAt"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'collector',
        function: 'collect',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface MarketIdArguments {
    collector: RawTransactionArgument<string>;
}
export interface MarketIdOptions {
    package?: string;
    arguments: MarketIdArguments | [
        collector: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Return the market that this collector is scoped to. */
export function marketId(options: MarketIdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["collector"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'collector',
        function: 'market_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ContentsArguments {
    collector: RawTransactionArgument<string>;
}
export interface ContentsOptions {
    package?: string;
    arguments: ContentsArguments | [
        collector: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Return all collected quotes keyed by source type. */
export function contents(options: ContentsOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["collector"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'collector',
        function: 'contents',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ContainsSourceArguments {
    collector: RawTransactionArgument<string>;
}
export interface ContainsSourceOptions {
    package?: string;
    arguments: ContainsSourceArguments | [
        collector: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
/** Return whether a concrete source has already provided a quote. */
export function containsSource(options: ContainsSourceOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["collector"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'collector',
        function: 'contains_source',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SyIndexArguments {
    quote: RawTransactionArgument<string>;
}
export interface SyIndexOptions {
    package?: string;
    arguments: SyIndexArguments | [
        quote: RawTransactionArgument<string>
    ];
}
/** Return the quoted SY index from one source sample. */
export function syIndex(options: SyIndexOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["quote"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'collector',
        function: 'sy_index',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface UpdatedAtArguments {
    quote: RawTransactionArgument<string>;
}
export interface UpdatedAtOptions {
    package?: string;
    arguments: UpdatedAtArguments | [
        quote: RawTransactionArgument<string>
    ];
}
/** Return the update timestamp from one source sample. */
export function updatedAt(options: UpdatedAtOptions) {
    const packageAddress = options.package ?? 'jitter/jitter-oracle';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["quote"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'collector',
        function: 'updated_at',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}