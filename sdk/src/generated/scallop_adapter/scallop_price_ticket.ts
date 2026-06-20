/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/** scallop_price_ticket - Scallop sCoin exchange-rate quote source. */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
const $moduleName = 'jitter/scallop-adapter::scallop_price_ticket';
export const QuoteCollectedEvent = new MoveStruct({ name: `${$moduleName}::QuoteCollectedEvent`, fields: {
        market_id: bcs.Address,
        scallop_market_id: bcs.Address,
        sy_index: bcs.u128(),
        updated_at: bcs.u64()
    } });
export interface QuoteArguments {
    collector: RawTransactionArgument<string>;
    vault: RawTransactionArgument<string>;
    scallopVersion: RawTransactionArgument<string>;
    scallopMarket: RawTransactionArgument<string>;
}
export interface QuoteOptions {
    package?: string;
    arguments: QuoteArguments | [
        collector: RawTransactionArgument<string>,
        vault: RawTransactionArgument<string>,
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
export function quote(options: QuoteOptions) {
    const packageAddress = options.package ?? 'jitter/scallop-adapter';
    const argumentsTypes = [
        null,
        null,
        null,
        null,
        '0x2::clock::Clock'
    ] satisfies (string | null)[];
    const parameterNames = ["collector", "vault", "scallopVersion", "scallopMarket"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'scallop_price_ticket',
        function: 'quote',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}