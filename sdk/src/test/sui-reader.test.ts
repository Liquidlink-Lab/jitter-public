import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { SuiJitterChainReader } from "../infrastructure/sui-chain-reader.js";
import { SuiJitterEventReader } from "../infrastructure/sui-event-reader.js";
import type { EventReaderQuery } from "../ports/event-reader.js";
import type { GrpcNetworkKind } from "../rpc.js";
import {
  makeTestMarketConfig,
  makeTestPoolFields,
  makeTestPyStateFields,
} from "./fakes.js";

describe("Sui reader adapters", () => {
  test("adapt injected Sui chain delegates to JitterChainReader methods", async () => {
    const config = makeTestMarketConfig();
    const pool = makeTestPoolFields({ total_sy: "42" });
    const pyState = makeTestPyStateFields({ market_id: config.marketObjectId });
    const reader = new SuiJitterChainReader("testnet", {
      getObject: async <TFields>(
        _network: GrpcNetworkKind,
        objectId: string,
      ) =>
        ({
          id: { id: objectId },
          value: "ok",
        }) as TFields,
      getPoolState: async () => pool,
      getPyState: async () => pyState,
      getPoolVolumeStats: async () => ({
        volume24hSy: 1n,
        volume7dSy: 2n,
        totalFeesSy: 3n,
        swapCount24h: 4,
        swapCount7d: 5,
      }),
      getOwnedObjects: async <TFields>() =>
        [{ objectId: "0xowned" } as TFields],
      getDynamicFieldObjects: async <TFields>() =>
        [{ objectId: "0xdynamic" } as TFields],
    });

    await expect(reader.getObject("0xobject")).resolves.toEqual({
      id: { id: "0xobject" },
      value: "ok",
    });
    await expect(reader.getPoolState(config)).resolves.toBe(pool);
    await expect(reader.getPyState(config)).resolves.toBe(pyState);
    await expect(reader.getPoolVolumeStats(config)).resolves.toMatchObject({
      volume24hSy: 1n,
      swapCount7d: 5,
    });
    await expect(
      reader.getOwnedObjects({ owner: "0xowner", structType: "Type" }),
    ).resolves.toEqual([{ objectId: "0xowned" }]);
    await expect(
      reader.getDynamicFieldObjects({ parentId: "0xparent" }),
    ).resolves.toEqual([{ objectId: "0xdynamic" }]);
  });

  test("adapt injected Sui event delegates to JitterEventReader methods", async () => {
    const reader = new SuiJitterEventReader({
      queryEvents: async <TEvent>(query: EventReaderQuery) =>
        [
          { eventType: query.eventType, network: query.network } as TEvent,
        ],
    });

    await expect(
      reader.queryEvents({
        network: "testnet",
        eventType: "0x1::pool::SwapEvent",
      }),
    ).resolves.toEqual([
      { eventType: "0x1::pool::SwapEvent", network: "testnet" },
    ]);
  });

  test("do not use legacy JSON RPC SDK APIs", () => {
    const root = join(import.meta.dir, "..");
    const files = [
      "infrastructure/sui-chain-reader.ts",
      "infrastructure/sui-event-reader.ts",
    ];

    for (const file of files) {
      const source = readFileSync(join(root, file), "utf8");
      expect(source).not.toContain("@mysten/sui/jsonRpc");
      expect(source).not.toContain("SuiJsonRpcClient");
      expect(source).not.toContain("devInspectTransactionBlock");
    }
  });
});
