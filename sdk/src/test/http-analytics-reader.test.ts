import { describe, expect, test } from "bun:test";

import { HttpJitterAnalyticsReader } from "../infrastructure/http-analytics-reader.js";
import type { MarketAnalyticsResult } from "../ports/analytics-reader.js";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

describe("HttpJitterAnalyticsReader", () => {
  test("allows redis as a market analytics source from the indexer hot cache", async () => {
    const redisAnalytics = {
      marketId: "market-a",
      source: "redis",
      tvl: { raw: "100", usd: "1.5", usdSource: "redis" },
      liquidity: { raw: "90", usd: "1.2", usdSource: "redis" },
      volume24h: { raw: "10", usd: null, usdSource: "unavailable" },
      volume7d: { raw: "70", usd: null, usdSource: "unavailable" },
      impliedApy: "0.12",
      underlyingApy: null,
      underlyingApySource: "external",
      underlyingApyUpdatedAtMs: "1710000000000",
      lpApy: null,
      lpApySource: "mixed",
      lpApyFormulaVersion: "weighted_pool_yield_v1",
      updatedAtMs: "1710000000000",
    } satisfies MarketAnalyticsResult;
    const reader = new HttpJitterAnalyticsReader({
      baseUrl: "https://indexer.example.test",
      fetch: async () => jsonResponse(redisAnalytics),
    });

    await expect(
      reader.getMarketAnalytics({ network: "testnet", marketId: "market-a" }),
    ).resolves.toEqual(redisAnalytics);
  });

  test("requests market analytics, chart, activity, ladder, and reward endpoints with query strings", async () => {
    const urls: string[] = [];
    const fetcher = async (input: string) => {
      const url = String(input);
      urls.push(url);
      if (url.includes("/analytics")) {
        return jsonResponse({
          marketId: "market-a",
          source: "indexer",
          tvl: { raw: "100", usd: null, usdSource: "unavailable" },
          liquidity: { raw: "90", usd: null, usdSource: "unavailable" },
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
        });
      }
      if (url.includes("/chart")) {
        return jsonResponse({ marketId: "market-a", range: "7d", source: "indexer", series: [] });
      }
      if (url.includes("/activity")) {
        return jsonResponse({ marketId: "market-a", source: "indexer", items: [], nextCursor: "next" });
      }
      if (url.includes("/orderbook")) {
        return jsonResponse({
          marketId: "market-a",
          asset: "pt",
          source: "indexer",
          routeSupported: true,
          bids: [],
          asks: [],
          bestBid: null,
          bestAsk: null,
          midPriceRaw: null,
          spreadRaw: null,
          updatedAtMs: null,
        });
      }
      if (url.includes("/leaderboard")) {
        return jsonResponse({
          projectId: "1",
          source: "indexer",
          rows: [],
          updatedAtMs: null,
        });
      }
      return jsonResponse({
        projectId: "1",
        userAddress: "0xuser",
        source: "unavailable",
        onChainPoints: "0",
        offChainXp: null,
        rank: null,
        updatedAtMs: null,
      });
    };
    const reader = new HttpJitterAnalyticsReader({
      baseUrl: "https://indexer.example.test/api/",
      fetch: fetcher,
    });

    await reader.getMarketAnalytics({ network: "testnet", marketId: "market-a" });
    await reader.getMarketChart({ network: "testnet", marketId: "market-a", range: "7d", product: "lp", series: ["implied_apy", "volume"] });
    await reader.getMarketActivity({ network: "testnet", marketId: "market-a", actor: "0xuser", limit: 25, cursor: "abc" });
    await reader.getOrderbookLadder({ network: "testnet", marketId: "market-a", asset: "pt", bucket: "bps" });
    await reader.getRewardSummary({ network: "testnet", projectId: "1", userAddress: "0xuser" });
    await reader.getRewardLeaderboard({ network: "testnet", projectId: "1", limit: 10 });

    expect(urls).toEqual([
      "https://indexer.example.test/api/v1/markets/market-a/analytics?network=testnet",
      "https://indexer.example.test/api/v1/markets/market-a/chart?network=testnet&range=7d&product=lp&series=implied_apy%2Cvolume",
      "https://indexer.example.test/api/v1/markets/market-a/activity?network=testnet&limit=25&cursor=abc&actor=0xuser",
      "https://indexer.example.test/api/v1/markets/market-a/orderbook?network=testnet&asset=pt&bucket=bps",
      "https://indexer.example.test/api/v1/rewards/1/users/0xuser?network=testnet",
      "https://indexer.example.test/api/v1/rewards/1/leaderboard?network=testnet&limit=10",
    ]);
  });

  test("throws a clear error for non-2xx responses", async () => {
    const reader = new HttpJitterAnalyticsReader({
      baseUrl: "https://indexer.example.test",
      fetch: async () => new Response("not found", { status: 404, statusText: "Not Found" }),
    });

    await expect(reader.getMarketAnalytics({ network: "testnet", marketId: "missing" })).rejects.toThrow(
      "Jitter analytics request failed: 404 Not Found",
    );
  });
});
