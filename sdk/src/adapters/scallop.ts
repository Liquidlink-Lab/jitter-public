import { addScallopPriceInfo } from "../oracle.js";
import {
  addScallopDepositFromUnderlying,
  addScallopRedeemToUnderlying,
} from "../sy.js";
import type { JitterMarketConfig } from "../types.js";
import type { JitterAdapterManifest } from "./types.js";

export const scallopAdapterManifest: JitterAdapterManifest = {
  kind: "scallop",
  canDepositUnderlying: true,
  canRedeemUnderlying: true,

  depositInputType(config: JitterMarketConfig): string {
    return config.underlyingTypeTag;
  },

  redeemOutputType(config: JitterMarketConfig): string {
    return config.underlyingTypeTag;
  },

  requiredObjectIds(config: JitterMarketConfig): Record<string, string> {
    return {
      scallopProtocolPackageId: requireConfigValue(
        config.scallopProtocolPackageId,
        "scallopProtocolPackageId",
      ),
      scallopMarketVaultObjectId: requireConfigValue(
        config.scallopMarketVaultObjectId,
        "scallopMarketVaultObjectId",
      ),
      scallopMarketObjectId: requireConfigValue(
        config.scallopMarketObjectId,
        "scallopMarketObjectId",
      ),
      scallopVersionObjectId: requireConfigValue(
        config.scallopVersionObjectId,
        "scallopVersionObjectId",
      ),
    };
  },

  addPriceInfo({ tx, config }) {
    return addScallopPriceInfo(tx, config);
  },

  addDepositToSy({ tx, config, mintRequest, inputCoin, syAmount }) {
    return {
      excessCoin: addScallopDepositFromUnderlying(
        tx,
        config,
        mintRequest,
        inputCoin,
        syAmount,
      ),
    };
  },

  addRedeemFromSy({ tx, config, burnRequest, syAmount }) {
    return {
      outputCoin: addScallopRedeemToUnderlying(tx, config, burnRequest, syAmount),
    };
  },
};

function requireConfigValue(value: string | undefined, field: string): string {
  if (!value) {
    throw new Error(`Missing Jitter market config field: ${field}.`);
  }
  return value;
}
