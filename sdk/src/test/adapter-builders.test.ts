import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "bun:test";
import { Transaction, type TransactionObjectArgument } from "@mysten/sui/transactions";

import {
  addEmberDeposit,
  addNaviPriceInfo,
  addNaviRedeemV2,
  addSuilendRedeem,
} from "../index.js";
import type { JitterMarketConfig } from "../types.js";

const objectId = (suffix: string) => `0x${suffix.padStart(64, "0")}`;

const config = {
  jitterPackageId: objectId("1"),
  demoAdapterPackageId: objectId("2"),
  oraclePackageId: objectId("3"),
  emberAdapterPackageId: objectId("4"),
  suilendAdapterPackageId: objectId("5"),
  naviAdapterPackageId: objectId("6"),
  syStateObjectId: objectId("7"),
  yieldConfigObjectId: objectId("8"),
  ammConfigObjectId: objectId("9"),
  aclObjectId: objectId("a"),
  marketObjectId: objectId("b"),
  pyStateObjectId: objectId("c"),
  poolObjectId: objectId("d"),
  priceAggregatorObjectId: objectId("e"),
  globalConfigObjectId: objectId("40"),
  demoMarketVaultObjectId: objectId("f"),
  emberMarketVaultObjectId: objectId("10"),
  emberVaultObjectId: objectId("11"),
  suilendMarketVaultObjectId: objectId("12"),
  suilendReserveObjectId: objectId("13"),
  naviMarketVaultObjectId: objectId("14"),
  naviStorageObjectId: objectId("15"),
  naviPoolObjectId: objectId("16"),
  naviIncentiveV2ObjectId: objectId("17"),
  naviIncentiveV3ObjectId: objectId("18"),
  naviOracleObjectId: objectId("19"),
  naviSuiSystemStateObjectId: objectId("1a"),
  underlyingTypeTag: `${objectId("20")}::underlying::UNDERLYING`,
  syTypeTag: `${objectId("21")}::sy::SY`,
  ptTypeTag: `${objectId("22")}::pt::PT`,
  ytTypeTag: `${objectId("23")}::yt::YT`,
  emberReceiptTypeTag: `${objectId("24")}::receipt::RECEIPT`,
  suilendProtocolTypeTag: `${objectId("25")}::protocol::PROTOCOL`,
} satisfies JitterMarketConfig;

describe("adapter builders", () => {
  test("price ticket builders use generated adapter module bindings", () => {
    const oracleSource = readSdkSource("oracle.ts");

    expect(oracleSource).not.toContain("::ember_price_ticket::");
    expect(oracleSource).not.toContain("::suilend_price_ticket::");
    expect(oracleSource).not.toContain("::navi_price_ticket::");
  });

  test("ember deposit builder targets generated ember adapter module", () => {
    const calls = collectMoveCalls((tx) => {
      addEmberDeposit(tx, config, tx.object(objectId("30")), tx.object(objectId("31")));
    });

    expect(calls).toContainEqual(
      expect.objectContaining({
        module: "ember_market_vault",
        function: "deposit",
      }),
    );
  });

  test("suilend redeem builder targets generated suilend adapter module", () => {
    const calls = collectMoveCalls((tx) => {
      addSuilendRedeem(tx, config, tx.object(objectId("32")));
    });

    expect(calls).toContainEqual(
      expect.objectContaining({
        module: "suilend_market_vault",
        function: "redeem",
      }),
    );
  });

  test("navi redeem v2 builder targets generated navi adapter module", () => {
    const calls = collectMoveCalls((tx) => {
      addNaviRedeemV2(tx, config, tx.object(objectId("33")));
    });

    expect(calls).toContainEqual(
      expect.objectContaining({
        module: "navi_market_vault",
        function: "redeem_v2",
      }),
    );
  });

  test("navi price builder targets generated navi oracle module", () => {
    const calls = collectMoveCalls((tx) => {
      addNaviPriceInfo(tx, config);
    });

    expect(calls).toContainEqual(
      expect.objectContaining({
        module: "navi_price_ticket",
        function: "quote",
      }),
    );
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

function readSdkSource(fileName: string): string {
  const testDir = path.dirname(fileURLToPath(import.meta.url));
  return readFileSync(path.resolve(testDir, "..", fileName), "utf8");
}
