import { expect, test } from "bun:test";

test("generated adapter bindings include all contract adapters", async () => {
  await expect(import("../generated/demo_adapter/demo_market_vault.js")).resolves.toBeTruthy();
  await expect(import("../generated/scallop_adapter/scallop_market_vault.js")).resolves.toBeTruthy();
  await expect(import("../generated/ember_adapter/ember_market_vault.js")).resolves.toBeTruthy();
  await expect(import("../generated/suilend_adapter/suilend_market_vault.js")).resolves.toBeTruthy();
  await expect(import("../generated/navi_adapter/navi_market_vault.js")).resolves.toBeTruthy();
});
