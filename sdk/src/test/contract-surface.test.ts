import { expect, test } from "bun:test";

import { JITTER_CONTRACT_SURFACE } from "../contract/contract-surface.js";

test("contract surface lists current adapter packages", () => {
  expect(JITTER_CONTRACT_SURFACE.adapters.map((adapter) => adapter.kind)).toEqual([
    "demo",
    "scallop",
    "ember",
    "suilend",
    "navi",
  ]);
});

test("contract surface includes frontend-relevant core objects", () => {
  expect(JITTER_CONTRACT_SURFACE.objects.Pool.fields).toContain("total_sy");
  expect(JITTER_CONTRACT_SURFACE.objects.Pool.fields).toContain("lp_supply");
  expect(JITTER_CONTRACT_SURFACE.objects.PyState.fields).toContain("is_settled");
  expect(JITTER_CONTRACT_SURFACE.objects.PyState.fields).toContain("paused");
  expect(JITTER_CONTRACT_SURFACE.objects.JitterPosition.fields).toContain("py");
  expect(JITTER_CONTRACT_SURFACE.objects.JitterPosition.fields).toContain("lp");
});
