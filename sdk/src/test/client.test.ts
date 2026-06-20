import { describe, expect, test } from "bun:test";

import { FP64_ONE } from "../constants.js";
import { getDefaultJitterMarketConfig } from "../config.js";
import { JitterClient, createJitterClient } from "../client.js";
import {
  buildDepositToSyTx as buildLegacyDepositToSyTx,
  buildRedeemSyToUnderlyingTx as buildLegacyRedeemSyToUnderlyingTx,
} from "../compat/legacy-builders.js";
import type { JitterMarketConfig } from "../types.js";

// ---------------------------------------------------------------------------
// Minimal mock config — no real object IDs needed for builder tests
// ---------------------------------------------------------------------------

const MOCK_CONFIG: JitterMarketConfig = {
  jitterPackageId: "0x1f7836605e4707d5799c33d857d2ca7cbd905732a26d66f9eef523eb399d66d5",
  demoAdapterPackageId: "0xed6d9e684d553a3f68909a4ad99d1c0f22017c2e2f18114514f3b4400f489481",
  oraclePackageId: "0xb876fd6ed7cbca4f1445ea69622f7af220a852121a666c9923907f5262f4d7b3",
  syStateObjectId: "0xaaaa",
  globalConfigObjectId: "0xbbbb",
  rewardDistributorObjectId: "0xcccc",
  aclObjectId: "0xdddd",
  marketObjectId: "0xeeee",
  pyStateObjectId: "0xffff",
  poolObjectId: "0x1111",
  priceAggregatorObjectId: "0x2222",
  demoMarketVaultObjectId: "0x3333",
  underlyingTypeTag: "0xaaaa::usdc::USDC",
  syTypeTag: "0xbbbb::sy_usdc::SY_USDC",
  ptTypeTag: "0xcccc::pt_usdc::PT_USDC",
  ytTypeTag: "0xdddd::yt_usdc::YT_USDC",
  liquidlink: {
    enabled: true,
    pointConfigObjectId: "0x4444",
    scoreboardObjectId: "0x5555",
    lpPointStateObjectId: "0x6666",
  },
};

const SCALLOP_CONFIG: JitterMarketConfig = {
  ...MOCK_CONFIG,
  demoMarketVaultObjectId: "",
  scallopAdapterPackageId: "0x2020",
  scallopProtocolPackageId: "0x2424",
  scallopMarketVaultObjectId: "0x2121",
  scallopMarketObjectId: "0x2222",
  scallopVersionObjectId: "0x2323",
};

// ---------------------------------------------------------------------------
// Constructor & factory
// ---------------------------------------------------------------------------

describe("JitterClient constructor", () => {
  test("stores network and config", () => {
    const client = new JitterClient("testnet", MOCK_CONFIG);
    expect(client.network).toBe("testnet");
    expect(client.config).toBe(MOCK_CONFIG);
  });

  test("createJitterClient factory uses SDK-maintained testnet config", () => {
    const client = createJitterClient("testnet");
    const defaultConfig = getDefaultJitterMarketConfig("testnet");

    expect(client.network).toBe("testnet");
    if (!defaultConfig) throw new Error("Missing default testnet market config");
    expect(client.config.poolObjectId).toBe(defaultConfig.poolObjectId);
  });
});

// ---------------------------------------------------------------------------
// Sync transaction builders (no network call)
// ---------------------------------------------------------------------------

describe("sync transaction builders", () => {
  const client = new JitterClient("testnet", MOCK_CONFIG);
  const sender = "0x" + "a".repeat(64);

  test("buildSwapSyForPtTx returns a Transaction", async () => {
    const tx = await client.buildSwapSyForPtTx({
      syCoinId: "0x" + "b".repeat(64),
      syAmount: BigInt(1_000_000),
      minPtOut: BigInt(900_000),
      pyPositionId: "0x" + "c".repeat(64),
      senderAddress: sender,
      syIndex: FP64_ONE,
    });
    // Transaction object has a getData method
    expect(tx).toBeDefined();
    expect(typeof tx.getData).toBe("function");
  });

  test("buildSwapPtForSyTx returns a Transaction", async () => {
    const tx = await client.buildSwapPtForSyTx({
      ptAmount: BigInt(1_000_000),
      minSyOut: BigInt(900_000),
      pyPositionId: "0x" + "c".repeat(64),
      senderAddress: sender,
      syIndex: FP64_ONE,
    });
    expect(tx).toBeDefined();
  });

  test("buildAddLiquidityTx returns a Transaction", async () => {
    const tx = await client.buildAddLiquidityTx({
      syCoinId: "0x" + "b".repeat(64),
      syAmount: BigInt(1_000_000),
      ptAmount: BigInt(1_000_000),
      pyPositionId: "0x" + "c".repeat(64),
      lpPositionId: "0x" + "d".repeat(64),
      senderAddress: sender,
      syIndex: FP64_ONE,
    });
    expect(tx).toBeDefined();
  });

  test("buildAddLiquidityTx supports single-SY add without external PT", async () => {
    const tx = await client.buildAddLiquidityTx({
      syCoinId: "0x" + "b".repeat(64),
      syAmount: BigInt(1_000_000),
      syToMintHint: BigInt(500_000),
      minLpOut: BigInt(400_000),
      minSyOut: BigInt(0),
      pyPositionId: "0x" + "c".repeat(64),
      lpPositionId: "0x" + "d".repeat(64),
      senderAddress: sender,
      syIndex: FP64_ONE,
    });
    expect(tx).toBeDefined();
  });

  test("buildRemoveLiquidityTx returns a Transaction", () => {
    const tx = client.buildRemoveLiquidityTx({
      lpAmount: BigInt(500_000),
      pyPositionId: "0x" + "c".repeat(64),
      lpPositionId: "0x" + "d".repeat(64),
      senderAddress: sender,
    });
    expect(tx).toBeDefined();
  });

  test("buildCreatePyPositionTx returns a Transaction", () => {
    const tx = client.buildCreatePyPositionTx(sender);
    expect(tx).toBeDefined();
  });

  test("buildCreateLpPositionTx returns a Transaction", () => {
    const tx = client.buildCreateLpPositionTx(sender);
    expect(tx).toBeDefined();
  });

  test("buildSwapPtForExactSyTx returns a Transaction", async () => {
    const tx = await client.buildSwapPtForExactSyTx({
      syOut: BigInt(1_000_000),
      maxPtIn: BigInt(1_100_000),
      pyPositionId: "0x" + "c".repeat(64),
      senderAddress: sender,
      syIndex: FP64_ONE,
    });
    expect(tx).toBeDefined();
  });

  test("buildDepositScallopToSyTx routes underlying through Scallop mint", () => {
    const scallopClient = new JitterClient("testnet", SCALLOP_CONFIG);
    const tx = scallopClient.buildDepositScallopToSyTx({
      underlyingAmount: 1_000_000n,
      senderAddress: sender,
    });
    const calls = collectMoveCalls(tx);

    expect(calls).toContainEqual(
      expect.objectContaining({ module: "mint", function: "mint" }),
    );
    expect(calls).toContainEqual(
      expect.objectContaining({ module: "scallop_market_vault", function: "deposit" }),
    );
  });

  test("buildRedeemSyToUnderlyingTx routes Scallop MarketCoin through protocol redeem", async () => {
    const scallopClient = new JitterClient("testnet", SCALLOP_CONFIG);
    const tx = await scallopClient.buildRedeemSyToUnderlyingTx({
      syCoinId: "0x" + "b".repeat(64),
      syAmount: 1_000_000n,
      senderAddress: sender,
      syIndex: FP64_ONE,
    });
    const calls = collectMoveCalls(tx);

    expect(calls).toContainEqual(
      expect.objectContaining({ module: "scallop_market_vault", function: "redeem" }),
    );
    expect(calls).toContainEqual(
      expect.objectContaining({ module: "redeem", function: "redeem" }),
    );
  });

  test("legacy SY builders route Scallop configs through the adapter manifest", () => {
    const depositTx = buildLegacyDepositToSyTx(
      SCALLOP_CONFIG,
      "0x" + "e".repeat(64),
      1_000_000n,
      FP64_ONE,
      sender,
    );
    const redeemTx = buildLegacyRedeemSyToUnderlyingTx(
      SCALLOP_CONFIG,
      "0x" + "f".repeat(64),
      1_000_000n,
      FP64_ONE,
      sender,
    );
    const depositCalls = collectMoveCalls(depositTx);
    const redeemCalls = collectMoveCalls(redeemTx);

    expect(depositCalls).toContainEqual(
      expect.objectContaining({ module: "mint", function: "mint" }),
    );
    expect(depositCalls).toContainEqual(
      expect.objectContaining({ module: "scallop_market_vault", function: "deposit" }),
    );
    expect(redeemCalls).toContainEqual(
      expect.objectContaining({ module: "scallop_market_vault", function: "redeem" }),
    );
    expect(redeemCalls).toContainEqual(
      expect.objectContaining({ module: "redeem", function: "redeem" }),
    );
  });
});

// ---------------------------------------------------------------------------
// formatSyIndex / formatAmount helpers
// ---------------------------------------------------------------------------

describe("JitterClient format helpers", () => {
  const client = new JitterClient("testnet", MOCK_CONFIG);

  test("formatSyIndex(FP64_ONE) → '1.000000'", () => {
    expect(client.formatSyIndex(FP64_ONE)).toBe("1.000000");
  });

  test("formatAmount(1_000_000, 6) → '1.000000'", () => {
    expect(client.formatAmount("1000000", 6)).toBe("1.000000");
  });
});

function collectMoveCalls(tx: { getData(): { commands: unknown[] } }) {
  return tx.getData().commands.flatMap((command) => {
    if (!isMoveCallCommand(command)) return [];
    return [command.MoveCall];
  });
}

function isMoveCallCommand(
  command: unknown,
): command is { $kind: "MoveCall"; MoveCall: { module: string; function: string } } {
  return (
    typeof command === "object" &&
    command !== null &&
    "$kind" in command &&
    command.$kind === "MoveCall" &&
    "MoveCall" in command
  );
}
