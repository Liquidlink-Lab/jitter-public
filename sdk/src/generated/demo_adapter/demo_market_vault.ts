/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * demo_market_vault - balance-backed demo adapter state.
 * 
 * The package has one shared `DemoAdapter` object that represents the external
 * protocol integration, and one `DemoMarketVault` per Jitter market. Each market
 * keeps its own SY/PT/YT trio and expiry inside `jitter::market`, while the
 * adapter vault owns:
 * 
 * - underlying custody
 * - the current SY index snapshot
 * - the linear `SyAdapterCap<SY>` used to mint and burn this market's SY
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as balance from './deps/sui/balance.js';
const $moduleName = 'jitter/demo-adapter::demo_market_vault';
export const DemoMarketVault = new MoveStruct({ name: `${$moduleName}::DemoMarketVault<phantom Underlying, phantom SY, phantom PT, phantom YT>`, fields: {
        id: bcs.Address,
        market_id: bcs.Address,
        underlying_balance: balance.Balance,
        updated_at: bcs.u64()
    } });
export const MarketVaultCreatedEvent = new MoveStruct({ name: `${$moduleName}::MarketVaultCreatedEvent`, fields: {
        vault_id: bcs.Address,
        market_id: bcs.Address,
        created_by: bcs.Address
    } });
export const QuoteUpdatedEvent = new MoveStruct({ name: `${$moduleName}::QuoteUpdatedEvent`, fields: {
        market_id: bcs.Address,
        sy_index: bcs.u128(),
        updated_at: bcs.u64(),
        updater: bcs.Address
    } });
export const DepositEvent = new MoveStruct({ name: `${$moduleName}::DepositEvent`, fields: {
        market_id: bcs.Address,
        underlying_in: bcs.u64(),
        depositor: bcs.Address
    } });
export const RedeemEvent = new MoveStruct({ name: `${$moduleName}::RedeemEvent`, fields: {
        market_id: bcs.Address,
        underlying_out: bcs.u64(),
        redeemer: bcs.Address
    } });
export interface CreateMarketVaultBy_ACLArguments {
    acl: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
    initialSyIndex: RawTransactionArgument<number | bigint>;
}
export interface CreateMarketVaultBy_ACLOptions {
    package?: string;
    arguments: CreateMarketVaultBy_ACLArguments | [
        acl: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>,
        initialSyIndex: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
/**
 * Create one market-scoped vault under the shared adapter.
 *
 * Emits `MarketVaultCreatedEvent` and a seed `QuoteUpdatedEvent` so indexers and
 * oracle aggregators can anchor their history at deploy time.
 */
export function createMarketVaultBy_ACL(options: CreateMarketVaultBy_ACLOptions) {
    const packageAddress = options.package ?? 'jitter/demo-adapter';
    const argumentsTypes = [
        null,
        null,
        'u128',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["acl", "market", "initialSyIndex"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'demo_market_vault',
        function: 'create_market_vault_by_ACL',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface CreateMarketVaultByAdminArguments {
    Admin: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
    initialSyIndex: RawTransactionArgument<number | bigint>;
}
export interface CreateMarketVaultByAdminOptions {
    package?: string;
    arguments: CreateMarketVaultByAdminArguments | [
        Admin: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>,
        initialSyIndex: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function createMarketVaultByAdmin(options: CreateMarketVaultByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/demo-adapter';
    const argumentsTypes = [
        null,
        null,
        'u128',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["Admin", "market", "initialSyIndex"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'demo_market_vault',
        function: 'create_market_vault_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface DepositArguments {
    request: RawTransactionArgument<string>;
    underlyingCoin: RawTransactionArgument<string>;
    syState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    vault: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
}
export interface DepositOptions {
    package?: string;
    arguments: DepositArguments | [
        request: RawTransactionArgument<string>,
        underlyingCoin: RawTransactionArgument<string>,
        syState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        vault: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
/**
 * Deposit underlying into the adapter vault and mint market SY.
 *
 * Oracle aggregation is intentionally a separate step. A PTB can do:
 *
 * 1.  `deposit`
 * 2.  `demo_price_ticket::quote`
 * 3.  `jitter::router::mint_py_from_sy`
 */
export function deposit(options: DepositOptions) {
    const packageAddress = options.package ?? 'jitter/demo-adapter';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["request", "underlyingCoin", "syState", "globalConfig", "vault", "market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'demo_market_vault',
        function: 'deposit',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RedeemArguments {
    request: RawTransactionArgument<string>;
    syState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    vault: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
}
export interface RedeemOptions {
    package?: string;
    arguments: RedeemArguments | [
        request: RawTransactionArgument<string>,
        syState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        vault: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
/** Burn market SY and redeem underlying from the adapter vault. */
export function redeem(options: RedeemOptions) {
    const packageAddress = options.package ?? 'jitter/demo-adapter';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["request", "syState", "globalConfig", "vault", "market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'demo_market_vault',
        function: 'redeem',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface VaultIdArguments {
    vault: RawTransactionArgument<string>;
}
export interface VaultIdOptions {
    package?: string;
    arguments: VaultIdArguments | [
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function vaultId(options: VaultIdOptions) {
    const packageAddress = options.package ?? 'jitter/demo-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'demo_market_vault',
        function: 'vault_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface MarketIdArguments {
    vault: RawTransactionArgument<string>;
}
export interface MarketIdOptions {
    package?: string;
    arguments: MarketIdArguments | [
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function marketId(options: MarketIdOptions) {
    const packageAddress = options.package ?? 'jitter/demo-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'demo_market_vault',
        function: 'market_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface UpdatedAtArguments {
    vault: RawTransactionArgument<string>;
}
export interface UpdatedAtOptions {
    package?: string;
    arguments: UpdatedAtArguments | [
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function updatedAt(options: UpdatedAtOptions) {
    const packageAddress = options.package ?? 'jitter/demo-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'demo_market_vault',
        function: 'updated_at',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface UnderlyingBalanceArguments {
    vault: RawTransactionArgument<string>;
}
export interface UnderlyingBalanceOptions {
    package?: string;
    arguments: UnderlyingBalanceArguments | [
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function underlyingBalance(options: UnderlyingBalanceOptions) {
    const packageAddress = options.package ?? 'jitter/demo-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'demo_market_vault',
        function: 'underlying_balance',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}