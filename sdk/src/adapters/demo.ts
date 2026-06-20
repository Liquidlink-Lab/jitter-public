import { addDemoPriceInfo } from "../oracle.js";
import { addDemoDeposit, addDemoRedeem } from "../sy.js";
import type { JitterMarketConfig } from "../types.js";
import type { JitterAdapterManifest } from "./types.js";

export const demoAdapterManifest: JitterAdapterManifest = {
  kind: "demo",
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
      demoMarketVaultObjectId: requireConfigValue(
        config.demoMarketVaultObjectId,
        "demoMarketVaultObjectId",
      ),
    };
  },

  addPriceInfo({ tx, config, syIndex }) {
    if (syIndex === undefined) {
      throw new Error("Demo adapter price info requires a syIndex.");
    }
    return addDemoPriceInfo(tx, config, syIndex);
  },

  addDepositToSy({ tx, config, mintRequest, inputCoin }) {
    addDemoDeposit(tx, config, mintRequest, inputCoin);
    return {};
  },

  addRedeemFromSy({ tx, config, burnRequest }) {
    return {
      outputCoin: addDemoRedeem(tx, config, burnRequest),
    };
  },
};

function requireConfigValue(value: string | undefined, field: string): string {
  if (!value) {
    throw new Error(`Missing Jitter market config field: ${field}.`);
  }
  return value;
}
