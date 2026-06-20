import { describe, expect, test } from "bun:test";

import { getJitterAdapterManifest } from "../adapters/registry.js";
import { DEFAULT_DEMO_SY_INDEX, FP64_ONE } from "../constants.js";
import { getJitterMarketConfig } from "../config.js";
import { createJitterQuoteService } from "../services/quote-service.js";
import {
  createJitterTradeService,
  type JitterTradeBuildTransactionRequest,
  type JitterTradeQuoteRequest,
} from "../services/trade-service.js";
import { createJitterTransactionService } from "../services/transaction-service.js";
import { makeTestMarketConfig } from "./fakes.js";

const senderAddress =
  "0x00000000000000000000000000000000000000000000000000000000000000aa";

describe("JitterTradeService", () => {
  test("returns a frontend-stable product quote response", async () => {
    const config = makeTestMarketConfig();
    const service = createJitterTradeService({
      marketId: "demo",
      config,
      quoteService: createJitterQuoteService({
        config,
        delegates: {
          quoteSwapSyForPt: async () => ({
            ptOut: 900n,
            slippageBps: 12n,
          }),
        },
      }),
    });

    const quote = await service.quoteTrade({
      marketId: "demo",
      product: "pt",
      side: "buy",
      inputAsset: "sy",
      amount: "1000",
      slippageBps: 100,
      owner: senderAddress,
    });

    expect(quote).toMatchObject({
      status: "available",
      marketId: "demo",
      actionId: "buy_pt",
      product: "pt",
      side: "buy",
      inputAsset: "sy",
      inputAmount: "1000",
      expectedOutput: [{ asset: "pt", amount: "900" }],
      fee: { totalSy: "0" },
      priceImpactBps: "12",
      apyChangeBps: null,
      minReceived: [{ asset: "pt", amount: "891" }],
      maxInput: null,
      source: {
        kind: "delegate",
        state: "available",
        stale: false,
        updatedAtMs: null,
      },
      unavailableReason: null,
      preview: {
        positionDelta: { pt: "900", yt: "0", lp: "0" },
        walletDelta: { sy: "-1000" },
      },
    });
  });

  test("quotes buy PT from underlying by converting the input to SY first", async () => {
    const config = makeTestMarketConfig();
    const syIndex = FP64_ONE * 2n;
    const service = createJitterTradeService({
      marketId: "demo",
      config,
      quoteService: createJitterQuoteService({
        config,
        delegates: {
          quoteSwapSyForPt: async (syIn, quoteSyIndex) => {
            expect(syIn).toBe(1_000n);
            expect(quoteSyIndex).toBe(syIndex);
            return {
              ptOut: syIn - 100n,
              slippageBps: 12n,
            };
          },
        },
      }),
    });

    const quote = await service.quoteTrade({
      marketId: "demo",
      product: "pt",
      side: "buy",
      inputAsset: "underlying",
      amount: "2000",
      slippageBps: 100,
      owner: senderAddress,
      syIndex: syIndex.toString(),
    });

    expect(quote).toMatchObject({
      status: "available",
      actionId: "buy_pt",
      inputAsset: "underlying",
      inputAmount: "2000",
      expectedOutput: [{ asset: "pt", amount: "900" }],
      minReceived: [{ asset: "pt", amount: "891" }],
      preview: {
        input: { syIn: "1000" },
        walletDelta: { sy: "-1000" },
      },
    });
  });

  test("returns an unavailable quote when AMM math rejects an oversized YT buy", async () => {
    const config = makeTestMarketConfig();
    const service = createJitterTradeService({
      marketId: "demo",
      config,
      quoteService: createJitterQuoteService({
        config,
        delegates: {
          quoteSwapSyForYt: async () => {
            throw new Error(
              "Transaction simulation failed: MoveAbort in 1st command, abort code: 1402, in '0x2::amm_math::calc_trade_proportion'",
            );
          },
        },
      }),
    });

    await expect(
      service.quoteTrade({
        marketId: "demo",
        product: "yt",
        side: "buy",
        inputAsset: "underlying",
        amount: "2000",
        slippageBps: 100,
        owner: senderAddress,
        syIndex: FP64_ONE.toString(),
        actionId: "buy_yt",
      }),
    ).resolves.toMatchObject({
      status: "unavailable",
      actionId: "buy_yt",
      expectedOutput: [],
      minReceived: [],
      unavailableReason:
        "Trade amount is too large for the current pool liquidity.",
      preview: null,
      source: {
        kind: "unavailable",
        state: "unavailable",
      },
    });
  });

  test("does not quote disabled display-only markets", async () => {
    const config = makeTestMarketConfig();
    const service = createJitterTradeService({
      marketId: "scallop-sui",
      config,
      metadata: {
        marketId: "scallop-sui",
        adapterKind: "scallop",
        tradeReady: false,
        disabledReason: "Trading disabled by SDK registry for this market.",
        missingConfigKeys: [],
        actions: [],
      },
    });

    await expect(
      service.quoteTrade({
        marketId: "scallop-sui",
        product: "pt",
        side: "buy",
        inputAsset: "sy",
        amount: "1000",
        slippageBps: 100,
        owner: senderAddress,
      }),
    ).resolves.toMatchObject({
      status: "unavailable",
      actionId: "buy_pt",
      expectedOutput: [],
      minReceived: [],
      source: {
        kind: "unavailable",
        state: "unavailable",
        stale: false,
      },
      unavailableReason: "Trading disabled by SDK registry for this market.",
      preview: null,
    });
  });

  test("serializes unsigned demo product transactions from stable build requests", async () => {
    const config = getDemoConfig();
    const service = createTradeServiceForBuild("demo", config);
    const requests: Array<[JitterTradeBuildTransactionRequest, string]> = [
      [
        {
          ...baseRequest("pt", "buy", "sy", "1000"),
          inputCoinId: objectId("40"),
          positionId: objectId("41"),
        },
        "buy_pt",
      ],
      [
        {
          ...baseRequest("pt", "sell", "pt", "900"),
          positionId: objectId("41"),
        },
        "sell_pt",
      ],
      [
        {
          ...baseRequest("yt", "buy", "sy", "1000"),
          inputCoinId: objectId("42"),
          positionId: objectId("43"),
        },
        "buy_yt",
      ],
      [
        {
          ...baseRequest("yt", "sell", "yt", "900"),
          positionId: objectId("43"),
        },
        "sell_yt",
      ],
      [
        {
          ...baseRequest("lp", "add", "sy", "1000"),
          actionId: "add_lp",
          pairedPtAmount: "400",
          inputCoinId: objectId("44"),
          positionId: objectId("45"),
        },
        "add_lp",
      ],
      [
        {
          ...baseRequest("lp", "add", "sy", "1000"),
          actionId: "add_lp_keep_yt",
          inputCoinId: objectId("46"),
          positionId: objectId("45"),
        },
        "add_lp_keep_yt",
      ],
      [
        {
          ...baseRequest("lp", "add", "sy", "1000"),
          actionId: "add_lp_from_sy",
          inputCoinId: objectId("47"),
          positionId: objectId("45"),
        },
        "add_lp_from_sy",
      ],
      [
        {
          ...baseRequest("lp", "remove", "lp", "300"),
          positionId: objectId("45"),
        },
        "remove_lp",
      ],
    ];

    for (const [request, routerFunction] of requests) {
      const result = await service.buildTradeTransaction(request);

      expect(result).toMatchObject({
        status: "ready",
        marketId: "demo",
        owner: senderAddress,
        unsigned: true,
        transactionEncoding: "sui-transaction-json-v2",
        quote: { status: "available" },
      });
      expect(collectMoveCallsFromJson(result.transactionJson)).toContainEqual(
        expect.objectContaining({ module: "router", function: routerFunction }),
      );
    }
  });

  test("serializes a first-time buy by creating the missing PY position", async () => {
    const config = getDemoConfig();
    const service = createTradeServiceForBuild("demo", config);

    const result = await service.buildTradeTransaction({
      ...baseRequest("pt", "buy", "sy", "1000"),
      inputCoinId: objectId("40"),
    });

    expect(result).toMatchObject({
      status: "ready",
      marketId: "demo",
      owner: senderAddress,
      quote: { status: "available" },
    });
    expect(collectMoveCallsFromJson(result.transactionJson)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ module: "router", function: "create_py_position" }),
        expect.objectContaining({ module: "router", function: "buy_pt" }),
      ]),
    );
  });

  test("serializes Scallop product transactions with adapter price info calls", async () => {
    const config = getScallopTestConfig();
    const service = createTradeServiceForBuild("scallop-sui", config);

    const result = await service.buildTradeTransaction({
      ...baseRequest("pt", "buy", "sy", "1000", "scallop-sui"),
      inputCoinId: objectId("50"),
      positionId: objectId("51"),
    });
    const calls = collectMoveCallsFromJson(result.transactionJson);

    expect(calls).toContainEqual(
      expect.objectContaining({ module: "scallop_price_ticket", function: "quote" }),
    );
    expect(calls).toContainEqual(
      expect.objectContaining({ module: "router", function: "buy_pt" }),
    );
    expect(calls).not.toContainEqual(
      expect.objectContaining({ module: "demo_price_ticket", function: "quote" }),
    );
  });
});

function baseRequest(
  product: JitterTradeQuoteRequest["product"],
  side: JitterTradeQuoteRequest["side"],
  inputAsset: JitterTradeQuoteRequest["inputAsset"],
  amount: string,
  marketId = "demo",
): JitterTradeQuoteRequest {
  return {
    marketId,
    product,
    side,
    inputAsset,
    amount,
    slippageBps: 100,
    owner: senderAddress,
    syIndex: DEFAULT_DEMO_SY_INDEX.toString(),
  };
}

function createTradeServiceForBuild(
  marketId: string,
  config: ReturnType<typeof getDemoConfig>,
) {
  return createJitterTradeService({
    marketId,
    config,
    quoteService: createJitterQuoteService({
      config,
      delegates: {
        resolveSyIndex: () => DEFAULT_DEMO_SY_INDEX,
        quoteSwapSyForPt: async () => ({ ptOut: 900n, slippageBps: 10n }),
        quoteSwapPtForSy: async () => ({ syOut: 800n, slippageBps: 10n }),
        quoteSwapSyForYt: async () => ({
          ytOut: 700n,
          syRefund: 20n,
          slippageBps: 10n,
        }),
        quoteSwapYtForSy: async () => ({
          syOut: 600n,
          syRedeemOut: 900n,
          syRepaid: 300n,
          slippageBps: 10n,
        }),
        quoteAddLiquidity: async (syIn, ptIn = 0n) => ({
          lpOut: syIn + ptIn,
          pairedPt: ptIn,
        }),
        quoteAddLiquidityKeepYt: async (syIn) => ({
          lpOut: syIn / 2n,
          pairedPt: syIn / 4n,
          syToMint: syIn / 4n,
          syForLiquidity: syIn - syIn / 4n,
          keptYt: syIn / 4n,
        }),
        quoteAddLiquidityFromSy: async (syIn) => ({
          lpOut: syIn / 3n,
          pairedPt: syIn / 6n,
          syToMint: syIn / 6n,
          syForLiquidity: syIn - syIn / 6n,
          keptYt: syIn / 6n,
          ytToSell: syIn / 6n,
          syOut: 2n,
          syRedeemOut: 8n,
          syRepaid: 6n,
          slippageBps: 9n,
        }),
        quoteLpValue: async (lpAmount) => ({
          syValue: lpAmount * 2n,
          ptValue: lpAmount,
          value: lpAmount * 2n,
        }),
      },
    }),
    transactionService: createJitterTransactionService({
      config,
      adapter: getJitterAdapterManifest(config),
      resolveSyIndex: async () => FP64_ONE,
    }),
  });
}

function getDemoConfig() {
  const config = getJitterMarketConfig("testnet", "demo");
  if (!config) throw new Error("missing SDK demo market config");
  return config;
}

function getScallopTestConfig() {
  return {
    ...getDemoConfig(),
    demoMarketVaultObjectId: "",
    scallopAdapterPackageId: objectId("20"),
    scallopProtocolPackageId: objectId("24"),
    scallopMarketVaultObjectId: objectId("21"),
    scallopMarketObjectId: objectId("22"),
    scallopVersionObjectId: objectId("23"),
    scallopMarketCoinTypeTag: `${objectId("24")}::reserve::MarketCoin<0x2::sui::SUI>`,
  };
}

function objectId(suffix: string): string {
  return `0x${suffix.padStart(64, "0")}`;
}

function collectMoveCallsFromJson(transactionJson: string) {
  const data = JSON.parse(transactionJson) as {
    commands?: Array<{
      MoveCall?: { module: string; function: string };
    }>;
  };

  return (data.commands ?? []).flatMap((command) =>
    command.MoveCall ? [command.MoveCall] : [],
  );
}
