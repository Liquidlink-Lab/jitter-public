import { describe, expect, test } from "bun:test";

import * as sdk from "../index.js";
import {
  calcImpliedApy,
  createJitterClient,
  formatTokenAmount,
  getDefaultJitterMarketConfig,
  getDemoMarketConfig,
  getMarketAccountingDecimals,
  getMarketUnderlyingDecimals,
  listJitterMarketConfigs,
  type JitterMarketConfig,
  type OrderbookOrder,
  type PoolActivityEntry,
  type PoolFields,
  type PyStateFields,
  type UserPortfolio,
} from "../index.js";

describe("frontend public API characterization", () => {
  test("frontend compatibility exports remain available", () => {
    expect(typeof sdk.createJitterClient).toBe("function");
    expect(typeof sdk.createJitterMarketDataService).toBe("function");
    expect(typeof sdk.createJitterTradeService).toBe("function");
    expect(typeof sdk.listJitterMarketConfigs).toBe("function");
    expect(typeof sdk.listJitterMarkets).toBe("function");
    expect(typeof sdk.getPoolActivity).toBe("function");
    expect(typeof sdk.getPoolApyHistory).toBe("function");
    expect(typeof sdk.getUnderlyingApyHistory).toBe("function");
    expect(typeof sdk.getLiquidlinkLeaderboard).toBe("function");
    expect(typeof sdk.hasJitterCheckInConfig).toBe("function");
    expect(typeof sdk.getMarketAccountingDecimals).toBe("function");
    expect(typeof sdk.getMarketUnderlyingDecimals).toBe("function");
    expect(typeof sdk.detectAdapterKind).toBe("function");
    expect(typeof sdk.getJitterAdapterManifest).toBe("function");
    expect(typeof sdk.calculateProfitScenario).toBe("function");
  });

  test("keeps config helpers used by frontend available", () => {
    const configs = listJitterMarketConfigs("testnet");
    const defaultConfig = getDefaultJitterMarketConfig("testnet");
    const demoConfig = getDemoMarketConfig("testnet");

    expect(configs.length).toBeGreaterThan(0);
    expect(defaultConfig).not.toBeNull();
    if (!defaultConfig) throw new Error("missing default testnet market config");
    expect(demoConfig.poolObjectId).toBe(defaultConfig.poolObjectId);
    expect(getMarketAccountingDecimals(demoConfig)).toBe(
      demoConfig.marketDecimals ?? demoConfig.underlyingDecimals ?? 6,
    );
    expect(getMarketUnderlyingDecimals(demoConfig)).toBe(
      demoConfig.underlyingDecimals ?? demoConfig.marketDecimals ?? 6,
    );
  });

  test("keeps formatting and APY helpers available", () => {
    expect(formatTokenAmount(1_000_000n, 6)).toBe("1.000000");
    expect(calcImpliedApy("0")).toBe(0);
  });

  test("keeps JitterClient facade methods used by frontend available", () => {
    const client = createJitterClient("testnet");
    const methodNames = [
      "getPoolState",
      "getPyState",
      "getUserPortfolio",
      "getOrderbookOrders",
      "getAllOrderbookOrders",
      "getLiquidlinkScoreInfo",
      "getLiquidlinkLeaderboard",
      "quoteSwapSyForPt",
      "quoteSwapUnderlyingForPt",
      "quoteAddLiquidityZap",
      "quoteAddLiquidityKeepYt",
      "quoteLpValue",
      "buildSwapSyForPtTx",
      "buildSwapUnderlyingForYtTx",
      "buildAddLiquidityZapTx",
      "buildClaimYtInterestTx",
      "buildDailyCheckInTx",
      "buildClaimOrderTx",
      "buildCancelOrderTx",
    ] as const;

    for (const methodName of methodNames) {
      expect(typeof client[methodName]).toBe("function");
    }
  });

  test("keeps frontend-facing types structurally compatible", () => {
    const config = getDemoMarketConfig("testnet") satisfies JitterMarketConfig;
    const pool = {
      id: { id: config.poolObjectId },
      expiry: "4102444800000",
      initial_anchor: "0",
      last_ln_implied_rate: "0",
      ln_fee_rate_root: "0",
      lp_supply: "0",
      paused: false,
      scalar_root: "0",
      total_pt: "0",
      total_sy: "0",
    } satisfies PoolFields;
    const pyState = {
      id: { id: config.pyStateObjectId },
      expiry: "4102444800000",
      global_interest_index: "0",
      is_settled: false,
      market_id: config.marketObjectId,
      pt_supply: "0",
      py_index_stored: "0",
      settled_py_index: "0",
      sy_balance: "0",
      yt_supply: "0",
    } satisfies PyStateFields;
    const activity = {
      digest: "0xabc",
      kind: "swap",
      poolId: config.poolObjectId,
      sender: "0x123",
      timestampMs: 0,
    } satisfies PoolActivityEntry;
    const order = {
      asset: "pt",
      claimablePt: "0",
      claimableSy: "0",
      createdAt: "0",
      escrowPt: "0",
      escrowSy: "0",
      expiryMs: "0",
      id: "0",
      owner: "0x123",
      priceRaw: "0",
      remainingPt: "0",
      side: "bid",
    } satisfies OrderbookOrder;
    const portfolio = {
      lpPositions: [],
      orders: [order],
      pyPositions: [],
      syCoins: [],
      totalSyBalance: 0n,
      totalUnderlyingBalance: 0n,
      underlyingCoins: [],
    } satisfies UserPortfolio;

    expect(pool.id.id).toBe(config.poolObjectId);
    expect(pyState.market_id).toBe(config.marketObjectId);
    expect(activity.kind).toBe("swap");
    expect(portfolio.orders[0]?.asset).toBe("pt");
  });
});
