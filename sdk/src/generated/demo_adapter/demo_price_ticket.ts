/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * demo_price_ticket - demo quote source wiring for the oracle pipeline.
 * 
 * This module does not store custody. It only translates the market vault's latest
 * `sy_index` snapshot into the generic oracle flow:
 * `DemoMarketVault -> PriceCollector<SY> -> PriceAggregator<SY> -> PriceInfo<SY>`.
 */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
const $moduleName = 'jitter/demo-adapter::demo_price_ticket';
export const QuoteCollectedEvent = new MoveStruct({ name: `${$moduleName}::QuoteCollectedEvent`, fields: {
        market_id: bcs.Address,
        sy_index: bcs.u128(),
        updated_at: bcs.u64()
    } });
export interface QuoteArguments {
    collector: RawTransactionArgument<string>;
    syIndex: RawTransactionArgument<number | bigint>;
    vault: RawTransactionArgument<string>;
}
export interface QuoteOptions {
    package?: string;
    arguments: QuoteArguments | [
        collector: RawTransactionArgument<string>,
        syIndex: RawTransactionArgument<number | bigint>,
        vault: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string,
        string
    ];
}
/**
 * Produce the final `PriceInfo<SY>` for Jitter by running the collector through
 * the market's configured aggregator.
 */
export function quote(options: QuoteOptions) {
    const packageAddress = options.package ?? 'jitter/demo-adapter';
    const argumentsTypes = [
        null,
        'u128',
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["collector", "syIndex", "vault"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'demo_price_ticket',
        function: 'quote',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}