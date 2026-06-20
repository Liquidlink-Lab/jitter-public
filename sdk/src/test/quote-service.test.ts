import { describe, expect, test } from "bun:test";

import { FP64_ONE } from "../constants.js";
import { createJitterQuoteService } from "../services/quote-service.js";
import {
  InMemoryJitterChainReader,
  makeTestMarketConfig,
  makeTestPoolFields,
  makeTestPyStateFields,
} from "./fakes.js";

describe("JitterQuoteService", () => {
  test("keeps frontend-facing SY/PT quote method signatures", async () => {
    const service = createJitterQuoteService({
      config: makeTestMarketConfig(),
      delegates: {
        quoteSwapSyForPt: async (syIn) => ({
          ptOut: syIn - 1n,
          slippageBps: 10n,
        }),
      },
    });

    await expect(service.quoteSwapSyForPt(100n)).resolves.toEqual({
      ptOut: 99n,
      slippageBps: 10n,
    });
  });

  test("previewBuyPt returns product-level position delta and quote source", async () => {
    const service = createJitterQuoteService({
      config: makeTestMarketConfig(),
      delegates: {
        quoteSwapSyForPt: async (syIn) => ({
          ptOut: syIn - 1n,
          slippageBps: 10n,
        }),
      },
    });

    await expect(service.previewBuyPt({ syIn: 100n })).resolves.toMatchObject({
      kind: "buy-pt",
      input: { syIn: 100n },
      positionDelta: { pt: 99n, yt: 0n, lp: 0n },
      output: { ptOut: 99n },
      fees: { totalSy: 0n },
      slippageBps: 10n,
      source: { kind: "delegate" },
    });
  });

  test("previewSellPt wraps PT sell quote and exposes wallet SY output", async () => {
    const service = createJitterQuoteService({
      config: makeTestMarketConfig(),
      delegates: {
        quoteSwapPtForSy: async (ptIn) => ({
          syOut: ptIn - 2n,
          slippageBps: 7n,
        }),
      },
    });

    await expect(service.previewSellPt({ ptIn: 100n })).resolves.toMatchObject({
      kind: "sell-pt",
      input: { ptIn: 100n },
      positionDelta: { pt: -100n, yt: 0n, lp: 0n },
      output: { syOut: 98n },
      walletDelta: { sy: 98n },
      slippageBps: 7n,
      source: { kind: "delegate" },
    });
  });

  test("previewBuyYt and previewSellYt keep YT position delta separate from wallet output", async () => {
    const service = createJitterQuoteService({
      config: makeTestMarketConfig(),
      delegates: {
        quoteSwapSyForYt: async (syIn) => ({
          ytOut: syIn * 2n,
          syRefund: 3n,
          slippageBps: 4n,
        }),
        quoteSwapYtForSy: async (ytIn) => ({
          syOut: ytIn / 2n,
          syRedeemOut: ytIn,
          syRepaid: ytIn / 2n,
          slippageBps: 6n,
        }),
      },
    });

    await expect(service.previewBuyYt({ syIn: 50n, syIndex: FP64_ONE })).resolves.toMatchObject({
      kind: "buy-yt",
      input: { syIn: 50n },
      positionDelta: { pt: 0n, yt: 100n, lp: 0n },
      output: { ytOut: 100n, syRefund: 3n },
      walletDelta: { sy: -47n },
      source: { kind: "delegate" },
    });
    await expect(service.previewSellYt({ ytIn: 100n, syIndex: FP64_ONE })).resolves.toMatchObject({
      kind: "sell-yt",
      input: { ytIn: 100n },
      positionDelta: { pt: 0n, yt: -100n, lp: 0n },
      output: { syOut: 50n },
      walletDelta: { sy: 50n },
      source: { kind: "delegate" },
    });
  });

  test("LP previews expose LP/YT deltas and do not pretend remove_lp_keep_yt is special", async () => {
    const service = createJitterQuoteService({
      config: makeTestMarketConfig(),
      delegates: {
        quoteAddLiquidity: async (syIn, ptIn = 0n) => ({ lpOut: syIn + ptIn, pairedPt: ptIn }),
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
    });

    await expect(service.previewAddLp({ syIn: 10n, ptIn: 5n })).resolves.toMatchObject({
      kind: "add-lp",
      positionDelta: { pt: -5n, yt: 0n, lp: 15n },
      output: { lpOut: 15n, pairedPt: 5n },
    });
    await expect(service.previewAddLpKeepYt({ syIn: 20n, syIndex: FP64_ONE })).resolves.toMatchObject({
      kind: "add-lp-keep-yt",
      positionDelta: { pt: 0n, yt: 5n, lp: 10n },
      output: { lpOut: 10n, keptYt: 5n, syToMintHint: 5n, minLpOutHint: 10n },
    });
    await expect(service.previewAddLpFromSy({ syIn: 30n, syIndex: FP64_ONE })).resolves.toMatchObject({
      kind: "add-lp-from-sy",
      positionDelta: { pt: 0n, yt: 0n, lp: 10n },
      walletDelta: { sy: -28n },
      output: { lpOut: 10n, syToMintHint: 5n, minLpOutHint: 10n, minSyOutHint: 2n },
      slippageBps: 9n,
    });
    await expect(service.previewRemoveLp({ lpIn: 7n })).resolves.toMatchObject({
      kind: "remove-lp",
      positionDelta: { pt: 7n, yt: 0n, lp: -7n },
      output: { syOut: 14n, ptOut: 7n },
      assumptions: expect.arrayContaining([
        expect.objectContaining({ key: "removeLpKeepYt", value: "alias-of-remove-lp" }),
      ]),
    });
  });

  test("composes underlying to SY conversion with trade quote", async () => {
    const syIndex = FP64_ONE * 2n;
    const service = createJitterQuoteService({
      config: makeTestMarketConfig(),
      delegates: {
        quoteSwapSyForPt: async (syIn) => ({
          ptOut: syIn / 2n,
          slippageBps: 5n,
        }),
      },
    });

    await expect(
      service.quoteSwapUnderlyingForPt(200n, syIndex),
    ).resolves.toEqual({
      syIn: 100n,
      syIndex,
      ptOut: 50n,
      slippageBps: 5n,
    });
  });

  test("returns bigint LP value fields from fake pool snapshots", async () => {
    const config = makeTestMarketConfig();
    const service = createJitterQuoteService({
      config,
      chainReader: new InMemoryJitterChainReader({
        pools: new Map([
          [
            config.poolObjectId,
            makeTestPoolFields({
              total_sy: "1000",
              total_pt: "500",
              lp_supply: "1000",
            }),
          ],
        ]),
      }),
    });

    await expect(service.quoteLpValue(100n)).resolves.toEqual({
      syValue: 100n,
      ptValue: 50n,
      value: 100n,
    });
  });

  test("uses pool maturity and PyState settlement to determine expiry", async () => {
    const config = makeTestMarketConfig();
    const service = createJitterQuoteService({
      config,
      chainReader: new InMemoryJitterChainReader({
        pools: new Map([
          [
            config.poolObjectId,
            makeTestPoolFields({ expiry: "4102444800000" }),
          ],
        ]),
        pyStates: new Map([
          [
            config.pyStateObjectId,
            makeTestPyStateFields({
              expiry: "4102444800000",
              is_settled: true,
            }),
          ],
        ]),
      }),
    });

    await expect(service.quoteIsMarketExpired(Date.UTC(2025, 0, 1))).resolves.toBe(
      true,
    );
  });
});
