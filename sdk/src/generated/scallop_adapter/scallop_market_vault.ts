/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * scallop_market_vault - Scallop MarketCoin-backed SY custody adapter.
 * 
 * This adapter wraps Scallop receipt assets (`MarketCoin<Underlying>`, e.g.
 * sSUI/sUSDC) as Jitter SY. Base coin mint/redeem against Scallop mainnet is
 * composed outside this adapter; this package escrows and releases sCoins.
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as balance from './deps/sui/balance.js';
import * as balance_1 from './deps/sui/balance.js';
const $moduleName = 'jitter/scallop-adapter::scallop_market_vault';
export const ScallopMarketVault = new MoveStruct({ name: `${$moduleName}::ScallopMarketVault<phantom Underlying, phantom SY, phantom PT, phantom YT>`, fields: {
        id: bcs.Address,
        market_id: bcs.Address,
        scallop_market_id: bcs.Address,
        market_coin_balance: balance.Balance,
        updated_at: bcs.u64(),
        withdraw_window_ms: bcs.u64(),
        withdraw_bps_per_window: bcs.u64(),
        withdraw_window_start_ms: bcs.u64(),
        withdraw_window_base_reserve: bcs.u64(),
        withdraw_window_withdrawn: bcs.u64(),
        withdraw_window_minted: bcs.u64(),
        queued_market_coin: bcs.u64(),
        withdraw_queue: bcs.vector(bcs.Address)
    } });
export const WithdrawRequest = new MoveStruct({ name: `${$moduleName}::WithdrawRequest<phantom Underlying, phantom SY, phantom PT, phantom YT>`, fields: {
        id: bcs.Address,
        vault_id: bcs.Address,
        market_id: bcs.Address,
        scallop_market_id: bcs.Address,
        owner: bcs.Address,
        underlying_value: bcs.u64(),
        market_coin_amount: bcs.u64(),
        created_at: bcs.u64(),
        sy_balance: balance_1.Balance
    } });
export const MarketVaultCreatedEvent = new MoveStruct({ name: `${$moduleName}::MarketVaultCreatedEvent`, fields: {
        vault_id: bcs.Address,
        market_id: bcs.Address,
        scallop_market_id: bcs.Address,
        created_by: bcs.Address
    } });
export const DepositEvent = new MoveStruct({ name: `${$moduleName}::DepositEvent`, fields: {
        market_id: bcs.Address,
        scallop_market_id: bcs.Address,
        underlying_value_in: bcs.u64(),
        market_coin_in: bcs.u64(),
        market_coin_change_out: bcs.u64(),
        depositor: bcs.Address
    } });
export const RedeemEvent = new MoveStruct({ name: `${$moduleName}::RedeemEvent`, fields: {
        market_id: bcs.Address,
        scallop_market_id: bcs.Address,
        underlying_value_out: bcs.u64(),
        market_coin_out: bcs.u64(),
        redeemer: bcs.Address
    } });
export const WithdrawCircuitBreakerUpdatedEvent = new MoveStruct({ name: `${$moduleName}::WithdrawCircuitBreakerUpdatedEvent`, fields: {
        vault_id: bcs.Address,
        market_id: bcs.Address,
        withdraw_window_ms: bcs.u64(),
        withdraw_bps_per_window: bcs.u64(),
        window_start_ms: bcs.u64(),
        window_base_reserve: bcs.u64(),
        updater: bcs.Address
    } });
export const WithdrawWindowRolledEvent = new MoveStruct({ name: `${$moduleName}::WithdrawWindowRolledEvent`, fields: {
        vault_id: bcs.Address,
        market_id: bcs.Address,
        window_start_ms: bcs.u64(),
        window_base_reserve: bcs.u64()
    } });
export const WithdrawQueuedEvent = new MoveStruct({ name: `${$moduleName}::WithdrawQueuedEvent`, fields: {
        request_id: bcs.Address,
        vault_id: bcs.Address,
        market_id: bcs.Address,
        scallop_market_id: bcs.Address,
        owner: bcs.Address,
        underlying_value: bcs.u64(),
        market_coin_amount: bcs.u64(),
        created_at: bcs.u64()
    } });
export const WithdrawCancelledEvent = new MoveStruct({ name: `${$moduleName}::WithdrawCancelledEvent`, fields: {
        request_id: bcs.Address,
        vault_id: bcs.Address,
        market_id: bcs.Address,
        scallop_market_id: bcs.Address,
        owner: bcs.Address,
        underlying_value: bcs.u64(),
        market_coin_amount: bcs.u64(),
        sy_amount: bcs.u64(),
        cancelled_at: bcs.u64()
    } });
export const WithdrawCompletedEvent = new MoveStruct({ name: `${$moduleName}::WithdrawCompletedEvent`, fields: {
        request_id: bcs.Address,
        vault_id: bcs.Address,
        market_id: bcs.Address,
        scallop_market_id: bcs.Address,
        owner: bcs.Address,
        underlying_value: bcs.u64(),
        market_coin_amount: bcs.u64(),
        completed_at: bcs.u64(),
        operator: bcs.Address
    } });
export const WithdrawRejectedEvent = new MoveStruct({ name: `${$moduleName}::WithdrawRejectedEvent`, fields: {
        request_id: bcs.Address,
        vault_id: bcs.Address,
        market_id: bcs.Address,
        scallop_market_id: bcs.Address,
        owner: bcs.Address,
        underlying_value: bcs.u64(),
        market_coin_amount: bcs.u64(),
        sy_amount: bcs.u64(),
        rejected_at: bcs.u64(),
        operator: bcs.Address
    } });
export interface CreateMarketVaultBy_ACLArguments {
    acl: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
    scallopMarket: RawTransactionArgument<string>;
    withdrawWindowMs: RawTransactionArgument<number | bigint>;
    withdrawBpsPerWindow: RawTransactionArgument<number | bigint>;
}
export interface CreateMarketVaultBy_ACLOptions {
    package?: string;
    arguments: CreateMarketVaultBy_ACLArguments | [
        acl: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>,
        scallopMarket: RawTransactionArgument<string>,
        withdrawWindowMs: RawTransactionArgument<number | bigint>,
        withdrawBpsPerWindow: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function createMarketVaultBy_ACL(options: CreateMarketVaultBy_ACLOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null,
        null,
        null,
        'u64',
        'u64',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["acl", "market", "scallopMarket", "withdrawWindowMs", "withdrawBpsPerWindow"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'create_market_vault_by_ACL',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface CreateMarketVaultByAdminArguments {
    Admin: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
    scallopMarket: RawTransactionArgument<string>;
    withdrawWindowMs: RawTransactionArgument<number | bigint>;
    withdrawBpsPerWindow: RawTransactionArgument<number | bigint>;
}
export interface CreateMarketVaultByAdminOptions {
    package?: string;
    arguments: CreateMarketVaultByAdminArguments | [
        Admin: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>,
        scallopMarket: RawTransactionArgument<string>,
        withdrawWindowMs: RawTransactionArgument<number | bigint>,
        withdrawBpsPerWindow: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function createMarketVaultByAdmin(options: CreateMarketVaultByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null,
        null,
        null,
        'u64',
        'u64',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["Admin", "market", "scallopMarket", "withdrawWindowMs", "withdrawBpsPerWindow"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'create_market_vault_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SetWithdrawCircuitBreakerBy_ACLArguments {
    acl: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    vault: RawTransactionArgument<string>;
    withdrawWindowMs: RawTransactionArgument<number | bigint>;
    withdrawBpsPerWindow: RawTransactionArgument<number | bigint>;
}
export interface SetWithdrawCircuitBreakerBy_ACLOptions {
    package?: string;
    arguments: SetWithdrawCircuitBreakerBy_ACLArguments | [
        acl: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        vault: RawTransactionArgument<string>,
        withdrawWindowMs: RawTransactionArgument<number | bigint>,
        withdrawBpsPerWindow: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function setWithdrawCircuitBreakerBy_ACL(options: SetWithdrawCircuitBreakerBy_ACLOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null,
        null,
        null,
        'u64',
        'u64',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["acl", "globalConfig", "vault", "withdrawWindowMs", "withdrawBpsPerWindow"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'set_withdraw_circuit_breaker_by_ACL',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SetWithdrawCircuitBreakerByAdminArguments {
    Admin: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    vault: RawTransactionArgument<string>;
    withdrawWindowMs: RawTransactionArgument<number | bigint>;
    withdrawBpsPerWindow: RawTransactionArgument<number | bigint>;
}
export interface SetWithdrawCircuitBreakerByAdminOptions {
    package?: string;
    arguments: SetWithdrawCircuitBreakerByAdminArguments | [
        Admin: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        vault: RawTransactionArgument<string>,
        withdrawWindowMs: RawTransactionArgument<number | bigint>,
        withdrawBpsPerWindow: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function setWithdrawCircuitBreakerByAdmin(options: SetWithdrawCircuitBreakerByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null,
        null,
        null,
        'u64',
        'u64',
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["Admin", "globalConfig", "vault", "withdrawWindowMs", "withdrawBpsPerWindow"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'set_withdraw_circuit_breaker_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface DepositArguments {
    request: RawTransactionArgument<string>;
    marketCoin: RawTransactionArgument<string>;
    maxMarketCoinIn: RawTransactionArgument<number | bigint>;
    syState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    vault: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
    scallopVersion: RawTransactionArgument<string>;
    scallopMarket: RawTransactionArgument<string>;
}
export interface DepositOptions {
    package?: string;
    arguments: DepositArguments | [
        request: RawTransactionArgument<string>,
        marketCoin: RawTransactionArgument<string>,
        maxMarketCoinIn: RawTransactionArgument<number | bigint>,
        syState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        vault: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>,
        scallopVersion: RawTransactionArgument<string>,
        scallopMarket: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function deposit(options: DepositOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null,
        null,
        'u64',
        null,
        null,
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["request", "marketCoin", "maxMarketCoinIn", "syState", "globalConfig", "vault", "market", "scallopVersion", "scallopMarket"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'deposit',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RedeemArguments {
    request: RawTransactionArgument<string>;
    minMarketCoinOut: RawTransactionArgument<number | bigint>;
    syState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    vault: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
    scallopVersion: RawTransactionArgument<string>;
    scallopMarket: RawTransactionArgument<string>;
}
export interface RedeemOptions {
    package?: string;
    arguments: RedeemArguments | [
        request: RawTransactionArgument<string>,
        minMarketCoinOut: RawTransactionArgument<number | bigint>,
        syState: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        vault: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>,
        scallopVersion: RawTransactionArgument<string>,
        scallopMarket: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function redeem(options: RedeemOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null,
        'u64',
        null,
        null,
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["request", "minMarketCoinOut", "syState", "globalConfig", "vault", "market", "scallopVersion", "scallopMarket"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'redeem',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface QueueRedeemArguments {
    syCoin: RawTransactionArgument<string>;
    minMarketCoinOut: RawTransactionArgument<number | bigint>;
    globalConfig: RawTransactionArgument<string>;
    vault: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
    scallopVersion: RawTransactionArgument<string>;
    scallopMarket: RawTransactionArgument<string>;
}
export interface QueueRedeemOptions {
    package?: string;
    arguments: QueueRedeemArguments | [
        syCoin: RawTransactionArgument<string>,
        minMarketCoinOut: RawTransactionArgument<number | bigint>,
        globalConfig: RawTransactionArgument<string>,
        vault: RawTransactionArgument<string>,
        market: RawTransactionArgument<string>,
        scallopVersion: RawTransactionArgument<string>,
        scallopMarket: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function queueRedeem(options: QueueRedeemOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null,
        'u64',
        null,
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["syCoin", "minMarketCoinOut", "globalConfig", "vault", "market", "scallopVersion", "scallopMarket"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'queue_redeem',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface CancelQueuedRedeemArguments {
    request: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    vault: RawTransactionArgument<string>;
}
export interface CancelQueuedRedeemOptions {
    package?: string;
    arguments: CancelQueuedRedeemArguments | [
        request: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function cancelQueuedRedeem(options: CancelQueuedRedeemOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["request", "globalConfig", "vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'cancel_queued_redeem',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface CompleteQueuedRedeemBy_ACLArguments {
    acl: RawTransactionArgument<string>;
    request: RawTransactionArgument<string>;
    syState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    vault: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
}
export interface CompleteQueuedRedeemBy_ACLOptions {
    package?: string;
    arguments: CompleteQueuedRedeemBy_ACLArguments | [
        acl: RawTransactionArgument<string>,
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
export function completeQueuedRedeemBy_ACL(options: CompleteQueuedRedeemBy_ACLOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["acl", "request", "syState", "globalConfig", "vault", "market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'complete_queued_redeem_by_ACL',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface CompleteQueuedRedeemByAdminArguments {
    Admin: RawTransactionArgument<string>;
    request: RawTransactionArgument<string>;
    syState: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    vault: RawTransactionArgument<string>;
    market: RawTransactionArgument<string>;
}
export interface CompleteQueuedRedeemByAdminOptions {
    package?: string;
    arguments: CompleteQueuedRedeemByAdminArguments | [
        Admin: RawTransactionArgument<string>,
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
export function completeQueuedRedeemByAdmin(options: CompleteQueuedRedeemByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["Admin", "request", "syState", "globalConfig", "vault", "market"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'complete_queued_redeem_by_admin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RejectWithdrawBy_ACLArguments {
    acl: RawTransactionArgument<string>;
    request: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    vault: RawTransactionArgument<string>;
}
export interface RejectWithdrawBy_ACLOptions {
    package?: string;
    arguments: RejectWithdrawBy_ACLArguments | [
        acl: RawTransactionArgument<string>,
        request: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function rejectWithdrawBy_ACL(options: RejectWithdrawBy_ACLOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["acl", "request", "globalConfig", "vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'reject_withdraw_by_ACL',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RejectWithdrawByAdminArguments {
    Admin: RawTransactionArgument<string>;
    request: RawTransactionArgument<string>;
    globalConfig: RawTransactionArgument<string>;
    vault: RawTransactionArgument<string>;
}
export interface RejectWithdrawByAdminOptions {
    package?: string;
    arguments: RejectWithdrawByAdminArguments | [
        Admin: RawTransactionArgument<string>,
        request: RawTransactionArgument<string>,
        globalConfig: RawTransactionArgument<string>,
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function rejectWithdrawByAdmin(options: RejectWithdrawByAdminOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["Admin", "request", "globalConfig", "vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'reject_withdraw_by_admin',
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
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
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
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'market_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ScallopMarketIdArguments {
    vault: RawTransactionArgument<string>;
}
export interface ScallopMarketIdOptions {
    package?: string;
    arguments: ScallopMarketIdArguments | [
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function scallopMarketId(options: ScallopMarketIdOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'scallop_market_id',
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
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'updated_at',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface MarketCoinBalanceArguments {
    vault: RawTransactionArgument<string>;
}
export interface MarketCoinBalanceOptions {
    package?: string;
    arguments: MarketCoinBalanceArguments | [
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function marketCoinBalance(options: MarketCoinBalanceOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'market_coin_balance',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface QueuedMarketCoinArguments {
    vault: RawTransactionArgument<string>;
}
export interface QueuedMarketCoinOptions {
    package?: string;
    arguments: QueuedMarketCoinArguments | [
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function queuedMarketCoin(options: QueuedMarketCoinOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'queued_market_coin',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface WithdrawQueueLengthArguments {
    vault: RawTransactionArgument<string>;
}
export interface WithdrawQueueLengthOptions {
    package?: string;
    arguments: WithdrawQueueLengthArguments | [
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function withdrawQueueLength(options: WithdrawQueueLengthOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'withdraw_queue_length',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface WithdrawQueueRequestIdArguments {
    vault: RawTransactionArgument<string>;
    index: RawTransactionArgument<number | bigint>;
}
export interface WithdrawQueueRequestIdOptions {
    package?: string;
    arguments: WithdrawQueueRequestIdArguments | [
        vault: RawTransactionArgument<string>,
        index: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function withdrawQueueRequestId(options: WithdrawQueueRequestIdOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null,
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["vault", "index"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'withdraw_queue_request_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface WithdrawWindowMsArguments {
    vault: RawTransactionArgument<string>;
}
export interface WithdrawWindowMsOptions {
    package?: string;
    arguments: WithdrawWindowMsArguments | [
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function withdrawWindowMs(options: WithdrawWindowMsOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'withdraw_window_ms',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface WithdrawBpsPerWindowArguments {
    vault: RawTransactionArgument<string>;
}
export interface WithdrawBpsPerWindowOptions {
    package?: string;
    arguments: WithdrawBpsPerWindowArguments | [
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function withdrawBpsPerWindow(options: WithdrawBpsPerWindowOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'withdraw_bps_per_window',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface WithdrawWindowStartMsArguments {
    vault: RawTransactionArgument<string>;
}
export interface WithdrawWindowStartMsOptions {
    package?: string;
    arguments: WithdrawWindowStartMsArguments | [
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function withdrawWindowStartMs(options: WithdrawWindowStartMsOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'withdraw_window_start_ms',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface WithdrawWindowBaseReserveArguments {
    vault: RawTransactionArgument<string>;
}
export interface WithdrawWindowBaseReserveOptions {
    package?: string;
    arguments: WithdrawWindowBaseReserveArguments | [
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function withdrawWindowBaseReserve(options: WithdrawWindowBaseReserveOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'withdraw_window_base_reserve',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface WithdrawWindowWithdrawnArguments {
    vault: RawTransactionArgument<string>;
}
export interface WithdrawWindowWithdrawnOptions {
    package?: string;
    arguments: WithdrawWindowWithdrawnArguments | [
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function withdrawWindowWithdrawn(options: WithdrawWindowWithdrawnOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'withdraw_window_withdrawn',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface WithdrawWindowMintedArguments {
    vault: RawTransactionArgument<string>;
}
export interface WithdrawWindowMintedOptions {
    package?: string;
    arguments: WithdrawWindowMintedArguments | [
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function withdrawWindowMinted(options: WithdrawWindowMintedOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'withdraw_window_minted',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface WithdrawQuotaPerWindowArguments {
    vault: RawTransactionArgument<string>;
}
export interface WithdrawQuotaPerWindowOptions {
    package?: string;
    arguments: WithdrawQuotaPerWindowArguments | [
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function withdrawQuotaPerWindow(options: WithdrawQuotaPerWindowOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'withdraw_quota_per_window',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RemainingWithdrawQuotaArguments {
    vault: RawTransactionArgument<string>;
}
export interface RemainingWithdrawQuotaOptions {
    package?: string;
    arguments: RemainingWithdrawQuotaArguments | [
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function remainingWithdrawQuota(options: RemainingWithdrawQuotaOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'remaining_withdraw_quota',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RequestVaultIdArguments {
    request: RawTransactionArgument<string>;
}
export interface RequestVaultIdOptions {
    package?: string;
    arguments: RequestVaultIdArguments | [
        request: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function requestVaultId(options: RequestVaultIdOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["request"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'request_vault_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RequestOwnerArguments {
    request: RawTransactionArgument<string>;
}
export interface RequestOwnerOptions {
    package?: string;
    arguments: RequestOwnerArguments | [
        request: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function requestOwner(options: RequestOwnerOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["request"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'request_owner',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RequestMarketCoinAmountArguments {
    request: RawTransactionArgument<string>;
}
export interface RequestMarketCoinAmountOptions {
    package?: string;
    arguments: RequestMarketCoinAmountArguments | [
        request: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function requestMarketCoinAmount(options: RequestMarketCoinAmountOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["request"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'request_market_coin_amount',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RequestUnderlyingValueArguments {
    request: RawTransactionArgument<string>;
}
export interface RequestUnderlyingValueOptions {
    package?: string;
    arguments: RequestUnderlyingValueArguments | [
        request: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function requestUnderlyingValue(options: RequestUnderlyingValueOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["request"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'request_underlying_value',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RequestSyAmountArguments {
    request: RawTransactionArgument<string>;
}
export interface RequestSyAmountOptions {
    package?: string;
    arguments: RequestSyAmountArguments | [
        request: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function requestSyAmount(options: RequestSyAmountOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["request"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'request_sy_amount',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface UnderlyingDustArguments {
    vault: RawTransactionArgument<string>;
}
export interface UnderlyingDustOptions {
    package?: string;
    arguments: UnderlyingDustArguments | [
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
export function underlyingDust(options: UnderlyingDustOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'underlying_dust',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface UnderlyingForSyFloorArguments {
    syAmount: RawTransactionArgument<number | bigint>;
    syIndex: RawTransactionArgument<number | bigint>;
}
export interface UnderlyingForSyFloorOptions {
    package?: string;
    arguments: UnderlyingForSyFloorArguments | [
        syAmount: RawTransactionArgument<number | bigint>,
        syIndex: RawTransactionArgument<number | bigint>
    ];
}
export function underlyingForSyFloor(options: UnderlyingForSyFloorOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        'u64',
        'u128'
    ] satisfies (string | null)[];
    const parameterNames = ["syAmount", "syIndex"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'underlying_for_sy_floor',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface MarketCoinForUnderlyingFloorArguments {
    underlyingValue: RawTransactionArgument<number | bigint>;
    scallopMarket: RawTransactionArgument<string>;
}
export interface MarketCoinForUnderlyingFloorOptions {
    package?: string;
    arguments: MarketCoinForUnderlyingFloorArguments | [
        underlyingValue: RawTransactionArgument<number | bigint>,
        scallopMarket: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function marketCoinForUnderlyingFloor(options: MarketCoinForUnderlyingFloorOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        'u64',
        null
    ] satisfies (string | null)[];
    const parameterNames = ["underlyingValue", "scallopMarket"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'market_coin_for_underlying_floor',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface MarketCoinForUnderlyingCeilArguments {
    underlyingValue: RawTransactionArgument<number | bigint>;
    scallopMarket: RawTransactionArgument<string>;
}
export interface MarketCoinForUnderlyingCeilOptions {
    package?: string;
    arguments: MarketCoinForUnderlyingCeilArguments | [
        underlyingValue: RawTransactionArgument<number | bigint>,
        scallopMarket: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function marketCoinForUnderlyingCeil(options: MarketCoinForUnderlyingCeilOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        'u64',
        null
    ] satisfies (string | null)[];
    const parameterNames = ["underlyingValue", "scallopMarket"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_market_vault',
        function: 'market_coin_for_underlying_ceil',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}