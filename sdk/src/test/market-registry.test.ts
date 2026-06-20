import { describe, expect, test } from "bun:test";

import {
  listJitterMarketRegistryRecords,
  overlayJitterMarketConfigFromRegistry,
} from "../market-registry.js";
import {
  InMemoryJitterChainReader,
  makeTestMarketConfig,
} from "./fakes.js";

const REGISTRY_ID = "0xregistry";
const MARKET_ID = "0xmarket-live";
const PY_STATE_ID = "0xpy-live";
const POOL_ID = "0xpool-live";
const REWARD_DISTRIBUTOR_ID = "0xreward-live";

describe("market registry", () => {
  test("lists records in on-chain registry market_ids order", async () => {
    const chainReader = new InMemoryJitterChainReader({
      objects: new Map([
        [
          REGISTRY_ID,
          {
            market_count: "1",
            market_ids: [MARKET_ID],
          },
        ],
      ]),
      dynamicFieldObjects: new Map([
        [
          REGISTRY_ID,
          [
            {
              name: { pos0: MARKET_ID },
              value: {
                project_id: "1",
                market_id: MARKET_ID,
                py_state_id: PY_STATE_ID,
                pool_id: POOL_ID,
                pt_orderbook_id:
                  "0x0000000000000000000000000000000000000000000000000000000000000000",
                yt_orderbook_id: "0xyt-orderbook",
                reward_distributor_id: REWARD_DISTRIBUTOR_ID,
                expiry: "4102444800000",
              },
            },
          ],
        ],
      ]),
    });

    await expect(
      listJitterMarketRegistryRecords(chainReader, {
        marketRegistryObjectId: REGISTRY_ID,
        marketObjectId: "0xmarket-stale",
      }),
    ).resolves.toEqual([
      {
        projectId: "1",
        marketId: MARKET_ID,
        pyStateId: PY_STATE_ID,
        poolId: POOL_ID,
        ptOrderbookId: null,
        ytOrderbookId: "0xyt-orderbook",
        rewardDistributorId: REWARD_DISTRIBUTOR_ID,
        expiryMs: "4102444800000",
      },
    ]);
  });

  test("overlays stale core object ids from registry record", async () => {
    const config = makeTestMarketConfig({
      marketRegistryObjectId: REGISTRY_ID,
      marketObjectId: "0xmarket-stale",
      pyStateObjectId: "0xpy-stale",
      poolObjectId: "0xpool-stale",
      rewardDistributorObjectId: "0xreward-stale",
    });
    const chainReader = new InMemoryJitterChainReader({
      objects: new Map([
        [
          REGISTRY_ID,
          {
            market_ids: [MARKET_ID],
          },
        ],
      ]),
      dynamicFieldObjects: new Map([
        [
          REGISTRY_ID,
          [
            {
              value: {
                project_id: "1",
                market_id: MARKET_ID,
                py_state_id: PY_STATE_ID,
                pool_id: POOL_ID,
                pt_orderbook_id: "0xpt-orderbook",
                yt_orderbook_id: "0xyt-orderbook",
                reward_distributor_id: REWARD_DISTRIBUTOR_ID,
                expiry: "4102444800000",
              },
            },
          ],
        ],
      ]),
    });

    await expect(
      overlayJitterMarketConfigFromRegistry(chainReader, config),
    ).resolves.toMatchObject({
      marketObjectId: MARKET_ID,
      pyStateObjectId: PY_STATE_ID,
      poolObjectId: POOL_ID,
      orderbookObjectId: "0xpt-orderbook",
      ytOrderbookObjectId: "0xyt-orderbook",
      rewardDistributorObjectId: REWARD_DISTRIBUTOR_ID,
      underlyingTypeTag: config.underlyingTypeTag,
      demoMarketVaultObjectId: config.demoMarketVaultObjectId,
    });
  });
});
