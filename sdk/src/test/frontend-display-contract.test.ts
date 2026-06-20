import { expect, test } from "bun:test";

import type { JitterMarketExplorerData } from "../index.js";

type RequiredMarketKeys = "markets" | "groups" | "categoryFilters";

test("market explorer data keeps frontend top-level shape", () => {
  const data = {
    markets: [],
    groups: [],
    categoryFilters: [],
  } satisfies JitterMarketExplorerData & Record<RequiredMarketKeys, unknown>;

  expect(data.markets).toEqual([]);
  expect(data.groups).toEqual([]);
  expect(data.categoryFilters).toEqual([]);
});
