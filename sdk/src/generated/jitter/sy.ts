/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs, type BcsType } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as type_name from './deps/std/type_name.js';
import * as type_name_1 from './deps/std/type_name.js';
import * as vec_map from './deps/sui/vec_map.js';
import * as type_name_2 from './deps/std/type_name.js';
import * as type_name_3 from './deps/std/type_name.js';
import * as type_name_4 from './deps/std/type_name.js';
import * as type_name_5 from './deps/std/type_name.js';
import * as type_name_6 from './deps/std/type_name.js';
const $moduleName = 'jitter/jitter::sy';
export const SyInfo = new MoveStruct({ name: `${$moduleName}::SyInfo`, fields: {
        underlying_type: type_name.TypeName,
        sign_type: type_name_1.TypeName
    } });
export const SyState = new MoveStruct({ name: `${$moduleName}::SyState`, fields: {
        id: bcs.Address,
        sy_info: vec_map.VecMap(type_name_2.TypeName, SyInfo)
    } });
export const MintSyRequest = new MoveStruct({ name: `${$moduleName}::MintSyRequest<phantom SY>`, fields: {
        market_id: bcs.Address,
        sy_amount: bcs.u64(),
        amount: bcs.u64()
    } });
export const BurnSyRequest = new MoveStruct({ name: `${$moduleName}::BurnSyRequest<phantom SY>`, fields: {
        market_id: bcs.Address,
        sy_amount: bcs.u64(),
        amount: bcs.u64()
    } });
export const SyRegisteredEvent = new MoveStruct({ name: `${$moduleName}::SyRegisteredEvent`, fields: {
        sy_type: type_name_3.TypeName,
        underlying_type: type_name_4.TypeName,
        sign_type: type_name_5.TypeName
    } });
export const SyUnregisteredEvent = new MoveStruct({ name: `${$moduleName}::SyUnregisteredEvent`, fields: {
        sy_type: type_name_6.TypeName
    } });
export interface RegisterNewSyArguments {
    state: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
}
export interface RegisterNewSyOptions {
    package?: string;
    arguments: RegisterNewSyArguments | [
        state: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function registerNewSy(options: RegisterNewSyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state", "globalConfig", "AdminCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'sy',
        function: 'register_new_sy',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface UnregisterSyArguments {
    state: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    AdminCap: RawTransactionArgument<string>;
}
export interface UnregisterSyOptions {
    package?: string;
    arguments: UnregisterSyArguments | [
        state: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        AdminCap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/**
 * Remove an SY registration. Intended for deprecating a misconfigured adapter
 * before any liquidity is onboarded; new mints via this SY type will fail at
 * `destroy_mint_request` (no sign_type match), and callers holding outstanding
 * `MintSyRequest`/`BurnSyRequest` should be settled first. (audit finding M-2)
 */
export function unregisterSy(options: UnregisterSyOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["state", "globalConfig", "AdminCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'sy',
        function: 'unregister_sy',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface MintSyExactInArguments {
    market: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    priceInfo: RawTransactionArgument<string>;
    exactIn: RawTransactionArgument<number | bigint>;
}
export interface MintSyExactInOptions {
    package?: string;
    arguments: MintSyExactInArguments | [
        market: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        priceInfo: RawTransactionArgument<string>,
        exactIn: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function mintSyExactIn(options: MintSyExactInOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        'u64',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["market", "globalConfig", "priceInfo", "exactIn"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'sy',
        function: 'mint_sy_exact_in',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface BurnSyExactInArguments {
    market: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    priceInfo: RawTransactionArgument<string>;
    syIn: RawTransactionArgument<string>;
}
export interface BurnSyExactInOptions {
    package?: string;
    arguments: BurnSyExactInArguments | [
        market: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        priceInfo: RawTransactionArgument<string>,
        syIn: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function burnSyExactIn(options: BurnSyExactInOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["market", "globalConfig", "priceInfo", "syIn"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'sy',
        function: 'burn_sy_exact_in',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface GetMintRequestAmountArguments {
    request: RawTransactionArgument<string>;
}
export interface GetMintRequestAmountOptions {
    package?: string;
    arguments: GetMintRequestAmountArguments | [
        request: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function getMintRequestAmount(options: GetMintRequestAmountOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["request"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'sy',
        function: 'get_mint_request_amount',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface GetMintRequestSyAmountArguments {
    request: RawTransactionArgument<string>;
}
export interface GetMintRequestSyAmountOptions {
    package?: string;
    arguments: GetMintRequestSyAmountArguments | [
        request: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function getMintRequestSyAmount(options: GetMintRequestSyAmountOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["request"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'sy',
        function: 'get_mint_request_sy_amount',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface GetMintRequestMarketIdArguments {
    request: RawTransactionArgument<string>;
}
export interface GetMintRequestMarketIdOptions {
    package?: string;
    arguments: GetMintRequestMarketIdArguments | [
        request: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function getMintRequestMarketId(options: GetMintRequestMarketIdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["request"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'sy',
        function: 'get_mint_request_market_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface GetBurnRequestAmountArguments {
    request: RawTransactionArgument<string>;
}
export interface GetBurnRequestAmountOptions {
    package?: string;
    arguments: GetBurnRequestAmountArguments | [
        request: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function getBurnRequestAmount(options: GetBurnRequestAmountOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["request"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'sy',
        function: 'get_burn_request_amount',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface GetBurnRequestSyAmountArguments {
    request: RawTransactionArgument<string>;
}
export interface GetBurnRequestSyAmountOptions {
    package?: string;
    arguments: GetBurnRequestSyAmountArguments | [
        request: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function getBurnRequestSyAmount(options: GetBurnRequestSyAmountOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["request"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'sy',
        function: 'get_burn_request_sy_amount',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface GetBurnRequestMarketIdArguments {
    request: RawTransactionArgument<string>;
}
export interface GetBurnRequestMarketIdOptions {
    package?: string;
    arguments: GetBurnRequestMarketIdArguments | [
        request: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function getBurnRequestMarketId(options: GetBurnRequestMarketIdOptions) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["request"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'sy',
        function: 'get_burn_request_market_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface DestroyMintRequestArguments<Sign extends BcsType<any>> {
    request: RawTransactionArgument<string>;
    Sign: RawTransactionArgument<Sign>;
    syState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
}
export interface DestroyMintRequestOptions<Sign extends BcsType<any>> {
    package?: string;
    arguments: DestroyMintRequestArguments<Sign> | [
        request: RawTransactionArgument<string>,
        Sign: RawTransactionArgument<Sign>,
        syState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
export function destroyMintRequest<Sign extends BcsType<any>>(options: DestroyMintRequestOptions<Sign>) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        `${options.typeArguments[1]}`,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["request", "Sign", "syState", "globalConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'sy',
        function: 'destroy_mint_request',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface DestroyBurnRequestArguments<Sign extends BcsType<any>> {
    request: RawTransactionArgument<string>;
    Sign: RawTransactionArgument<Sign>;
    syState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
}
export interface DestroyBurnRequestOptions<Sign extends BcsType<any>> {
    package?: string;
    arguments: DestroyBurnRequestArguments<Sign> | [
        request: RawTransactionArgument<string>,
        Sign: RawTransactionArgument<Sign>,
        syState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
export function destroyBurnRequest<Sign extends BcsType<any>>(options: DestroyBurnRequestOptions<Sign>) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        `${options.typeArguments[1]}`,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["request", "Sign", "syState", "globalConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'sy',
        function: 'destroy_burn_request',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface CancelBurnRequestArguments<Sign extends BcsType<any>> {
    request: RawTransactionArgument<string>;
    Sign: RawTransactionArgument<Sign>;
    syState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
}
export interface CancelBurnRequestOptions<Sign extends BcsType<any>> {
    package?: string;
    arguments: CancelBurnRequestArguments<Sign> | [
        request: RawTransactionArgument<string>,
        Sign: RawTransactionArgument<Sign>,
        syState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function cancelBurnRequest<Sign extends BcsType<any>>(options: CancelBurnRequestOptions<Sign>) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        `${options.typeArguments[3]}`,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["request", "Sign", "syState", "globalConfig", "market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'sy',
        function: 'cancel_burn_request',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface BurnEscrowedSyArguments<Sign extends BcsType<any>> {
    syCoin: RawTransactionArgument<string>;
    Sign: RawTransactionArgument<Sign>;
    syState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
}
export interface BurnEscrowedSyOptions<Sign extends BcsType<any>> {
    package?: string;
    arguments: BurnEscrowedSyArguments<Sign> | [
        syCoin: RawTransactionArgument<string>,
        Sign: RawTransactionArgument<Sign>,
        syState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function burnEscrowedSy<Sign extends BcsType<any>>(options: BurnEscrowedSyOptions<Sign>) {
    const packageAddress = options.package ?? 'jitter/jitter';
    const argumentsTypes = [
        null,
        `${options.typeArguments[3]}`,
        null,
        null,
        null
    ] satisfies (string | null)[];
    const parameterNames = ["syCoin", "Sign", "syState", "globalConfig", "market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'sy',
        function: 'burn_escrowed_sy',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}