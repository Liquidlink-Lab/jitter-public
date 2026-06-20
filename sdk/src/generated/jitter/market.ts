/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * market - canonical container for a single Jitter market
 * 
 * A market owns the treasury capabilities for the SY/PT/YT token trio and keeps
 * the core metadata that other protocol modules need to mint, burn, and settle
 * positions against the same market object.
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as type_name from './deps/std/type_name.js';
import * as type_name_1 from './deps/std/type_name.js';
import * as type_name_2 from './deps/std/type_name.js';
import * as coin from './deps/sui/coin.js';
import * as coin_1 from './deps/sui/coin.js';
import * as coin_2 from './deps/sui/coin.js';
import * as type_name_3 from './deps/std/type_name.js';
import * as type_name_4 from './deps/std/type_name.js';
import * as type_name_5 from './deps/std/type_name.js';
const $moduleName = 'jitter/jitter::market';
export const Market = new MoveStruct({ name: `${$moduleName}::Market<phantom SY, phantom PT, phantom YT>`, fields: {
        id: bcs.Address,
        expiry: bcs.u64(),
        sy_type: type_name.TypeName,
        pt_type: type_name_1.TypeName,
        yt_type: type_name_2.TypeName,
        sy_treasury: coin.TreasuryCap,
        pt_treasury: coin_1.TreasuryCap,
        yt_treasury: coin_2.TreasuryCap
    } });
export const MarketCreatedEvent = new MoveStruct({ name: `${$moduleName}::MarketCreatedEvent`, fields: {
        market_id: bcs.Address,
        expiry: bcs.u64(),
        created_by: bcs.Address,
        sy_type: type_name_3.TypeName,
        pt_type: type_name_4.TypeName,
        yt_type: type_name_5.TypeName
    } });
export interface CreateByAdminCapArguments {
    AdminCap: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    expiry: RawTransactionArgument<number | bigint>;
    syTreasury: RawTransactionArgument<string>;
    ptTreasury: RawTransactionArgument<string>;
    ytTreasury: RawTransactionArgument<string>;
}
export interface CreateByAdminCapOptions {
    package?: string;
    arguments: CreateByAdminCapArguments | [
        AdminCap: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        expiry: RawTransactionArgument<number | bigint>,
        syTreasury: RawTransactionArgument<string>,
        ptTreasury: RawTransactionArgument<string>,
        ytTreasury: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function createByAdminCap(options: CreateByAdminCapOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        'u64',
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["AdminCap", "globalConfig", "expiry", "syTreasury", "ptTreasury", "ytTreasury"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'market',
        function: 'create_by_admin_cap',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface IdArguments {
    market: RawTransactionArgument<string>;
}
export interface IdOptions {
    package?: string;
    arguments: IdArguments | [
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function id(options: IdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'market',
        function: 'id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ExpiryArguments {
    market: RawTransactionArgument<string>;
}
export interface ExpiryOptions {
    package?: string;
    arguments: ExpiryArguments | [
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function expiry(options: ExpiryOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'market',
        function: 'expiry',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SyTypeNameArguments {
    market: RawTransactionArgument<string>;
}
export interface SyTypeNameOptions {
    package?: string;
    arguments: SyTypeNameArguments | [
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function syTypeName(options: SyTypeNameOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'market',
        function: 'sy_type_name',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface PtTypeNameArguments {
    market: RawTransactionArgument<string>;
}
export interface PtTypeNameOptions {
    package?: string;
    arguments: PtTypeNameArguments | [
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function ptTypeName(options: PtTypeNameOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'market',
        function: 'pt_type_name',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface YtTypeNameArguments {
    market: RawTransactionArgument<string>;
}
export interface YtTypeNameOptions {
    package?: string;
    arguments: YtTypeNameArguments | [
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function ytTypeName(options: YtTypeNameOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'market',
        function: 'yt_type_name',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SyTreasuryIdArguments {
    market: RawTransactionArgument<string>;
}
export interface SyTreasuryIdOptions {
    package?: string;
    arguments: SyTreasuryIdArguments | [
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function syTreasuryId(options: SyTreasuryIdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'market',
        function: 'sy_treasury_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface PtTreasuryIdArguments {
    market: RawTransactionArgument<string>;
}
export interface PtTreasuryIdOptions {
    package?: string;
    arguments: PtTreasuryIdArguments | [
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function ptTreasuryId(options: PtTreasuryIdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'market',
        function: 'pt_treasury_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface YtTreasuryIdArguments {
    market: RawTransactionArgument<string>;
}
export interface YtTreasuryIdOptions {
    package?: string;
    arguments: YtTreasuryIdArguments | [
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function ytTreasuryId(options: YtTreasuryIdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'market',
        function: 'yt_treasury_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SyTotalSupplyArguments {
    market: RawTransactionArgument<string>;
}
export interface SyTotalSupplyOptions {
    package?: string;
    arguments: SyTotalSupplyArguments | [
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function syTotalSupply(options: SyTotalSupplyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'market',
        function: 'sy_total_supply',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface PtTotalSupplyArguments {
    market: RawTransactionArgument<string>;
}
export interface PtTotalSupplyOptions {
    package?: string;
    arguments: PtTotalSupplyArguments | [
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function ptTotalSupply(options: PtTotalSupplyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'market',
        function: 'pt_total_supply',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface YtTotalSupplyArguments {
    market: RawTransactionArgument<string>;
}
export interface YtTotalSupplyOptions {
    package?: string;
    arguments: YtTotalSupplyArguments | [
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function ytTotalSupply(options: YtTotalSupplyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'market',
        function: 'yt_total_supply',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}