/**
 * @jitter/sdk - orderbook.ts
 *
 * PTB helpers for the on-chain PT/SY orderbook and hybrid AMM routing.
 */

import { Transaction, type TransactionObjectArgument } from "@mysten/sui/transactions";

import type { JitterMarketConfig } from "./types.js";

export type OrderbookAsset = "pt" | "yt";

function getOrderbookObjectId(config: JitterMarketConfig, asset: OrderbookAsset): string | null | undefined {
  return asset === "yt" ? config.ytOrderbookObjectId : config.orderbookObjectId;
}

function getAssetTypeTag(config: JitterMarketConfig, asset: OrderbookAsset): string {
  return asset === "yt" ? config.ytTypeTag : config.ptTypeTag;
}

function requireOrderbook(config: JitterMarketConfig, asset: OrderbookAsset = "pt"): string {
  const objectId = getOrderbookObjectId(config, asset);
  if (!objectId) {
    throw new Error(`This market config does not include a ${asset.toUpperCase()} orderbook object id.`);
  }
  return objectId;
}

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

export function addPlaceBidOrder(
  tx: Transaction,
  config: JitterMarketConfig,
  syCoin: TransactionObjectArgument,
  priceRaw: bigint,
  minPtAmount: bigint,
  expiryMs: bigint = 0n,
  asset: OrderbookAsset = "pt",
): void {
  tx.moveCall({
    target: `${config.jitterPackageId}::orderbook::place_bid`,
    arguments: [
      tx.object(requireOrderbook(config, asset)),
      syCoin,
      tx.pure.u128(priceRaw),
      tx.pure.u64(minPtAmount),
      tx.pure.u64(expiryMs),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag, getAssetTypeTag(config, asset)],
  });
}

export function addPlaceAskOrderFromPosition(
  tx: Transaction,
  config: JitterMarketConfig,
  ptAmount: bigint,
  priceRaw: bigint,
  pyPosition: TransactionObjectArgument | string,
  expiryMs: bigint = 0n,
  asset: OrderbookAsset = "pt",
): void {
  const assetCoin = tx.moveCall({
    target: `${config.jitterPackageId}::jitter_position::${asset === "yt" ? "redeem_yt_out" : "redeem_pt_out"}`,
    arguments: [
      tx.pure.u64(ptAmount),
      asObjectArg(tx, pyPosition),
      tx.pure.id(config.pyStateObjectId),
      tx.object(config.marketObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag, config.ptTypeTag, config.ytTypeTag],
  }) as TransactionObjectArgument;

  tx.moveCall({
    target: `${config.jitterPackageId}::orderbook::place_ask`,
    arguments: [
      tx.object(requireOrderbook(config, asset)),
      assetCoin,
      tx.pure.u128(priceRaw),
      tx.pure.u64(expiryMs),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag, getAssetTypeTag(config, asset)],
  });
}

export function addClaimOrder(
  tx: Transaction,
  config: JitterMarketConfig,
  orderId: bigint,
  asset: OrderbookAsset = "pt",
): [TransactionObjectArgument, TransactionObjectArgument] {
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::orderbook::claim_order`,
    arguments: [
      tx.object(requireOrderbook(config, asset)),
      tx.pure.u64(orderId),
    ],
    typeArguments: [config.syTypeTag, getAssetTypeTag(config, asset)],
  });
  return [result[0] as TransactionObjectArgument, result[1] as TransactionObjectArgument];
}

export function addCancelOrder(
  tx: Transaction,
  config: JitterMarketConfig,
  orderId: bigint,
  asset: OrderbookAsset = "pt",
): [TransactionObjectArgument, TransactionObjectArgument] {
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::orderbook::cancel_order`,
    arguments: [
      tx.object(requireOrderbook(config, asset)),
      tx.pure.u64(orderId),
    ],
    typeArguments: [config.syTypeTag, getAssetTypeTag(config, asset)],
  });
  return [result[0] as TransactionObjectArgument, result[1] as TransactionObjectArgument];
}

export function addSetOrderbookPausedByAcl(
  tx: Transaction,
  config: JitterMarketConfig,
  paused: boolean,
  asset: OrderbookAsset = "pt",
): void {
  tx.moveCall({
    target: `${config.jitterPackageId}::orderbook::${paused ? "pause_orderbook_by_acl" : "unpause_orderbook_by_acl"}`,
    arguments: [
      tx.object(requireOrderbook(config, asset)),
      tx.object(config.aclObjectId),
    ],
    typeArguments: [config.syTypeTag, getAssetTypeTag(config, asset)],
  });
}

export function addSetOrderbookPausedByAdmin(
  tx: Transaction,
  config: JitterMarketConfig,
  adminCap: TransactionObjectArgument | string,
  paused: boolean,
  asset: OrderbookAsset = "pt",
): void {
  tx.moveCall({
    target: `${config.jitterPackageId}::orderbook::${paused ? "pause_orderbook_by_admin" : "unpause_orderbook_by_admin"}`,
    arguments: [
      tx.object(requireOrderbook(config, asset)),
      asObjectArg(tx, adminCap),
    ],
    typeArguments: [config.syTypeTag, getAssetTypeTag(config, asset)],
  });
}

export function addHybridSwapSyForPt(
  tx: Transaction,
  config: JitterMarketConfig,
  syCoin: TransactionObjectArgument,
  orderIds: Array<bigint | number | string>,
  maxBookPriceRaw: bigint,
  minTotalPtOut: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): TransactionObjectArgument {
  return tx.moveCall({
    target: `${config.jitterPackageId}::router::swap_sy_for_pt_orderbook_then_amm`,
    arguments: [
      syCoin,
      tx.object(requireOrderbook(config, "pt")),
      orderIdsArg(tx, orderIds),
      tx.pure.u128(maxBookPriceRaw),
      tx.pure.u64(minTotalPtOut),
      tx.object(config.marketObjectId),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      priceInfo,
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag, config.ptTypeTag, config.ytTypeTag],
  }) as TransactionObjectArgument;
}

export function addHybridSwapPtForSy(
  tx: Transaction,
  config: JitterMarketConfig,
  ptAmount: bigint,
  orderIds: Array<bigint | number | string>,
  minBookPriceRaw: bigint,
  minTotalSyOut: bigint,
  priceInfo: TransactionObjectArgument,
  pyPosition: TransactionObjectArgument | string,
): TransactionObjectArgument {
  return tx.moveCall({
    target: `${config.jitterPackageId}::router::swap_pt_for_sy_orderbook_then_amm`,
    arguments: [
      tx.pure.u64(ptAmount),
      tx.object(requireOrderbook(config, "pt")),
      orderIdsArg(tx, orderIds),
      tx.pure.u128(minBookPriceRaw),
      tx.pure.u64(minTotalSyOut),
      tx.object(config.marketObjectId),
      tx.object(config.poolObjectId),
      asObjectArg(tx, pyPosition),
      tx.object(config.pyStateObjectId),
      priceInfo,
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag, config.ptTypeTag, config.ytTypeTag],
  }) as TransactionObjectArgument;
}

export function addFillAskExactAssetToPosition(
  tx: Transaction,
  config: JitterMarketConfig,
  asset: OrderbookAsset,
  orderId: bigint | number | string,
  syCoin: TransactionObjectArgument,
  assetAmount: bigint,
  maxPriceRaw: bigint,
  pyPosition: TransactionObjectArgument | string,
): TransactionObjectArgument {
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::orderbook::fill_ask_exact_pt`,
    arguments: [
      tx.object(requireOrderbook(config, asset)),
      tx.pure.u64(BigInt(orderId)),
      syCoin,
      tx.pure.u64(assetAmount),
      tx.pure.u128(maxPriceRaw),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag, getAssetTypeTag(config, asset)],
  });

  const assetCoin = result[0] as TransactionObjectArgument;
  const syChange = result[1] as TransactionObjectArgument;

  tx.moveCall({
    target: `${config.jitterPackageId}::jitter_position::${asset === "yt" ? "burn_yt_in" : "burn_pt_in"}`,
    arguments: [
      assetCoin,
      asObjectArg(tx, pyPosition),
      tx.pure.id(config.pyStateObjectId),
      tx.object(config.marketObjectId),
    ],
    typeArguments: [config.syTypeTag, config.ptTypeTag, config.ytTypeTag],
  });

  return syChange;
}

export function addFillBidExactAssetFromPosition(
  tx: Transaction,
  config: JitterMarketConfig,
  asset: OrderbookAsset,
  orderId: bigint | number | string,
  assetAmount: bigint,
  minPriceRaw: bigint,
  pyPosition: TransactionObjectArgument | string,
): TransactionObjectArgument {
  const assetCoin = tx.moveCall({
    target: `${config.jitterPackageId}::jitter_position::${asset === "yt" ? "redeem_yt_out" : "redeem_pt_out"}`,
    arguments: [
      tx.pure.u64(assetAmount),
      asObjectArg(tx, pyPosition),
      tx.pure.id(config.pyStateObjectId),
      tx.object(config.marketObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag, config.ptTypeTag, config.ytTypeTag],
  }) as TransactionObjectArgument;

  const result = tx.moveCall({
    target: `${config.jitterPackageId}::orderbook::fill_bid_exact_pt`,
    arguments: [
      tx.object(requireOrderbook(config, asset)),
      tx.pure.u64(BigInt(orderId)),
      assetCoin,
      tx.pure.u64(assetAmount),
      tx.pure.u128(minPriceRaw),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag, getAssetTypeTag(config, asset)],
  });

  const syOut = result[0] as TransactionObjectArgument;
  const assetChange = result[1] as TransactionObjectArgument;
  tx.moveCall({
    target: `0x2::coin::destroy_zero`,
    arguments: [assetChange],
    typeArguments: [getAssetTypeTag(config, asset)],
  });

  return syOut;
}
