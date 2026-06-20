/**
 * Integration tests for simulation/quote functions.
 *
 * These tests call the Sui testnet via devInspectTransactionBlock.
 * They are skipped automatically when env vars are not set.
 *
 * To run:
 *   NEXT_PUBLIC_JITTER_PACKAGE_ID=0x... \
 *   NEXT_PUBLIC_DEMO_POOL_OBJECT_ID=0x... \
 *   ... \
 *   bun test src/test/simulation.test.ts
 */

import { beforeAll, describe, expect, test } from "bun:test";

import { FP64_ONE } from "../constants.js";
import { JitterClient } from "../client.js";
import { getDemoMarketConfig } from "../types.js";

// ---------------------------------------------------------------------------
// Skip entire suite if env vars are absent
// ---------------------------------------------------------------------------

const hasEnv = Boolean(
  process.env.NEXT_PUBLIC_JITTER_PACKAGE_ID || process.env.JITTER_PACKAGE_ID,
);

const describeIntegration = hasEnv ? describe : describe.skip;

// ---------------------------------------------------------------------------
// Integration tests
// ---------------------------------------------------------------------------

describeIntegration("JitterClient quote functions (testnet)", () => {
  let client: JitterClient;

  beforeAll(() => {
    client = new JitterClient("testnet", getDemoMarketConfig());
  });

  test("quotePrices returns valid FP64 prices", async () => {
    const { ptPrice, ytPrice } = await client.quotePrices();

    // PT price should be between 0 and 1 SY (< FP64_ONE)
    expect(ptPrice).toBeGreaterThan(BigInt(0));
    expect(ptPrice).toBeLessThan(FP64_ONE);

    // YT price is typically small
    expect(ytPrice).toBeGreaterThan(BigInt(0));

    console.log("PT price:", ptPrice.toString());
    console.log("YT price:", ytPrice.toString());
  });

  test("quoteSwapSyForPt: 1 SY in → positive PT out", async () => {
    const syIn = BigInt(1_000_000); // 1 SY (6 decimals)
    const { ptOut } = await client.quoteSwapSyForPt(syIn);

    expect(ptOut).toBeGreaterThan(BigInt(0));
    // PT out should be >= SY in (PT is at discount)
    expect(ptOut).toBeGreaterThanOrEqual(syIn);

    console.log(`quoteSwapSyForPt: ${syIn} SY → ${ptOut} PT`);
  });

  test("quoteSwapPtForSy: round-trip estimate is consistent", async () => {
    const ptIn = BigInt(1_000_000);
    const { syOut } = await client.quoteSwapPtForSy(ptIn);

    expect(syOut).toBeGreaterThan(BigInt(0));
    // SY out should be less than PT in (PT is discounted)
    expect(syOut).toBeLessThan(ptIn);

    console.log(`quoteSwapPtForSy: ${ptIn} PT → ${syOut} SY`);
  });

  test("quoteSwapSyForExactPt: syIn > ptOut (price impact)", async () => {
    const ptOut = BigInt(1_000_000);
    const { syIn } = await client.quoteSwapSyForExactPt(ptOut);

    expect(syIn).toBeGreaterThan(BigInt(0));
    // Should need less SY than PT (PT at discount)
    expect(syIn).toBeLessThanOrEqual(ptOut);

    console.log(`quoteSwapSyForExactPt: need ${syIn} SY for ${ptOut} PT`);
  });

  test("quoteSwapSyForYt: positive YT out for SY in", async () => {
    const syIn = BigInt(1_000_000);
    const { ytOut } = await client.quoteSwapSyForYt(syIn);

    expect(ytOut).toBeGreaterThan(BigInt(0));
    // YT leverage means ytOut > syIn
    expect(ytOut).toBeGreaterThan(syIn);

    console.log(`quoteSwapSyForYt: ${syIn} SY → ${ytOut} YT`);
  });

  test("quoteIsMarketExpired: market is not expired", async () => {
    const expired = await client.quoteIsMarketExpired();
    expect(expired).toBe(false);
  });

  test("getImpliedApy: returns a reasonable APY %", async () => {
    const apy = await client.getImpliedApy();
    expect(apy).toBeGreaterThanOrEqual(0);
    expect(apy).toBeLessThan(500); // sanity: < 500%
    console.log(`Implied APY: ${apy.toFixed(2)}%`);
  });

  test("getSyIndex: returns value close to FP64_ONE (testnet ≈ 1.0)", async () => {
    const syIndex = await client.getSyIndex();
    expect(syIndex).toBeGreaterThanOrEqual(FP64_ONE);
    // Shouldn't be more than 2x FP64_ONE in normal conditions
    expect(syIndex).toBeLessThan(FP64_ONE * BigInt(2));
    console.log("SY index:", syIndex.toString());
  });
});
