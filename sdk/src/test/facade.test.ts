import { describe, expect, test } from "bun:test";

import { createJitterSdk } from "../facade/jitter-sdk.js";
import {
  InMemoryJitterChainReader,
  InMemoryJitterMarketConfigProvider,
  makeTestMarketConfig,
  makeTestPoolFields,
  makeTestPyStateFields,
} from "./fakes.js";

describe("createJitterSdk facade", () => {
  test("composes market and per-market services behind a small facade", async () => {
    const config = makeTestMarketConfig({
      poolObjectId: "0xpool",
      pyStateObjectId: "0xpy",
      marketDecimals: 6,
      underlyingDecimals: 6,
    });
    const sdk = createJitterSdk({
      network: "testnet",
      configProvider: new InMemoryJitterMarketConfigProvider([
        {
          id: "test",
          name: "Test Market",
          network: "testnet",
          chainId: "test-chain",
          config,
        },
      ]),
      chainReader: new InMemoryJitterChainReader({
        pools: new Map([
          [
            "0xpool",
            makeTestPoolFields({
              total_sy: "1000000",
              total_pt: "1000000",
            }),
          ],
        ]),
        pyStates: new Map([["0xpy", makeTestPyStateFields()]]),
      }),
    });

    const explorer = await sdk.markets.getExplorerData();
    const marketSdk = sdk.forMarket(config);

    expect(explorer.markets).toHaveLength(1);
    expect(marketSdk.accounts.getPortfolio).toBeFunction();
    expect(marketSdk.adapter.kind).toBe("demo");
    expect(marketSdk.orderbooks.getAllOrderbookOrders).toBeFunction();
    expect(marketSdk.quotes.quoteSwapSyForPt).toBeFunction();
    expect(marketSdk.trades.quoteTrade).toBeFunction();
    expect(marketSdk.trades.buildTradeTransaction).toBeFunction();
    expect(marketSdk.transactions.buildSwapSyForPtTx).toBeFunction();
  });
});
