import type {
  JitterConfigNetworkInput,
  JitterMarketConfigEntry,
  JitterMarketDisplaySnapshot,
} from "../config.js";
import { FP64_ONE } from "../constants.js";
import { toDecimalUnits } from "../domain/amounts.js";
import {
  buildJitterMarketOverview,
  type JitterMarketOverview,
  type MarketVolumeStats,
} from "../domain/market-mappers.js";
import type {
  AnalyticsDataSource,
  JitterAnalyticsReader,
  MarketAnalyticsResult,
} from "../ports/analytics-reader.js";
import type { JitterChainReader } from "../ports/chain-reader.js";
import type { JitterMarketConfigProvider } from "../ports/config-provider.js";
import {
  getMarketAccountingDecimals,
  type JitterMarketConfig,
} from "../types.js";
import { overlayJitterMarketConfigFromRegistry } from "../market-registry.js";

export type { JitterMarketOverview } from "../domain/market-mappers.js";

export type JitterMarketGroupInfo = {
  id: string;
  name: string;
  protocol: string;
  icon: string;
  marketsCount: number;
  liquidity: number;
  tvl: number;
  volume24h: number;
  volume7d: number;
  bestFixedApy: number;
  bestUnderlyingApy: number;
  bestLongYieldApy: number;
  bestYtLeverage: number;
  categories: string[];
  searchText: string;
  markets: JitterMarketOverview[];
};

export type JitterMarketCategoryFilter = {
  id: string;
  name: string;
};

export type JitterMarketExplorerData = {
  markets: JitterMarketOverview[];
  groups: JitterMarketGroupInfo[];
  categoryFilters: JitterMarketCategoryFilter[];
};

export type JitterTradeProduct = "pt" | "yt" | "lp";
export type JitterTradeSide =
  | "buy"
  | "sell"
  | "add"
  | "add_keep_yt"
  | "remove";
export type JitterTradeActionId =
  | "buy_pt"
  | "sell_pt"
  | "buy_yt"
  | "sell_yt"
  | "add_lp"
  | "add_lp_from_sy"
  | "add_lp_keep_yt"
  | "remove_lp"
  | "remove_lp_to_sy";
export type JitterTradeAsset = "underlying" | "sy" | "pt" | "yt" | "lp";
export type JitterRequiredPosition = "py" | "lp" | null;

export type JitterMarketTradeAction = {
  id: JitterTradeActionId;
  product: JitterTradeProduct;
  side: JitterTradeSide;
  inputAssets: JitterTradeAsset[];
  outputAssets: JitterTradeAsset[];
  requiredPosition: JitterRequiredPosition;
  disabledReason: string | null;
};

export type JitterMarketTradeMetadata = {
  marketId: string;
  adapterKind: "demo" | "scallop" | "ember" | "suilend" | "navi";
  tradeReady: boolean;
  disabledReason: string | null;
  missingConfigKeys: string[];
  actions: JitterMarketTradeAction[];
};

export type MarketDataServiceOptions = {
  nowMs?: number;
  analyticsFreshnessMs?: number;
};

export type CreateJitterMarketDataServiceOptions = {
  network: JitterConfigNetworkInput;
  configProvider: JitterMarketConfigProvider;
  chainReader: JitterChainReader;
  analyticsReader?: JitterAnalyticsReader;
  getUnderlyingApy?: (
    config: JitterMarketConfig,
  ) => number | Promise<number>;
};

export type JitterMarketDataService = {
  getExplorerData(
    options?: MarketDataServiceOptions,
  ): Promise<JitterMarketExplorerData>;
  getMarketSnapshot(
    config: JitterMarketConfig,
    options?: MarketDataServiceOptions & { tradeReady?: boolean },
  ): Promise<JitterMarketOverview>;
  getMarketAnalytics(marketId: string): Promise<MarketAnalyticsResult>;
  getMarketTradeMetadata(marketId: string): JitterMarketTradeMetadata | null;
};

const EMPTY_POOL_VOLUME: MarketVolumeStats = {
  volume24hSy: 0n,
  volume7dSy: 0n,
  totalFeesSy: 0n,
  swapCount24h: 0,
  swapCount7d: 0,
};
const DEFAULT_ANALYTICS_FRESHNESS_MS = 60_000;

export function createJitterMarketDataService(
  options: CreateJitterMarketDataServiceOptions,
): JitterMarketDataService {
  return {
    async getExplorerData(
      serviceOptions: MarketDataServiceOptions = {},
    ): Promise<JitterMarketExplorerData> {
      const entries = options.configProvider.listMarketConfigEntries(
        options.network,
      );
      const resolvedEntries = await resolveMarketConfigEntries(options, entries);
      const markets = await Promise.all(
        resolvedEntries.map((entry) =>
          hydrateMarketOverview(options, entry, {
            ...serviceOptions,
            tradeReady:
              entry.tradeReady ?? isTradeReadyMarketConfig(entry.config),
          }),
        ),
      );
      const sortedMarkets = [...markets].sort(
        (a, b) => b.liquidity - a.liquidity,
      );

      return {
        markets: sortedMarkets,
        groups: buildJitterMarketGroups(sortedMarkets),
        categoryFilters: buildJitterMarketCategoryFilters(sortedMarkets),
      };
    },

    getMarketSnapshot(
      config: JitterMarketConfig,
      serviceOptions: MarketDataServiceOptions & { tradeReady?: boolean } = {},
    ): Promise<JitterMarketOverview> {
      return (async () => {
        const resolvedConfig = await overlayConfigFromRegistry(options, config);
        const marketId = resolveMarketId(options, resolvedConfig);
        return hydrateMarketOverview(
          options,
          {
            id: marketId,
            config: resolvedConfig,
          },
          {
            ...serviceOptions,
            tradeReady:
              serviceOptions.tradeReady ??
              isTradeReadyMarketConfig(resolvedConfig),
          },
        );
      })();
    },

    getMarketAnalytics(marketId: string): Promise<MarketAnalyticsResult> {
      return getMarketAnalytics(options, marketId);
    },

    getMarketTradeMetadata(marketId: string): JitterMarketTradeMetadata | null {
      const entry = options.configProvider.getMarketConfigEntry(
        options.network,
        marketId,
      );
      if (!entry) return null;

      return buildMarketTradeMetadata(entry);
    },
  };
}

async function resolveMarketConfigEntries(
  options: CreateJitterMarketDataServiceOptions,
  entries: readonly JitterMarketConfigEntry[],
): Promise<JitterMarketConfigEntry[]> {
  return Promise.all(
    entries.map(async (entry) => ({
      ...entry,
      config: await overlayConfigFromRegistry(options, entry.config),
    })),
  );
}

async function overlayConfigFromRegistry(
  options: CreateJitterMarketDataServiceOptions,
  config: JitterMarketConfig,
): Promise<JitterMarketConfig> {
  if (!config.marketRegistryObjectId) return { ...config };

  try {
    return await overlayJitterMarketConfigFromRegistry(options.chainReader, config);
  } catch {
    return { ...config };
  }
}

const PRODUCT_LEVEL_TRADE_ACTIONS: readonly Omit<
  JitterMarketTradeAction,
  "disabledReason"
>[] = [
  {
    id: "buy_pt",
    product: "pt",
    side: "buy",
    inputAssets: ["underlying", "sy"],
    outputAssets: ["pt"],
    requiredPosition: "py",
  },
  {
    id: "sell_pt",
    product: "pt",
    side: "sell",
    inputAssets: ["pt"],
    outputAssets: ["sy"],
    requiredPosition: "py",
  },
  {
    id: "buy_yt",
    product: "yt",
    side: "buy",
    inputAssets: ["underlying", "sy"],
    outputAssets: ["yt"],
    requiredPosition: "py",
  },
  {
    id: "sell_yt",
    product: "yt",
    side: "sell",
    inputAssets: ["yt"],
    outputAssets: ["sy"],
    requiredPosition: "py",
  },
  {
    id: "add_lp",
    product: "lp",
    side: "add",
    inputAssets: ["sy", "pt"],
    outputAssets: ["lp"],
    requiredPosition: "lp",
  },
  {
    id: "add_lp_from_sy",
    product: "lp",
    side: "add",
    inputAssets: ["underlying", "sy"],
    outputAssets: ["lp", "sy"],
    requiredPosition: "lp",
  },
  {
    id: "add_lp_keep_yt",
    product: "lp",
    side: "add_keep_yt",
    inputAssets: ["underlying", "sy"],
    outputAssets: ["lp", "yt"],
    requiredPosition: "lp",
  },
  {
    id: "remove_lp",
    product: "lp",
    side: "remove",
    inputAssets: ["lp"],
    outputAssets: ["sy", "pt"],
    requiredPosition: "lp",
  },
  {
    id: "remove_lp_to_sy",
    product: "lp",
    side: "remove",
    inputAssets: ["lp"],
    outputAssets: ["sy"],
    requiredPosition: "lp",
  },
];

function buildMarketTradeMetadata(
  entry: Pick<JitterMarketConfigEntry, "id" | "config" | "tradeReady">,
): JitterMarketTradeMetadata {
  const missingConfigKeys = getMissingTradeReadyConfigKeys(entry.config);
  const configReady = missingConfigKeys.length === 0;
  const disabledReason = resolveTradeDisabledReason({
    configReady,
    missingConfigKeys,
    registryTradeReady: entry.tradeReady,
  });
  const tradeReady = disabledReason === null;

  return {
    marketId: entry.id,
    adapterKind: resolveAdapterKind(entry.config),
    tradeReady,
    disabledReason,
    missingConfigKeys,
    actions: PRODUCT_LEVEL_TRADE_ACTIONS.map((action) => ({
      ...action,
      inputAssets: [...action.inputAssets],
      outputAssets: [...action.outputAssets],
      disabledReason,
    })),
  };
}

function resolveTradeDisabledReason(input: {
  configReady: boolean;
  missingConfigKeys: string[];
  registryTradeReady: boolean | undefined;
}): string | null {
  if (!input.configReady) {
    return `Missing trade config: ${input.missingConfigKeys.join(", ")}`;
  }
  if (input.registryTradeReady === false) {
    return "Trading disabled by SDK registry for this market.";
  }
  return null;
}

function resolveAdapterKind(
  config: JitterMarketConfig,
): JitterMarketTradeMetadata["adapterKind"] {
  if (config.scallopMarketVaultObjectId) return "scallop";
  if (config.emberMarketVaultObjectId) return "ember";
  if (config.suilendMarketVaultObjectId) return "suilend";
  if (config.naviMarketVaultObjectId) return "navi";
  return "demo";
}

export function isTradeReadyMarketConfig(config: JitterMarketConfig): boolean {
  return getMissingTradeReadyConfigKeys(config).length === 0;
}

export function getMissingTradeReadyConfigKeys(
  config: JitterMarketConfig,
): string[] {
  const missing = missingConfigKeys([
    ["jitterPackageId", config.jitterPackageId],
    ["oraclePackageId", config.oraclePackageId],
    ["syStateObjectId", config.syStateObjectId],
    ["aclObjectId", config.aclObjectId],
    ["rewardDistributorObjectId", config.rewardDistributorObjectId],
    ["marketObjectId", config.marketObjectId],
    ["pyStateObjectId", config.pyStateObjectId],
    ["poolObjectId", config.poolObjectId],
    ["priceAggregatorObjectId", config.priceAggregatorObjectId],
    ["underlyingTypeTag", config.underlyingTypeTag],
    ["syTypeTag", config.syTypeTag],
    ["ptTypeTag", config.ptTypeTag],
    ["ytTypeTag", config.ytTypeTag],
  ]);

  const hasCoreMarket =
    Boolean(config.jitterPackageId) &&
    Boolean(config.oraclePackageId) &&
    Boolean(config.syStateObjectId) &&
    Boolean(config.aclObjectId) &&
    Boolean(config.rewardDistributorObjectId) &&
    Boolean(config.marketObjectId) &&
    Boolean(config.pyStateObjectId) &&
    Boolean(config.poolObjectId) &&
    Boolean(config.priceAggregatorObjectId) &&
    Boolean(config.underlyingTypeTag) &&
    Boolean(config.syTypeTag) &&
    Boolean(config.ptTypeTag) &&
    Boolean(config.ytTypeTag);
  const hasDemoRoute = Boolean(config.demoMarketVaultObjectId);
  const hasScallopRoute =
    Boolean(config.scallopProtocolPackageId) &&
    Boolean(config.scallopMarketVaultObjectId) &&
    Boolean(config.scallopMarketObjectId) &&
    Boolean(config.scallopVersionObjectId);

  if (hasCoreMarket && (hasDemoRoute || hasScallopRoute)) return [];

  if (!hasDemoRoute && !hasScallopRoute) {
    missing.push(
      ...missingConfigKeys([
        ["demoMarketVaultObjectId", config.demoMarketVaultObjectId],
        ["scallopProtocolPackageId", config.scallopProtocolPackageId],
        ["scallopMarketVaultObjectId", config.scallopMarketVaultObjectId],
        ["scallopMarketObjectId", config.scallopMarketObjectId],
        ["scallopVersionObjectId", config.scallopVersionObjectId],
      ]),
    );
  }

  return Array.from(new Set(missing));
}

function missingConfigKeys(
  entries: Array<readonly [key: string, value: string | null | undefined]>,
): string[] {
  return entries.flatMap(([key, value]) => (value ? [] : [key]));
}

export function buildJitterMarketGroups(
  markets: readonly JitterMarketOverview[],
): JitterMarketGroupInfo[] {
  const groups = new Map<string, JitterMarketGroupInfo>();

  for (const market of markets) {
    const existing = groups.get(market.groupId);
    if (!existing) {
      groups.set(market.groupId, {
        id: market.groupId,
        name: market.symbol,
        protocol: market.protocol,
        icon: market.icon,
        marketsCount: 1,
        liquidity: market.liquidity,
        tvl: market.tvl,
        volume24h: market.volume24h,
        volume7d: market.volume7d,
        bestFixedApy: market.fixedApy,
        bestUnderlyingApy: market.underlyingApy,
        bestLongYieldApy: market.longYieldApy,
        bestYtLeverage: market.ytLeverage,
        categories: [...market.categories],
        searchText: `${market.symbol} ${market.protocol} ${market.groupId}`.toLowerCase(),
        markets: [market],
      });
      continue;
    }

    existing.marketsCount += 1;
    existing.liquidity += market.liquidity;
    existing.tvl += market.tvl;
    existing.volume24h += market.volume24h;
    existing.volume7d += market.volume7d;
    existing.bestFixedApy = Math.max(existing.bestFixedApy, market.fixedApy);
    existing.bestUnderlyingApy = Math.max(
      existing.bestUnderlyingApy,
      market.underlyingApy,
    );
    existing.bestLongYieldApy = Math.max(
      existing.bestLongYieldApy,
      market.longYieldApy,
    );
    existing.bestYtLeverage = Math.max(
      existing.bestYtLeverage,
      market.ytLeverage,
    );
    existing.categories = Array.from(
      new Set([...existing.categories, ...market.categories]),
    );
    existing.markets.push(market);
    existing.searchText = [
      existing.name,
      existing.protocol,
      existing.id,
      ...existing.categories,
    ]
      .join(" ")
      .toLowerCase();
  }

  return [...groups.values()].sort((a, b) => b.liquidity - a.liquidity);
}

export function buildJitterMarketCategoryFilters(
  markets: readonly JitterMarketOverview[],
): JitterMarketCategoryFilter[] {
  const filters = new Map<string, JitterMarketCategoryFilter>();

  for (const market of markets) {
    for (const category of market.categories) {
      if (filters.has(category)) continue;

      if (category.startsWith("protocol:")) {
        const protocol = category.slice("protocol:".length);
        filters.set(category, {
          id: category,
          name: formatCategoryProtocol(protocol),
        });
        continue;
      }

      if (category.startsWith("underlying:")) {
        const symbol = category.slice("underlying:".length).toUpperCase();
        filters.set(category, { id: category, name: symbol });
        continue;
      }

      if (category.startsWith("maturity:")) {
        const bucket = category.slice("maturity:".length);
        filters.set(category, {
          id: category,
          name: formatMaturityBucket(bucket),
        });
      }
    }
  }

  return [...filters.values()];
}

async function hydrateMarketOverview(
  options: CreateJitterMarketDataServiceOptions,
  entry: Pick<JitterMarketConfigEntry, "id" | "config" | "displaySnapshot">,
  serviceOptions: MarketDataServiceOptions & { tradeReady: boolean },
): Promise<JitterMarketOverview> {
  const { config } = entry;
  const marketId = entry.id;

  if (!serviceOptions.tradeReady && entry.displaySnapshot) {
    return hydrateDisplayMarketOverview(
      options,
      config,
      marketId,
      entry.displaySnapshot,
      serviceOptions,
    );
  }

  const [pool, pyState, volume, underlyingApy, analytics] = await Promise.all([
    options.chainReader.getPoolState(config),
    options.chainReader.getPyState(config),
    getPoolVolumeStats(options.chainReader, config),
    options.getUnderlyingApy?.(config) ?? 0,
    getMarketAnalyticsForOverview(options, marketId),
  ]);

  const overview = buildJitterMarketOverview({
    marketId,
    config,
    tradeReady: serviceOptions.tradeReady,
    pool,
    pyState,
    volume,
    underlyingApy,
    nowMs: serviceOptions.nowMs,
  });

  return analytics
    ? applyMarketAnalyticsSnapshot(overview, analytics, config, serviceOptions)
    : overview;
}

async function hydrateDisplayMarketOverview(
  options: CreateJitterMarketDataServiceOptions,
  config: JitterMarketConfig,
  marketId: string,
  snapshot: JitterMarketDisplaySnapshot,
  serviceOptions: MarketDataServiceOptions & { tradeReady: boolean },
): Promise<JitterMarketOverview> {
  const [underlyingApy, analytics] = await Promise.all([
    snapshot.underlyingApy ?? options.getUnderlyingApy?.(config) ?? 0,
    getMarketAnalyticsForOverview(options, marketId),
  ]);
  const overview = buildJitterMarketOverview({
    marketId,
    config,
    tradeReady: serviceOptions.tradeReady,
    pool: snapshot.pool,
    pyState: snapshot.pyState,
    volume: displaySnapshotVolumeToStats(snapshot.volume),
    underlyingApy,
    nowMs: serviceOptions.nowMs,
  });

  return analytics
    ? applyMarketAnalyticsSnapshot(overview, analytics, config, serviceOptions)
    : overview;
}

function displaySnapshotVolumeToStats(
  volume: JitterMarketDisplaySnapshot["volume"],
): MarketVolumeStats {
  return {
    volume24hSy: rawSnapshotAmountToBigInt(volume?.volume24hSy),
    volume7dSy: rawSnapshotAmountToBigInt(volume?.volume7dSy),
    totalFeesSy: rawSnapshotAmountToBigInt(volume?.totalFeesSy),
    swapCount24h: volume?.swapCount24h ?? 0,
    swapCount7d: volume?.swapCount7d ?? 0,
  };
}

function rawSnapshotAmountToBigInt(value: string | undefined): bigint {
  return value ? BigInt(value) : 0n;
}

async function getPoolVolumeStats(
  chainReader: JitterChainReader,
  config: JitterMarketConfig,
): Promise<MarketVolumeStats> {
  try {
    return (await chainReader.getPoolVolumeStats?.(config)) ?? EMPTY_POOL_VOLUME;
  } catch {
    return EMPTY_POOL_VOLUME;
  }
}

function getMarketAnalytics(
  options: CreateJitterMarketDataServiceOptions,
  marketId: string,
): Promise<MarketAnalyticsResult> {
  if (options.analyticsReader) {
    return options.analyticsReader.getMarketAnalytics({
      network: options.network,
      marketId,
    });
  }

  return Promise.resolve({
    marketId,
    source: "unavailable",
    tvl: unavailableAmount(),
    liquidity: unavailableAmount(),
    volume24h: unavailableAmount(),
    volume7d: unavailableAmount(),
    impliedApy: null,
    underlyingApy: null,
    underlyingApySource: "unavailable",
    underlyingApyUpdatedAtMs: null,
    lpApy: null,
    lpApySource: "unavailable",
    lpApyFormulaVersion: null,
    updatedAtMs: null,
  });
}

function unavailableAmount() {
  return { raw: "0", usd: null, usdSource: "unavailable" as const };
}

async function getMarketAnalyticsForOverview(
  options: CreateJitterMarketDataServiceOptions,
  marketId: string,
): Promise<MarketAnalyticsResult | null> {
  if (!options.analyticsReader) return null;

  try {
    const analytics = await options.analyticsReader.getMarketAnalytics({
      network: options.network,
      marketId,
    });
    return analytics.source === "unavailable" ? null : analytics;
  } catch {
    return null;
  }
}

function applyMarketAnalyticsSnapshot(
  overview: JitterMarketOverview,
  analytics: MarketAnalyticsResult,
  config: JitterMarketConfig,
  options: MarketDataServiceOptions,
): JitterMarketOverview {
  const decimals = getMarketAccountingDecimals(config);
  const fixedApy = parseAnalyticsRate(analytics.impliedApy) ?? overview.fixedApy;
  const nowMs = options.nowMs ?? Date.now();
  const yearsToMaturity = Math.max(overview.maturityTimestamp * 1000 - nowMs, 0) /
    (365 * 24 * 60 * 60 * 1000);
  const underlyingPrice =
    amountSnapshotUnitUsd(analytics.liquidity, decimals) ??
    amountSnapshotUnitUsd(analytics.tvl, decimals) ??
    overview.underlyingPrice;
  const ptUsdValue = quotePtPriceFromImpliedApy(
    underlyingPrice,
    fixedApy,
    yearsToMaturity,
  );
  const ytAssetPrice = Math.max(underlyingPrice - ptUsdValue, 0);
  const underlyingApy =
    parseAnalyticsRate(analytics.underlyingApy) ?? overview.underlyingApy;
  const longYieldApy = Math.max(underlyingApy - fixedApy, 0);
  const ytLeverage = quoteYtLeverage(
    underlyingPrice,
    ytAssetPrice,
    underlyingApy,
  );
  const lpApy = parseAnalyticsRate(analytics.lpApy) ?? overview.lpApy;
  const ptWeight = overview.lpBreakdown.ptWeight;
  const syWeight = overview.lpBreakdown.syWeight;

  return {
    ...overview,
    tvl: amountSnapshotToNumber(analytics.tvl, decimals) ?? overview.tvl,
    liquidity:
      amountSnapshotToNumber(analytics.liquidity, decimals) ??
      overview.liquidity,
    volume24h:
      amountSnapshotToNumber(analytics.volume24h, decimals) ??
      overview.volume24h,
    volume7d:
      amountSnapshotToNumber(analytics.volume7d, decimals) ??
      overview.volume7d,
    fixedApy,
    ptRoi: fixedApy,
    ptUsdValue,
    underlyingPrice,
    underlyingApy,
    totalUnderlyingApy: underlyingApy,
    longYieldApy,
    ytLeverage,
    ytRoi: longYieldApy,
    ytAssetPrice,
    lpApy,
    lpBreakdown: {
      ...overview.lpBreakdown,
      scaledImpliedApy: fixedApy * ptWeight,
      scaledSyInterestApy: underlyingApy * syWeight,
    },
    baseYield: {
      ...overview.baseYield,
      apy: underlyingApy,
    },
    underlyingInterestApy: underlyingApy,
    analytics: buildMarketAnalyticsState(analytics, options),
  };
}

function buildMarketAnalyticsState(
  analytics: MarketAnalyticsResult,
  options: MarketDataServiceOptions,
): JitterMarketOverview["analytics"] {
  const staleAfterMs =
    options.analyticsFreshnessMs ?? DEFAULT_ANALYTICS_FRESHNESS_MS;
  const updatedAtMs = parseAnalyticsTimestamp(analytics.updatedAtMs);
  const nowMs = options.nowMs ?? Date.now();

  return {
    source: analytics.source,
    updatedAtMs,
    isStale:
      updatedAtMs === null ? true : nowMs - updatedAtMs > staleAfterMs,
    staleAfterMs,
    underlyingApySource: analytics.underlyingApySource,
    underlyingApyUpdatedAtMs: parseAnalyticsTimestamp(
      analytics.underlyingApyUpdatedAtMs,
    ),
    lpApySource: analytics.lpApySource,
    lpApyFormulaVersion: analytics.lpApyFormulaVersion,
  };
}

function amountSnapshotToNumber(
  amount: MarketAnalyticsResult["tvl"],
  decimals: number,
): number | null {
  if (amount.usd !== null) return parseFiniteNumber(amount.usd);
  try {
    const value = toDecimalUnits(amount.raw, decimals);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function amountSnapshotUnitUsd(
  amount: MarketAnalyticsResult["tvl"],
  decimals: number,
): number | null {
  if (amount.usd === null) return null;
  const usd = parseFiniteNumber(amount.usd);
  if (usd === null || usd <= 0) return null;
  const rawUnits = amountSnapshotRawUnits(amount.raw, decimals);
  if (rawUnits === null || rawUnits <= 0) return null;
  return usd / rawUnits;
}

function amountSnapshotRawUnits(raw: string, decimals: number): number | null {
  try {
    const value = toDecimalUnits(raw, decimals);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
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

function parseAnalyticsRate(value: string | null): number | null {
  if (value === null) return null;
  const parsed = parseFiniteNumber(value);
  if (parsed === null) return null;

  const trimmed = value.trim();
  if (/^-?\d+$/.test(trimmed)) {
    const raw = BigInt(trimmed);
    const fixed64Threshold = 1_000_000_000_000n;
    if (raw > fixed64Threshold || raw < -fixed64Threshold) {
      return Math.exp(Number(raw) / Number(FP64_ONE)) - 1;
    }
  }

  return parsed;
}

function parseFiniteNumber(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseAnalyticsTimestamp(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveMarketId(
  options: CreateJitterMarketDataServiceOptions,
  config: JitterMarketConfig,
): string {
  return (
    options.configProvider
      .listMarketConfigEntries(options.network)
      .find(
        (entry) =>
          entry.config.poolObjectId === config.poolObjectId ||
          entry.config.marketObjectId === config.marketObjectId,
      )?.id ?? config.marketObjectId
  );
}

function formatCategoryProtocol(protocol: string): string {
  if (protocol === "scallop") return "Scallop";
  if (protocol === "jitter") return "Jitter";
  return protocol
    ? `${protocol[0]?.toUpperCase() ?? ""}${protocol.slice(1)}`
    : "Protocol";
}

function formatMaturityBucket(bucket: string): string {
  if (bucket === "near") return "Near Expiry";
  if (bucket === "mid") return "Mid Term";
  if (bucket === "far") return "Far Term";
  return "Matured";
}
