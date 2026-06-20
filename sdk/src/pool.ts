/**
 * @jitter/sdk — pool.ts
 */

import type {
  Transaction,
  TransactionArgument,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";

import type { JitterMarketConfig } from "./types.js";

function asObjectArg(
  tx: Transaction,
  value: TransactionObjectArgument | string,
): TransactionObjectArgument {
  return typeof value === "string" ? tx.object(value) : value;
}

function requireGlobalConfig(config: JitterMarketConfig): string {
  if (!config.globalConfigObjectId) {
    throw new Error("Jitter market config is missing globalConfigObjectId.");
  }
  return config.globalConfigObjectId;
}

function requireRewardDistributor(config: JitterMarketConfig): string {
  if (!config.rewardDistributorObjectId) {
    throw new Error("Jitter market config is missing rewardDistributorObjectId.");
  }
  return config.rewardDistributorObjectId;
}

function emptyRewardSettlements(tx: Transaction, config: JitterMarketConfig): TransactionArgument {
  return tx.makeMoveVec({
    type: `${config.jitterPackageId}::reward_distributor::RewardSettlement`,
    elements: [],
  });
}

function destroyEmptyRewardOperations(
  tx: Transaction,
  config: JitterMarketConfig,
  operations: TransactionArgument,
): void {
  tx.moveCall({
    target: "0x1::vector::destroy_empty",
    arguments: [operations],
    typeArguments: [`${config.jitterPackageId}::reward_distributor::RewardOperation`],
  });
}

// ---------------------------------------------------------------------------
// Swap: SY → PT
// ---------------------------------------------------------------------------

export function addSwapSyForPt(
  tx: Transaction,
  config: JitterMarketConfig,
  syCoin: TransactionObjectArgument,
  minPtOut: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): [TransactionArgument, TransactionObjectArgument] {
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::router::buy_pt`,
    arguments: [
      emptyRewardSettlements(tx, config),
      tx.object(requireRewardDistributor(config)),
      syCoin,
      tx.pure.u64(minPtOut),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      tx.object(requireGlobalConfig(config)),
      priceInfo,
      tx.pure.u64(0),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  destroyEmptyRewardOperations(tx, config, result[2] as TransactionArgument);
  return [result[0] as TransactionArgument, result[1] as TransactionObjectArgument];
}

export function addSwapSyForExactPt(
  tx: Transaction,
  config: JitterMarketConfig,
  syCoin: TransactionObjectArgument,
  ptOut: bigint,
  maxSyIn: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): [TransactionArgument, TransactionObjectArgument] {
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::router::swap_sy_for_exact_pt_to_position`,
    arguments: [
      syCoin,
      tx.pure.u64(ptOut),
      tx.pure.u64(maxSyIn),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      priceInfo,
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [result[0] as TransactionArgument, result[1] as TransactionObjectArgument];
}

// ---------------------------------------------------------------------------
// Swap: PT → SY
// ---------------------------------------------------------------------------

export function addSwapPtForSy(
  tx: Transaction,
  config: JitterMarketConfig,
  ptAmount: bigint,
  minSyOut: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): TransactionObjectArgument {
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::router::sell_pt`,
    arguments: [
      emptyRewardSettlements(tx, config),
      tx.object(requireRewardDistributor(config)),
      tx.pure.u64(ptAmount),
      tx.pure.u64(minSyOut),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      tx.object(requireGlobalConfig(config)),
      priceInfo,
      tx.pure.u64(0),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  destroyEmptyRewardOperations(tx, config, result[1] as TransactionArgument);
  return result[0] as TransactionObjectArgument;
}

export function addSwapPtForExactSy(
  tx: Transaction,
  config: JitterMarketConfig,
  syOut: bigint,
  maxPtIn: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): TransactionObjectArgument {
  return tx.moveCall({
    target: `${config.jitterPackageId}::router::swap_pt_for_exact_sy_from_position`,
    arguments: [
      tx.pure.u64(syOut),
      tx.pure.u64(maxPtIn),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      priceInfo,
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  }) as TransactionObjectArgument;
}

// ---------------------------------------------------------------------------
// Swap: SY → YT
// ---------------------------------------------------------------------------

export function addSwapSyForYt(
  tx: Transaction,
  config: JitterMarketConfig,
  syCoin: TransactionObjectArgument,
  minYtOut: bigint,
  minSyOut: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): [TransactionArgument, TransactionObjectArgument] {
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::router::swap_sy_for_yt_to_position`,
    arguments: [
      syCoin,
      tx.pure.u64(minYtOut),
      tx.pure.u64(minSyOut),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      priceInfo,
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [result[0] as TransactionArgument, result[1] as TransactionObjectArgument];
}

export function addSwapSyForExactYt(
  tx: Transaction,
  config: JitterMarketConfig,
  syCoin: TransactionObjectArgument,
  ytOut: bigint,
  maxSyIn: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): [TransactionArgument, TransactionObjectArgument] {
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::router::swap_sy_for_exact_yt_to_position`,
    arguments: [
      syCoin,
      tx.pure.u64(ytOut),
      tx.pure.u64(maxSyIn),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      priceInfo,
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [result[0] as TransactionArgument, result[1] as TransactionObjectArgument];
}

// ---------------------------------------------------------------------------
// Swap: YT â†’ SY
// ---------------------------------------------------------------------------

export function addSwapYtForSy(
  tx: Transaction,
  config: JitterMarketConfig,
  ytAmount: bigint,
  minSyOut: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): TransactionObjectArgument {
  return tx.moveCall({
    target: `${config.jitterPackageId}::router::swap_yt_for_sy_to_position`,
    arguments: [
      tx.pure.u64(ytAmount),
      tx.pure.u64(minSyOut),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      priceInfo,
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  }) as TransactionObjectArgument;
}

// ---------------------------------------------------------------------------
// Liquidity
// ---------------------------------------------------------------------------

export function addLiquidityFromPosition(
  tx: Transaction,
  config: JitterMarketConfig,
  syCoin: TransactionObjectArgument,
  ptAmount: bigint | TransactionArgument,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
  lpPosition: TransactionObjectArgument | string,
): [TransactionArgument, TransactionArgument, TransactionObjectArgument] {
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::router::add_liquidity_from_position`,
    arguments: [
      syCoin,
      typeof ptAmount === "bigint" ? tx.pure.u64(ptAmount) : ptAmount,
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      priceInfo,
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [
    result[0] as TransactionArgument,
    result[1] as TransactionArgument,
    result[2] as TransactionObjectArgument,
  ];
}

export function addLiquidityKeepYtFromPosition(
  tx: Transaction,
  config: JitterMarketConfig,
  syCoin: TransactionObjectArgument,
  syToMint: bigint,
  minLpOut: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
  lpPosition: TransactionObjectArgument | string,
): [TransactionArgument, TransactionArgument, TransactionObjectArgument] {
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::router::add_liquidity_keep_yt_from_sy`,
    arguments: [
      syCoin,
      tx.pure.u64(syToMint),
      tx.pure.u64(minLpOut),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      priceInfo,
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [
    result[0] as TransactionArgument,
    result[1] as TransactionArgument,
    result[2] as TransactionObjectArgument,
  ];
}

export function addLiquidityFromSy(
  tx: Transaction,
  config: JitterMarketConfig,
  syCoin: TransactionObjectArgument,
  syToMintHint: bigint,
  minLpOut: bigint,
  minSyOut: bigint,
  priceInfo: TransactionObjectArgument,
  position: TransactionObjectArgument | string,
): [TransactionArgument, TransactionObjectArgument] {
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::router::add_lp_from_sy`,
    arguments: [
      emptyRewardSettlements(tx, config),
      emptyRewardSettlements(tx, config),
      emptyRewardSettlements(tx, config),
      tx.object(requireRewardDistributor(config)),
      syCoin,
      tx.pure.u64(syToMintHint),
      tx.pure.u64(minLpOut),
      tx.pure.u64(minSyOut),
      tx.object(config.poolObjectId),
      asObjectArg(tx, position),
      tx.object(config.pyStateObjectId),
      tx.object(requireGlobalConfig(config)),
      priceInfo,
      tx.pure.u64(0),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  destroyEmptyRewardOperations(tx, config, result[2] as TransactionArgument);
  return [result[0] as TransactionArgument, result[1] as TransactionObjectArgument];
}

export function addRemoveLiquidityToPosition(
  tx: Transaction,
  config: JitterMarketConfig,
  lpAmount: bigint,
  pyPosition: TransactionObjectArgument | string,
  lpPosition: TransactionObjectArgument | string,
): [TransactionObjectArgument, TransactionArgument] {
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::router::remove_liquidity_to_position`,
    arguments: [
      tx.pure.u64(lpAmount),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [result[0] as TransactionObjectArgument, result[1] as TransactionArgument];
}
