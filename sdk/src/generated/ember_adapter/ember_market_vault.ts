/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * ember_market_vault - Ember receipt-asset backed SY adapter.
 * 
 * This adapter does not deposit into or withdraw from Ember. It wraps Ember's
 * receipt asset as Jitter SY, while using the Ember vault rate only to convert
 * between base-asset value and receipt-share amount.
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as balance from './deps/sui/balance.js';
const $moduleName = 'jitter/ember-adapter::ember_market_vault';
export const EmberMarketVault = new MoveStruct({ name: `${$moduleName}::EmberMarketVault<phantom Underlying, phantom Receipt, phantom SY, phantom PT, phantom YT>`, fields: {
        id: bcs.Address,
        market_id: bcs.Address,
        ember_vault_id: bcs.Address,
        receipt_balance: balance.Balance,
        updated_at: bcs.u64()
    } });
export const MarketVaultCreatedEvent = new MoveStruct({ name: `${$moduleName}::MarketVaultCreatedEvent`, fields: {
        vault_id: bcs.Address,
        market_id: bcs.Address,
        ember_vault_id: bcs.Address,
        created_by: bcs.Address
    } });
export const DepositEvent = new MoveStruct({ name: `${$moduleName}::DepositEvent`, fields: {
        market_id: bcs.Address,
        ember_vault_id: bcs.Address,
        underlying_value_in: bcs.u64(),
        receipt_shares_in: bcs.u64(),
        receipt_change_out: bcs.u64(),
        depositor: bcs.Address
    } });
export const RedeemEvent = new MoveStruct({ name: `${$moduleName}::RedeemEvent`, fields: {
        market_id: bcs.Address,
        ember_vault_id: bcs.Address,
        underlying_value_out: bcs.u64(),
        receipt_shares_out: bcs.u64(),
        redeemer: bcs.Address
    } });
export interface CreateMarketVaultBy_ACLArguments {
    acl: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
    emberVault: RawTransactionArgument<string>;
}
export interface CreateMarketVaultBy_ACLOptions {
    package?: string;
    arguments: CreateMarketVaultBy_ACLArguments | [
        acl: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>,
        emberVault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string,
        string
    ];
}
export function createMarketVaultBy_ACL(options: CreateMarketVaultBy_ACLOptions) {
    const packageAddress = options.package ?? 'jitter/ember-adapter';
    const argumentsTypes = [
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["acl", "market", "emberVault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'ember_market_vault',
        function: 'create_market_vault_by_ACL',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface CreateMarketVaultByAdminArguments {
    Admin: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
    emberVault: RawTransactionArgument<string>;
}
export interface CreateMarketVaultByAdminOptions {
    package?: string;
    arguments: CreateMarketVaultByAdminArguments | [
        Admin: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>,
        emberVault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string,
        string
    ];
}
export function createMarketVaultByAdmin(options: CreateMarketVaultByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/ember-adapter';
    const argumentsTypes = [
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["Admin", "market", "emberVault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'ember_market_vault',
        function: 'create_market_vault_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface DepositArguments {
    request: RawTransactionArgument<string>;
    receiptCoin: RawTransactionArgument<string>;
    syState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    adapterVault: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
    emberVault: RawTransactionArgument<string>;
}
export interface DepositOptions {
    package?: string;
    arguments: DepositArguments | [
        request: RawTransactionArgument<string>,
        receiptCoin: RawTransactionArgument<string>,
        syState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        adapterVault: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>,
        emberVault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string,
        string
    ];
}
/**
 * Escrow Ember receipt shares and settle the Jitter `MintSyRequest`.
 *
 * `MintSyRequest.amount` is denominated in the Ember vault's base asset value. The
 * user supplies Ember receipt shares directly; any excess shares are returned to
 * the caller as `Coin<Receipt>`.
 */
export function deposit(options: DepositOptions) {
    const packageAddress = options.package ?? 'jitter/ember-adapter';
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
    const parameterNames = ["request", "receiptCoin", "syState", "globalConfig", "adapterVault", "market", "emberVault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'ember_market_vault',
        function: 'deposit',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RedeemArguments {
    request: RawTransactionArgument<string>;
    syState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    adapterVault: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
    emberVault: RawTransactionArgument<string>;
}
export interface RedeemOptions {
    package?: string;
    arguments: RedeemArguments | [
        request: RawTransactionArgument<string>,
        syState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        adapterVault: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>,
        emberVault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string,
        string
    ];
}
/**
 * Burn Jitter SY and return Ember receipt shares.
 *
 * This does not create an Ember withdrawal request. If the caller wants the base
 * asset, that Ember withdrawal must be routed outside this adapter.
 */
export function redeem(options: RedeemOptions) {
    const packageAddress = options.package ?? 'jitter/ember-adapter';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["request", "syState", "globalConfig", "adapterVault", "market", "emberVault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'ember_market_vault',
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
        string,
        string
    ];
}
export function vaultId(options: VaultIdOptions) {
    const packageAddress = options.package ?? 'jitter/ember-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'ember_market_vault',
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
        string,
        string
    ];
}
export function marketId(options: MarketIdOptions) {
    const packageAddress = options.package ?? 'jitter/ember-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'ember_market_vault',
        function: 'market_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EmberVaultIdArguments {
    vault: RawTransactionArgument<string>;
}
export interface EmberVaultIdOptions {
    package?: string;
    arguments: EmberVaultIdArguments | [
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string,
        string
    ];
}
export function emberVaultId(options: EmberVaultIdOptions) {
    const packageAddress = options.package ?? 'jitter/ember-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'ember_market_vault',
        function: 'ember_vault_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ReceiptBalanceArguments {
    vault: RawTransactionArgument<string>;
}
export interface ReceiptBalanceOptions {
    package?: string;
    arguments: ReceiptBalanceArguments | [
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string,
        string
    ];
}
export function receiptBalance(options: ReceiptBalanceOptions) {
    const packageAddress = options.package ?? 'jitter/ember-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'ember_market_vault',
        function: 'receipt_balance',
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
        string,
        string
    ];
}
export function updatedAt(options: UpdatedAtOptions) {
    const packageAddress = options.package ?? 'jitter/ember-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'ember_market_vault',
        function: 'updated_at',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SharesForUnderlyingCeilArguments {
    underlyingAmount: RawTransactionArgument<number | bigint>;
    vaultRate: RawTransactionArgument<number | bigint>;
}
export interface SharesForUnderlyingCeilOptions {
    package?: string;
    arguments: SharesForUnderlyingCeilArguments | [
        underlyingAmount: RawTransactionArgument<number | bigint>,
        vaultRate: RawTransactionArgument<number | bigint>
    ];
}
export function sharesForUnderlyingCeil(options: SharesForUnderlyingCeilOptions) {
    const packageAddress = options.package ?? 'jitter/ember-adapter';
    const argumentsTypes = [
        'u64',
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["underlyingAmount", "vaultRate"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'ember_market_vault',
        function: 'shares_for_underlying_ceil',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}