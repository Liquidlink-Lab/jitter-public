/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/

import { type Transaction } from "@mysten/sui/transactions";

import { normalizeMoveArguments, type RawTransactionArgument } from "../utils/index.js";

export interface DepositArguments {
  request: RawTransactionArgument<string>;
  ctokenCoin: RawTransactionArgument<string>;
  syState: RawTransactionArgument<string>;
  vault: RawTransactionArgument<string>;
  market: RawTransactionArgument<string>;
  reserve: RawTransactionArgument<string>;
}

export interface DepositOptions {
  package?: string;
  arguments: DepositArguments | [
    request: RawTransactionArgument<string>,
    ctokenCoin: RawTransactionArgument<string>,
    syState: RawTransactionArgument<string>,
    vault: RawTransactionArgument<string>,
    market: RawTransactionArgument<string>,
    reserve: RawTransactionArgument<string>,
  ];
  typeArguments: [string, string, string, string, string];
}

export function deposit(options: DepositOptions) {
  const packageAddress = options.package ?? "jitter/suilend-adapter";
  const argumentsTypes = [
    null,
    null,
    null,
    null,
    null,
    null,
    "0x2::clock::Clock",
  ] satisfies (string | null)[];
  const parameterNames = [
    "request",
    "ctokenCoin",
    "syState",
    "vault",
    "market",
    "reserve",
  ];
  return (tx: Transaction) => tx.moveCall({
    package: packageAddress,
    module: "suilend_market_vault",
    function: "deposit",
    arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    typeArguments: options.typeArguments,
  });
}

export interface RedeemArguments {
  request: RawTransactionArgument<string>;
  syState: RawTransactionArgument<string>;
  vault: RawTransactionArgument<string>;
  market: RawTransactionArgument<string>;
  reserve: RawTransactionArgument<string>;
}

export interface RedeemOptions {
  package?: string;
  arguments: RedeemArguments | [
    request: RawTransactionArgument<string>,
    syState: RawTransactionArgument<string>,
    vault: RawTransactionArgument<string>,
    market: RawTransactionArgument<string>,
    reserve: RawTransactionArgument<string>,
  ];
  typeArguments: [string, string, string, string, string];
}

export function redeem(options: RedeemOptions) {
  const packageAddress = options.package ?? "jitter/suilend-adapter";
  const argumentsTypes = [
    null,
    null,
    null,
    null,
    null,
    "0x2::clock::Clock",
  ] satisfies (string | null)[];
  const parameterNames = [
    "request",
    "syState",
    "vault",
    "market",
    "reserve",
  ];
  return (tx: Transaction) => tx.moveCall({
    package: packageAddress,
    module: "suilend_market_vault",
    function: "redeem",
    arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    typeArguments: options.typeArguments,
  });
}
