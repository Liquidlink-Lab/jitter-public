import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "bun:test";

import * as sdk from "../index.js";
import { buildDepositToSyTx } from "../compat/legacy-builders.js";
import { detectAdapterKind } from "../public/primitives.js";
import { formatTokenAmount } from "../public/queries.js";
import { createJitterClient } from "../public/client.js";
import { getDefaultJitterMarketConfig } from "../public/config.js";
import { createJitterSdk } from "../public/services.js";
import { getMarketUnderlyingDecimals } from "../public/types.js";

describe("public entrypoint structure", () => {
  test("keeps src/index.ts as a thin public barrel", () => {
    const source = readFileSync(join(import.meta.dir, "..", "index.ts"), "utf8");

    expect(source).toContain('export * from "./public/primitives.js"');
    expect(source).toContain('export * from "./public/queries.js"');
    expect(source).toContain('export * from "./public/client.js"');
    expect(source).toContain('export * from "./public/config.js"');
    expect(source).toContain('export * from "./public/services.js"');
    expect(source).toContain('export * from "./public/types.js"');
    expect(source).toContain('export * from "./compat/legacy-builders.js"');
    expect(source).not.toContain("new Transaction(");
    expect(source).not.toMatch(/export function build[A-Z]/);
  });

  test("public barrels expose the same representative API as the package entrypoint", () => {
    expect(detectAdapterKind).toBe(sdk.detectAdapterKind);
    expect(formatTokenAmount).toBe(sdk.formatTokenAmount);
    expect(createJitterClient).toBe(sdk.createJitterClient);
    expect(getDefaultJitterMarketConfig).toBe(sdk.getDefaultJitterMarketConfig);
    expect(createJitterSdk).toBe(sdk.createJitterSdk);
    expect(getMarketUnderlyingDecimals).toBe(sdk.getMarketUnderlyingDecimals);
  });

  test("legacy one-shot builders remain available from compat and package entrypoint", () => {
    expect(buildDepositToSyTx).toBe(sdk.buildDepositToSyTx);
    expect(typeof sdk.buildSwapSyForPtTx).toBe("function");
    expect(typeof sdk.buildSwapSyForYtTx).toBe("function");
    expect(typeof sdk.buildSwapPtForSyTx).toBe("function");
    expect(typeof sdk.buildAddLiquidityTx).toBe("function");
    expect(typeof sdk.buildRemoveLiquidityTx).toBe("function");
    expect(typeof sdk.buildClaimYtInterestTx).toBe("function");
  });
});
