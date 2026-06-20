import { describe, expect, test } from "bun:test";

import { createJitterOrderbookService } from "../services/orderbook-service.js";
import type { JitterAnalyticsReader } from "../ports/analytics-reader.js";
import {
  InMemoryJitterChainReader,
  makeTestMarketConfig,
} from "./fakes.js";
import type { OrderbookOrder } from "../queries.js";

function order(overrides: Partial<OrderbookOrder>): OrderbookOrder {
  return {
    id: "0xorder",
    asset: "pt",
    owner: "0xowner",
    side: "bid",
    priceRaw: "1",
    remainingPt: "1",
    escrowSy: "0",
    escrowPt: "0",
    claimableSy: "0",
    claimablePt: "0",
    createdAt: "0",
    expiryMs: "4102444800000",
    ...overrides,
  };
}

describe("JitterOrderbookService", () => {
  test("combines PT and YT orders and filters by owner", async () => {
    const config = makeTestMarketConfig({
      orderbookObjectId: "0xbook-pt",
      ytOrderbookObjectId: "0xbook-yt",
    });
    const service = createJitterOrderbookService({
      config,
      chainReader: new InMemoryJitterChainReader({
        dynamicFieldObjects: new Map([
          [
            "0xbook-pt",
            [
              order({ id: "0xpt-owner", asset: "pt", owner: "0xOwner" }),
              order({ id: "0xpt-other", asset: "pt", owner: "0xother" }),
            ],
          ],
          [
            "0xbook-yt",
            [order({ id: "0xyt-owner", asset: "yt", owner: "0xowner" })],
          ],
        ]),
      }),
    });

    const orders = await service.getAllOrderbookOrders("0xowner");

    expect(orders.map((item) => item.id)).toEqual(["0xpt-owner", "0xyt-owner"]);
    expect(orders.map((item) => item.asset)).toEqual(["pt", "yt"]);
  });

  test("returns an empty list for missing optional orderbook objects", async () => {
    const service = createJitterOrderbookService({
      config: makeTestMarketConfig({
        orderbookObjectId: null,
        ytOrderbookObjectId: null,
      }),
      chainReader: new InMemoryJitterChainReader(),
    });

    await expect(service.getOrderbookOrders(undefined, "pt")).resolves.toEqual([]);
    await expect(service.getAllOrderbookOrders()).resolves.toEqual([]);
  });

  test("uses analytics reader for ladder and locally aggregates when unavailable", async () => {
    const config = makeTestMarketConfig({ orderbookObjectId: "0xbook-pt" });
    const analyticsReader: Pick<JitterAnalyticsReader, "getOrderbookLadder"> = {
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
        };
      },
    };
    const readerBacked = createJitterOrderbookService({
      config,
      chainReader: new InMemoryJitterChainReader(),
      marketId: "market-a",
      analyticsReader: analyticsReader as JitterAnalyticsReader,
    });
    const fallback = createJitterOrderbookService({
      config,
      chainReader: new InMemoryJitterChainReader({
        dynamicFieldObjects: new Map([
          [
            "0xbook-pt",
            [
              order({ id: "bid-1", side: "bid", priceRaw: "100", remainingPt: "5", escrowSy: "500" }),
              order({ id: "bid-2", side: "bid", priceRaw: "100", remainingPt: "7", escrowSy: "700" }),
              order({ id: "ask-1", side: "ask", priceRaw: "110", remainingPt: "3", escrowPt: "3" }),
            ],
          ],
        ]),
      }),
      marketId: "market-a",
    });

    await expect(readerBacked.getLadder("pt")).resolves.toMatchObject({
      source: "indexer",
      bids: [{ priceRaw: "100", sizePt: "5" }],
    });
    await expect(fallback.getLadder("pt")).resolves.toMatchObject({
      source: "contract",
      bids: [{ priceRaw: "100", sizePt: "12", totalSy: "1200", orderCount: 2 }],
      asks: [{ priceRaw: "110", sizePt: "3", orderCount: 1 }],
    });
  });
});
