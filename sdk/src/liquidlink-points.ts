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

function orderIdsArg(tx: Transaction, orderIds: Array<bigint | number | string>) {
  return tx.pure.vector(
    "u64",
    orderIds.map((value) => BigInt(value)),
  );
}

function requireLiquidlinkPoints(config: JitterMarketConfig) {
  if (!config.jitterExtensionsPackageId) {
    throw new Error("LiquidLink points require jitterExtensionsPackageId in market config.");
  }
  const pointConfigObjectId =
    config.liquidlink?.pointConfigObjectId ?? config.liquidlinkPointConfigObjectId;
  const scoreboardObjectId =
    config.liquidlink?.scoreboardObjectId ?? config.liquidlinkScoreboardObjectId;
  const liquidlinkGlobalConfigObjectId = config.liquidlink?.liquidlinkGlobalConfigObjectId;
  const enabled = config.liquidlink?.enabled ?? Boolean(pointConfigObjectId && scoreboardObjectId);

  if (!enabled || !pointConfigObjectId || !scoreboardObjectId || !liquidlinkGlobalConfigObjectId) {
    throw new Error("LiquidLink points are not enabled for this project.");
  }
  if (!config.globalConfigObjectId) {
    throw new Error("LiquidLink points require globalConfigObjectId in market config.");
  }

  return {
    extensionsPackageId: config.jitterExtensionsPackageId,
    globalConfigObjectId: config.globalConfigObjectId,
    liquidlinkGlobalConfigObjectId,
    pointConfigObjectId,
    scoreboardObjectId,
  };
}

function requireLiquidlinkLpPoints(config: JitterMarketConfig) {
  const liquidlink = requireLiquidlinkPoints(config);
  const lpPointStateObjectId = config.liquidlink?.lpPointStateObjectId;
  if (!lpPointStateObjectId) {
    throw new Error("LiquidLink LP point state is not configured for this market.");
  }
  return { ...liquidlink, lpPointStateObjectId };
}

function requirePtOrderbook(config: JitterMarketConfig): string {
  if (!config.orderbookObjectId) {
    throw new Error("This market config does not include a PT orderbook object id.");
  }
  return config.orderbookObjectId;
}

function requireRewardDistributor(config: JitterMarketConfig): string {
  if (!config.rewardDistributorObjectId) {
    throw new Error("LiquidLink reward settlement requires rewardDistributorObjectId in market config.");
  }
  return config.rewardDistributorObjectId;
}

export function hasLiquidlinkPointsConfig(
  config: JitterMarketConfig | null | undefined,
): boolean {
  if (!config?.jitterExtensionsPackageId) return false;
  const pointConfigObjectId =
    config?.liquidlink?.pointConfigObjectId ?? config?.liquidlinkPointConfigObjectId;
  const scoreboardObjectId =
    config?.liquidlink?.scoreboardObjectId ?? config?.liquidlinkScoreboardObjectId;
  const enabled = config?.liquidlink?.enabled ?? Boolean(pointConfigObjectId && scoreboardObjectId);
  return Boolean(enabled && pointConfigObjectId && scoreboardObjectId);
}

export function hasLiquidlinkLpPointsConfig(
  config: JitterMarketConfig | null | undefined,
): boolean {
  return Boolean(hasLiquidlinkPointsConfig(config) && config?.liquidlink?.lpPointStateObjectId);
}

export function addMintPyFromSyWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  syCoin: TransactionObjectArgument,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): TransactionArgument {
  const liquidlink = requireLiquidlinkPoints(config);
  return tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::mint_py_from_sy_with_points`,
    arguments: [
      syCoin,
      priceInfo,
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.scoreboardObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  }) as TransactionArgument;
}

export function addSwapSyForPtWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  syCoin: TransactionObjectArgument,
  minPtOut: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): [TransactionArgument, TransactionObjectArgument] {
  const liquidlink = requireLiquidlinkLpPoints(config);
  const result = tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::swap_sy_for_pt_to_position_with_points`,
    arguments: [
      syCoin,
      tx.pure.u64(minPtOut),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      priceInfo,
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.lpPointStateObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [result[0] as TransactionArgument, result[1] as TransactionObjectArgument];
}

export function addSwapSyForExactPtWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  syCoin: TransactionObjectArgument,
  ptOut: bigint,
  maxSyIn: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): [TransactionArgument, TransactionObjectArgument] {
  const liquidlink = requireLiquidlinkLpPoints(config);
  const result = tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::swap_sy_for_exact_pt_to_position_with_points`,
    arguments: [
      syCoin,
      tx.pure.u64(ptOut),
      tx.pure.u64(maxSyIn),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      priceInfo,
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.lpPointStateObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [result[0] as TransactionArgument, result[1] as TransactionObjectArgument];
}

export function addSwapPtForSyWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  ptAmount: bigint,
  minSyOut: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): TransactionObjectArgument {
  const liquidlink = requireLiquidlinkLpPoints(config);
  return tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::swap_pt_for_sy_from_position_with_points`,
    arguments: [
      tx.pure.u64(ptAmount),
      tx.pure.u64(minSyOut),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      priceInfo,
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.lpPointStateObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  }) as TransactionObjectArgument;
}

export function addSwapPtForExactSyWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  syOut: bigint,
  maxPtIn: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): [TransactionArgument, TransactionObjectArgument] {
  const liquidlink = requireLiquidlinkLpPoints(config);
  const result = tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::swap_pt_for_exact_sy_from_position_with_points`,
    arguments: [
      tx.pure.u64(syOut),
      tx.pure.u64(maxPtIn),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      priceInfo,
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.lpPointStateObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [result[0] as TransactionArgument, result[1] as TransactionObjectArgument];
}

export function addSwapSyForYtWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  syCoin: TransactionObjectArgument,
  minYtOut: bigint,
  minSyOut: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): [TransactionArgument, TransactionObjectArgument] {
  const liquidlink = requireLiquidlinkLpPoints(config);
  const result = tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::swap_sy_for_yt_to_position_with_points`,
    arguments: [
      syCoin,
      tx.pure.u64(minYtOut),
      tx.pure.u64(minSyOut),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.scoreboardObjectId),
      tx.object(liquidlink.lpPointStateObjectId),
      priceInfo,
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [result[0] as TransactionArgument, result[1] as TransactionObjectArgument];
}

export function addSwapSyForExactYtWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  syCoin: TransactionObjectArgument,
  ytOut: bigint,
  maxSyIn: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): [TransactionArgument, TransactionObjectArgument] {
  const liquidlink = requireLiquidlinkLpPoints(config);
  const result = tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::swap_sy_for_exact_yt_to_position_with_points`,
    arguments: [
      syCoin,
      tx.pure.u64(ytOut),
      tx.pure.u64(maxSyIn),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.scoreboardObjectId),
      tx.object(liquidlink.lpPointStateObjectId),
      priceInfo,
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [result[0] as TransactionArgument, result[1] as TransactionObjectArgument];
}

export function addSwapYtForSyWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  ytAmount: bigint,
  minSyOut: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): TransactionObjectArgument {
  const liquidlink = requireLiquidlinkLpPoints(config);
  return tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::swap_yt_for_sy_to_position_with_points`,
    arguments: [
      tx.pure.u64(ytAmount),
      tx.pure.u64(minSyOut),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.scoreboardObjectId),
      tx.object(liquidlink.lpPointStateObjectId),
      priceInfo,
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  }) as TransactionObjectArgument;
}

export function addHybridSwapSyForPtWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  syCoin: TransactionObjectArgument,
  orderIds: Array<bigint | number | string>,
  maxBookPriceRaw: bigint,
  minTotalPtOut: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): TransactionObjectArgument {
  const liquidlink = requireLiquidlinkLpPoints(config);
  return tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::swap_sy_for_pt_orderbook_then_amm_with_points`,
    arguments: [
      syCoin,
      tx.object(requirePtOrderbook(config)),
      orderIdsArg(tx, orderIds),
      tx.pure.u128(maxBookPriceRaw),
      tx.pure.u64(minTotalPtOut),
      tx.object(config.marketObjectId),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      priceInfo,
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.lpPointStateObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag, config.ptTypeTag, config.ytTypeTag],
  }) as TransactionObjectArgument;
}

export function addHybridSwapPtForSyWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  ptAmount: bigint,
  orderIds: Array<bigint | number | string>,
  minBookPriceRaw: bigint,
  minTotalSyOut: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): TransactionObjectArgument {
  const liquidlink = requireLiquidlinkLpPoints(config);
  return tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::swap_pt_for_sy_orderbook_then_amm_with_points`,
    arguments: [
      tx.pure.u64(ptAmount),
      tx.object(requirePtOrderbook(config)),
      orderIdsArg(tx, orderIds),
      tx.pure.u128(minBookPriceRaw),
      tx.pure.u64(minTotalSyOut),
      tx.object(config.marketObjectId),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      priceInfo,
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.lpPointStateObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag, config.ptTypeTag, config.ytTypeTag],
  }) as TransactionObjectArgument;
}

export function addRedeemBeforeExpiryWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  ptAmount: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): TransactionObjectArgument {
  const liquidlink = requireLiquidlinkPoints(config);
  return tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::redeem_before_expiry_with_points`,
    arguments: [
      tx.pure.u64(ptAmount),
      priceInfo,
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.scoreboardObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  }) as TransactionObjectArgument;
}

export function addRedeemAfterExpiryWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  ptAmount: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): TransactionObjectArgument {
  const liquidlink = requireLiquidlinkPoints(config);
  return tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::redeem_after_expiry_with_points`,
    arguments: [
      tx.pure.u64(ptAmount),
      priceInfo,
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.scoreboardObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  }) as TransactionObjectArgument;
}

export function addClaimYtInterestWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): TransactionObjectArgument {
  const liquidlink = requireLiquidlinkPoints(config);
  return tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::claim_yt_interest_with_points`,
    arguments: [
      priceInfo,
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.scoreboardObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  }) as TransactionObjectArgument;
}

export function addLiquidityFromPositionWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  syCoin: TransactionObjectArgument,
  ptAmount: bigint | TransactionArgument,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
  lpPosition: TransactionObjectArgument | string,
): [TransactionArgument, TransactionArgument, TransactionObjectArgument] {
  const liquidlink = requireLiquidlinkLpPoints(config);
  const result = tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::add_liquidity_from_position_with_points`,
    arguments: [
      syCoin,
      typeof ptAmount === "bigint" ? tx.pure.u64(ptAmount) : ptAmount,
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      priceInfo,
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.lpPointStateObjectId),
      tx.object(liquidlink.scoreboardObjectId),
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

export function addLiquidityKeepYtFromPositionWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  syCoin: TransactionObjectArgument,
  syToMint: bigint,
  minLpOut: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
  lpPosition: TransactionObjectArgument | string,
): [TransactionArgument, TransactionArgument, TransactionObjectArgument] {
  const liquidlink = requireLiquidlinkLpPoints(config);
  const result = tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::add_liquidity_keep_yt_from_sy_with_points`,
    arguments: [
      syCoin,
      tx.pure.u64(syToMint),
      tx.pure.u64(minLpOut),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.scoreboardObjectId),
      tx.object(liquidlink.lpPointStateObjectId),
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

export function addLiquidityFromSyWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  syCoin: TransactionObjectArgument,
  syToMintHint: bigint,
  minLpOut: bigint,
  minSyOut: bigint,
  priceInfo: TransactionObjectArgument,
  position: TransactionObjectArgument | string,
): [TransactionArgument, TransactionObjectArgument] {
  const liquidlink = requireLiquidlinkLpPoints(config);
  const result = tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::add_liquidity_from_sy_with_points`,
    arguments: [
      syCoin,
      tx.pure.u64(syToMintHint),
      tx.pure.u64(minLpOut),
      tx.pure.u64(minSyOut),
      tx.object(config.poolObjectId),
      asObjectArg(tx, position),
      tx.object(config.pyStateObjectId),
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.scoreboardObjectId),
      tx.object(liquidlink.lpPointStateObjectId),
      priceInfo,
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [result[0] as TransactionArgument, result[1] as TransactionObjectArgument];
}

export function addRemoveLiquidityToPositionWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  lpAmount: bigint,
  pyPosition: TransactionObjectArgument | string,
  lpPosition: TransactionObjectArgument | string,
): [TransactionObjectArgument, TransactionArgument] {
  const liquidlink = requireLiquidlinkLpPoints(config);
  const result = tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::remove_liquidity_to_position_with_points`,
    arguments: [
      tx.pure.u64(lpAmount),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.lpPointStateObjectId),
      tx.object(liquidlink.scoreboardObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [result[0] as TransactionObjectArgument, result[1] as TransactionArgument];
}

export function addSyncPyPositionWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  pyPosition: TransactionObjectArgument | string,
): void {
  const liquidlink = requireLiquidlinkPoints(config);
  tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::sync_py_position_with_points`,
    arguments: [
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.scoreboardObjectId),
      tx.object(liquidlink.globalConfigObjectId),
      tx.object(liquidlink.liquidlinkGlobalConfigObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
}

export function addSettleYtRewardOperationWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  operation: TransactionArgument,
  pyPosition: TransactionObjectArgument | string,
): void {
  const liquidlink = requireLiquidlinkPoints(config);
  tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::settle_yt_reward_operation`,
    typeArguments: [config.syTypeTag],
    arguments: [
      tx.object(liquidlink.globalConfigObjectId),
      tx.object(liquidlink.liquidlinkGlobalConfigObjectId),
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.scoreboardObjectId),
      tx.object(requireRewardDistributor(config)),
      operation,
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      tx.object.clock(),
    ],
  });
}

export function addSettleLpRewardOperationWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  operation: TransactionArgument,
  lpPosition: TransactionObjectArgument | string,
): void {
  const liquidlink = requireLiquidlinkLpPoints(config);
  tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::settle_lp_reward_operation`,
    typeArguments: [config.syTypeTag],
    arguments: [
      tx.object(liquidlink.globalConfigObjectId),
      tx.object(liquidlink.liquidlinkGlobalConfigObjectId),
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.lpPointStateObjectId),
      tx.object(liquidlink.scoreboardObjectId),
      tx.object(requireRewardDistributor(config)),
      operation,
      tx.object(config.poolObjectId),
      asObjectArg(tx, lpPosition),
      tx.object.clock(),
    ],
  });
}

export function addSettlePoolRewardOperationWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  operation: TransactionArgument,
): void {
  const liquidlink = requireLiquidlinkLpPoints(config);
  tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::settle_pool_reward_operation`,
    typeArguments: [config.syTypeTag],
    arguments: [
      tx.object(liquidlink.globalConfigObjectId),
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.lpPointStateObjectId),
      tx.object(requireRewardDistributor(config)),
      operation,
      tx.object(config.poolObjectId),
      tx.object.clock(),
    ],
  });
}

export function addSettleLpPositionWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  lpPosition: TransactionObjectArgument | string,
): void {
  const liquidlink = requireLiquidlinkLpPoints(config);
  tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::settle_lp_position_with_points`,
    arguments: [
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.lpPointStateObjectId),
      tx.object(liquidlink.scoreboardObjectId),
      tx.object(liquidlink.globalConfigObjectId),
      tx.object(liquidlink.liquidlinkGlobalConfigObjectId),
      tx.object(config.poolObjectId),
      asObjectArg(tx, lpPosition),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
}

export function addClaimLpPointsWithLiquidlinkPoints(
  tx: Transaction,
  config: JitterMarketConfig,
  lpPosition: TransactionObjectArgument | string,
): TransactionArgument {
  const liquidlink = requireLiquidlinkLpPoints(config);
  return tx.moveCall({
    target: `${liquidlink.extensionsPackageId}::liquidlink_points::claim_lp_points_with_points`,
    arguments: [
      tx.object(liquidlink.pointConfigObjectId),
      tx.object(liquidlink.lpPointStateObjectId),
      tx.object(liquidlink.scoreboardObjectId),
      tx.object(config.poolObjectId),
      asObjectArg(tx, lpPosition),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  }) as TransactionArgument;
}

/** @deprecated Use addSettleLpPositionWithLiquidlinkPoints. */
export const addSyncLpPositionWithLiquidlinkPoints = addSettleLpPositionWithLiquidlinkPoints;
