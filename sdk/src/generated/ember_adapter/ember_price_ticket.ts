/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/** ember_price_ticket - Ember Vault rate quote source. */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
const $moduleName = 'jitter/ember-adapter::ember_price_ticket';
export const QuoteCollectedEvent = new MoveStruct({ name: `${$moduleName}::QuoteCollectedEvent`, fields: {
        market_id: bcs.Address,
        ember_vault_id: bcs.Address,
        vault_rate: bcs.u64(),
        sy_index: bcs.u128(),
        updated_at: bcs.u64()
    } });
export interface QuoteArguments {
    collector: RawTransactionArgument<string>;
    adapterVault: RawTransactionArgument<string>;
    emberVault: RawTransactionArgument<string>;
}
export interface QuoteOptions {
    package?: string;
    arguments: QuoteArguments | [
        collector: RawTransactionArgument<string>,
        adapterVault: RawTransactionArgument<string>,
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
 * Collect an Ember Vault rate as a Jitter SY index.
 *
 * Ember mints receipt shares as `underlying * rate / 1e9`, so one receipt share is
 * worth `1e9 / rate` underlying units. Jitter's SY index is `underlying per SY` in
 * FP64.
 */
export function quote(options: QuoteOptions) {
    const packageAddress = options.package ?? 'jitter/ember-adapter';
    const argumentsTypes = [
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["collector", "adapterVault", "emberVault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'ember_price_ticket',
        function: 'quote',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface CurrentSyIndexArguments {
    emberVault: RawTransactionArgument<string>;
}
export interface CurrentSyIndexOptions {
    package?: string;
    arguments: CurrentSyIndexArguments | [
        emberVault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
export function currentSyIndex(options: CurrentSyIndexOptions) {
    const packageAddress = options.package ?? 'jitter/ember-adapter';
    const argumentsTypes = [
        null
    ] satisfies (string | null)[];
    const parameterNames = ["emberVault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'ember_price_ticket',
        function: 'current_sy_index',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SyIndexFromVaultRateArguments {
    vaultRate: RawTransactionArgument<number | bigint>;
}
export interface SyIndexFromVaultRateOptions {
    package?: string;
    arguments: SyIndexFromVaultRateArguments | [
        vaultRate: RawTransactionArgument<number | bigint>
    ];
}
export function syIndexFromVaultRate(options: SyIndexFromVaultRateOptions) {
    const packageAddress = options.package ?? 'jitter/ember-adapter';
    const argumentsTypes = [
        'u64'
    ] satisfies (string | null)[];
    const parameterNames = ["vaultRate"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'ember_price_ticket',
        function: 'sy_index_from_vault_rate',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}