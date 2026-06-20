import { describe, expect, test } from "bun:test";

import {
  getDefaultJitterMarketConfig,
  getDefaultJitterMarketConfigEntry,
  getJitterMarketConfig,
  listJitterMarketConfigs,
} from "../config.js";
import {
  getDemoMarketConfig,
  getMissingDemoMarketConfigKeys,
  hasDemoMarketConfig,
  tryGetDemoMarketConfig,
} from "../types.js";

const OBJECT_ID_RE = /^0x[0-9a-f]{64}$/;

describe("SDK-maintained market configs", () => {
  test("keeps mainnet and testnet registries separate", () => {
    const mainnetConfigs = listJitterMarketConfigs("mainnet");
    expect(mainnetConfigs.map((entry) => entry.id)).toEqual([
      "scallop-ssui-2026-09-17",
    ]);
    expect(mainnetConfigs.every((entry) => entry.network === "mainnet")).toBe(true);
    expect(mainnetConfigs.filter((entry) => entry.isDefault)).toHaveLength(1);

    const testnetConfigs = listJitterMarketConfigs("testnet");
    expect(testnetConfigs.map((entry) => entry.id)).toEqual(["demo"]);
    expect(testnetConfigs.every((entry) => entry.network === "testnet")).toBe(true);
    expect(testnetConfigs.filter((entry) => entry.isDefault)).toHaveLength(1);
  });

  test("does not include static display-only Scallop placeholders", () => {
    const testnetConfigs = listJitterMarketConfigs("testnet");

    expect(testnetConfigs.some((entry) => entry.id.startsWith("scallop-"))).toBe(
      false,
    );
    expect(getJitterMarketConfig("testnet", "scallop-sui")).toBeNull();
    expect(getJitterMarketConfig("testnet", "scallop-usdc")).toBeNull();
  });

  test("returns cloned configs so callers cannot mutate the registry", () => {
    const first = getDefaultJitterMarketConfig("testnet");
    const second = getDefaultJitterMarketConfig("testnet");

    expect(first).not.toBe(second);
    expect(first?.poolObjectId).toBe(second?.poolObjectId);
  });

  test("can look up testnet demo config by id", () => {
    const entry = getDefaultJitterMarketConfigEntry("testnet");
    const demoEntry = listJitterMarketConfigs("testnet").find(
      (candidate) => candidate.id === "demo",
    );
    const config = getJitterMarketConfig("testnet", "demo");

    expect(entry?.id).toBe("demo");
    if (!demoEntry || !config) throw new Error("Missing testnet demo market config");
    expect(config.marketObjectId).toBe(demoEntry.config.marketObjectId);
    expect(config.marketObjectId).toMatch(OBJECT_ID_RE);
  });

  test("getDemoMarketConfig falls back to the SDK registry", () => {
    const defaultConfig = getDefaultJitterMarketConfig("testnet");

    expect(hasDemoMarketConfig("testnet")).toBe(true);
    expect(getMissingDemoMarketConfigKeys("testnet")).toEqual([]);
    expect(tryGetDemoMarketConfig("testnet")).not.toBeNull();
    if (!defaultConfig) throw new Error("Missing default testnet market config");
    expect(getDemoMarketConfig("testnet").jitterPackageId).toBe(
      defaultConfig.jitterPackageId,
    );
    expect(getDemoMarketConfig("testnet").jitterPackageId).toMatch(OBJECT_ID_RE);
  });

  test("mainnet contains the Scallop sSUI deployment", () => {
    const mainnetConfig = getDefaultJitterMarketConfig("mainnet");

    expect(mainnetConfig?.scallopMarketObjectId).toBe(
      "0xa757975255146dc9686aa823b7838b507f315d704f428cbadad2f4ea061939d9",
    );
    expect(mainnetConfig?.scallopVersionObjectId).toBe(
      "0x07871c4b3c847a0f674510d4978d5cf6f960452795e8ff6f189fd2088a3f6ac7",
    );
    expect(mainnetConfig?.scallopVersionObjectId).not.toBe(
      "0x5f099c1d6105ba18aef1a9e2c3c3d2b5ae1980f1e874e19e3083360007b9e4e2",
    );
    expect(hasDemoMarketConfig("mainnet")).toBe(true);
    expect(getDemoMarketConfig("mainnet").scallopVersionObjectId).toBe(
      mainnetConfig?.scallopVersionObjectId,
    );
  });
});
