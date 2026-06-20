/**
 * @jitter/sdk — py.ts
 */

import type { Transaction, TransactionObjectArgument } from "@mysten/sui/transactions";

import {
  createPyPosition,
  createLpPosition,
  createPosition,
  mintPyFromSy,
  redeemBeforeExpiry,
  redeemAfterExpiry,
  claimYtInterest,
} from "./generated/jitter/router.js";

import type { JitterMarketConfig } from "./types.js";

function requireGlobalConfig(config: JitterMarketConfig): string {
  if (!config.globalConfigObjectId) {
    throw new Error("Jitter market config is missing globalConfigObjectId.");
  }
  return config.globalConfigObjectId;
}

// ---------------------------------------------------------------------------
// Position creation
// ---------------------------------------------------------------------------

export function addCreatePyPosition(
  tx: Transaction,
  config: JitterMarketConfig,
): TransactionObjectArgument {
  return createPyPosition({
    package: config.jitterPackageId,
    arguments: [config.pyStateObjectId, requireGlobalConfig(config)],
    typeArguments: [config.syTypeTag],
  })(tx) as TransactionObjectArgument;
}

export function addCreateLpPosition(
  tx: Transaction,
  config: JitterMarketConfig,
): TransactionObjectArgument {
  return createLpPosition({
    package: config.jitterPackageId,
    arguments: [config.poolObjectId, requireGlobalConfig(config)],
    typeArguments: [config.syTypeTag],
  })(tx) as TransactionObjectArgument;
}

export function addCreatePosition(
  tx: Transaction,
  config: JitterMarketConfig,
): TransactionObjectArgument {
  return createPosition({
    package: config.jitterPackageId,
    arguments: [config.pyStateObjectId, config.poolObjectId, requireGlobalConfig(config)],
    typeArguments: [config.syTypeTag],
  })(tx) as TransactionObjectArgument;
}

// ---------------------------------------------------------------------------
// PT + YT minting
// ---------------------------------------------------------------------------

export function addMintPyFromSy(
  tx: Transaction,
  config: JitterMarketConfig,
  syCoin: TransactionObjectArgument,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): void {
  mintPyFromSy({
    package: config.jitterPackageId,
    arguments: [
      syCoin,
      priceInfo,
      pyPosition as string,
      config.pyStateObjectId,
      requireGlobalConfig(config),
    ],
    typeArguments: [config.syTypeTag],
  })(tx);
}

// ---------------------------------------------------------------------------
// Redemption
// ---------------------------------------------------------------------------

export function addRedeemBeforeExpiry(
  tx: Transaction,
  config: JitterMarketConfig,
  ptAmount: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): TransactionObjectArgument {
  return redeemBeforeExpiry({
    package: config.jitterPackageId,
    arguments: [
      ptAmount,
      priceInfo,
      pyPosition as string,
      config.pyStateObjectId,
      requireGlobalConfig(config),
    ],
    typeArguments: [config.syTypeTag],
  })(tx) as TransactionObjectArgument;
}

export function addRedeemAfterExpiry(
  tx: Transaction,
  config: JitterMarketConfig,
  ptAmount: bigint,
  pyPosition: TransactionObjectArgument | string,
): TransactionObjectArgument {
  return redeemAfterExpiry({
    package: config.jitterPackageId,
    arguments: [
      ptAmount,
      pyPosition as string,
      config.pyStateObjectId,
      requireGlobalConfig(config),
    ],
    typeArguments: [config.syTypeTag],
  })(tx) as TransactionObjectArgument;
}

export function addClaimYtInterest(
  tx: Transaction,
  config: JitterMarketConfig,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): TransactionObjectArgument {
  return claimYtInterest({
    package: config.jitterPackageId,
    arguments: [
      priceInfo,
      pyPosition as string,
      config.pyStateObjectId,
      requireGlobalConfig(config),
    ],
    typeArguments: [config.syTypeTag],
  })(tx) as TransactionObjectArgument;
}
