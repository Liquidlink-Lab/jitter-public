import { describe, expect, test } from "bun:test";

import { buildJitterMarketOverview } from "../domain/market-mappers.js";
import type {
  JitterMarketConfig,
  PoolFields,
  PyStateFields,
} from "../types.js";

const JAN_1_2025 = Date.UTC(2025, 0, 1);
const JAN_1_2026 = Date.UTC(2026, 0, 1);

function marketConfig(
  overrides: Partial<JitterMarketConfig> = {},
): JitterMarketConfig {
  return {
    jitterPackageId: "0x1",
    demoAdapterPackageId: "0x2",
    oraclePackageId: "0x3",
    syStateObjectId: "0x4",
    aclObjectId: "0x5",
    marketObjectId: "0xmarket",
    pyStateObjectId: "0xpy",
    poolObjectId: "0xpool",
    priceAggregatorObjectId: "0x9",
    demoMarketVaultObjectId: "0xa",
    underlyingTypeTag:
      "0xfacbeda4e0bef2ba45f295d27b4eaaed116f5ff5b5c61dbf6eccaae044b7c70e::usdc::USDC",
    syTypeTag: "0xb::SY::SY",
    ptTypeTag: "0xc::PT::PT",
    ytTypeTag: "0xd::YT::YT",
    marketDecimals: 6,
    underlyingDecimals: 6,
    ...overrides,
  };
}

function poolFields(overrides: Partial<PoolFields> = {}): PoolFields {
  return {
    id: { id: "0xpool" },
    total_pt: "500000",
    total_sy: "1500000",
    lp_supply: "1000000",
    last_ln_implied_rate: "0",
    scalar_root: "0",
    initial_anchor: "0",
    ln_fee_rate_root: "0",
    paused: false,
    expiry: JAN_1_2026.toString(),
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
    expiry: JAN_1_2026.toString(),
    market_id: "0xmarket",
    ...overrides,
  };
}

describe("buildJitterMarketOverview", () => {
  test("maps contract snapshots into frontend-ready market display data", () => {
    const config = marketConfig({ scallopMarketVaultObjectId: "0xscallop" });
    const market = buildJitterMarketOverview({
      config,
      tradeReady: true,
      pool: poolFields(),
      pyState: pyStateFields(),
      volume: {
        volume24hSy: 250000n,
        volume7dSy: 750000n,
        totalFeesSy: 0n,
        swapCount24h: 3,
        swapCount7d: 9,
      },
      underlyingApy: 0.08,
      nowMs: JAN_1_2025,
    });

    expect(market.address).toBe("0xpool");
    expect(market.symbol).toBe("sUSDC");
    expect(market.protocol).toBe("Scallop");
    expect(market.maturity).toBe("Jan 1, 2026");
    expect(market.maturityTimestamp).toBe(Math.floor(JAN_1_2026 / 1000));
    expect(market.liquidity).toBe(2);
    expect(market.tvl).toBe(2);
    expect(market.volume24h).toBe(0.25);
    expect(market.volume7d).toBe(0.75);
    expect(market.fixedApy).toBe(0);
    expect(market.underlyingApy).toBe(0.08);
    expect(market.underlyingPrice).toBe(1);
    expect(market.ptUsdValue).toBe(1);
    expect(market.ytAssetPrice).toBe(0);
    expect(market.longYieldApy).toBe(0.08);
    expect(market.ytLeverage).toBe(1);
    expect(market.lpBreakdown.ptWeight).toBe(0.25);
    expect(market.lpBreakdown.syWeight).toBe(0.75);
    expect(market.lpApy).toBe(0.06);
    expect(market.underlyingDecimals).toBe(6);
    expect(market.marketDecimals).toBe(6);
    expect(market.isActive).toBe(true);
    expect(market.isPaused).toBe(false);
    expect(market.isMatured).toBe(false);
    expect(market.isSettled).toBe(false);
    expect(market.categories).toEqual([
      "protocol:scallop",
      "underlying:susdc",
      "maturity:far",
    ]);
    expect(market.searchText).toContain("jitter");
    expect(market.searchText).toContain("0xmarket");
    expect(market.jitterConfig).toEqual(config);
  });

  test("preserves configured accounting decimals on market overviews", () => {
    const market = buildJitterMarketOverview({
      config: marketConfig({
        underlyingDecimals: 9,
        marketDecimals: 9,
      }),
      tradeReady: true,
      pool: poolFields({
        total_pt: "500000000",
        total_sy: "1500000000",
      }),
      pyState: pyStateFields(),
      volume: {
        volume24hSy: 250000000n,
        volume7dSy: 750000000n,
        totalFeesSy: 0n,
        swapCount24h: 3,
        swapCount7d: 9,
      },
      underlyingApy: 0.08,
      nowMs: JAN_1_2025,
    });

    expect(market.underlyingDecimals).toBe(9);
    expect(market.marketDecimals).toBe(9);
    expect(market.liquidity).toBe(2);
    expect(market.volume24h).toBe(0.25);
  });

  test("derives PT and YT prices from implied APY and time to maturity", () => {
    const market = buildJitterMarketOverview({
      config: marketConfig({ underlyingPriceUsd: 2 }),
      tradeReady: true,
      pool: poolFields({
        last_ln_implied_rate: "887822395064481792",
      }),
      pyState: pyStateFields(),
      volume: {
        volume24hSy: 0n,
        volume7dSy: 0n,
        totalFeesSy: 0n,
        swapCount24h: 0,
        swapCount7d: 0,
      },
      underlyingApy: 0.04,
      nowMs: JAN_1_2025,
    });

    expect(market.underlyingPrice).toBe(2);
    expect(market.ptUsdValue).toBeGreaterThan(1.9);
    expect(market.ptUsdValue).toBeLessThan(2);
    expect(market.ytAssetPrice).toBeGreaterThan(0);
    expect(market.ytLeverage).toBeGreaterThan(1);
  });

  test("surfaces configured LiquidLink points and coin reward streams", () => {
    const market = buildJitterMarketOverview({
      config: marketConfig({
        rewardDistributorObjectId: "0xreward",
        jitterExtensionsPackageId: "0xextensions",
        liquidlink: {
          enabled: true,
          pointConfigObjectId: "0xpoint",
          scoreboardObjectId: "0xscoreboard",
          lpPointStateObjectId: "0xlp-points",
          ytMultiplierBps: 12_500,
          lpMultiplierBps: 15_000,
        },
        coinReward: {
          rewardCoinTypeTag: "0x123::qa_reward::QA_REWARD",
          ytRewarderObjectId: "0xyt-rewarder",
          lpRewarderObjectId: "0xlp-rewarder",
          fundedAmount: "1000000",
        },
      }),
      tradeReady: true,
      pool: poolFields(),
      pyState: pyStateFields(),
      volume: {
        volume24hSy: 0n,
        volume7dSy: 0n,
        totalFeesSy: 0n,
        swapCount24h: 0,
        swapCount7d: 0,
      },
      underlyingApy: 0,
      nowMs: JAN_1_2025,
    });

    expect(market.points).toEqual([
      {
        key: "LiquidLink YT Points",
        pendleAsset: "yt",
        type: "multiplier",
        value: 1.25,
      },
      {
        key: "LiquidLink LP Points",
        pendleAsset: "lp",
        type: "multiplier",
        value: 1.5,
      },
    ]);
    expect(market.ytRewards).toEqual([
      {
        amount: 1_000_000,
        apy: 0,
        assetSymbol: "QA_REWARD",
        source: "YT Coin Reward",
      },
    ]);
    expect(market.lpBreakdown.onChainRewards).toEqual([
      {
        amount: 1_000_000,
        apy: 0,
        assetSymbol: "QA_REWARD",
        source: "LP Coin Reward",
      },
    ]);
    expect(market.categories).toContain("points:liquidlink");
    expect(market.categories).toContain("reward:coin");
  });

  test("omits trade config when a market is display-only", () => {
    const market = buildJitterMarketOverview({
      config: marketConfig(),
      tradeReady: false,
      pool: poolFields(),
      pyState: pyStateFields(),
      volume: {
        volume24hSy: 0n,
        volume7dSy: 0n,
        totalFeesSy: 0n,
        swapCount24h: 0,
        swapCount7d: 0,
      },
      underlyingApy: 0,
      nowMs: JAN_1_2025,
    });

    expect(market.symbol).toBe("USDC");
    expect(market.protocol).toBe("Jitter");
    expect(market.jitterConfig).toBeUndefined();
  });

  test("uses lifecycle flags from pool and PyState snapshots", () => {
    const paused = buildJitterMarketOverview({
      config: marketConfig(),
      tradeReady: true,
      pool: poolFields({ paused: true }),
      pyState: pyStateFields(),
      volume: {
        volume24hSy: 0n,
        volume7dSy: 0n,
        totalFeesSy: 0n,
        swapCount24h: 0,
        swapCount7d: 0,
      },
      underlyingApy: 0,
      nowMs: JAN_1_2025,
    });

    const settled = buildJitterMarketOverview({
      config: marketConfig(),
      tradeReady: true,
      pool: poolFields({ expiry: "1000" }),
      pyState: pyStateFields({ expiry: "1000", is_settled: true }),
      volume: {
        volume24hSy: 0n,
        volume7dSy: 0n,
        totalFeesSy: 0n,
        swapCount24h: 0,
        swapCount7d: 0,
      },
      underlyingApy: 0,
      nowMs: JAN_1_2025,
    });

    expect(paused).toMatchObject({ isActive: false, isPaused: true });
    expect(settled).toMatchObject({
      isActive: false,
      isMatured: true,
      isSettled: true,
    });
  });
});
