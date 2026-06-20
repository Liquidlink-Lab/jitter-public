import { Transaction } from "@mysten/sui/transactions";

import { SUI_CLOCK_ID } from "./constants.js";
import type { JitterMarketConfig } from "./types.js";

export type JitterCheckInObjects = {
  packageId: string;
  globalConfigObjectId: string;
  campaignObjectId: string;
  liquidlinkGlobalConfigObjectId: string;
  scoreboardObjectId: string;
};

export function hasJitterCheckInConfig(config: JitterMarketConfig): boolean {
  return getMissingJitterCheckInConfigKeys(config).length === 0;
}

export function getMissingJitterCheckInConfigKeys(
  config: JitterMarketConfig,
): string[] {
  const liquidlink = config.liquidlink;
  const checkIn = liquidlink?.checkIn;
  const entries: Array<[string, string | undefined]> = [
    ["liquidlink.checkIn.packageId", checkIn?.packageId],
    ["liquidlink.checkIn.globalConfigObjectId", checkIn?.globalConfigObjectId],
    ["liquidlink.checkIn.campaignObjectId", checkIn?.campaignObjectId],
    ["liquidlink.liquidlinkGlobalConfigObjectId", liquidlink?.liquidlinkGlobalConfigObjectId],
    ["liquidlink.scoreboardObjectId", liquidlink?.scoreboardObjectId],
  ];

  return entries.filter(([, value]) => !value).map(([key]) => key);
}

export function requireJitterCheckInConfig(
  config: JitterMarketConfig,
): JitterCheckInObjects {
  const liquidlink = config.liquidlink;
  const checkIn = liquidlink?.checkIn;
  const missing = getMissingJitterCheckInConfigKeys(config);
  if (missing.length > 0) {
    throw new Error(
      `Missing Jitter check-in config: ${missing.join(", ")}.`,
    );
  }

  return {
    packageId: checkIn?.packageId ?? "",
    globalConfigObjectId: checkIn?.globalConfigObjectId ?? "",
    campaignObjectId: checkIn?.campaignObjectId ?? "",
    liquidlinkGlobalConfigObjectId: liquidlink?.liquidlinkGlobalConfigObjectId ?? "",
    scoreboardObjectId: liquidlink?.scoreboardObjectId ?? "",
  };
}

export function addDailyCheckIn(
  tx: Transaction,
  config: JitterMarketConfig,
) {
  const checkIn = requireJitterCheckInConfig(config);

  tx.moveCall({
    target: `${checkIn.packageId}::check_in::check_in`,
    arguments: [
      tx.object(checkIn.globalConfigObjectId),
      tx.object(checkIn.campaignObjectId),
      tx.object(checkIn.liquidlinkGlobalConfigObjectId),
      tx.object(checkIn.scoreboardObjectId),
      tx.object(SUI_CLOCK_ID),
    ],
  });
}
