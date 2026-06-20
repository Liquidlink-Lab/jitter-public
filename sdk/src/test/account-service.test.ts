import { describe, expect, test } from "bun:test";

import { createJitterAccountService } from "../services/account-service.js";
import type { JitterAnalyticsReader } from "../ports/analytics-reader.js";
import {
  InMemoryJitterChainReader,
  makeTestMarketConfig,
} from "./fakes.js";
import type { JitterPositionFields } from "../types.js";

describe("JitterAccountService", () => {
  test("normalizes unified positions and sums underlying and SY coin balances", async () => {
    const owner = "0xowner";
    const config = makeTestMarketConfig();
    const position: JitterPositionFields = {
      id: { id: "0xposition" },
      py_state_id: config.pyStateObjectId,
      market_id: config.marketObjectId,
      expiry: "4102444800000",
      created_at: "100",
      py: {
        fields: {
          pt_balance: "11",
          yt_balance: "12",
          index: "0",
          py_index: "1",
          accrued: "2",
        },
      },
      lp: {
        fields: {
          pool_id: config.poolObjectId,
          lp_amount: "13",
        },
      },
    };
    const chainReader = new InMemoryJitterChainReader({
      ownedObjects: new Map([
        [
          `${owner}:${config.jitterPackageId}::jitter_position::JitterPosition`,
          [position],
        ],
        [
          `${owner}:0x2::coin::Coin<${config.underlyingTypeTag}>`,
          [
            { objectId: "0xunderlying-1", balance: 10n },
            { id: { id: "0xunderlying-2" }, balance: "5" },
          ],
        ],
        [
          `${owner}:0x2::coin::Coin<${config.syTypeTag}>`,
          [{ objectId: "0xsy-1", balance: "7" }],
        ],
      ]),
    });
    const service = createJitterAccountService({ config, chainReader });

    const portfolio = await service.getPortfolio(owner);

    expect(portfolio.pyPositions).toEqual([
      expect.objectContaining({
        id: { id: "0xposition" },
        pt_balance: "11",
        yt_balance: "12",
        py_state_id: config.pyStateObjectId,
      }),
    ]);
    expect(portfolio.lpPositions).toEqual([
      expect.objectContaining({
        id: { id: "0xposition" },
        lp_amount: "13",
        pool_id: config.poolObjectId,
      }),
    ]);
    expect(portfolio.underlyingCoins).toEqual([
      { objectId: "0xunderlying-1", balance: 10n },
      { objectId: "0xunderlying-2", balance: 5n },
    ]);
    expect(portfolio.syCoins).toEqual([{ objectId: "0xsy-1", balance: 7n }]);
    expect(portfolio.totalUnderlyingBalance).toBe(15n);
    expect(portfolio.totalSyBalance).toBe(7n);
    expect(portfolio.orders).toEqual([]);
  });

  test("ignores missing position legs instead of failing portfolio refresh", async () => {
    const owner = "0xowner";
    const config = makeTestMarketConfig();
    const pyOnlyPosition = {
      id: { id: "0xpy-position" },
      py_state_id: config.pyStateObjectId,
      market_id: config.marketObjectId,
      expiry: "4102444800000",
      created_at: "100",
      py: {
        fields: {
          pt_balance: "11",
          yt_balance: "12",
          index: "0",
          py_index: "1",
          accrued: "2",
        },
      },
    } as unknown as JitterPositionFields;
    const lpOnlyPosition = {
      id: { id: "0xlp-position" },
      expiry: "4102444800000",
      created_at: "101",
      lp: {
        fields: {
          pool_id: config.poolObjectId,
          lp_amount: "13",
        },
      },
    } as unknown as JitterPositionFields;
    const chainReader = new InMemoryJitterChainReader({
      ownedObjects: new Map([
        [
          `${owner}:${config.jitterPackageId}::jitter_position::JitterPosition`,
          [pyOnlyPosition, lpOnlyPosition],
        ],
      ]),
    });
    const service = createJitterAccountService({ config, chainReader });

    const portfolio = await service.getPortfolio(owner);

    expect(portfolio.pyPositions).toEqual([
      expect.objectContaining({
        id: { id: "0xpy-position" },
        pt_balance: "11",
        py_state_id: config.pyStateObjectId,
      }),
    ]);
    expect(portfolio.lpPositions).toEqual([
      expect.objectContaining({
        id: { id: "0xlp-position" },
        lp_amount: "13",
        pool_id: config.poolObjectId,
      }),
    ]);
  });

  test("returns user transaction history from analytics reader or unavailable fallback", async () => {
    const config = makeTestMarketConfig();
    const analyticsReader: Pick<JitterAnalyticsReader, "getMarketActivity"> = {
      async getMarketActivity(query) {
        return {
          marketId: query.marketId,
          source: "indexer",
          items: [
            {
              id: "activity-1",
              transactionDigest: "0xtx",
              timestampMs: "1710000000000",
              actor: query.actor ?? null,
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
        };
      },
    };
    const readerBacked = createJitterAccountService({
      config,
      chainReader: new InMemoryJitterChainReader(),
      marketId: "market-a",
      analyticsReader: analyticsReader as JitterAnalyticsReader,
    });
    const unavailable = createJitterAccountService({
      config,
      chainReader: new InMemoryJitterChainReader(),
      marketId: "market-a",
    });

    await expect(readerBacked.getTransactionHistory("0xowner")).resolves.toMatchObject({
      source: "indexer",
      items: [{ actor: "0xowner", action: "swap_sy_for_pt" }],
    });
    await expect(unavailable.getTransactionHistory("0xowner")).resolves.toMatchObject({
      source: "unavailable",
      items: [],
      nextCursor: null,
    });
  });
});
