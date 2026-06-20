import type { Transaction, TransactionObjectArgument } from "@mysten/sui/transactions";

import type { JitterMarketConfig } from "../types.js";

export type JitterAdapterKind =
  | "demo"
  | "scallop"
  | "ember"
  | "suilend"
  | "navi";

export type AdapterPriceInfoArgs = {
  tx: Transaction;
  config: JitterMarketConfig;
  /** Required by demo-style fixed index quotes. Protocol adapters may ignore it. */
  syIndex?: bigint;
};

export type AdapterDepositArgs = {
  tx: Transaction;
  config: JitterMarketConfig;
  mintRequest: TransactionObjectArgument;
  inputCoin: TransactionObjectArgument;
  /** SY amount minted by jitter::sy::mint_sy_exact_in; useful as adapter min-out. */
  syAmount: bigint;
};

export type AdapterRedeemArgs = {
  tx: Transaction;
  config: JitterMarketConfig;
  burnRequest: TransactionObjectArgument;
  /** SY amount burned by jitter::sy::burn_sy_exact_in; useful as adapter share amount. */
  syAmount: bigint;
};

export type AdapterDepositResult = {
  /** Adapter-specific excess coin returned from receipt-token adapters. */
  excessCoin?: TransactionObjectArgument;
};

export type AdapterRedeemResult = {
  outputCoin: TransactionObjectArgument;
};

export type JitterAdapterManifest = {
  kind: JitterAdapterKind;
  canDepositUnderlying: boolean;
  canRedeemUnderlying: boolean;
  depositInputType(config: JitterMarketConfig): string;
  redeemOutputType(config: JitterMarketConfig): string;
  requiredObjectIds(config: JitterMarketConfig): Record<string, string>;
  addPriceInfo(args: AdapterPriceInfoArgs): TransactionObjectArgument;
  addDepositToSy(args: AdapterDepositArgs): AdapterDepositResult;
  addRedeemFromSy(args: AdapterRedeemArgs): AdapterRedeemResult;
};
