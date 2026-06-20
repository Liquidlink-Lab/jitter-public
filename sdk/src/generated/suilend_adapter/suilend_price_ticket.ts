/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/

import { type Transaction } from "@mysten/sui/transactions";

import { normalizeMoveArguments, type RawTransactionArgument } from "../utils/index.js";

export interface QuoteArguments {
  collector: RawTransactionArgument<string>;
  vault: RawTransactionArgument<string>;
  reserve: RawTransactionArgument<string>;
}

export interface QuoteOptions {
  package?: string;
  arguments: QuoteArguments | [
    collector: RawTransactionArgument<string>,
    vault: RawTransactionArgument<string>,
    reserve: RawTransactionArgument<string>,
  ];
  typeArguments: [string, string, string, string, string];
}

export function quote(options: QuoteOptions) {
  const packageAddress = options.package ?? "jitter/suilend-adapter";
  const argumentsTypes = [
    null,
    null,
    null,
    "0x2::clock::Clock",
  ] satisfies (string | null)[];
  const parameterNames = ["collector", "vault", "reserve"];
  return (tx: Transaction) => tx.moveCall({
    package: packageAddress,
    module: "suilend_price_ticket",
    function: "quote",
    arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    typeArguments: options.typeArguments,
  });
}
