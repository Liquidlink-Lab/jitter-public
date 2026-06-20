/**
 * @jitter/sdk — client.ts
 *
 * JitterClient is the primary entry point for interacting with the Jitter protocol.
 *
 * It binds a network + market config so callers never have to pass them per-call.
 * Query methods return on-chain state. Transaction builders return unsigned Transaction
 * objects ready for wallet signing.
 *
 * Usage (browser / dapp-kit):
 *   const client = JitterClient.fromEnv("testnet");
 *   const tx = await client.buildDepositAndMintPyTx({ ... });
 *   await signAndExecuteTransaction({ transaction: tx });
 *
 * Usage (Node.js / script):
 *   const client = JitterClient.fromEnv("testnet");
 *   const tx = await client.buildDepositAndMintPyTx({ ... });
 *   await suiClient.signAndExecuteTransaction({ signer: keypair, transaction: tx });
 */

import {
  coinWithBalance,
  Transaction,
  type TransactionArgument,
  type TransactionObjectArgument,
} from "@mysten/sui/transactions";

import { FP64_ONE, SUI_CLOCK_ID, SUI_TYPE_TAG } from "./constants.js";
import { addDemoPriceInfo, addScallopPriceInfo } from "./oracle.js";
import {
  addClaimYtInterest,
  addCreatePosition,
  addCreateLpPosition,
  addCreatePyPosition,
  addMintPyFromSy,
  addRedeemAfterExpiry,
  addRedeemBeforeExpiry,
} from "./py.js";
import {
  addLiquidityKeepYtFromPosition,
  addLiquidityFromPosition,
  addLiquidityFromSy,
  addRemoveLiquidityToPosition,
  addSwapPtForExactSy,
  addSwapPtForSy,
  addSwapSyForExactYt,
  addSwapSyForPt,
  addSwapSyForYt,
  addSwapYtForSy,
} from "./pool.js";
import {
  addCancelOrder,
  addClaimOrder,
  addFillAskExactAssetToPosition,
  addFillBidExactAssetFromPosition,
  addHybridSwapPtForSy,
  addHybridSwapSyForPt,
  addPlaceAskOrderFromPosition,
  addPlaceBidOrder,
  addSetOrderbookPausedByAcl,
  addSetOrderbookPausedByAdmin,
  type OrderbookAsset,
} from "./orderbook.js";
import {
  addClaimLpPointsWithLiquidlinkPoints,
  addClaimYtInterestWithLiquidlinkPoints,
  addHybridSwapPtForSyWithLiquidlinkPoints,
  addHybridSwapSyForPtWithLiquidlinkPoints,
  addLiquidityFromPositionWithLiquidlinkPoints,
  addLiquidityKeepYtFromPositionWithLiquidlinkPoints,
  addMintPyFromSyWithLiquidlinkPoints,
  addRedeemBeforeExpiryWithLiquidlinkPoints,
  addRemoveLiquidityToPositionWithLiquidlinkPoints,
  addSwapPtForExactSyWithLiquidlinkPoints,
  addSwapPtForSyWithLiquidlinkPoints,
  addSwapSyForExactYtWithLiquidlinkPoints,
  addSwapSyForPtWithLiquidlinkPoints,
  addSwapSyForYtWithLiquidlinkPoints,
  addSwapYtForSyWithLiquidlinkPoints,
  addSettleLpPositionWithLiquidlinkPoints,
  addSyncPyPositionWithLiquidlinkPoints,
  hasLiquidlinkLpPointsConfig,
  hasLiquidlinkPointsConfig,
} from "./liquidlink-points.js";
import { addDailyCheckIn } from "./check-in.js";
import {
  addSettleCoinReward,
  addSettleAndClaimCoinReward,
  hasCoinRewardConfig,
  type CoinRewardScope,
} from "./coin-reward.js";
import {
  calcImpliedApy,
  fp64ToFloat,
  formatTokenAmount,
  getDemoVaultState,
  getLiquidlinkLeaderboard,
  getLiquidlinkScoreInfo,
  getLpPositionById,
  getOrderbookOrders,
  getPoolApyHistory,
  getPoolState,
  getPyPositionById,
  getPyState,
  getScallopMarketIndex,
  getUserLpPositions,
  getUserPyPositions,
  getUserCoins,
  getUserSyCoins,
  getUserUnderlyingCoins,
  queryPoolCreatedEvents,
  queryPyStateCreatedEvents,
  querySwapEvents,
  type PoolCreatedEvent,
  type PoolImpliedRatePoint,
  type PyStateCreatedEvent,
  type SwapEvent,
  type LiquidlinkScoreInfo,
  type LiquidlinkLeaderboardEntry,
  type OrderbookOrder,
} from "./queries.js";
import {
  quoteAddLiquidity,
  quoteAddLiquidityFromSy,
  quoteAddLiquidityZap,
  quoteClaimableInterest,
  quoteIsMarketExpired,
  quoteLpValue,
  quotePrices,
  quoteSwapPtForExactSy,
  quoteSwapPtForSy,
  quoteSwapSyForExactPt,
  quoteSwapSyForExactYt,
  quoteSwapSyForPt,
  quoteSwapSyForYt,
  quoteSwapYtForSy,
  quoteAddLiquidityKeepYt,
  type QuoteAddLiquidity,
  type QuoteAddLiquidityFromSy,
  type QuoteAddLiquidityZap,
  type QuoteAddLiquidityKeepYt,
  type QuoteClaimableInterest,
  type QuoteLpValue,
  type QuotePrices,
  type QuoteSwapPtForExactSy,
  type QuoteSwapPtForSy,
  type QuoteSwapSyForExactPt,
  type QuoteSwapSyForExactYt,
  type QuoteSwapSyForPt,
  type QuoteSwapSyForYt,
  type QuoteSwapYtForSy,
} from "./simulation.js";
import {
  addBurnSyExactIn,
  addDemoDeposit,
  addDemoRedeem,
  addMintSyExactIn,
  addScallopDepositFromUnderlying,
  addScallopRedeemToUnderlying,
} from "./sy.js";
import type {
  DemoMarketVaultFields,
  JitterMarketConfig,
  LpPositionFields,
  PoolFields,
  PyPositionFields,
  PyStateFields,
} from "./types.js";
import { getDemoMarketConfig } from "./types.js";
import type { GrpcNetworkKind } from "./rpc.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Callback signature compatible with both dapp-kit and SuiClient */
export type SignAndExecuteFn = (
  tx: Transaction,
) => Promise<{ digest: string }>;

export type UserPortfolio = {
  pyPositions: PyPositionFields[];
  lpPositions: LpPositionFields[];
  underlyingCoins: Array<{ objectId: string; balance: bigint }>;
  syCoins: Array<{ objectId: string; balance: bigint }>;
  totalUnderlyingBalance: bigint;
  totalSyBalance: bigint;
  orders: OrderbookOrder[];
};

// ---------------------------------------------------------------------------
// Parameter types for transaction builders
// ---------------------------------------------------------------------------

export type DepositAndMintPyParams = {
  underlyingCoinId: string;
  underlyingAmount: bigint;
  pyPositionId: string;
  senderAddress: string;
  /** FP64 SY index. Auto-fetched from chain if omitted. */
  syIndex?: bigint;
};

export type MintPyFromSyParams = {
  syCoinId: string;
  syAmount: bigint;
  pyPositionId: string;
  senderAddress: string;
  /** FP64 SY index. Auto-fetched from chain if omitted. */
  syIndex?: bigint;
};

export type SwapSyForPtParams = {
  syCoinId: string;
  syAmount: bigint;
  minPtOut: bigint;
  pyPositionId?: string;
  senderAddress: string;
  /** FP64 SY index. Auto-fetched for demo markets; Scallop markets quote on-chain. */
  syIndex?: bigint;
};

export type HybridSwapSyForPtParams = SwapSyForPtParams & {
  orderIds: Array<bigint | number | string>;
  maxBookPriceRaw: bigint;
};

export type SwapSyForYtParams = {
  syCoinId: string;
  syAmount: bigint;
  minYtOut: bigint;
  pyPositionId?: string;
  senderAddress: string;
  syIndex?: bigint;
};

export type SwapUnderlyingForPtParams = {
  underlyingCoinId: string;
  underlyingAmount: bigint;
  minPtOut: bigint;
  pyPositionId?: string;
  senderAddress: string;
  syIndex?: bigint;
};

export type SwapScallopUnderlyingForPtParams = {
  underlyingAmount: bigint;
  minPtOut: bigint;
  pyPositionId?: string;
  senderAddress: string;
};

export type SwapUnderlyingForYtParams = {
  underlyingCoinId: string;
  underlyingAmount: bigint;
  minYtOut: bigint;
  pyPositionId?: string;
  senderAddress: string;
  syIndex?: bigint;
};

export type SwapPtForSyParams = {
  ptAmount: bigint;
  minSyOut: bigint;
  pyPositionId: string;
  senderAddress: string;
  /** FP64 SY index. Auto-fetched for demo markets; Scallop markets quote on-chain. */
  syIndex?: bigint;
};

export type HybridSwapPtForSyParams = SwapPtForSyParams & {
  orderIds: Array<bigint | number | string>;
  minBookPriceRaw: bigint;
};

type OrderbookFillPlan = {
  orderId: bigint;
  priceRaw: bigint;
  assetAmount: bigint;
  syAmount: bigint;
};

export type PlaceBidOrderParams = {
  asset?: OrderbookAsset;
  syCoinId: string;
  syAmount: bigint;
  priceRaw: bigint;
  minPtAmount: bigint;
  senderAddress: string;
  expiryMs?: bigint;
};

export type PlaceBidOrderFromUnderlyingParams = {
  asset?: OrderbookAsset;
  underlyingCoinId: string;
  underlyingAmount: bigint;
  syAmount: bigint;
  priceRaw: bigint;
  minPtAmount: bigint;
  senderAddress: string;
  expiryMs?: bigint;
  syIndex?: bigint;
};

export type PlaceBidOrderFromScallopUnderlyingParams = {
  asset?: OrderbookAsset;
  underlyingAmount: bigint;
  syAmount: bigint;
  priceRaw: bigint;
  minPtAmount: bigint;
  senderAddress: string;
  expiryMs?: bigint;
};

export type SwapScallopUnderlyingForYtParams = {
  underlyingAmount: bigint;
  minYtOut: bigint;
  pyPositionId?: string;
  senderAddress: string;
};

export type PlaceAskOrderParams = {
  asset?: OrderbookAsset;
  ptAmount: bigint;
  priceRaw: bigint;
  pyPositionId: string;
  senderAddress: string;
  expiryMs?: bigint;
};

export type OrderActionParams = {
  asset?: OrderbookAsset;
  orderId: bigint;
  senderAddress: string;
};

export type SetOrderbookPausedByAclParams = {
  asset?: OrderbookAsset;
  paused: boolean;
  senderAddress: string;
};

export type SetOrderbookPausedByAdminParams = SetOrderbookPausedByAclParams & {
  adminCapId: string;
};

export type SwapPtForUnderlyingParams = {
  ptAmount: bigint;
  minSyOut: bigint;
  pyPositionId: string;
  senderAddress: string;
  syIndex?: bigint;
};

export type SwapSyForExactYtParams = {
  syCoinId: string;
  /** Budget coin amount split from syCoinId. */
  syBudget: bigint;
  ytOut: bigint;
  maxSyIn: bigint;
  pyPositionId: string;
  senderAddress: string;
  syIndex?: bigint;
};

export type SwapPtForExactSyParams = {
  syOut: bigint;
  maxPtIn: bigint;
  pyPositionId: string;
  senderAddress: string;
  /** FP64 SY index. Auto-fetched for demo markets; Scallop markets quote on-chain. */
  syIndex?: bigint;
};

export type SwapYtForUnderlyingParams = {
  ytAmount: bigint;
  minSyOut: bigint;
  pyPositionId: string;
  senderAddress: string;
  syIndex?: bigint;
};

export type AddLiquidityParams = {
  syCoinId: string;
  syAmount: bigint;
  /** When omitted, route through router::add_liquidity_from_sy and do not require external PT. */
  ptAmount?: bigint;
  syToMintHint?: bigint;
  minLpOut?: bigint;
  minSyOut?: bigint;
  pyPositionId?: string;
  lpPositionId?: string;
  senderAddress: string;
  /** FP64 SY index. Auto-fetched for demo markets; Scallop markets quote on-chain. */
  syIndex?: bigint;
};

export type AddLiquidityFromUnderlyingParams = {
  underlyingCoinId: string;
  /** Exact underlying input to mint SY from. */
  underlyingAmount: bigint;
  /** Exact SY amount to route into add_liquidity. */
  syAmount: bigint;
  /** When omitted, route through router::add_liquidity_from_sy and do not require external PT. */
  ptAmount?: bigint;
  syToMintHint?: bigint;
  minLpOut?: bigint;
  minSyOut?: bigint;
  pyPositionId?: string;
  lpPositionId?: string;
  senderAddress: string;
  syIndex?: bigint;
};

export type AddLiquidityFromScallopUnderlyingParams = {
  /** Exact Scallop underlying input to mint SY from. */
  underlyingAmount: bigint;
  /** Exact SY amount to route into add_liquidity. */
  syAmount: bigint;
  /** When omitted, route through router::add_liquidity_from_sy and do not require external PT. */
  ptAmount?: bigint;
  syToMintHint?: bigint;
  minLpOut?: bigint;
  minSyOut?: bigint;
  pyPositionId?: string;
  lpPositionId?: string;
  senderAddress: string;
};

export type AddLiquidityZapParams = {
  syCoinId: string;
  syAmount: bigint;
  syToSwap: bigint;
  minPtOut: bigint;
  pyPositionId?: string;
  lpPositionId?: string;
  senderAddress: string;
  /** FP64 SY index. Auto-fetched for demo markets; Scallop markets quote on-chain. */
  syIndex?: bigint;
};

export type AddLiquidityZapFromUnderlyingParams = {
  underlyingCoinId: string;
  underlyingAmount: bigint;
  syToSwap: bigint;
  minPtOut: bigint;
  pyPositionId?: string;
  lpPositionId?: string;
  senderAddress: string;
  syIndex?: bigint;
};

export type AddLiquidityZapFromScallopUnderlyingParams = {
  underlyingAmount: bigint;
  syToSwap: bigint;
  minPtOut: bigint;
  pyPositionId?: string;
  lpPositionId?: string;
  senderAddress: string;
};

export type AddLiquidityKeepYtParams = {
  syCoinId: string;
  syAmount: bigint;
  syToMint: bigint;
  minLpOut: bigint;
  pyPositionId?: string;
  lpPositionId?: string;
  senderAddress: string;
  syIndex?: bigint;
};

export type AddLiquidityKeepYtFromUnderlyingParams = {
  underlyingCoinId: string;
  /** Exact underlying input to mint SY from. */
  underlyingAmount: bigint;
  /** Exact SY budget to route through keep-YT LP. */
  syAmount: bigint;
  syToMint: bigint;
  minLpOut: bigint;
  pyPositionId?: string;
  lpPositionId?: string;
  senderAddress: string;
  syIndex?: bigint;
};

export type AddLiquidityKeepYtFromScallopUnderlyingParams = {
  /** Exact Scallop underlying input to mint SY from. */
  underlyingAmount: bigint;
  /** Exact SY budget to route through keep-YT LP. */
  syAmount: bigint;
  syToMint: bigint;
  minLpOut: bigint;
  pyPositionId?: string;
  lpPositionId?: string;
  senderAddress: string;
};

export type RemoveLiquidityParams = {
  lpAmount: bigint;
  pyPositionId: string;
  lpPositionId: string;
  senderAddress: string;
};

export type RedeemBeforeExpiryParams = {
  ptAmount: bigint;
  pyPositionId: string;
  senderAddress: string;
  syIndex?: bigint;
};

export type RedeemBeforeExpiryToUnderlyingParams = {
  ptAmount: bigint;
  pyPositionId: string;
  senderAddress: string;
  syIndex?: bigint;
};

export type RedeemAfterExpiryParams = {
  ptAmount: bigint;
  pyPositionId: string;
  senderAddress: string;
  syIndex?: bigint;
};

export type ClaimYtInterestParams = {
  pyPositionId: string;
  senderAddress: string;
  syIndex?: bigint;
};

export type LpPointsActionParams = {
  lpPositionId: string;
  senderAddress: string;
};

export type CoinRewardActionParams = {
  positionId: string;
  senderAddress: string;
  scope: CoinRewardScope;
};

export type DailyCheckInParams = {
  senderAddress: string;
};

export type RedeemSyToUnderlyingParams = {
  syCoinId: string;
  syAmount: bigint;
  senderAddress: string;
  syIndex?: bigint;
};

export type DepositToSyParams = {
  underlyingCoinId: string;
  underlyingAmount: bigint;
  senderAddress: string;
  syIndex?: bigint;
};

export type DepositScallopToSyParams = {
  underlyingAmount: bigint;
  senderAddress: string;
};

export type QuoteSwapPtForUnderlying = QuoteSwapPtForSy & {
  underlyingOut: bigint;
  syIndex: bigint;
};

export type QuoteSwapYtForUnderlying = {
  syOut: bigint;
  syRedeemOut: bigint;
  syRepaid: bigint;
  underlyingOut: bigint;
  syIndex: bigint;
  slippageBps: bigint;
};

export type QuoteAddLiquidityKeepYtFromUnderlying = QuoteAddLiquidityKeepYt & {
  syIn: bigint;
  syIndex: bigint;
};

export type QuoteAddLiquidityFromSyFromUnderlying = QuoteAddLiquidityFromSy & {
  syIn: bigint;
  syIndex: bigint;
};

export type SettleExpiredByAclParams = {
  senderAddress: string;
  /** FP64 SY index. Auto-fetched from chain if omitted. */
  syIndex?: bigint;
};

export type SettleExpiredByAdminParams = {
  adminCapId: string;
  senderAddress: string;
  syIndex?: bigint;
};

export type CollectTreasuryInterestByAclParams = {
  senderAddress: string;
  /**
   * If provided, the SY coin result is transferred to this recipient instead
   * of the sender. Useful for routing fees to a multisig / treasury safe.
   */
  recipient?: string;
};

export type CollectTreasuryInterestByAdminParams = {
  adminCapId: string;
  senderAddress: string;
  recipient?: string;
};

// ---------------------------------------------------------------------------
// JitterClient
// ---------------------------------------------------------------------------

const DEFAULT_GAS: bigint = BigInt(300_000_000);
const ORDERBOOK_ROUTE_MAX_FILLS = 8;
const ORDERBOOK_ROUTE_PRICE_BUFFER_BPS = 50n;

export class JitterClient {
  readonly network: GrpcNetworkKind;
  readonly config: JitterMarketConfig;

  constructor(network: GrpcNetworkKind, config: JitterMarketConfig) {
    this.network = network;
    this.config = config;
  }

  /**
   * Create a JitterClient from env vars or the SDK-maintained network config.
   * Env vars override the built-in registry when all required values are set.
   */
  static fromEnv(network: GrpcNetworkKind = "testnet"): JitterClient {
    return new JitterClient(network, getDemoMarketConfig(network));
  }

  /**
   * Create a JitterClient from an explicit market config.
   * Use this for on-chain-discovered markets instead of env-only defaults.
   */
  static fromConfig(
    network: GrpcNetworkKind,
    config: JitterMarketConfig,
  ): JitterClient {
    return new JitterClient(network, config);
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private newTx(senderAddress: string): Transaction {
    const tx = new Transaction();
    tx.setSender(senderAddress);
    tx.setGasBudget(DEFAULT_GAS);
    return tx;
  }

  /**
   * Fetch the current SY index from the on-chain PyState.
   * Returns py_index_stored as a bigint (FP64 u128).
   */
  async getSyIndex(): Promise<bigint> {
    if (this.hasScallopRouteConfigured()) {
      const scallopIndex = await getScallopMarketIndex(this.network, this.config);
      return BigInt(scallopIndex.syIndexRaw);
    }

    const state = await this.getPyState();
    return BigInt(state.py_index_stored);
  }

  private async resolveSyIndex(override?: bigint): Promise<bigint> {
    return override ?? (await this.getSyIndex());
  }

  private async addCurrentPriceInfo(
    tx: Transaction,
    syIndexOverride?: bigint,
  ): Promise<TransactionObjectArgument> {
    if (this.hasScallopRouteConfigured()) {
      return addScallopPriceInfo(tx, this.config);
    }
    return addDemoPriceInfo(tx, this.config, await this.resolveSyIndex(syIndexOverride));
  }

  private mulDivFloor(a: bigint, b: bigint, denominator: bigint): bigint {
    if (denominator <= 0n) {
      throw new Error("Invalid denominator for mulDivFloor.");
    }
    return (a * b) / denominator;
  }

  private mulDivCeil(a: bigint, b: bigint, denominator: bigint): bigint {
    if (denominator <= 0n) {
      throw new Error("Invalid denominator for mulDivCeil.");
    }
    return (a * b + denominator - 1n) / denominator;
  }

  /** Convert underlying amount to SY amount using current FP64 sy_index (floor). */
  underlyingToSyAmount(underlyingAmount: bigint, syIndexRaw: bigint): bigint {
    if (underlyingAmount <= 0n) return 0n;
    if (syIndexRaw <= 0n) throw new Error("Invalid sy_index for conversion.");
    return this.mulDivFloor(underlyingAmount, FP64_ONE, syIndexRaw);
  }

  /** Convert SY amount to underlying amount using current FP64 sy_index (floor). */
  syToUnderlyingAmount(syAmount: bigint, syIndexRaw: bigint): bigint {
    if (syAmount <= 0n) return 0n;
    if (syIndexRaw <= 0n) throw new Error("Invalid sy_index for conversion.");
    return this.mulDivFloor(syAmount, syIndexRaw, FP64_ONE);
  }

  /** Minimum underlying needed so minted SY is >= target SY (ceil inverse conversion). */
  syToUnderlyingAmountCeil(syAmount: bigint, syIndexRaw: bigint): bigint {
    if (syAmount <= 0n) return 0n;
    if (syIndexRaw <= 0n) throw new Error("Invalid sy_index for conversion.");
    return this.mulDivCeil(syAmount, syIndexRaw, FP64_ONE);
  }

  private syForAssetAmount(assetAmount: bigint, priceRaw: bigint): bigint {
    if (assetAmount <= 0n || priceRaw <= 0n) return 0n;
    return this.mulDivCeil(assetAmount, priceRaw, FP64_ONE);
  }

  private assetAmountForSy(syAmount: bigint, priceRaw: bigint): bigint {
    if (syAmount <= 0n || priceRaw <= 0n) return 0n;
    return this.mulDivFloor(syAmount, FP64_ONE, priceRaw);
  }

  private async getPositionYtBalance(pyPositionId?: string): Promise<bigint> {
    if (!pyPositionId) return 0n;
    const position = await this.getPyPositionById(pyPositionId);
    return BigInt(position.yt_balance);
  }

  private async getYtAmmPriceRaw(syIndex?: bigint): Promise<bigint | null> {
    try {
      const prices = await this.quotePrices(syIndex);
      return prices.ytPrice > 0n ? prices.ytPrice : null;
    } catch {
      return null;
    }
  }

  private async planYtAskFills(
    syBudget: bigint,
    syIndex?: bigint,
  ): Promise<OrderbookFillPlan[]> {
    if (!this.config.ytOrderbookObjectId || syBudget <= 0n) return [];

    const ammPriceRaw = await this.getYtAmmPriceRaw(syIndex);
    if (ammPriceRaw === null) return [];
    const maxBookPriceRaw = this.mulDivCeil(
      ammPriceRaw,
      10_000n + ORDERBOOK_ROUTE_PRICE_BUFFER_BPS,
      10_000n,
    );
    const nowMs = BigInt(Date.now());
    const orders = (await getOrderbookOrders(this.network, this.config, "yt"))
      .filter((order) => {
        const remaining = BigInt(order.remainingPt);
        const priceRaw = BigInt(order.priceRaw);
        const expiryMs = BigInt(order.expiryMs || "0");
        return (
          order.side === "ask" &&
          remaining > 0n &&
          priceRaw > 0n &&
          (expiryMs === 0n || expiryMs > nowMs) &&
          priceRaw <= maxBookPriceRaw
        );
      })
      .sort((a, b) => {
        const ap = BigInt(a.priceRaw);
        const bp = BigInt(b.priceRaw);
        if (ap !== bp) return ap < bp ? -1 : 1;
        return BigInt(a.id) < BigInt(b.id) ? -1 : 1;
      });

    let remainingSy = syBudget;
    const fills: OrderbookFillPlan[] = [];

    for (const order of orders) {
      if (remainingSy <= 0n || fills.length >= ORDERBOOK_ROUTE_MAX_FILLS) break;

      const priceRaw = BigInt(order.priceRaw);
      const maxByBudget = this.assetAmountForSy(remainingSy, priceRaw);
      const remainingOrder = BigInt(order.remainingPt);
      const assetAmount = remainingOrder < maxByBudget ? remainingOrder : maxByBudget;
      const syAmount = this.syForAssetAmount(assetAmount, priceRaw);
      if (assetAmount <= 0n || syAmount <= 0n || syAmount > remainingSy) continue;

      fills.push({
        orderId: BigInt(order.id),
        priceRaw,
        assetAmount,
        syAmount,
      });
      remainingSy -= syAmount;
    }

    return fills;
  }

  private async planYtBidFills(
    ytAmount: bigint,
    syIndex?: bigint,
  ): Promise<OrderbookFillPlan[]> {
    if (!this.config.ytOrderbookObjectId || ytAmount <= 0n) return [];

    const ammPriceRaw = await this.getYtAmmPriceRaw(syIndex);
    if (ammPriceRaw === null) return [];
    const minBookPriceRaw = this.mulDivFloor(
      ammPriceRaw,
      10_000n - ORDERBOOK_ROUTE_PRICE_BUFFER_BPS,
      10_000n,
    );
    const nowMs = BigInt(Date.now());
    const orders = (await getOrderbookOrders(this.network, this.config, "yt"))
      .filter((order) => {
        const remaining = BigInt(order.remainingPt);
        const priceRaw = BigInt(order.priceRaw);
        const expiryMs = BigInt(order.expiryMs || "0");
        return (
          order.side === "bid" &&
          remaining > 0n &&
          priceRaw > 0n &&
          (expiryMs === 0n || expiryMs > nowMs) &&
          priceRaw >= minBookPriceRaw
        );
      })
      .sort((a, b) => {
        const ap = BigInt(a.priceRaw);
        const bp = BigInt(b.priceRaw);
        if (ap !== bp) return ap > bp ? -1 : 1;
        return BigInt(a.id) < BigInt(b.id) ? -1 : 1;
      });

    let remainingYt = ytAmount;
    const fills: OrderbookFillPlan[] = [];

    for (const order of orders) {
      if (remainingYt <= 0n || fills.length >= ORDERBOOK_ROUTE_MAX_FILLS) break;

      const priceRaw = BigInt(order.priceRaw);
      const remainingOrder = BigInt(order.remainingPt);
      const assetAmount = remainingOrder < remainingYt ? remainingOrder : remainingYt;
      const syAmount = this.syForAssetAmount(assetAmount, priceRaw);
      if (assetAmount <= 0n || syAmount <= 0n) continue;

      fills.push({
        orderId: BigInt(order.id),
        priceRaw,
        assetAmount,
        syAmount,
      });
      remainingYt -= assetAmount;
    }

    return fills;
  }

  private addAssertYtDeltaAtLeast(
    tx: Transaction,
    pyPosition: TransactionObjectArgument | string,
    initialYtBalance: bigint,
    minYtDelta: bigint,
  ): void {
    tx.moveCall({
      target: `${this.config.jitterPackageId}::router::assert_yt_delta_at_least`,
      arguments: [
        typeof pyPosition === "string" ? tx.object(pyPosition) : pyPosition,
        tx.pure.u64(initialYtBalance),
        tx.pure.u64(minYtDelta),
      ],
    });
  }

  private addAssertSyCoinMinValue(
    tx: Transaction,
    syCoin: TransactionObjectArgument,
    minValue: bigint,
  ): void {
    tx.moveCall({
      target: `${this.config.jitterPackageId}::router::assert_coin_min_value`,
      arguments: [syCoin, tx.pure.u64(minValue)],
      typeArguments: [this.config.syTypeTag],
    });
  }

  private addSyncPyPositionPointsIfConfigured(
    tx: Transaction,
    pyPosition: TransactionObjectArgument | string,
  ): void {
    if (!hasLiquidlinkPointsConfig(this.config)) return;
    addSyncPyPositionWithLiquidlinkPoints(tx, this.config, pyPosition);
  }

  private assertScallopRouteConfigured(): void {
    const missing = [
      ["scallopAdapterPackageId", this.config.scallopAdapterPackageId],
      ["scallopProtocolPackageId", this.config.scallopProtocolPackageId],
      ["scallopMarketVaultObjectId", this.config.scallopMarketVaultObjectId],
      ["scallopMarketObjectId", this.config.scallopMarketObjectId],
      ["scallopVersionObjectId", this.config.scallopVersionObjectId],
    ]
      .filter(([, value]) => !value)
      .map(([field]) => field);

    if (missing.length > 0) {
      throw new Error(`Scallop route is not configured: ${missing.join(", ")}.`);
    }
  }

  private hasScallopRouteConfigured(): boolean {
    return Boolean(
      this.config.scallopAdapterPackageId &&
        this.config.scallopProtocolPackageId &&
        this.config.scallopMarketVaultObjectId &&
        this.config.scallopMarketObjectId &&
        this.config.scallopVersionObjectId,
    );
  }

  private addTransferCreatedPyPosition(
    tx: Transaction,
    position: TransactionObjectArgument,
    recipient: string,
  ): void {
    this.addSyncPyPositionPointsIfConfigured(tx, position);
    this.addTransferPosition(tx, position, recipient);
  }

  private addTransferCreatedLpPosition(
    tx: Transaction,
    position: TransactionObjectArgument,
    recipient: string,
  ): void {
    if (hasLiquidlinkLpPointsConfig(this.config)) {
      addSettleLpPositionWithLiquidlinkPoints(tx, this.config, position);
    }
    this.addTransferPosition(tx, position, recipient);
  }

  private addTransferCreatedPosition(
    tx: Transaction,
    position: TransactionObjectArgument,
    recipient: string,
  ): void {
    this.addSyncPyPositionPointsIfConfigured(tx, position);
    if (hasLiquidlinkLpPointsConfig(this.config)) {
      addSettleLpPositionWithLiquidlinkPoints(tx, this.config, position);
    }
    this.addTransferPosition(tx, position, recipient);
  }

  private addTransferPosition(
    tx: Transaction,
    position: TransactionObjectArgument,
    recipient: string,
  ): void {
    tx.moveCall({
      target: `${this.config.jitterPackageId}::router::transfer_position`,
      arguments: [position, tx.pure.address(recipient)],
    });
  }

  private addSwapSyForPt(
    tx: Transaction,
    syCoin: TransactionObjectArgument,
    minPtOut: bigint,
    priceInfo: TransactionObjectArgument,
    pyPosition: TransactionObjectArgument | string,
  ): [TransactionArgument, TransactionObjectArgument] {
    return addSwapSyForPt(tx, this.config, syCoin, minPtOut, priceInfo, pyPosition);
  }

  private addSwapPtForSy(
    tx: Transaction,
    ptAmount: bigint,
    minSyOut: bigint,
    priceInfo: TransactionObjectArgument,
    pyPosition: TransactionObjectArgument | string,
  ): TransactionObjectArgument {
    return addSwapPtForSy(tx, this.config, ptAmount, minSyOut, priceInfo, pyPosition);
  }

  private addSwapPtForExactSy(
    tx: Transaction,
    syOut: bigint,
    maxPtIn: bigint,
    priceInfo: TransactionObjectArgument,
    pyPosition: TransactionObjectArgument | string,
  ): TransactionObjectArgument {
    if (hasLiquidlinkLpPointsConfig(this.config)) {
      const [, syCoin] = addSwapPtForExactSyWithLiquidlinkPoints(
        tx,
        this.config,
        syOut,
        maxPtIn,
        priceInfo,
        pyPosition,
      );
      return syCoin;
    }

    return addSwapPtForExactSy(tx, this.config, syOut, maxPtIn, priceInfo, pyPosition);
  }

  private addHybridSwapSyForPt(
    tx: Transaction,
    syCoin: TransactionObjectArgument,
    orderIds: Array<bigint | number | string>,
    maxBookPriceRaw: bigint,
    minTotalPtOut: bigint,
    priceInfo: TransactionObjectArgument,
    pyPosition: TransactionObjectArgument | string,
  ): TransactionObjectArgument {
    return hasLiquidlinkLpPointsConfig(this.config)
      ? addHybridSwapSyForPtWithLiquidlinkPoints(
          tx,
          this.config,
          syCoin,
          orderIds,
          maxBookPriceRaw,
          minTotalPtOut,
          priceInfo,
          pyPosition,
        )
      : addHybridSwapSyForPt(
          tx,
          this.config,
          syCoin,
          orderIds,
          maxBookPriceRaw,
          minTotalPtOut,
          priceInfo,
          pyPosition,
        );
  }

  private addHybridSwapPtForSy(
    tx: Transaction,
    ptAmount: bigint,
    orderIds: Array<bigint | number | string>,
    minBookPriceRaw: bigint,
    minTotalSyOut: bigint,
    priceInfo: TransactionObjectArgument,
    pyPosition: TransactionObjectArgument | string,
  ): TransactionObjectArgument {
    return hasLiquidlinkLpPointsConfig(this.config)
      ? addHybridSwapPtForSyWithLiquidlinkPoints(
          tx,
          this.config,
          ptAmount,
          orderIds,
          minBookPriceRaw,
          minTotalSyOut,
          priceInfo,
          pyPosition,
        )
      : addHybridSwapPtForSy(
          tx,
          this.config,
          ptAmount,
          orderIds,
          minBookPriceRaw,
          minTotalSyOut,
          priceInfo,
          pyPosition,
        );
  }

  private addMintPyFromSy(
    tx: Transaction,
    syCoin: TransactionObjectArgument,
    priceInfo: TransactionObjectArgument,
    pyPosition: TransactionObjectArgument | string,
  ): void {
    this.addSettleYtCoinRewardIfConfigured(tx, pyPosition, tx.getData().sender ?? "");
    if (hasLiquidlinkPointsConfig(this.config)) {
      addMintPyFromSyWithLiquidlinkPoints(
        tx,
        this.config,
        syCoin,
        priceInfo,
        pyPosition,
      );
      this.addSettleYtCoinRewardIfConfigured(tx, pyPosition, tx.getData().sender ?? "");
      return;
    }

    addMintPyFromSy(tx, this.config, syCoin, priceInfo, pyPosition);
    this.addSettleYtCoinRewardIfConfigured(tx, pyPosition, tx.getData().sender ?? "");
  }

  private addSwapSyForYt(
    tx: Transaction,
    syCoin: TransactionObjectArgument,
    minYtOut: bigint,
    minSyOut: bigint,
    priceInfo: TransactionObjectArgument,
    pyPosition: TransactionObjectArgument | string,
  ): [TransactionArgument, TransactionObjectArgument] {
    return hasLiquidlinkLpPointsConfig(this.config)
      ? addSwapSyForYtWithLiquidlinkPoints(
          tx,
          this.config,
          syCoin,
          minYtOut,
          minSyOut,
          priceInfo,
          pyPosition,
        )
      : addSwapSyForYt(
          tx,
          this.config,
          syCoin,
          minYtOut,
          minSyOut,
          priceInfo,
          pyPosition,
        );
  }

  private addSwapSyForExactYt(
    tx: Transaction,
    syCoin: TransactionObjectArgument,
    ytOut: bigint,
    maxSyIn: bigint,
    priceInfo: TransactionObjectArgument,
    pyPosition: TransactionObjectArgument | string,
  ): [TransactionArgument, TransactionObjectArgument] {
    this.addSettleYtCoinRewardIfConfigured(tx, pyPosition, tx.getData().sender ?? "");
    const result = hasLiquidlinkLpPointsConfig(this.config)
      ? addSwapSyForExactYtWithLiquidlinkPoints(
          tx,
          this.config,
          syCoin,
          ytOut,
          maxSyIn,
          priceInfo,
          pyPosition,
        )
      : addSwapSyForExactYt(
          tx,
          this.config,
          syCoin,
          ytOut,
          maxSyIn,
          priceInfo,
          pyPosition,
        );
    this.addSettleYtCoinRewardIfConfigured(tx, pyPosition, tx.getData().sender ?? "");
    return result;
  }

  private addSwapYtForSy(
    tx: Transaction,
    ytAmount: bigint,
    minSyOut: bigint,
    priceInfo: TransactionObjectArgument,
    pyPosition: TransactionObjectArgument | string,
  ): TransactionObjectArgument {
    return hasLiquidlinkLpPointsConfig(this.config)
      ? addSwapYtForSyWithLiquidlinkPoints(
          tx,
          this.config,
          ytAmount,
          minSyOut,
          priceInfo,
          pyPosition,
        )
      : addSwapYtForSy(
          tx,
          this.config,
          ytAmount,
          minSyOut,
          priceInfo,
          pyPosition,
        );
  }

  private addOrderbookThenAmmSwapSyForYt(
    tx: Transaction,
    syCoin: TransactionObjectArgument,
    syBudget: bigint,
    minYtOut: bigint,
    initialYtBalance: bigint,
    priceInfo: TransactionObjectArgument | null,
    pyPosition: TransactionObjectArgument | string,
    fills: OrderbookFillPlan[],
  ): TransactionObjectArgument {
    this.addSettleYtCoinRewardIfConfigured(tx, pyPosition, tx.getData().sender ?? "");
    let routedSyCoin = syCoin;
    let remainingSyBudget = syBudget;

    for (const fill of fills) {
      routedSyCoin = addFillAskExactAssetToPosition(
        tx,
        this.config,
        "yt",
        fill.orderId,
        routedSyCoin,
        fill.assetAmount,
        fill.priceRaw,
        pyPosition,
      );
      remainingSyBudget = remainingSyBudget > fill.syAmount
        ? remainingSyBudget - fill.syAmount
        : 0n;
    }

    if (remainingSyBudget > 0n) {
      if (!priceInfo) {
        throw new Error("Unable to build YT buy AMM fallback without price info.");
      }
      const [, syChange] = this.addSwapSyForYt(
        tx,
        routedSyCoin,
        0n,
        0n,
        priceInfo,
        pyPosition,
      );
      routedSyCoin = syChange;
    }

    if (fills.length > 0) {
      this.addSyncPyPositionPointsIfConfigured(tx, pyPosition);
    }
    this.addSettleYtCoinRewardIfConfigured(tx, pyPosition, tx.getData().sender ?? "");
    this.addAssertYtDeltaAtLeast(tx, pyPosition, initialYtBalance, minYtOut);

    return routedSyCoin;
  }

  private addOrderbookThenAmmSwapYtForSy(
    tx: Transaction,
    ytAmount: bigint,
    minSyOut: bigint,
    priceInfo: TransactionObjectArgument | null,
    pyPosition: TransactionObjectArgument | string,
    fills: OrderbookFillPlan[],
  ): TransactionObjectArgument {
    this.addSettleYtCoinRewardIfConfigured(tx, pyPosition, tx.getData().sender ?? "");
    let remainingYt = ytAmount;
    let syCoin: TransactionObjectArgument | null = null;

    for (const fill of fills) {
      const fillSyCoin = addFillBidExactAssetFromPosition(
        tx,
        this.config,
        "yt",
        fill.orderId,
        fill.assetAmount,
        fill.priceRaw,
        pyPosition,
      );

      if (syCoin) {
        tx.mergeCoins(syCoin, [fillSyCoin]);
      } else {
        syCoin = fillSyCoin;
      }

      remainingYt = remainingYt > fill.assetAmount
        ? remainingYt - fill.assetAmount
        : 0n;
    }

    if (remainingYt > 0n) {
      if (!priceInfo) {
        throw new Error("Unable to build YT sell AMM fallback without price info.");
      }
      const ammSyCoin = this.addSwapYtForSy(
        tx,
        remainingYt,
        0n,
        priceInfo,
        pyPosition,
      );
      if (syCoin) {
        tx.mergeCoins(syCoin, [ammSyCoin]);
      } else {
        syCoin = ammSyCoin;
      }
    }

    if (!syCoin) {
      throw new Error("Unable to build YT sell route.");
    }

    if (fills.length > 0) {
      this.addSyncPyPositionPointsIfConfigured(tx, pyPosition);
    }
    this.addSettleYtCoinRewardIfConfigured(tx, pyPosition, tx.getData().sender ?? "");
    this.addAssertSyCoinMinValue(tx, syCoin, minSyOut);

    return syCoin;
  }

  private addLiquidityFromPosition(
    tx: Transaction,
    syCoin: TransactionObjectArgument,
    ptAmount: bigint | TransactionArgument,
    priceInfo: TransactionObjectArgument,
    pyPosition: TransactionObjectArgument | string,
    lpPosition: TransactionObjectArgument | string,
  ): [TransactionArgument, TransactionArgument, TransactionObjectArgument] {
    this.addSettleLpCoinRewardIfConfigured(tx, lpPosition, tx.getData().sender ?? "");
    const result = hasLiquidlinkLpPointsConfig(this.config)
      ? addLiquidityFromPositionWithLiquidlinkPoints(
          tx,
          this.config,
          syCoin,
          ptAmount,
          priceInfo,
          pyPosition,
          lpPosition,
        )
      : addLiquidityFromPosition(
          tx,
          this.config,
          syCoin,
          ptAmount,
          priceInfo,
          pyPosition,
          lpPosition,
        );
    this.addSettleLpCoinRewardIfConfigured(tx, lpPosition, tx.getData().sender ?? "");
    return result;
  }

  private addLiquidityKeepYtFromPosition(
    tx: Transaction,
    syCoin: TransactionObjectArgument,
    syToMint: bigint,
    minLpOut: bigint,
    priceInfo: TransactionObjectArgument,
    pyPosition: TransactionObjectArgument | string,
    lpPosition: TransactionObjectArgument | string,
  ): [TransactionArgument, TransactionArgument, TransactionObjectArgument] {
    this.addSettleYtCoinRewardIfConfigured(tx, pyPosition, tx.getData().sender ?? "");
    this.addSettleLpCoinRewardIfConfigured(tx, lpPosition, tx.getData().sender ?? "");
    let result: [TransactionArgument, TransactionArgument, TransactionObjectArgument];
    if (hasLiquidlinkLpPointsConfig(this.config)) {
      result = addLiquidityKeepYtFromPositionWithLiquidlinkPoints(
        tx,
        this.config,
        syCoin,
        syToMint,
        minLpOut,
        priceInfo,
        pyPosition,
        lpPosition,
      );
    } else {
      result = addLiquidityKeepYtFromPosition(
        tx,
        this.config,
        syCoin,
        syToMint,
        minLpOut,
        priceInfo,
        pyPosition,
        lpPosition,
      );
    }

    this.addSettleLpCoinRewardIfConfigured(tx, lpPosition, tx.getData().sender ?? "");
    this.addSettleYtCoinRewardIfConfigured(tx, pyPosition, tx.getData().sender ?? "");
    return result;
  }

  private addLiquidityFromSy(
    tx: Transaction,
    syCoin: TransactionObjectArgument,
    syToMintHint: bigint,
    minLpOut: bigint,
    minSyOut: bigint,
    priceInfo: TransactionObjectArgument,
    position: TransactionObjectArgument | string,
  ): [TransactionArgument, TransactionObjectArgument] {
    this.addSettleYtCoinRewardIfConfigured(tx, position, tx.getData().sender ?? "");
    this.addSettleLpCoinRewardIfConfigured(tx, position, tx.getData().sender ?? "");
    const result = addLiquidityFromSy(
      tx,
      this.config,
      syCoin,
      syToMintHint,
      minLpOut,
      minSyOut,
      priceInfo,
      position,
    );
    this.addSyncPyPositionPointsIfConfigured(tx, position);
    if (hasLiquidlinkLpPointsConfig(this.config)) {
      addSettleLpPositionWithLiquidlinkPoints(tx, this.config, position);
    }
    this.addSettleLpCoinRewardIfConfigured(tx, position, tx.getData().sender ?? "");
    this.addSettleYtCoinRewardIfConfigured(tx, position, tx.getData().sender ?? "");
    return result;
  }

  private addRemoveLiquidityToPosition(
    tx: Transaction,
    lpAmount: bigint,
    pyPosition: TransactionObjectArgument | string,
    lpPosition: TransactionObjectArgument | string,
  ): [TransactionObjectArgument, TransactionArgument] {
    this.addSettleLpCoinRewardIfConfigured(tx, lpPosition, tx.getData().sender ?? "");
    let result: [TransactionObjectArgument, TransactionArgument];
    if (hasLiquidlinkLpPointsConfig(this.config)) {
      result = addRemoveLiquidityToPositionWithLiquidlinkPoints(
        tx,
        this.config,
        lpAmount,
        pyPosition,
        lpPosition,
      );
    } else {
      result = addRemoveLiquidityToPosition(
        tx,
        this.config,
        lpAmount,
        pyPosition,
        lpPosition,
      );
    }

    this.addSettleLpCoinRewardIfConfigured(tx, lpPosition, tx.getData().sender ?? "");
    return result;
  }

  private addSettleLpCoinRewardIfConfigured(
    tx: Transaction,
    position: TransactionObjectArgument | string,
    owner: string,
  ): void {
    if (!owner || !hasCoinRewardConfig(this.config, "lp")) return;
    addSettleCoinReward(tx, this.config, position, owner, "lp");
  }

  private addSettleYtCoinRewardIfConfigured(
    tx: Transaction,
    position: TransactionObjectArgument | string,
    owner: string,
  ): void {
    if (!owner || !hasCoinRewardConfig(this.config, "yt")) return;
    addSettleCoinReward(tx, this.config, position, owner, "yt");
  }

  private addRedeemBeforeExpiry(
    tx: Transaction,
    ptAmount: bigint,
    priceInfo: TransactionObjectArgument,
    pyPosition: TransactionObjectArgument | string,
  ): TransactionObjectArgument {
    this.addSettleYtCoinRewardIfConfigured(tx, pyPosition, tx.getData().sender ?? "");
    const syCoin = hasLiquidlinkPointsConfig(this.config)
      ? addRedeemBeforeExpiryWithLiquidlinkPoints(
          tx,
          this.config,
          ptAmount,
          priceInfo,
          pyPosition,
        )
      : addRedeemBeforeExpiry(
          tx,
          this.config,
          ptAmount,
          priceInfo,
          pyPosition,
        );
    this.addSettleYtCoinRewardIfConfigured(tx, pyPosition, tx.getData().sender ?? "");
    return syCoin;
  }

  private addRedeemAfterExpiry(
    tx: Transaction,
    ptAmount: bigint,
    pyPosition: TransactionObjectArgument | string,
  ): TransactionObjectArgument {
    return addRedeemAfterExpiry(tx, this.config, ptAmount, pyPosition);
  }

  private addClaimYtInterest(
    tx: Transaction,
    priceInfo: TransactionObjectArgument,
    pyPosition: TransactionObjectArgument | string,
  ): TransactionObjectArgument {
    this.addSettleYtCoinRewardIfConfigured(tx, pyPosition, tx.getData().sender ?? "");
    return hasLiquidlinkPointsConfig(this.config)
      ? addClaimYtInterestWithLiquidlinkPoints(
          tx,
          this.config,
          priceInfo,
          pyPosition,
        )
      : addClaimYtInterest(tx, this.config, priceInfo, pyPosition);
  }

  private createCoinWithBalance(
    amount: bigint,
    coinType: string = this.config.underlyingTypeTag,
  ): TransactionObjectArgument {
    return coinWithBalance({
      balance: amount,
      type: coinType === SUI_TYPE_TAG ? undefined : coinType,
    });
  }

  private addScallopMintSyExactIn(
    tx: Transaction,
    underlyingAmount: bigint,
  ): TransactionObjectArgument {
    this.assertScallopRouteConfigured();
    const underlyingCoin = this.createCoinWithBalance(underlyingAmount);
    const priceInfo = addScallopPriceInfo(tx, this.config);
    const [syCoin, mintRequest] = addMintSyExactIn(
      tx,
      this.config,
      priceInfo,
      underlyingAmount,
    );
    addScallopDepositFromUnderlying(
      tx,
      this.config,
      mintRequest,
      underlyingCoin,
      underlyingAmount,
    );
    return syCoin;
  }

  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  getPoolState(): Promise<PoolFields> {
    return getPoolState(this.network, this.config);
  }

  getPyState(): Promise<PyStateFields> {
    return getPyState(this.network, this.config);
  }

  getDemoVaultState(): Promise<DemoMarketVaultFields> {
    return getDemoVaultState(this.network, this.config);
  }

  getUserPyPositions(owner: string): Promise<PyPositionFields[]> {
    return getUserPyPositions(this.network, owner, this.config);
  }

  getUserLpPositions(owner: string): Promise<LpPositionFields[]> {
    return getUserLpPositions(this.network, owner, this.config);
  }

  getUserUnderlyingCoins(
    owner: string,
  ): Promise<Array<{ objectId: string; balance: bigint }>> {
    return getUserUnderlyingCoins(this.network, owner, this.config);
  }

  getUserCoins(
    owner: string,
    coinTypeTag: string,
  ): Promise<Array<{ objectId: string; balance: bigint }>> {
    return getUserCoins(this.network, owner, coinTypeTag);
  }

  async getUserCoinBalance(owner: string, coinTypeTag: string): Promise<bigint> {
    const coins = await this.getUserCoins(owner, coinTypeTag);
    return coins.reduce((sum, coin) => sum + coin.balance, 0n);
  }

  getUserSyCoins(
    owner: string,
  ): Promise<Array<{ objectId: string; balance: bigint }>> {
    return getUserSyCoins(this.network, owner, this.config);
  }

  getLiquidlinkScoreInfo(owner: string): Promise<LiquidlinkScoreInfo> {
    return getLiquidlinkScoreInfo(this.network, this.config, owner);
  }

  getLiquidlinkLeaderboard(limit = 50): Promise<LiquidlinkLeaderboardEntry[]> {
    return getLiquidlinkLeaderboard(this.network, this.config, limit);
  }

  async getOrderbookOrders(
    owner?: string,
    asset: OrderbookAsset = "pt",
  ): Promise<OrderbookOrder[]> {
    const orders = await getOrderbookOrders(this.network, this.config, asset);
    if (!owner) return orders;
    return orders.filter((order) => order.owner.toLowerCase() === owner.toLowerCase());
  }

  async getAllOrderbookOrders(owner?: string): Promise<OrderbookOrder[]> {
    const orders = await Promise.all([
      this.getOrderbookOrders(owner, "pt"),
      this.getOrderbookOrders(owner, "yt"),
    ]);
    return orders.flat();
  }

  getPyPositionById(objectId: string): Promise<PyPositionFields> {
    return getPyPositionById(this.network, objectId);
  }

  getLpPositionById(objectId: string): Promise<LpPositionFields> {
    return getLpPositionById(this.network, objectId);
  }

  /** Fetch all user positions and coin balances in one call. */
  async getUserPortfolio(owner: string): Promise<UserPortfolio> {
    const [pyPositions, lpPositions, underlyingCoins, syCoins, orders] =
      await Promise.all([
        this.getUserPyPositions(owner),
        this.getUserLpPositions(owner),
        this.getUserUnderlyingCoins(owner),
        this.getUserSyCoins(owner),
        this.getAllOrderbookOrders(owner),
      ]);

    const totalUnderlyingBalance = underlyingCoins.reduce(
      (sum, c) => sum + c.balance,
      BigInt(0),
    );
    const totalSyBalance = syCoins.reduce(
      (sum, c) => sum + c.balance,
      BigInt(0),
    );

    return {
      pyPositions,
      lpPositions,
      underlyingCoins,
      syCoins,
      totalUnderlyingBalance,
      totalSyBalance,
      orders,
    };
  }

  /** Return implied APY as a percentage for the current pool state. */
  async getImpliedApy(): Promise<number> {
    const pool = await this.getPoolState();
    return calcImpliedApy(pool.last_ln_implied_rate);
  }

  /** Format a raw FP64 SY index as a human-readable float string. */
  formatSyIndex(raw: string | bigint, decimals = 6): string {
    return fp64ToFloat(String(raw), decimals);
  }

  /** Format a raw token amount (e.g. MIST, SY units) to decimal. */
  formatAmount(raw: string | bigint, decimals = 6): string {
    return formatTokenAmount(raw, decimals);
  }

  // -------------------------------------------------------------------------
  // Transaction Builders
  // -------------------------------------------------------------------------

  // A. underlying → SY → PT + YT
  async buildDepositAndMintPyTx(p: DepositAndMintPyParams): Promise<Transaction> {
    const syIndex = await this.resolveSyIndex(p.syIndex);
    const tx = this.newTx(p.senderAddress);

    const underlyingCoin = tx.splitCoins(tx.object(p.underlyingCoinId), [
      tx.pure.u64(p.underlyingAmount),
    ]);
    const priceInfo1 = addDemoPriceInfo(tx, this.config, syIndex);
    const [syCoin, mintRequest] = addMintSyExactIn(
      tx,
      this.config,
      priceInfo1,
      p.underlyingAmount,
    );
    addDemoDeposit(tx, this.config, mintRequest, underlyingCoin);
    const priceInfo2 = addDemoPriceInfo(tx, this.config, syIndex);
    this.addMintPyFromSy(tx, syCoin, priceInfo2, p.pyPositionId);

    return tx;
  }

  // B. SY → PT + YT (mint from SY coin)
  async buildMintPyFromSyTx(p: MintPyFromSyParams): Promise<Transaction> {
    const syIndex = await this.resolveSyIndex(p.syIndex);
    const tx = this.newTx(p.senderAddress);

    const syCoin = tx.splitCoins(tx.object(p.syCoinId), [tx.pure.u64(p.syAmount)]);
    const priceInfo = addDemoPriceInfo(tx, this.config, syIndex);
    this.addMintPyFromSy(tx, syCoin, priceInfo, p.pyPositionId);

    return tx;
  }

  // C. SY → PT (exact in)
  async buildSwapSyForPtTx(p: SwapSyForPtParams): Promise<Transaction> {
    const tx = this.newTx(p.senderAddress);
    const syCoin = tx.splitCoins(tx.object(p.syCoinId), [tx.pure.u64(p.syAmount)]);
    let createdPyPosition: TransactionObjectArgument | null = null;
    const pyPositionArg =
      p.pyPositionId ?? (createdPyPosition = addCreatePyPosition(tx, this.config));
    const priceInfo = await this.addCurrentPriceInfo(tx, p.syIndex);
    const [, syChange] = this.addSwapSyForPt(tx, syCoin, p.minPtOut, priceInfo, pyPositionArg);
    tx.transferObjects([syChange], tx.pure.address(p.senderAddress));
    if (createdPyPosition) {
      this.addTransferCreatedPyPosition(tx, createdPyPosition, p.senderAddress);
    }
    return tx;
  }

  async buildHybridSwapSyForPtTx(p: HybridSwapSyForPtParams): Promise<Transaction> {
    const tx = this.newTx(p.senderAddress);
    const syCoin = tx.splitCoins(tx.object(p.syCoinId), [tx.pure.u64(p.syAmount)]);
    let createdPyPosition: TransactionObjectArgument | null = null;
    const pyPositionArg =
      p.pyPositionId ?? (createdPyPosition = addCreatePyPosition(tx, this.config));
    const priceInfo = await this.addCurrentPriceInfo(tx, p.syIndex);
    const syChange = this.addHybridSwapSyForPt(
      tx,
      syCoin,
      p.orderIds,
      p.maxBookPriceRaw,
      p.minPtOut,
      priceInfo,
      pyPositionArg,
    );
    tx.transferObjects([syChange], tx.pure.address(p.senderAddress));
    if (createdPyPosition) {
      this.addTransferCreatedPyPosition(tx, createdPyPosition, p.senderAddress);
    }
    return tx;
  }

  // D. SY → YT (leveraged yield, exact in)
  async buildSwapSyForYtTx(p: SwapSyForYtParams): Promise<Transaction> {
    const syIndex = await this.resolveSyIndex(p.syIndex);
    const [fills, initialYtBalance] = await Promise.all([
      this.planYtAskFills(p.syAmount, syIndex),
      this.getPositionYtBalance(p.pyPositionId),
    ]);
    const tx = this.newTx(p.senderAddress);
    const syCoin = tx.splitCoins(tx.object(p.syCoinId), [tx.pure.u64(p.syAmount)]);
    let createdPyPosition: TransactionObjectArgument | null = null;
    const pyPositionArg =
      p.pyPositionId ?? (createdPyPosition = addCreatePyPosition(tx, this.config));
    const filledSy = fills.reduce((sum, fill) => sum + fill.syAmount, 0n);
    const priceInfo =
      filledSy < p.syAmount ? await this.addCurrentPriceInfo(tx, syIndex) : null;
    const syChange = this.addOrderbookThenAmmSwapSyForYt(
      tx,
      syCoin,
      p.syAmount,
      p.minYtOut,
      initialYtBalance,
      priceInfo,
      pyPositionArg,
      fills,
    );
    tx.transferObjects([syChange], tx.pure.address(p.senderAddress));
    if (createdPyPosition) {
      this.addTransferCreatedPyPosition(tx, createdPyPosition, p.senderAddress);
    }
    return tx;
  }

  // D2. underlying → SY → PT (exact in, single PTB)
  async buildSwapUnderlyingForPtTx(p: SwapUnderlyingForPtParams): Promise<Transaction> {
    const syIndex = await this.resolveSyIndex(p.syIndex);
    const tx = this.newTx(p.senderAddress);

    let createdPyPosition: TransactionObjectArgument | null = null;
    const pyPositionArg =
      p.pyPositionId ?? (createdPyPosition = addCreatePyPosition(tx, this.config));

    const underlyingCoin = tx.splitCoins(tx.object(p.underlyingCoinId), [
      tx.pure.u64(p.underlyingAmount),
    ]);
    const priceInfo = addDemoPriceInfo(tx, this.config, syIndex);
    const [syCoin, mintRequest] = addMintSyExactIn(
      tx,
      this.config,
      priceInfo,
      p.underlyingAmount,
    );
    addDemoDeposit(tx, this.config, mintRequest, underlyingCoin);

    const priceInfoForSwap = await this.addCurrentPriceInfo(tx, syIndex);
    const [, syChange] = this.addSwapSyForPt(tx, syCoin, p.minPtOut, priceInfoForSwap, pyPositionArg);
    tx.transferObjects([syChange], tx.pure.address(p.senderAddress));

    if (createdPyPosition) {
      this.addTransferCreatedPyPosition(tx, createdPyPosition, p.senderAddress);
    }

    return tx;
  }

  // D2s. Scallop underlying -> sCoin -> SY -> PT (exact in, single PTB)
  buildSwapScallopUnderlyingForPtTx(
    p: SwapScallopUnderlyingForPtParams,
  ): Transaction {
    const tx = this.newTx(p.senderAddress);

    let createdPyPosition: TransactionObjectArgument | null = null;
    const pyPositionArg =
      p.pyPositionId ?? (createdPyPosition = addCreatePyPosition(tx, this.config));

    const syCoin = this.addScallopMintSyExactIn(tx, p.underlyingAmount);
    const priceInfo = addScallopPriceInfo(tx, this.config);
    const [, syChange] = this.addSwapSyForPt(tx, syCoin, p.minPtOut, priceInfo, pyPositionArg);
    tx.transferObjects([syChange], tx.pure.address(p.senderAddress));

    if (createdPyPosition) {
      this.addTransferCreatedPyPosition(tx, createdPyPosition, p.senderAddress);
    }

    return tx;
  }

  async buildSwapUnderlyingForYtTx(p: SwapUnderlyingForYtParams): Promise<Transaction> {
    const syIndex = await this.resolveSyIndex(p.syIndex);
    const syBudget = this.underlyingToSyAmount(p.underlyingAmount, syIndex);
    const [fills, initialYtBalance] = await Promise.all([
      this.planYtAskFills(syBudget, syIndex),
      this.getPositionYtBalance(p.pyPositionId),
    ]);
    const tx = this.newTx(p.senderAddress);

    let createdPyPosition: TransactionObjectArgument | null = null;
    const pyPositionArg =
      p.pyPositionId ?? (createdPyPosition = addCreatePyPosition(tx, this.config));

    const underlyingCoin = tx.splitCoins(tx.object(p.underlyingCoinId), [
      tx.pure.u64(p.underlyingAmount),
    ]);
    const priceInfo1 = addDemoPriceInfo(tx, this.config, syIndex);
    const [syCoin, mintRequest] = addMintSyExactIn(
      tx,
      this.config,
      priceInfo1,
      p.underlyingAmount,
    );
    addDemoDeposit(tx, this.config, mintRequest, underlyingCoin);

    const filledSy = fills.reduce((sum, fill) => sum + fill.syAmount, 0n);
    const priceInfo2 =
      filledSy < syBudget ? addDemoPriceInfo(tx, this.config, syIndex) : null;
    const syChange = this.addOrderbookThenAmmSwapSyForYt(
      tx,
      syCoin,
      syBudget,
      p.minYtOut,
      initialYtBalance,
      priceInfo2,
      pyPositionArg,
      fills,
    );
    tx.transferObjects([syChange], tx.pure.address(p.senderAddress));

    if (createdPyPosition) {
      this.addTransferCreatedPyPosition(tx, createdPyPosition, p.senderAddress);
    }

    return tx;
  }

  // D3s. Scallop underlying -> sCoin -> SY -> YT (exact in, single PTB)
  async buildSwapScallopUnderlyingForYtTx(
    p: SwapScallopUnderlyingForYtParams,
  ): Promise<Transaction> {
    const syIndex = await this.resolveSyIndex();
    const syBudget = this.underlyingToSyAmount(p.underlyingAmount, syIndex);
    const [fills, initialYtBalance] = await Promise.all([
      this.planYtAskFills(syBudget, syIndex),
      this.getPositionYtBalance(p.pyPositionId),
    ]);
    const tx = this.newTx(p.senderAddress);

    let createdPyPosition: TransactionObjectArgument | null = null;
    const pyPositionArg =
      p.pyPositionId ?? (createdPyPosition = addCreatePyPosition(tx, this.config));

    const syCoin = this.addScallopMintSyExactIn(tx, p.underlyingAmount);
    const filledSy = fills.reduce((sum, fill) => sum + fill.syAmount, 0n);
    const priceInfo =
      filledSy < syBudget ? addScallopPriceInfo(tx, this.config) : null;
    const syChange = this.addOrderbookThenAmmSwapSyForYt(
      tx,
      syCoin,
      syBudget,
      p.minYtOut,
      initialYtBalance,
      priceInfo,
      pyPositionArg,
      fills,
    );
    tx.transferObjects([syChange], tx.pure.address(p.senderAddress));

    if (createdPyPosition) {
      this.addTransferCreatedPyPosition(tx, createdPyPosition, p.senderAddress);
    }

    return tx;
  }

  // E. PT → SY (exact in)
  async buildSwapPtForSyTx(p: SwapPtForSyParams): Promise<Transaction> {
    const tx = this.newTx(p.senderAddress);
    const priceInfo = await this.addCurrentPriceInfo(tx, p.syIndex);
    const syCoin = this.addSwapPtForSy(tx, p.ptAmount, p.minSyOut, priceInfo, p.pyPositionId);
    tx.transferObjects([syCoin], tx.pure.address(p.senderAddress));
    return tx;
  }

  async buildHybridSwapPtForSyTx(p: HybridSwapPtForSyParams): Promise<Transaction> {
    const tx = this.newTx(p.senderAddress);
    const priceInfo = await this.addCurrentPriceInfo(tx, p.syIndex);
    const syCoin = this.addHybridSwapPtForSy(
      tx,
      p.ptAmount,
      p.orderIds,
      p.minBookPriceRaw,
      p.minSyOut,
      priceInfo,
      p.pyPositionId,
    );
    tx.transferObjects([syCoin], tx.pure.address(p.senderAddress));
    return tx;
  }

  buildPlaceBidOrderTx(p: PlaceBidOrderParams): Transaction {
    const tx = this.newTx(p.senderAddress);
    const syCoin = tx.splitCoins(tx.object(p.syCoinId), [tx.pure.u64(p.syAmount)]);
    addPlaceBidOrder(
      tx,
      this.config,
      syCoin,
      p.priceRaw,
      p.minPtAmount,
      p.expiryMs ?? 0n,
      p.asset ?? "pt",
    );
    return tx;
  }

  async buildPlaceBidOrderFromUnderlyingTx(
    p: PlaceBidOrderFromUnderlyingParams,
  ): Promise<Transaction> {
    const syIndex = await this.resolveSyIndex(p.syIndex);
    const tx = this.newTx(p.senderAddress);

    const underlyingCoin = tx.splitCoins(tx.object(p.underlyingCoinId), [
      tx.pure.u64(p.underlyingAmount),
    ]);
    const priceInfo = addDemoPriceInfo(tx, this.config, syIndex);
    const [mintedSyCoin, mintRequest] = addMintSyExactIn(
      tx,
      this.config,
      priceInfo,
      p.underlyingAmount,
    );
    addDemoDeposit(tx, this.config, mintRequest, underlyingCoin);

    const syForOrder = tx.splitCoins(mintedSyCoin, [tx.pure.u64(p.syAmount)]);
    addPlaceBidOrder(
      tx,
      this.config,
      syForOrder,
      p.priceRaw,
      p.minPtAmount,
      p.expiryMs ?? 0n,
      p.asset ?? "pt",
    );
    tx.transferObjects([mintedSyCoin], tx.pure.address(p.senderAddress));

    return tx;
  }

  buildPlaceBidOrderFromScallopUnderlyingTx(
    p: PlaceBidOrderFromScallopUnderlyingParams,
  ): Transaction {
    const tx = this.newTx(p.senderAddress);
    const mintedSyCoin = this.addScallopMintSyExactIn(tx, p.underlyingAmount);
    const syForOrder = tx.splitCoins(mintedSyCoin, [tx.pure.u64(p.syAmount)]);
    addPlaceBidOrder(
      tx,
      this.config,
      syForOrder,
      p.priceRaw,
      p.minPtAmount,
      p.expiryMs ?? 0n,
      p.asset ?? "pt",
    );
    tx.transferObjects([mintedSyCoin], tx.pure.address(p.senderAddress));

    return tx;
  }

  buildPlaceAskOrderTx(p: PlaceAskOrderParams): Transaction {
    const tx = this.newTx(p.senderAddress);
    addPlaceAskOrderFromPosition(
      tx,
      this.config,
      p.ptAmount,
      p.priceRaw,
      p.pyPositionId,
      p.expiryMs ?? 0n,
      p.asset ?? "pt",
    );
    return tx;
  }

  buildClaimOrderTx(p: OrderActionParams): Transaction {
    const tx = this.newTx(p.senderAddress);
    const [syCoin, assetCoin] = addClaimOrder(tx, this.config, p.orderId, p.asset ?? "pt");
    tx.transferObjects([syCoin, assetCoin], tx.pure.address(p.senderAddress));
    return tx;
  }

  buildCancelOrderTx(p: OrderActionParams): Transaction {
    const tx = this.newTx(p.senderAddress);
    const [syCoin, assetCoin] = addCancelOrder(tx, this.config, p.orderId, p.asset ?? "pt");
    tx.transferObjects([syCoin, assetCoin], tx.pure.address(p.senderAddress));
    return tx;
  }

  buildSetOrderbookPausedByAclTx(
    p: SetOrderbookPausedByAclParams,
  ): Transaction {
    const tx = this.newTx(p.senderAddress);
    addSetOrderbookPausedByAcl(tx, this.config, p.paused, p.asset ?? "pt");
    return tx;
  }

  buildPauseOrderbookByAclTx(
    p: Omit<SetOrderbookPausedByAclParams, "paused">,
  ): Transaction {
    return this.buildSetOrderbookPausedByAclTx({ ...p, paused: true });
  }

  buildUnpauseOrderbookByAclTx(
    p: Omit<SetOrderbookPausedByAclParams, "paused">,
  ): Transaction {
    return this.buildSetOrderbookPausedByAclTx({ ...p, paused: false });
  }

  buildSetOrderbookPausedByAdminTx(
    p: SetOrderbookPausedByAdminParams,
  ): Transaction {
    const tx = this.newTx(p.senderAddress);
    addSetOrderbookPausedByAdmin(
      tx,
      this.config,
      p.adminCapId,
      p.paused,
      p.asset ?? "pt",
    );
    return tx;
  }

  buildPauseOrderbookByAdminTx(
    p: Omit<SetOrderbookPausedByAdminParams, "paused">,
  ): Transaction {
    return this.buildSetOrderbookPausedByAdminTx({ ...p, paused: true });
  }

  buildUnpauseOrderbookByAdminTx(
    p: Omit<SetOrderbookPausedByAdminParams, "paused">,
  ): Transaction {
    return this.buildSetOrderbookPausedByAdminTx({ ...p, paused: false });
  }

  // E2. PT → SY → underlying (exact in, single PTB)
  async buildSwapPtForUnderlyingTx(p: SwapPtForUnderlyingParams): Promise<Transaction> {
    const syIndex = await this.resolveSyIndex(p.syIndex);
    const tx = this.newTx(p.senderAddress);
    const priceInfoForSwap = await this.addCurrentPriceInfo(tx, syIndex);
    const syCoin = this.addSwapPtForSy(
      tx,
      p.ptAmount,
      p.minSyOut,
      priceInfoForSwap,
      p.pyPositionId,
    );
    const priceInfoForBurn = this.hasScallopRouteConfigured()
      ? addScallopPriceInfo(tx, this.config)
      : addDemoPriceInfo(tx, this.config, syIndex);
    const burnRequest = addBurnSyExactIn(tx, this.config, priceInfoForBurn, syCoin);
    const underlyingCoin = this.hasScallopRouteConfigured()
      ? addScallopRedeemToUnderlying(tx, this.config, burnRequest, 0n)
      : addDemoRedeem(tx, this.config, burnRequest);
    tx.transferObjects([underlyingCoin], tx.pure.address(p.senderAddress));
    return tx;
  }

  // F. Add liquidity (SY + PT → LP)
  async buildAddLiquidityTx(p: AddLiquidityParams): Promise<Transaction> {
    const tx = this.newTx(p.senderAddress);
    const syCoin = tx.splitCoins(tx.object(p.syCoinId), [tx.pure.u64(p.syAmount)]);

    let createdPosition: TransactionObjectArgument | null = null;
    const positionArg =
      p.pyPositionId ?? p.lpPositionId ?? (createdPosition = addCreatePosition(tx, this.config));

    const priceInfo = await this.addCurrentPriceInfo(tx, p.syIndex);
    const syChange =
      p.ptAmount === undefined
        ? this.addLiquidityFromSy(
            tx,
            syCoin,
            p.syToMintHint ?? 0n,
            p.minLpOut ?? 0n,
            p.minSyOut ?? 0n,
            priceInfo,
            positionArg,
          )[1]
        : this.addLiquidityFromPosition(
            tx,
            syCoin,
            p.ptAmount,
            priceInfo,
            positionArg,
            positionArg,
          )[2];
    tx.transferObjects([syChange], tx.pure.address(p.senderAddress));

    if (createdPosition) {
      this.addTransferCreatedPosition(tx, createdPosition, p.senderAddress);
    }

    return tx;
  }

  // F2. underlying → SY → add_liquidity (single PTB)
  async buildAddLiquidityFromUnderlyingTx(
    p: AddLiquidityFromUnderlyingParams,
  ): Promise<Transaction> {
    const syIndex = await this.resolveSyIndex(p.syIndex);
    const tx = this.newTx(p.senderAddress);

    let createdPosition: TransactionObjectArgument | null = null;
    const positionArg =
      p.pyPositionId ?? p.lpPositionId ?? (createdPosition = addCreatePosition(tx, this.config));

    const underlyingCoin = tx.splitCoins(tx.object(p.underlyingCoinId), [
      tx.pure.u64(p.underlyingAmount),
    ]);
    const priceInfo = addDemoPriceInfo(tx, this.config, syIndex);
    const [mintedSyCoin, mintRequest] = addMintSyExactIn(
      tx,
      this.config,
      priceInfo,
      p.underlyingAmount,
    );
    addDemoDeposit(tx, this.config, mintRequest, underlyingCoin);

    const syForLiquidity = tx.splitCoins(mintedSyCoin, [tx.pure.u64(p.syAmount)]);
    const priceInfoForLiquidity = addDemoPriceInfo(tx, this.config, syIndex);
    const syChange =
      p.ptAmount === undefined
        ? this.addLiquidityFromSy(
            tx,
            syForLiquidity,
            p.syToMintHint ?? 0n,
            p.minLpOut ?? 0n,
            p.minSyOut ?? 0n,
            priceInfoForLiquidity,
            positionArg,
          )[1]
        : this.addLiquidityFromPosition(
            tx,
            syForLiquidity,
            p.ptAmount,
            priceInfoForLiquidity,
            positionArg,
            positionArg,
          )[2];

    tx.transferObjects([mintedSyCoin, syChange], tx.pure.address(p.senderAddress));
    if (createdPosition) {
      this.addTransferCreatedPosition(tx, createdPosition, p.senderAddress);
    }

    return tx;
  }

  // G. Remove liquidity (LP → SY + PT)
  // Add liquidity while keeping the minted YT leg in PyPosition.
  async buildAddLiquidityKeepYtTx(
    p: AddLiquidityKeepYtParams,
  ): Promise<Transaction> {
    const syIndex = await this.resolveSyIndex(p.syIndex);
    const tx = this.newTx(p.senderAddress);
    const syCoin = tx.splitCoins(tx.object(p.syCoinId), [tx.pure.u64(p.syAmount)]);

    let createdPosition: TransactionObjectArgument | null = null;
    const positionArg =
      p.pyPositionId ?? p.lpPositionId ?? (createdPosition = addCreatePosition(tx, this.config));

    const priceInfo = addDemoPriceInfo(tx, this.config, syIndex);
    const [, , syChange] = this.addLiquidityKeepYtFromPosition(
      tx,
      syCoin,
      p.syToMint,
      p.minLpOut,
      priceInfo,
      positionArg,
      positionArg,
    );
    tx.transferObjects([syChange], tx.pure.address(p.senderAddress));

    if (createdPosition) {
      this.addTransferCreatedPosition(tx, createdPosition, p.senderAddress);
    }

    return tx;
  }

  buildAddLiquidityFromScallopUnderlyingTx(
    p: AddLiquidityFromScallopUnderlyingParams,
  ): Transaction {
    const tx = this.newTx(p.senderAddress);

    let createdPosition: TransactionObjectArgument | null = null;
    const positionArg =
      p.pyPositionId ?? p.lpPositionId ?? (createdPosition = addCreatePosition(tx, this.config));

    const mintedSyCoin = this.addScallopMintSyExactIn(tx, p.underlyingAmount);
    const syForLiquidity = tx.splitCoins(mintedSyCoin, [tx.pure.u64(p.syAmount)]);
    const priceInfo = addScallopPriceInfo(tx, this.config);
    const syChange =
      p.ptAmount === undefined
        ? this.addLiquidityFromSy(
            tx,
            syForLiquidity,
            p.syToMintHint ?? 0n,
            p.minLpOut ?? 0n,
            p.minSyOut ?? 0n,
            priceInfo,
            positionArg,
          )[1]
        : this.addLiquidityFromPosition(
            tx,
            syForLiquidity,
            p.ptAmount,
            priceInfo,
            positionArg,
            positionArg,
          )[2];

    tx.transferObjects([mintedSyCoin, syChange], tx.pure.address(p.senderAddress));
    if (createdPosition) {
      this.addTransferCreatedPosition(tx, createdPosition, p.senderAddress);
    }

    return tx;
  }

  async buildAddLiquidityZapTx(p: AddLiquidityZapParams): Promise<Transaction> {
    const tx = this.newTx(p.senderAddress);
    const syCoin = tx.splitCoins(tx.object(p.syCoinId), [tx.pure.u64(p.syAmount)]);
    const priceInfoForSwap = await this.addCurrentPriceInfo(tx, p.syIndex);
    const priceInfoForLiquidity = await this.addCurrentPriceInfo(tx, p.syIndex);

    this.addLiquidityZapFromSyCoin(tx, {
      lpPositionId: p.lpPositionId,
      minPtOut: p.minPtOut,
      priceInfoForLiquidity,
      priceInfoForSwap,
      pyPositionId: p.pyPositionId,
      senderAddress: p.senderAddress,
      syCoin,
      syToSwap: p.syToSwap,
    });

    return tx;
  }

  async buildAddLiquidityZapFromUnderlyingTx(
    p: AddLiquidityZapFromUnderlyingParams,
  ): Promise<Transaction> {
    const syIndex = await this.resolveSyIndex(p.syIndex);
    const tx = this.newTx(p.senderAddress);

    const underlyingCoin = tx.splitCoins(tx.object(p.underlyingCoinId), [
      tx.pure.u64(p.underlyingAmount),
    ]);
    const priceInfo = addDemoPriceInfo(tx, this.config, syIndex);
    const [syCoin, mintRequest] = addMintSyExactIn(
      tx,
      this.config,
      priceInfo,
      p.underlyingAmount,
    );
    addDemoDeposit(tx, this.config, mintRequest, underlyingCoin);

    const priceInfoForSwap = addDemoPriceInfo(tx, this.config, syIndex);
    const priceInfoForLiquidity = addDemoPriceInfo(tx, this.config, syIndex);
    this.addLiquidityZapFromSyCoin(tx, {
      lpPositionId: p.lpPositionId,
      minPtOut: p.minPtOut,
      priceInfoForLiquidity,
      priceInfoForSwap,
      pyPositionId: p.pyPositionId,
      senderAddress: p.senderAddress,
      syCoin,
      syToSwap: p.syToSwap,
    });

    return tx;
  }

  buildAddLiquidityZapFromScallopUnderlyingTx(
    p: AddLiquidityZapFromScallopUnderlyingParams,
  ): Transaction {
    const tx = this.newTx(p.senderAddress);
    const syCoin = this.addScallopMintSyExactIn(tx, p.underlyingAmount);
    const priceInfoForSwap = addScallopPriceInfo(tx, this.config);
    const priceInfoForLiquidity = addScallopPriceInfo(tx, this.config);

    this.addLiquidityZapFromSyCoin(tx, {
      lpPositionId: p.lpPositionId,
      minPtOut: p.minPtOut,
      priceInfoForLiquidity,
      priceInfoForSwap,
      pyPositionId: p.pyPositionId,
      senderAddress: p.senderAddress,
      syCoin,
      syToSwap: p.syToSwap,
    });

    return tx;
  }

  private addLiquidityZapFromSyCoin(
    tx: Transaction,
    p: {
      lpPositionId?: string;
      minPtOut: bigint;
      priceInfoForLiquidity: TransactionObjectArgument;
      priceInfoForSwap: TransactionObjectArgument;
      pyPositionId?: string;
      senderAddress: string;
      syCoin: TransactionObjectArgument;
      syToSwap: bigint;
    },
  ): void {
    let createdPosition: TransactionObjectArgument | null = null;
    const positionArg =
      p.pyPositionId ?? p.lpPositionId ?? (createdPosition = addCreatePosition(tx, this.config));

    const syForPt = tx.splitCoins(p.syCoin, [tx.pure.u64(p.syToSwap)]);
    const [ptOut, swapSyChange] = this.addSwapSyForPt(
      tx,
      syForPt,
      p.minPtOut,
      p.priceInfoForSwap,
      positionArg,
    );
    const [, , liquiditySyChange] = this.addLiquidityFromPosition(
      tx,
      p.syCoin,
      ptOut,
      p.priceInfoForLiquidity,
      positionArg,
      positionArg,
    );

    tx.transferObjects([swapSyChange, liquiditySyChange], tx.pure.address(p.senderAddress));
    if (createdPosition) {
      this.addTransferCreatedPosition(tx, createdPosition, p.senderAddress);
    }
  }

  async buildAddLiquidityKeepYtFromUnderlyingTx(
    p: AddLiquidityKeepYtFromUnderlyingParams,
  ): Promise<Transaction> {
    const syIndex = await this.resolveSyIndex(p.syIndex);
    const tx = this.newTx(p.senderAddress);

    let createdPosition: TransactionObjectArgument | null = null;
    const positionArg =
      p.pyPositionId ?? p.lpPositionId ?? (createdPosition = addCreatePosition(tx, this.config));

    const underlyingCoin = tx.splitCoins(tx.object(p.underlyingCoinId), [
      tx.pure.u64(p.underlyingAmount),
    ]);
    const priceInfo1 = addDemoPriceInfo(tx, this.config, syIndex);
    const [mintedSyCoin, mintRequest] = addMintSyExactIn(
      tx,
      this.config,
      priceInfo1,
      p.underlyingAmount,
    );
    addDemoDeposit(tx, this.config, mintRequest, underlyingCoin);

    const syForRoute = tx.splitCoins(mintedSyCoin, [tx.pure.u64(p.syAmount)]);
    const priceInfo2 = addDemoPriceInfo(tx, this.config, syIndex);
    const [, , syChange] = this.addLiquidityKeepYtFromPosition(
      tx,
      syForRoute,
      p.syToMint,
      p.minLpOut,
      priceInfo2,
      positionArg,
      positionArg,
    );

    tx.transferObjects([mintedSyCoin, syChange], tx.pure.address(p.senderAddress));
    if (createdPosition) {
      this.addTransferCreatedPosition(tx, createdPosition, p.senderAddress);
    }

    return tx;
  }

  buildAddLiquidityKeepYtFromScallopUnderlyingTx(
    p: AddLiquidityKeepYtFromScallopUnderlyingParams,
  ): Transaction {
    const tx = this.newTx(p.senderAddress);

    let createdPosition: TransactionObjectArgument | null = null;
    const positionArg =
      p.pyPositionId ?? p.lpPositionId ?? (createdPosition = addCreatePosition(tx, this.config));

    const mintedSyCoin = this.addScallopMintSyExactIn(tx, p.underlyingAmount);
    const syForRoute = tx.splitCoins(mintedSyCoin, [tx.pure.u64(p.syAmount)]);
    const priceInfo = addScallopPriceInfo(tx, this.config);
    const [, , syChange] = this.addLiquidityKeepYtFromPosition(
      tx,
      syForRoute,
      p.syToMint,
      p.minLpOut,
      priceInfo,
      positionArg,
      positionArg,
    );

    tx.transferObjects([mintedSyCoin, syChange], tx.pure.address(p.senderAddress));
    if (createdPosition) {
      this.addTransferCreatedPosition(tx, createdPosition, p.senderAddress);
    }

    return tx;
  }

  // Remove liquidity; existing YT stays untouched.
  buildRemoveLiquidityTx(p: RemoveLiquidityParams): Transaction {
    const tx = this.newTx(p.senderAddress);
    const [syCoin] = this.addRemoveLiquidityToPosition(
      tx,
      p.lpAmount,
      p.pyPositionId,
      p.lpPositionId,
    );
    tx.transferObjects([syCoin], tx.pure.address(p.senderAddress));
    return tx;
  }

  // H. PT + YT → SY (before expiry)
  async buildRedeemBeforeExpiryTx(p: RedeemBeforeExpiryParams): Promise<Transaction> {
    const tx = this.newTx(p.senderAddress);
    const priceInfo = await this.addCurrentPriceInfo(tx, p.syIndex);
    const syCoin = this.addRedeemBeforeExpiry(tx, p.ptAmount, priceInfo, p.pyPositionId);
    tx.transferObjects([syCoin], tx.pure.address(p.senderAddress));
    return tx;
  }

  // H2. PT + YT → SY → underlying (before expiry, single PTB)
  async buildRedeemBeforeExpiryToUnderlyingTx(
    p: RedeemBeforeExpiryToUnderlyingParams,
  ): Promise<Transaction> {
    const syIndex = await this.resolveSyIndex(p.syIndex);
    const tx = this.newTx(p.senderAddress);

    const priceInfo1 = await this.addCurrentPriceInfo(tx, syIndex);
    const syCoin = this.addRedeemBeforeExpiry(
      tx,
      p.ptAmount,
      priceInfo1,
      p.pyPositionId,
    );
    const priceInfo2 = this.hasScallopRouteConfigured()
      ? addScallopPriceInfo(tx, this.config)
      : addDemoPriceInfo(tx, this.config, syIndex);
    const burnRequest = addBurnSyExactIn(tx, this.config, priceInfo2, syCoin);
    const underlyingCoin = this.hasScallopRouteConfigured()
      ? addScallopRedeemToUnderlying(tx, this.config, burnRequest, 0n)
      : addDemoRedeem(tx, this.config, burnRequest);
    tx.transferObjects([underlyingCoin], tx.pure.address(p.senderAddress));

    return tx;
  }

  // I. PT → SY (after expiry)
  async buildRedeemAfterExpiryTx(p: RedeemAfterExpiryParams): Promise<Transaction> {
    const tx = this.newTx(p.senderAddress);
    const syCoin = this.addRedeemAfterExpiry(tx, p.ptAmount, p.pyPositionId);
    tx.transferObjects([syCoin], tx.pure.address(p.senderAddress));
    return tx;
  }

  // J. Claim YT interest → SY
  async buildClaimYtInterestTx(p: ClaimYtInterestParams): Promise<Transaction> {
    const tx = this.newTx(p.senderAddress);
    const priceInfo = await this.addCurrentPriceInfo(tx, p.syIndex);
    const syCoin = this.addClaimYtInterest(tx, priceInfo, p.pyPositionId);
    tx.transferObjects([syCoin], tx.pure.address(p.senderAddress));
    return tx;
  }

  buildSettleLpPointsTx(p: LpPointsActionParams): Transaction {
    const tx = this.newTx(p.senderAddress);
    addSettleLpPositionWithLiquidlinkPoints(tx, this.config, p.lpPositionId);
    return tx;
  }

  buildClaimLpPointsTx(p: LpPointsActionParams): Transaction {
    const tx = this.newTx(p.senderAddress);
    addClaimLpPointsWithLiquidlinkPoints(tx, this.config, p.lpPositionId);
    return tx;
  }

  buildClaimCoinRewardTx(p: CoinRewardActionParams): Transaction {
    const tx = this.newTx(p.senderAddress);
    const rewardCoin = addSettleAndClaimCoinReward(
      tx,
      this.config,
      p.positionId,
      p.senderAddress,
      p.scope,
    );
    tx.transferObjects([rewardCoin], tx.pure.address(p.senderAddress));
    return tx;
  }

  buildDailyCheckInTx(p: DailyCheckInParams): Transaction {
    const tx = this.newTx(p.senderAddress);
    addDailyCheckIn(tx, this.config);
    return tx;
  }

  // K. Create PyPosition
  buildCreatePyPositionTx(senderAddress: string): Transaction {
    const tx = this.newTx(senderAddress);
    const position = addCreatePyPosition(tx, this.config);
    this.addTransferCreatedPyPosition(tx, position, senderAddress);
    return tx;
  }

  // L. Create LpPosition
  buildCreateLpPositionTx(senderAddress: string): Transaction {
    const tx = this.newTx(senderAddress);
    const position = addCreateLpPosition(tx, this.config);
    this.addTransferCreatedLpPosition(tx, position, senderAddress);
    return tx;
  }

  // M. SY → underlying
  async buildRedeemSyToUnderlyingTx(p: RedeemSyToUnderlyingParams): Promise<Transaction> {
    const syIndex = await this.resolveSyIndex(p.syIndex);
    const tx = this.newTx(p.senderAddress);
    const syCoin = tx.splitCoins(tx.object(p.syCoinId), [tx.pure.u64(p.syAmount)]);
    const priceInfo = this.hasScallopRouteConfigured()
      ? addScallopPriceInfo(tx, this.config)
      : addDemoPriceInfo(tx, this.config, syIndex);
    const burnRequest = addBurnSyExactIn(tx, this.config, priceInfo, syCoin);
    const underlyingCoin = this.hasScallopRouteConfigured()
      ? addScallopRedeemToUnderlying(tx, this.config, burnRequest, 0n)
      : addDemoRedeem(tx, this.config, burnRequest);
    tx.transferObjects([underlyingCoin], tx.pure.address(p.senderAddress));
    return tx;
  }

  // N. SY → exact YT (exact out)
  async buildSwapSyForExactYtTx(p: SwapSyForExactYtParams): Promise<Transaction> {
    const tx = this.newTx(p.senderAddress);
    const syCoin = tx.splitCoins(tx.object(p.syCoinId), [tx.pure.u64(p.syBudget)]);
    const priceInfo = await this.addCurrentPriceInfo(tx, p.syIndex);
    const [, syChange] = this.addSwapSyForExactYt(
      tx,
      syCoin,
      p.ytOut,
      p.maxSyIn,
      priceInfo,
      p.pyPositionId,
    );
    tx.transferObjects([syChange], tx.pure.address(p.senderAddress));
    return tx;
  }

  // N2. YT → underlying by temporarily buying the matching PT leg.
  async buildSwapYtForUnderlyingTx(p: SwapYtForUnderlyingParams): Promise<Transaction> {
    const syIndex = await this.resolveSyIndex(p.syIndex);
    const fills = await this.planYtBidFills(p.ytAmount, syIndex);
    const tx = this.newTx(p.senderAddress);

    const filledYt = fills.reduce((sum, fill) => sum + fill.assetAmount, 0n);
    const priceInfo1 =
      filledYt < p.ytAmount ? await this.addCurrentPriceInfo(tx, syIndex) : null;
    const syCoin = this.addOrderbookThenAmmSwapYtForSy(
      tx,
      p.ytAmount,
      p.minSyOut,
      priceInfo1,
      p.pyPositionId,
      fills,
    );

    const priceInfo2 = this.hasScallopRouteConfigured()
      ? addScallopPriceInfo(tx, this.config)
      : addDemoPriceInfo(tx, this.config, syIndex);
    const burnRequest = addBurnSyExactIn(
      tx,
      this.config,
      priceInfo2,
      syCoin,
    );
    const finalUnderlyingCoin = this.hasScallopRouteConfigured()
      ? addScallopRedeemToUnderlying(tx, this.config, burnRequest, 0n)
      : addDemoRedeem(tx, this.config, burnRequest);
    tx.transferObjects([finalUnderlyingCoin], tx.pure.address(p.senderAddress));

    return tx;
  }

  // O. PT → exact SY (exact out)
  async buildSwapPtForExactSyTx(p: SwapPtForExactSyParams): Promise<Transaction> {
    const tx = this.newTx(p.senderAddress);
    const priceInfo = await this.addCurrentPriceInfo(tx, p.syIndex);
    const syCoin = this.addSwapPtForExactSy(
      tx,
      p.syOut,
      p.maxPtIn,
      priceInfo,
      p.pyPositionId,
    );
    tx.transferObjects([syCoin], tx.pure.address(p.senderAddress));
    return tx;
  }

  // -------------------------------------------------------------------------
  // Quotes  (read-only, no wallet needed)
  // -------------------------------------------------------------------------

  /** PT received for exact SY in. */
  quoteSwapSyForPt(syIn: bigint): Promise<QuoteSwapSyForPt> {
    return quoteSwapSyForPt(this.network, this.config, syIn);
  }

  /** Convert exact underlying input to SY using current sy_index (floor). */
  async quoteUnderlyingToSy(
    underlyingIn: bigint,
    syIndex?: bigint,
  ): Promise<{ syIn: bigint; syIndex: bigint }> {
    const resolvedSyIndex = await this.resolveSyIndex(syIndex);
    return {
      syIn: this.underlyingToSyAmount(underlyingIn, resolvedSyIndex),
      syIndex: resolvedSyIndex,
    };
  }

  /** PT received for exact underlying in (underlying -> SY by sy_index, then SY -> PT). */
  async quoteSwapUnderlyingForPt(
    underlyingIn: bigint,
    syIndex?: bigint,
  ): Promise<QuoteSwapSyForPt & { syIn: bigint; syIndex: bigint }> {
    const converted = await this.quoteUnderlyingToSy(underlyingIn, syIndex);
    const quote = await this.quoteSwapSyForPt(converted.syIn);
    return { ...quote, ...converted };
  }

  /** SY received for exact PT in. */
  quoteSwapPtForSy(ptIn: bigint): Promise<QuoteSwapPtForSy> {
    return quoteSwapPtForSy(this.network, this.config, ptIn);
  }

  /** underlying received for exact PT in (PT -> SY -> underlying by sy_index). */
  async quoteSwapPtForUnderlying(
    ptIn: bigint,
    syIndex?: bigint,
  ): Promise<QuoteSwapPtForUnderlying> {
    const [resolvedSyIndex, quote] = await Promise.all([
      this.resolveSyIndex(syIndex),
      this.quoteSwapPtForSy(ptIn),
    ]);
    return {
      ...quote,
      syIndex: resolvedSyIndex,
      underlyingOut: this.syToUnderlyingAmount(quote.syOut, resolvedSyIndex),
    };
  }

  /** SY required for exact PT out. */
  quoteSwapSyForExactPt(ptOut: bigint): Promise<QuoteSwapSyForExactPt> {
    return quoteSwapSyForExactPt(this.network, this.config, ptOut);
  }

  /** PT required for exact SY out. */
  quoteSwapPtForExactSy(syOut: bigint): Promise<QuoteSwapPtForExactSy> {
    return quoteSwapPtForExactSy(this.network, this.config, syOut);
  }

  /** YT received for exact SY in. Auto-fetches syIndex if omitted. */
  async quoteSwapSyForYt(syIn: bigint, syIndex?: bigint): Promise<QuoteSwapSyForYt> {
    return quoteSwapSyForYt(this.network, this.config, syIn, await this.resolveSyIndex(syIndex));
  }

  /** YT received for exact underlying in (underlying -> SY by sy_index, then SY -> YT). */
  async quoteSwapUnderlyingForYt(
    underlyingIn: bigint,
    syIndex?: bigint,
  ): Promise<QuoteSwapSyForYt & { syIn: bigint; syIndex: bigint }> {
    const converted = await this.quoteUnderlyingToSy(underlyingIn, syIndex);
    const quote = await this.quoteSwapSyForYt(converted.syIn, converted.syIndex);
    return { ...quote, ...converted };
  }

  /** SY required for exact YT out. Auto-fetches syIndex if omitted. */
  async quoteSwapSyForExactYt(ytOut: bigint, syIndex?: bigint): Promise<QuoteSwapSyForExactYt> {
    return quoteSwapSyForExactYt(this.network, this.config, ytOut, await this.resolveSyIndex(syIndex));
  }

  /** SY received for exact YT in, net of the router-level PT settlement leg. */
  async quoteSwapYtForSy(
    ytIn: bigint,
    syIndex?: bigint,
  ): Promise<QuoteSwapYtForSy & { syIndex: bigint }> {
    const resolvedSyIndex = await this.resolveSyIndex(syIndex);
    const quote = await quoteSwapYtForSy(
      this.network,
      this.config,
      ytIn,
      resolvedSyIndex,
    );
    return { ...quote, syIndex: resolvedSyIndex };
  }

  /** underlying received for exact YT in through the router-level PT settlement path. */
  async quoteSwapYtForUnderlying(
    ytIn: bigint,
    syIndex?: bigint,
  ): Promise<QuoteSwapYtForUnderlying> {
    const resolvedSyIndex = await this.resolveSyIndex(syIndex);
    const quote = await quoteSwapYtForSy(
      this.network,
      this.config,
      ytIn,
      resolvedSyIndex,
    );

    return {
      syOut: quote.syOut,
      syRedeemOut: quote.syRedeemOut,
      syRepaid: quote.syRepaid,
      underlyingOut: this.syToUnderlyingAmount(quote.syOut, resolvedSyIndex),
      syIndex: resolvedSyIndex,
      slippageBps: quote.slippageBps,
    };
  }

  /** PT price and YT price as FP64 u128. Auto-fetches syIndex if omitted. */
  async quotePrices(syIndex?: bigint): Promise<QuotePrices> {
    return quotePrices(this.network, this.config, await this.resolveSyIndex(syIndex));
  }

  /** SY value of LP tokens. */
  quoteLpValue(lpAmount: bigint): Promise<QuoteLpValue> {
    return quoteLpValue(this.network, this.config, lpAmount);
  }

  /** Claimable YT interest for a PyPosition. */
  quoteClaimableInterest(pyPositionId: string): Promise<QuoteClaimableInterest> {
    return quoteClaimableInterest(this.network, this.config, pyPositionId);
  }

  /** Whether the market has expired. */
  quoteIsMarketExpired(): Promise<boolean> {
    return quoteIsMarketExpired(this.network, this.config);
  }

  // -------------------------------------------------------------------------
  // APY History & Market Discovery
  // -------------------------------------------------------------------------

  /**
   * Return implied-APY time series from on-chain SwapEvents.
   * Suitable for driving the APY history chart.
   */
  getPoolApyHistory(limit = 100): Promise<PoolImpliedRatePoint[]> {
    return getPoolApyHistory(this.network, this.config, limit);
  }

  /**
   * Discover all pools created by this package on-chain.
   * Returns raw PoolCreatedEvent records — pair with queryPyStateCreatedEvents
   * to build a full market list.
   */
  discoverPools(limit = 50): Promise<PoolCreatedEvent[]> {
    return queryPoolCreatedEvents(this.network, this.config.jitterPackageId, limit);
  }

  /**
   * Discover all PyState objects created by this package.
   */
  discoverPyStates(limit = 50): Promise<PyStateCreatedEvent[]> {
    return queryPyStateCreatedEvents(this.network, this.config.jitterPackageId, limit);
  }

  /**
   * Fetch raw SwapEvents for the configured pool.
   * Used to build trade history tables and reconstruct APY history.
   */
  getSwapHistory(limit = 200): Promise<Array<SwapEvent & { timestampMs: number; digest: string }>> {
    return querySwapEvents(this.network, this.config.jitterPackageId, this.config.poolObjectId, limit);
  }

  /**
   * Admin-triggered settle using the `py_state.settle` ACL role.
   * Bounds the settlement window to the oracle's `max_staleness_ms` guard.
   * Aborts on-chain if `senderAddress` does not hold the role.
   */
  async buildSettleExpiredByAclTx(
    p: SettleExpiredByAclParams,
  ): Promise<Transaction> {
    const syIndex = await this.resolveSyIndex(p.syIndex);
    const tx = this.newTx(p.senderAddress);
    const priceInfo = addDemoPriceInfo(tx, this.config, syIndex);
    tx.moveCall({
      target: `${this.config.jitterPackageId}::py_state::settle_expired_market_by_acl`,
      arguments: [
        tx.object(this.config.pyStateObjectId),
        priceInfo,
        tx.object(this.config.aclObjectId),
      ],
      typeArguments: [this.config.syTypeTag],
    });
    return tx;
  }

  /**
   * Admin-triggered settle using an `AdminCap` held by the caller. Mirror of
   * the ACL path for deployments that have not yet handed out the role.
   */
  async buildSettleExpiredByAdminTx(
    p: SettleExpiredByAdminParams,
  ): Promise<Transaction> {
    const syIndex = await this.resolveSyIndex(p.syIndex);
    const tx = this.newTx(p.senderAddress);
    const priceInfo = addDemoPriceInfo(tx, this.config, syIndex);
    tx.moveCall({
      target: `${this.config.jitterPackageId}::py_state::settle_expired_market_by_admin`,
      arguments: [
        tx.object(this.config.pyStateObjectId),
        priceInfo,
        tx.object(p.adminCapId),
      ],
      typeArguments: [this.config.syTypeTag],
    });
    return tx;
  }

  /**
   * Preview matched-pair add_liquidity: returns the LP amount and the PT amount
   * that pairs with `syIn` at the current pool ratio. Pass `ptIn = 0n` to let
   * the SDK compute the matched pairing; pass a non-zero `ptIn` to preview LP
   * for a specific (syIn, ptIn) pairing.
   */
  quoteAddLiquidity(
    syIn: bigint,
    ptIn: bigint = BigInt(0),
  ): Promise<QuoteAddLiquidity> {
    return quoteAddLiquidity(this.network, this.config, syIn, ptIn);
  }

  /** LP preview for exact underlying in via sy_index conversion. */
  async quoteAddLiquidityFromUnderlying(
    underlyingIn: bigint,
    ptIn: bigint = BigInt(0),
    syIndex?: bigint,
  ): Promise<QuoteAddLiquidity & { syIn: bigint; syIndex: bigint }> {
    const converted = await this.quoteUnderlyingToSy(underlyingIn, syIndex);
    const quote = await this.quoteAddLiquidity(converted.syIn, ptIn);
    return { ...quote, ...converted };
  }

  /** LP preview for single-asset zap: swap part of SY to PT, then add LP. */
  quoteAddLiquidityZap(syIn: bigint): Promise<QuoteAddLiquidityZap> {
    return quoteAddLiquidityZap(this.network, this.config, syIn);
  }

  /** LP preview for single-SY add using the on-chain non-keep YT route. */
  async quoteAddLiquidityFromSy(
    syIn: bigint,
    syIndex?: bigint,
  ): Promise<QuoteAddLiquidityFromSy & { syIndex: bigint }> {
    const resolvedSyIndex = await this.resolveSyIndex(syIndex);
    const quote = await quoteAddLiquidityFromSy(
      this.network,
      this.config,
      syIn,
      resolvedSyIndex,
    );
    return { ...quote, syIndex: resolvedSyIndex };
  }

  /** LP preview for exact underlying in using the single-SY non-keep YT route. */
  async quoteAddLiquidityFromSyFromUnderlying(
    underlyingIn: bigint,
    syIndex?: bigint,
  ): Promise<QuoteAddLiquidityFromSyFromUnderlying> {
    const converted = await this.quoteUnderlyingToSy(underlyingIn, syIndex);
    const quote = await quoteAddLiquidityFromSy(
      this.network,
      this.config,
      converted.syIn,
      converted.syIndex,
    );
    return { ...quote, ...converted };
  }

  /** LP preview for exact underlying in using single-asset zap. */
  async quoteAddLiquidityZapFromUnderlying(
    underlyingIn: bigint,
    syIndex?: bigint,
  ): Promise<QuoteAddLiquidityZap & { syIn: bigint; syIndex: bigint }> {
    const converted = await this.quoteUnderlyingToSy(underlyingIn, syIndex);
    const quote = await this.quoteAddLiquidityZap(converted.syIn);
    return { ...quote, ...converted };
  }

  /** LP preview for exact SY in using keep-YT mode. */
  async quoteAddLiquidityKeepYt(
    syIn: bigint,
    syIndex?: bigint,
  ): Promise<QuoteAddLiquidityKeepYt & { syIndex: bigint }> {
    const resolvedSyIndex = await this.resolveSyIndex(syIndex);
    const quote = await quoteAddLiquidityKeepYt(
      this.network,
      this.config,
      syIn,
      resolvedSyIndex,
    );
    return { ...quote, syIndex: resolvedSyIndex };
  }

  /** LP preview for exact underlying in using keep-YT mode. */
  async quoteAddLiquidityKeepYtFromUnderlying(
    underlyingIn: bigint,
    syIndex?: bigint,
  ): Promise<QuoteAddLiquidityKeepYtFromUnderlying> {
    const converted = await this.quoteUnderlyingToSy(underlyingIn, syIndex);
    const quote = await quoteAddLiquidityKeepYt(
      this.network,
      this.config,
      converted.syIn,
      converted.syIndex,
    );
    return { ...quote, ...converted };
  }

  /**
   * Collect accumulated protocol treasury interest using the
   * `treasury.collect` ACL role. The returned SY coin is transferred to
   * `recipient` when provided, otherwise to the sender. Aborts on-chain if
   * the caller does not hold the role. Emits `TreasuryInterestCollectedEvent`.
   */
  buildCollectTreasuryInterestByAclTx(
    p: CollectTreasuryInterestByAclParams,
  ): Transaction {
    const tx = this.newTx(p.senderAddress);
    const syCoin = tx.moveCall({
      target: `${this.config.jitterPackageId}::py_state::collect_treasury_interest_by_acl`,
      arguments: [
        tx.object(this.config.pyStateObjectId),
        tx.object(this.config.aclObjectId),
      ],
      typeArguments: [this.config.syTypeTag],
    });
    tx.transferObjects(
      [syCoin],
      tx.pure.address(p.recipient ?? p.senderAddress),
    );
    return tx;
  }

  /**
   * Collect accumulated protocol treasury interest using an `AdminCap` owned
   * by the caller. Mirror of the ACL path for deployments that have not yet
   * handed out the `treasury.collect` role.
   */
  buildCollectTreasuryInterestByAdminTx(
    p: CollectTreasuryInterestByAdminParams,
  ): Transaction {
    const tx = this.newTx(p.senderAddress);
    const syCoin = tx.moveCall({
      target: `${this.config.jitterPackageId}::py_state::collect_treasury_interest_by_admin`,
      arguments: [
        tx.object(this.config.pyStateObjectId),
        tx.object(p.adminCapId),
      ],
      typeArguments: [this.config.syTypeTag],
    });
    tx.transferObjects(
      [syCoin],
      tx.pure.address(p.recipient ?? p.senderAddress),
    );
    return tx;
  }

  // P. underlying → SY only
  async buildDepositToSyTx(p: DepositToSyParams): Promise<Transaction> {
    const syIndex = await this.resolveSyIndex(p.syIndex);
    const tx = this.newTx(p.senderAddress);
    const underlyingCoin = tx.splitCoins(tx.object(p.underlyingCoinId), [
      tx.pure.u64(p.underlyingAmount),
    ]);
    const priceInfo = addDemoPriceInfo(tx, this.config, syIndex);
    const [syCoin, mintRequest] = addMintSyExactIn(
      tx,
      this.config,
      priceInfo,
      p.underlyingAmount,
    );
    addDemoDeposit(tx, this.config, mintRequest, underlyingCoin);
    tx.transferObjects([syCoin], tx.pure.address(p.senderAddress));
    return tx;
  }

  buildDepositScallopToSyTx(p: DepositScallopToSyParams): Transaction {
    const tx = this.newTx(p.senderAddress);
    const syCoin = this.addScallopMintSyExactIn(tx, p.underlyingAmount);
    tx.transferObjects([syCoin], tx.pure.address(p.senderAddress));
    return tx;
  }
}

// ---------------------------------------------------------------------------
// Convenience factory
// ---------------------------------------------------------------------------

/**
 * Create a JitterClient from env vars with a given network.
 * Equivalent to JitterClient.fromEnv(network).
 */
export function createJitterClient(
  network: GrpcNetworkKind = "testnet",
  config: JitterMarketConfig = getDemoMarketConfig(network),
): JitterClient {
  return JitterClient.fromConfig(network, config);
}
