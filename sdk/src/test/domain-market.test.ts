import { describe, expect, test } from "bun:test";

import {
  formatDecimalUnits,
  normalizeMoveNumeric,
  toDecimalUnits,
} from "../domain/amounts.js";
import {
  getMarketDisplaySymbol,
  getMarketProtocolLabel,
  resolveMarketLifecycle,
} from "../domain/market.js";
import type {
  JitterMarketConfig,
  PoolFields,
  PyStateFields,
} from "../types.js";

function marketConfig(
  overrides: Partial<JitterMarketConfig> = {},
): JitterMarketConfig {
  return {
    jitterPackageId: "0x1",
    demoAdapterPackageId: "0x2",
    oraclePackageId: "0x3",
    syStateObjectId: "0x4",
    aclObjectId: "0x5",
    marketObjectId: "0x6",
    pyStateObjectId: "0x7",
    poolObjectId: "0x8",
    priceAggregatorObjectId: "0x9",
    demoMarketVaultObjectId: "0xa",
    underlyingTypeTag: "0x2::sui::SUI",
    syTypeTag: "0xb::SY::SY",
    ptTypeTag: "0xc::PT::PT",
    ytTypeTag: "0xd::YT::YT",
    ...overrides,
  };
}

function poolFields(overrides: Partial<PoolFields> = {}): PoolFields {
  return {
    id: { id: "0xpool" },
    total_pt: "0",
    total_sy: "0",
    lp_supply: "0",
    last_ln_implied_rate: "0",
    scalar_root: "0",
    initial_anchor: "0",
    ln_fee_rate_root: "0",
    paused: false,
    expiry: "2000",
    ...overrides,
  };
}

function pyStateFields(overrides: Partial<PyStateFields> = {}): PyStateFields {
  return {
    id: { id: "0xpy" },
    pt_supply: "0",
    yt_supply: "0",
    sy_balance: "0",
    py_index_stored: "0",
    global_interest_index: "0",
    is_settled: false,
    settled_py_index: "0",
    expiry: "2000",
    market_id: "0xmarket",
    ...overrides,
  };
}

describe("domain amount helpers", () => {
  test("normalizes Move numeric strings, bigint, and signed Move numeric objects", () => {
    expect(normalizeMoveNumeric("42")).toBe(42n);
    expect(normalizeMoveNumeric(7n)).toBe(7n);
    expect(normalizeMoveNumeric({ value: "9", positive: true })).toBe(9n);
    expect(normalizeMoveNumeric({ value: "9", positive: false })).toBe(-9n);
  });

  test("formats and converts raw token units with configured decimals", () => {
    expect(formatDecimalUnits("1234567", 6)).toBe("1.234567");
    expect(formatDecimalUnits(1n, 9)).toBe("0.000000001");
    expect(toDecimalUnits("2500000", 6)).toBe(2.5);
  });
});

describe("domain market helpers", () => {
  test("distinguishes active, paused, matured, and settled market lifecycle states", () => {
    expect(
      resolveMarketLifecycle({
        pool: poolFields({ expiry: "2000" }),
        pyState: pyStateFields({ expiry: "2000" }),
        nowMs: 1000,
      }),
    ).toMatchObject({ status: "active", isActive: true });

    expect(
      resolveMarketLifecycle({
        pool: poolFields({ expiry: "2000", paused: true }),
        pyState: pyStateFields({ expiry: "2000" }),
        nowMs: 1000,
      }),
    ).toMatchObject({ status: "paused", isPaused: true });

    expect(
      resolveMarketLifecycle({
        pool: poolFields({ expiry: "1000" }),
        pyState: pyStateFields({ expiry: "1000" }),
        nowMs: 2000,
      }),
    ).toMatchObject({ status: "matured", isMatured: true });

    expect(
      resolveMarketLifecycle({
        pool: poolFields({ expiry: "1000" }),
        pyState: pyStateFields({ expiry: "1000", is_settled: true }),
        nowMs: 2000,
      }),
    ).toMatchObject({ status: "settled", isSettled: true });
  });

  test("maps Scallop display symbol to sSUI or sTOKEN and keeps demo symbols plain", () => {
    expect(getMarketDisplaySymbol(marketConfig())).toBe("SUI");
    expect(
      getMarketDisplaySymbol(
        marketConfig({ scallopMarketVaultObjectId: "0xscallop" }),
      ),
    ).toBe("sSUI");
    expect(
      getMarketDisplaySymbol(
        marketConfig({
          underlyingTypeTag:
            "0xfacbeda4e0bef2ba45f295d27b4eaaed116f5ff5b5c61dbf6eccaae044b7c70e::usdc::USDC",
          scallopMarketVaultObjectId: "0xscallop",
        }),
      ),
    ).toBe("sUSDC");
  });

  test("labels Scallop markets separately from demo Jitter markets", () => {
    expect(getMarketProtocolLabel(marketConfig())).toBe("Jitter");
    expect(
      getMarketProtocolLabel(
        marketConfig({ scallopMarketVaultObjectId: "0xscallop" }),
      ),
    ).toBe("Scallop");
  });
});
