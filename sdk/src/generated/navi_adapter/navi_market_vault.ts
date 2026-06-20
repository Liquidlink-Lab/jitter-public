/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/

import { type Transaction } from "@mysten/sui/transactions";

import { normalizeMoveArguments, type RawTransactionArgument } from "../utils/index.js";

export interface DepositArguments {
  request: RawTransactionArgument<string>;
  underlyingCoin: RawTransactionArgument<string>;
  syState: RawTransactionArgument<string>;
  vault: RawTransactionArgument<string>;
  market: RawTransactionArgument<string>;
  storage: RawTransactionArgument<string>;
  pool: RawTransactionArgument<string>;
  incentiveV2: RawTransactionArgument<string>;
  incentiveV3: RawTransactionArgument<string>;
}

export interface DepositOptions {
  package?: string;
  arguments: DepositArguments | [
    request: RawTransactionArgument<string>,
    underlyingCoin: RawTransactionArgument<string>,
    syState: RawTransactionArgument<string>,
    vault: RawTransactionArgument<string>,
    market: RawTransactionArgument<string>,
    storage: RawTransactionArgument<string>,
    pool: RawTransactionArgument<string>,
    incentiveV2: RawTransactionArgument<string>,
    incentiveV3: RawTransactionArgument<string>,
  ];
  typeArguments: [string, string, string, string];
}

export function deposit(options: DepositOptions) {
  const packageAddress = options.package ?? "jitter/navi-adapter";
  const argumentsTypes = [
    null,
    null,
    null,
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
    "underlyingCoin",
    "syState",
    "vault",
    "market",
    "storage",
    "pool",
    "incentiveV2",
    "incentiveV3",
  ];
  return (tx: Transaction) => tx.moveCall({
    package: packageAddress,
    module: "navi_market_vault",
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
  storage: RawTransactionArgument<string>;
  pool: RawTransactionArgument<string>;
  oracle: RawTransactionArgument<string>;
  incentiveV2: RawTransactionArgument<string>;
  incentiveV3: RawTransactionArgument<string>;
}

export interface RedeemOptions {
  package?: string;
  arguments: RedeemArguments | [
    request: RawTransactionArgument<string>,
    syState: RawTransactionArgument<string>,
    vault: RawTransactionArgument<string>,
    market: RawTransactionArgument<string>,
    storage: RawTransactionArgument<string>,
    pool: RawTransactionArgument<string>,
    oracle: RawTransactionArgument<string>,
    incentiveV2: RawTransactionArgument<string>,
    incentiveV3: RawTransactionArgument<string>,
  ];
  typeArguments: [string, string, string, string];
}

export function redeem(options: RedeemOptions) {
  const packageAddress = options.package ?? "jitter/navi-adapter";
  const argumentsTypes = [
    null,
    null,
    null,
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
    "syState",
    "vault",
    "market",
    "storage",
    "pool",
    "oracle",
    "incentiveV2",
    "incentiveV3",
  ];
  return (tx: Transaction) => tx.moveCall({
    package: packageAddress,
    module: "navi_market_vault",
    function: "redeem",
    arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    typeArguments: options.typeArguments,
  });
}

export interface RedeemV2Arguments extends RedeemArguments {
  systemState: RawTransactionArgument<string>;
}

export interface RedeemV2Options {
  package?: string;
  arguments: RedeemV2Arguments | [
    request: RawTransactionArgument<string>,
    syState: RawTransactionArgument<string>,
    vault: RawTransactionArgument<string>,
    market: RawTransactionArgument<string>,
    storage: RawTransactionArgument<string>,
    pool: RawTransactionArgument<string>,
    oracle: RawTransactionArgument<string>,
    incentiveV2: RawTransactionArgument<string>,
    incentiveV3: RawTransactionArgument<string>,
    systemState: RawTransactionArgument<string>,
  ];
  typeArguments: [string, string, string, string];
}

export function redeemV2(options: RedeemV2Options) {
  const packageAddress = options.package ?? "jitter/navi-adapter";
  const argumentsTypes = [
    null,
    null,
    null,
    null,
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
    "syState",
    "vault",
    "market",
    "storage",
    "pool",
    "oracle",
    "incentiveV2",
    "incentiveV3",
    "systemState",
  ];
  return (tx: Transaction) => tx.moveCall({
    package: packageAddress,
    module: "navi_market_vault",
    function: "redeem_v2",
    arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    typeArguments: options.typeArguments,
  });
}
