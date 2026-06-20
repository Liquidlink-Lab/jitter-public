import { FP64_ONE } from "../constants.js";
import {
  getMarketAccountingDecimals,
  getMarketUnderlyingDecimals,
  type JitterMarketConfig,
  type MoveNumericField,
  type PoolFields,
  type PyStateFields,
} from "../types.js";
import { normalizeMoveNumeric, toDecimalUnits } from "./amounts.js";
import {
  getMarketDisplaySymbol,
  getMarketProtocolLabel,
  resolveMarketLifecycle,
} from "./market.js";

export type MarketYieldReward = {
  amount: number;
  apy: number;
  assetSymbol: string;
  endTimestamp?: string;
  source: string;
  startTimestamp?: string;
};

export type MarketLpBreakdown = {
  ptWeight: number;
  syWeight: number;
  scaledImpliedApy: number;
  scaledSyInterestApy: number;
  swapFeeApy: number;
  pendleApy: number;
  arbApy: number;
  lpRewardApy: number;
  maxBoostedApy: number;
  boostable: boolean;
  onChainRewards: MarketYieldReward[];
  offChainRewards: MarketYieldReward[];
  lpExclusiveRewards: MarketYieldReward[];
};

export type MarketBaseYield = {
  apy: number;
  assetSymbol: string;
  source: "onchain" | "offchain" | "underlying";
};

export type MarketAnalyticsState = {
  source: "redis" | "indexer" | "external" | "contract" | "metadata" | "mixed" | "unavailable";
  updatedAtMs: number | null;
  isStale: boolean;
  staleAfterMs: number;
  underlyingApySource: "redis" | "indexer" | "external" | "contract" | "metadata" | "mixed" | "unavailable";
  underlyingApyUpdatedAtMs: number | null;
  lpApySource: "redis" | "indexer" | "external" | "contract" | "metadata" | "mixed" | "unavailable";
  lpApyFormulaVersion: string | null;
};

export type MarketPoint = {
  key: string;
  type: string;
  value: number;
  pendleAsset: "basic" | "lp" | string;
};

export type JitterMarketOverview = {
  marketId: string;
  address: string;
  chainId: number;
  symbol: string;
  protocol: string;
  icon: string;
  maturity: string;
  maturityTimestamp: number;
  liquidity: number;
  tvl: number;
  volume24h: number;
  volume7d: number;
  totalFees: number;
  fixedApy: number;
  ptMaturityValueText: string;
  ptRoi: number;
  ptUsdValue: number;
  underlyingApy: number;
  underlyingPrice: number;
  totalUnderlyingApy: number;
  longYieldApy: number;
  ytLeverage: number;
  ytRoi: number;
  ytUsdValue: number;
  ytAssetPrice: number;
  lpApy: number;
  underlyingDecimals: number;
  marketDecimals: number;
  lpTokenSymbol: string;
  lpBreakdown: MarketLpBreakdown;
  baseYield: MarketBaseYield;
  underlyingInterestApy: number;
  underlyingRewardApy: number;
  underlyingRewards: MarketYieldReward[];
  ytRewards: MarketYieldReward[];
  points: MarketPoint[];
  isActive: boolean;
  isPrime: boolean;
  isNew: boolean;
  isPopular: boolean;
  categories: string[];
  groupId: string;
  searchText: string;
  isMatured: boolean;
  isPaused: boolean;
  isSettled: boolean;
  tradeReady: boolean;
  analytics?: MarketAnalyticsState;
  jitterConfig?: JitterMarketConfig;
};

export type MarketVolumeStats = {
  volume24hSy: bigint;
  volume7dSy: bigint;
  totalFeesSy: bigint;
  swapCount24h: number;
  swapCount7d: number;
};

export type BuildJitterMarketOverviewInput = {
  marketId?: string;
  config: JitterMarketConfig;
  tradeReady: boolean;
  pool: PoolFields;
  pyState: PyStateFields;
  volume: MarketVolumeStats;
  underlyingApy: number;
  nowMs?: number;
  chainId?: number;
};

const MATURITY_FORMATTER = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const NEW_MARKET_WINDOW_MS = 365 * 24 * 60 * 60 * 1000;
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export function buildJitterMarketOverview(
  input: BuildJitterMarketOverviewInput,
): JitterMarketOverview {
  const { config, pool, pyState, volume } = input;
  const nowMs = input.nowMs ?? Date.now();
  const lifecycle = resolveMarketLifecycle({ pool, pyState, nowMs });
  const tradeReady =
    input.tradeReady &&
    lifecycle.isActive &&
    !lifecycle.isMatured &&
    !lifecycle.isPaused &&
    !lifecycle.isSettled;
  const symbol = getMarketDisplaySymbol(config);
  const protocol = getMarketProtocolLabel(config);
  const underlyingDecimals = getMarketUnderlyingDecimals(config);
  const marketDecimals = getMarketAccountingDecimals(config);
  const decimals = marketDecimals;
  const fixedApy = calcImpliedApyFraction(pool.last_ln_implied_rate);
  const expiryMs = lifecycle.expiryMs;
  const maturity = MATURITY_FORMATTER.format(new Date(expiryMs));
  const yearsToMaturity = Math.max(expiryMs - nowMs, 0) / YEAR_MS;

  const totalSyUnits = toDecimalUnits(pool.total_sy, decimals);
  const totalPtUnits = toDecimalUnits(pool.total_pt, decimals);
  const liquidity = totalSyUnits + totalPtUnits;
  const volume24h = toDecimalUnits(volume.volume24hSy, decimals);
  const volume7d = toDecimalUnits(volume.volume7dSy, decimals);
  const totalFees = toDecimalUnits(volume.totalFeesSy, decimals);

  const totalSy = normalizeMoveNumeric(pool.total_sy);
  const totalPt = normalizeMoveNumeric(pool.total_pt);
  const totalPool = totalSy + totalPt;
  const syWeight = totalPool > 0n ? Number(totalSy) / Number(totalPool) : 0;
  const ptWeight = totalPool > 0n ? Number(totalPt) / Number(totalPool) : 0;
  const longYieldApy = Math.max(input.underlyingApy - fixedApy, 0);
  const underlyingPrice = resolveUnderlyingPrice(config);
  const ptUsdValue = quotePtPriceFromImpliedApy(
    underlyingPrice,
    fixedApy,
    yearsToMaturity,
  );
  const ytAssetPrice = Math.max(underlyingPrice - ptUsdValue, 0);
  const ytLeverage = quoteYtLeverage(
    underlyingPrice,
    ytAssetPrice,
    input.underlyingApy,
  );
  const ytRewards = buildYtRewards(config);
  const lpRewards = buildLpRewards(config);
  const points = buildMarketPoints(config);

  const lpBreakdown: MarketLpBreakdown = {
    ptWeight,
    syWeight,
    scaledImpliedApy: fixedApy * ptWeight,
    scaledSyInterestApy: input.underlyingApy * syWeight,
    swapFeeApy: 0,
    pendleApy: 0,
    arbApy: 0,
    lpRewardApy: 0,
    maxBoostedApy: 0,
    boostable: false,
    onChainRewards: lpRewards,
    offChainRewards: [],
    lpExclusiveRewards: [],
  };
  const lpApy = lpBreakdown.scaledImpliedApy + lpBreakdown.scaledSyInterestApy;
  const categories = [
    `protocol:${protocol.toLowerCase()}`,
    `underlying:${symbol.toLowerCase()}`,
    `maturity:${lifecycle.maturityBucket}`,
    ...(points.length > 0 ? ["points:liquidlink"] : []),
    ...(ytRewards.length > 0 || lpRewards.length > 0 ? ["reward:coin"] : []),
  ];

  return {
    marketId: input.marketId ?? config.marketObjectId,
    address: config.poolObjectId,
    chainId: input.chainId ?? 0,
    symbol,
    protocol,
    icon: "",
    maturity,
    maturityTimestamp: Math.floor(expiryMs / 1000),
    liquidity,
    tvl: liquidity,
    volume24h,
    volume7d,
    totalFees,
    fixedApy,
    ptMaturityValueText: `1 ${symbol}`,
    ptRoi: fixedApy,
    ptUsdValue,
    underlyingApy: input.underlyingApy,
    underlyingPrice,
    totalUnderlyingApy: input.underlyingApy,
    longYieldApy,
    ytLeverage,
    ytRoi: longYieldApy,
    ytUsdValue: 0,
    ytAssetPrice,
    lpApy,
    underlyingDecimals,
    marketDecimals,
    lpTokenSymbol: `LP ${symbol}`,
    lpBreakdown,
    baseYield: { apy: input.underlyingApy, assetSymbol: symbol, source: "onchain" },
    underlyingInterestApy: input.underlyingApy,
    underlyingRewardApy: 0,
    underlyingRewards: [],
    ytRewards,
    points,
    isActive: lifecycle.isActive,
    isPrime: false,
    isNew: !lifecycle.isSettled && nowMs - expiryMs > -NEW_MARKET_WINDOW_MS,
    isPopular: false,
    isMatured: lifecycle.isMatured,
    isPaused: lifecycle.isPaused,
    isSettled: lifecycle.isSettled,
    tradeReady,
    jitterConfig: tradeReady ? config : undefined,
    categories,
    groupId: `jitter-${symbol.toLowerCase()}`,
    searchText: buildMarketSearchText({
      config,
      symbol,
      lifecycle,
      categories,
    }),
  };
}

function buildYtRewards(config: JitterMarketConfig): MarketYieldReward[] {
  if (!config.coinReward?.ytRewarderObjectId) return [];
  return [buildCoinReward(config, "YT Coin Reward")];
}

function buildLpRewards(config: JitterMarketConfig): MarketYieldReward[] {
  if (!config.coinReward?.lpRewarderObjectId) return [];
  return [buildCoinReward(config, "LP Coin Reward")];
}

function buildCoinReward(
  config: JitterMarketConfig,
  source: string,
): MarketYieldReward {
  return {
    amount: numericStringToNumber(config.coinReward?.fundedAmount),
    apy: 0,
    assetSymbol: getRewardCoinSymbol(config.coinReward?.rewardCoinTypeTag),
    source,
  };
}

function buildMarketPoints(config: JitterMarketConfig): MarketPoint[] {
  const liquidlink = config.liquidlink;
  const enabled = Boolean(
    liquidlink?.enabled ??
      (liquidlink?.pointConfigObjectId && liquidlink?.scoreboardObjectId),
  );
  if (!enabled || !liquidlink?.pointConfigObjectId || !liquidlink.scoreboardObjectId) {
    return [];
  }

  const points: MarketPoint[] = [
    {
      key: "LiquidLink YT Points",
      pendleAsset: "yt",
      type: "multiplier",
      value: bpsToMultiplier(liquidlink.ytMultiplierBps),
    },
  ];

  if (liquidlink.lpPointStateObjectId) {
    points.push({
      key: "LiquidLink LP Points",
      pendleAsset: "lp",
      type: "multiplier",
      value: bpsToMultiplier(liquidlink.lpMultiplierBps),
    });
  }

  return points;
}

function bpsToMultiplier(value: number | null | undefined): number {
  const bps = value ?? 10_000;
  if (!Number.isFinite(bps) || bps <= 0) return 1;
  return bps / 10_000;
}

function getRewardCoinSymbol(typeTag: string | null | undefined): string {
  const name = typeTag?.split("::").pop()?.trim();
  return name || "Reward";
}

function numericStringToNumber(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolveUnderlyingPrice(config: JitterMarketConfig): number {
  if (
    typeof config.underlyingPriceUsd === "number" &&
    Number.isFinite(config.underlyingPriceUsd) &&
    config.underlyingPriceUsd > 0
  ) {
    return config.underlyingPriceUsd;
  }

  const token = `${config.underlyingTypeTag} ${config.scallopMarketCoinTypeTag ?? ""}`.toLowerCase();
  if (token.includes("usdc")) return 1;
  if (token.includes("sui")) {
    const configured = Number(
      process.env.NEXT_PUBLIC_SUI_USD_PRICE ??
        process.env.SUI_USD_PRICE ??
        "1",
    );
    return Number.isFinite(configured) && configured > 0 ? configured : 1;
  }
  return 1;
}

function quotePtPriceFromImpliedApy(
  underlyingPrice: number,
  impliedApy: number,
  yearsToMaturity: number,
): number {
  if (!Number.isFinite(underlyingPrice) || underlyingPrice <= 0) return 0;
  if (!Number.isFinite(impliedApy) || impliedApy <= -0.999999) {
    return underlyingPrice;
  }
  if (yearsToMaturity <= 0) return underlyingPrice;

  const discountFactor = Math.pow(1 + Math.max(impliedApy, -0.999999), -yearsToMaturity);
  return underlyingPrice * Math.min(Math.max(discountFactor, 0), 1);
}

function quoteYtLeverage(
  underlyingPrice: number,
  ytAssetPrice: number,
  underlyingApy: number,
): number {
  if (underlyingPrice > 0 && ytAssetPrice > 0) {
    return underlyingPrice / ytAssetPrice;
  }
  return underlyingApy > 0 ? 1 : 0;
}

function calcImpliedApyFraction(lnImpliedRateRaw: MoveNumericField): number {
  const raw = normalizeMoveNumeric(lnImpliedRateRaw);
  if (raw === 0n) return 0;
  return Math.exp(Number(raw) / Number(FP64_ONE)) - 1;
}

function buildMarketSearchText(input: {
  config: JitterMarketConfig;
  symbol: string;
  lifecycle: ReturnType<typeof resolveMarketLifecycle>;
  categories: string[];
}): string {
  return [
    "jitter",
    input.symbol,
    input.config.poolObjectId,
    input.config.marketObjectId,
    input.lifecycle.maturityBucket,
    input.lifecycle.isPaused ? "paused" : "live",
    input.lifecycle.isSettled ? "settled" : "unsettled",
    ...input.categories,
  ]
    .join(" ")
    .toLowerCase();
}
