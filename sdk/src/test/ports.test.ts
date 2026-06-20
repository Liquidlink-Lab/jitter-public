import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { JitterConfigNetworkInput } from "../config.js";
import type { JitterMarketConfigProvider } from "../ports/config-provider.js";
import type { JitterChainReader } from "../ports/chain-reader.js";
import type {
  JitterAnalyticsReader,
  MarketActivityPage,
  MarketAnalyticsResult,
  MarketChartSeries,
  OrderbookLadderResult,
  RewardLeaderboardResult,
  RewardSummaryResult,
} from "../ports/analytics-reader.js";
import {
  InMemoryJitterChainReader,
  InMemoryJitterEventReader,
  InMemoryJitterMarketConfigProvider,
  makeTestMarketConfig,
  makeTestPoolFields,
  makeTestPyStateFields,
} from "./fakes.js";

async function hydrateDefaultMarket(
  network: JitterConfigNetworkInput,
  configs: JitterMarketConfigProvider,
  chain: JitterChainReader,
) {
  const entry = configs.getDefaultMarketConfigEntry(network);
  if (!entry) return null;

  const [pool, pyState] = await Promise.all([
    chain.getPoolState(entry.config),
    chain.getPyState(entry.config),
  ]);

  return { entry, pool, pyState };
}

describe("SDK ports", () => {
  test("allow services to depend on config and chain reader interfaces", async () => {
    const config = makeTestMarketConfig({ poolObjectId: "0xpool-a" });
    const configs = new InMemoryJitterMarketConfigProvider([
      {
        id: "market-a",
        name: "Market A",
        network: "testnet",
        chainId: "test-chain",
        isDefault: true,
        config,
      },
    ]);
    const chain = new InMemoryJitterChainReader({
      pools: new Map([["0xpool-a", makeTestPoolFields({ total_sy: "100" })]]),
      pyStates: new Map([[config.pyStateObjectId, makeTestPyStateFields()]]),
    });

    const hydrated = await hydrateDefaultMarket("testnet", configs, chain);

    expect(hydrated?.entry.id).toBe("market-a");
    expect(hydrated?.pool.total_sy).toBe("100");
    expect(hydrated?.pyState.market_id).toBe(config.marketObjectId);
  });

  test("allow services to depend on an event reader interface", async () => {
    const events = new InMemoryJitterEventReader(
      new Map([
        [
          "0x1::pool::SwapEvent",
          [
            {
              pool_id: "0xpool",
              amount_in: "10",
              amount_out: "9",
            },
          ],
        ],
      ]),
    );

    const result = await events.queryEvents<{
      pool_id: string;
      amount_in: string;
      amount_out: string;
    }>({
      network: "testnet",
      eventType: "0x1::pool::SwapEvent",
    });

    expect(result).toEqual([
      { pool_id: "0xpool", amount_in: "10", amount_out: "9" },
    ]);
  });

  test("allow services to depend on an analytics reader interface", async () => {
    const fake: JitterAnalyticsReader = {
      async getMarketAnalytics(query) {
        return {
          marketId: query.marketId,
          source: "indexer",
          tvl: { raw: "1000", usd: null, usdSource: "unavailable" },
          liquidity: { raw: "900", usd: null, usdSource: "unavailable" },
          volume24h: { raw: "10", usd: null, usdSource: "unavailable" },
          volume7d: { raw: "70", usd: null, usdSource: "unavailable" },
          impliedApy: "0.12",
          underlyingApy: null,
          underlyingApySource: "unavailable",
          underlyingApyUpdatedAtMs: null,
          lpApy: null,
          lpApySource: "unavailable",
          lpApyFormulaVersion: null,
          updatedAtMs: "1710000000000",
        } satisfies MarketAnalyticsResult;
      },
      async getMarketChart(query) {
        return {
          marketId: query.marketId,
          range: query.range,
          source: "indexer",
          series: [
            {
              timestampMs: "1710000000000",
              impliedApy: "0.12",
              underlyingApy: null,
              volume: "10",
            },
          ],
        } satisfies MarketChartSeries;
      },
      async getMarketActivity(query) {
        return {
          marketId: query.marketId,
          source: "indexer",
          items: [
            {
              id: "activity-1",
              transactionDigest: "0xtx",
              timestampMs: "1710000000000",
              actor: "0xactor",
              action: "swap_sy_for_pt",
              asset: "pt",
              syAmount: "10",
              ptAmount: "9",
              ytAmount: null,
              lpAmount: null,
              sourceEventType: "0x1::pool::SwapEvent",
            },
          ],
          nextCursor: null,
        } satisfies MarketActivityPage;
      },
      async getOrderbookLadder(query) {
        return {
          marketId: query.marketId,
          asset: query.asset,
          source: "indexer",
          routeSupported: query.asset === "pt",
          bids: [{ priceRaw: "100", sizePt: "5", totalSy: "500", orderCount: 1 }],
          asks: [],
          bestBid: "100",
          bestAsk: null,
          midPriceRaw: null,
          spreadRaw: null,
          updatedAtMs: "1710000000000",
        } satisfies OrderbookLadderResult;
      },
      async getRewardSummary(query) {
        return {
          projectId: query.projectId,
          userAddress: query.userAddress,
          source: "unavailable",
          onChainPoints: "0",
          offChainXp: null,
          rank: null,
          updatedAtMs: null,
        } satisfies RewardSummaryResult;
      },
      async getRewardLeaderboard(query) {
        return {
          projectId: query.projectId,
          source: "indexer",
          rows: [],
          updatedAtMs: null,
        } satisfies RewardLeaderboardResult;
      },
    };

    const [analytics, chart, activity, ladder, reward, leaderboard] = await Promise.all([
      fake.getMarketAnalytics({ network: "testnet", marketId: "market-a" }),
      fake.getMarketChart({ network: "testnet", marketId: "market-a", range: "7d" }),
      fake.getMarketActivity({ network: "testnet", marketId: "market-a", limit: 10 }),
      fake.getOrderbookLadder({ network: "testnet", marketId: "market-a", asset: "yt" }),
      fake.getRewardSummary({ network: "testnet", projectId: "1", userAddress: "0xuser" }),
      fake.getRewardLeaderboard({ network: "testnet", projectId: "1", limit: 10 }),
    ]);

    expect(analytics.source).toBe("indexer");
    expect(chart.series[0]?.impliedApy).toBe("0.12");
    expect(activity.items[0]?.action).toBe("swap_sy_for_pt");
    expect(ladder.routeSupported).toBe(false);
    expect(reward.source).toBe("unavailable");
    expect(leaderboard.rows).toEqual([]);
  });

  test("keep port definitions independent from concrete Sui transports", () => {
    const root = join(import.meta.dir, "..");
    const portFiles = [
      "ports/config-provider.ts",
      "ports/chain-reader.ts",
      "ports/event-reader.ts",
      "ports/analytics-reader.ts",
    ];

    for (const file of portFiles) {
      const source = readFileSync(join(root, file), "utf8");
      expect(source).not.toContain("@mysten/sui");
      expect(source).not.toContain("../rpc");
      expect(source).not.toContain("SuiGrpcClient");
      expect(source).not.toContain("SuiGraphQLClient");
    }
  });
});
