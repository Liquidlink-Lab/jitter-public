import { describe, expect, test } from "bun:test";
import { Transaction } from "@mysten/sui/transactions";

import {
  addDailyCheckIn,
  getMissingJitterCheckInConfigKeys,
  hasJitterCheckInConfig,
} from "../check-in.js";
import type { JitterMarketConfig } from "../types.js";

function objectId(byte: string): string {
  return `0x${byte.repeat(64)}`;
}

const BASE_CONFIG: JitterMarketConfig = {
  jitterPackageId: objectId("1"),
  demoAdapterPackageId: objectId("2"),
  oraclePackageId: objectId("3"),
  syStateObjectId: objectId("4"),
  globalConfigObjectId: objectId("5"),
  aclObjectId: objectId("6"),
  marketObjectId: objectId("7"),
  pyStateObjectId: objectId("8"),
  poolObjectId: objectId("9"),
  priceAggregatorObjectId: objectId("a"),
  demoMarketVaultObjectId: objectId("b"),
  underlyingTypeTag: `${objectId("c")}::underlying::UNDERLYING`,
  syTypeTag: `${objectId("d")}::sy::SY`,
  ptTypeTag: `${objectId("e")}::pt::PT`,
  ytTypeTag: `${objectId("f")}::yt::YT`,
};

describe("check-in builder", () => {
  test("reports missing object ids when a market has no check-in config", () => {
    expect(hasJitterCheckInConfig(BASE_CONFIG)).toBe(false);
    expect(getMissingJitterCheckInConfigKeys(BASE_CONFIG)).toEqual([
      "liquidlink.checkIn.packageId",
      "liquidlink.checkIn.globalConfigObjectId",
      "liquidlink.checkIn.campaignObjectId",
      "liquidlink.liquidlinkGlobalConfigObjectId",
      "liquidlink.scoreboardObjectId",
    ]);
  });

  test("adds the daily check-in move call when config is complete", () => {
    const config: JitterMarketConfig = {
      ...BASE_CONFIG,
      liquidlink: {
        enabled: true,
        liquidlinkGlobalConfigObjectId: objectId("a"),
        scoreboardObjectId: objectId("c"),
        checkIn: {
          packageId: objectId("d"),
          globalConfigObjectId: objectId("e"),
          campaignObjectId: objectId("f"),
        },
      },
    };
    const tx = new Transaction();

    addDailyCheckIn(tx, config);

    const data = tx.getData();
    expect(data.commands).toHaveLength(1);
    expect(JSON.stringify(data.commands[0])).toContain("check_in");
  });
});
