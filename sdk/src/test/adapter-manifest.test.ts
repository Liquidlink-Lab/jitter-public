import { describe, expect, test } from "bun:test";
import { Transaction, type TransactionObjectArgument } from "@mysten/sui/transactions";

import {
  detectAdapterKind,
  getJitterAdapterManifest,
  type JitterAdapterKind,
} from "../index.js";
import type { JitterMarketConfig } from "../types.js";
import { makeTestMarketConfig } from "./fakes.js";

const objectId = (suffix: string) => `0x${suffix.padStart(64, "0")}`;

function demoConfig(overrides: Partial<JitterMarketConfig> = {}): JitterMarketConfig {
  return makeTestMarketConfig({
    jitterPackageId: objectId("1"),
    demoAdapterPackageId: objectId("2"),
    oraclePackageId: objectId("3"),
    syStateObjectId: objectId("4"),
    globalConfigObjectId: objectId("40"),
    aclObjectId: objectId("5"),
    marketObjectId: objectId("6"),
    pyStateObjectId: objectId("7"),
    poolObjectId: objectId("8"),
    priceAggregatorObjectId: objectId("9"),
    demoMarketVaultObjectId: objectId("a"),
    underlyingTypeTag: `${objectId("b")}::underlying::UNDERLYING`,
    syTypeTag: `${objectId("c")}::sy::SY`,
    ptTypeTag: `${objectId("d")}::pt::PT`,
    ytTypeTag: `${objectId("e")}::yt::YT`,
    ...overrides,
  });
}

function scallopConfig(overrides: Partial<JitterMarketConfig> = {}): JitterMarketConfig {
  return demoConfig({
    demoMarketVaultObjectId: "",
    scallopAdapterPackageId: objectId("20"),
    scallopProtocolPackageId: objectId("24"),
    scallopMarketVaultObjectId: objectId("21"),
    scallopMarketObjectId: objectId("22"),
    scallopVersionObjectId: objectId("23"),
    scallopMarketCoinTypeTag: `${objectId("24")}::reserve::MarketCoin<0x2::sui::SUI>`,
    ...overrides,
  });
}

describe("adapter manifests", () => {
  test("detects demo and scallop adapter kinds from market config", () => {
    expect(detectAdapterKind(demoConfig())).toBe("demo");
    expect(detectAdapterKind(scallopConfig())).toBe("scallop");
  });

  test("throws a clear error for unsupported adapter configs", () => {
    const config = demoConfig({ demoMarketVaultObjectId: "" });

    expect(() => getJitterAdapterManifest(config)).toThrow(
      "Unsupported Jitter adapter",
    );
  });

  test("exports a discriminated adapter kind type", () => {
    const kinds: JitterAdapterKind[] = ["demo", "scallop", "ember", "suilend", "navi"];

    expect(kinds).toContain("demo");
    expect(kinds).toContain("scallop");
  });

  test("demo manifest wraps demo oracle and SY adapter builders", () => {
    const config = demoConfig();
    const manifest = getJitterAdapterManifest(config);
    const calls = collectMoveCalls((tx) => {
      const priceInfo = manifest.addPriceInfo({
        tx,
        config,
        syIndex: 1n << 64n,
      });
      manifest.addDepositToSy({
        tx,
        config,
        mintRequest: tx.object(objectId("30")),
        inputCoin: tx.object(objectId("31")),
        syAmount: 1n,
      });
      manifest.addRedeemFromSy({
        tx,
        config,
        burnRequest: priceInfo,
        syAmount: 1n,
      });
    });

    expect(manifest.kind).toBe("demo");
    expect(manifest.canDepositUnderlying).toBe(true);
    expect(manifest.canRedeemUnderlying).toBe(true);
    expect(calls).toContainEqual(expect.objectContaining({ module: "demo_price_ticket", function: "quote" }));
    expect(calls).toContainEqual(expect.objectContaining({ module: "demo_market_vault", function: "deposit" }));
    expect(calls).toContainEqual(expect.objectContaining({ module: "demo_market_vault", function: "redeem" }));
  });

  test("scallop manifest declares required external objects and wraps generated builders", () => {
    const config = scallopConfig();
    const manifest = getJitterAdapterManifest(config);
    const required = manifest.requiredObjectIds(config);
    const calls = collectMoveCalls((tx) => {
      const priceInfo = manifest.addPriceInfo({ tx, config });
      manifest.addDepositToSy({
        tx,
        config,
        mintRequest: tx.object(objectId("30")),
        inputCoin: tx.object(objectId("31")),
        syAmount: 123n,
      });
      manifest.addRedeemFromSy({
        tx,
        config,
        burnRequest: priceInfo,
        syAmount: 123n,
      });
    });

    expect(manifest.kind).toBe("scallop");
    expect(manifest.canDepositUnderlying).toBe(true);
    expect(manifest.canRedeemUnderlying).toBe(true);
    expect(manifest.depositInputType(config)).toBe(config.underlyingTypeTag);
    expect(manifest.redeemOutputType(config)).toBe(config.underlyingTypeTag);
    expect(required).toMatchObject({
      scallopProtocolPackageId: config.scallopProtocolPackageId,
      scallopMarketVaultObjectId: config.scallopMarketVaultObjectId,
      scallopMarketObjectId: config.scallopMarketObjectId,
      scallopVersionObjectId: config.scallopVersionObjectId,
    });
    expect(calls).toContainEqual(expect.objectContaining({ module: "mint", function: "mint" }));
    expect(calls).toContainEqual(expect.objectContaining({ module: "scallop_price_ticket", function: "quote" }));
    expect(calls).toContainEqual(expect.objectContaining({ module: "scallop_market_vault", function: "deposit" }));
    expect(calls).toContainEqual(expect.objectContaining({ module: "scallop_market_vault", function: "redeem" }));
    expect(calls).toContainEqual(expect.objectContaining({ module: "redeem", function: "redeem" }));
  });
});

function collectMoveCalls(
  build: (tx: Transaction) => void | TransactionObjectArgument,
) {
  const tx = new Transaction();
  build(tx);

  return tx.getData().commands.flatMap((command) => {
    if (command.$kind !== "MoveCall") return [];
    return [command.MoveCall];
  });
}
