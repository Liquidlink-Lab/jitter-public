import type { JitterConfigNetworkInput } from "../config.js";

export type AnalyticsDataSource =
  | "redis"
  | "indexer"
  | "external"
  | "contract"
  | "metadata"
  | "mixed"
  | "unavailable";
export type AnalyticsRange = "1h" | "4h" | "24h" | "7d" | "30d" | "90d";
export type AnalyticsChartProduct = "pt" | "yt" | "lp";
export type AnalyticsOrderbookAsset = "pt" | "yt";

export type MarketAnalyticsQuery = {
  network: JitterConfigNetworkInput;
  marketId: string;
};

export type AnalyticsAmount = {
  raw: string;
  usd: string | null;
  usdSource: AnalyticsDataSource;
};

export type MarketAnalyticsResult = {
  marketId: string;
  source: AnalyticsDataSource;
  tvl: AnalyticsAmount;
  liquidity: AnalyticsAmount;
  volume24h: AnalyticsAmount;
  volume7d: AnalyticsAmount;
  impliedApy: string | null;
  underlyingApy: string | null;
  underlyingApySource: AnalyticsDataSource;
  underlyingApyUpdatedAtMs: string | null;
  lpApy: string | null;
  lpApySource: AnalyticsDataSource;
  lpApyFormulaVersion: string | null;
  updatedAtMs: string | null;
};

export type MarketChartQuery = MarketAnalyticsQuery & {
  range: AnalyticsRange;
  product?: AnalyticsChartProduct;
  series?: Array<"implied_apy" | "underlying_apy" | "volume">;
};

export type MarketChartPoint = {
  timestampMs: string;
  impliedApy: string | null;
  underlyingApy: string | null;
  volume: string | null;
};

export type MarketChartSeries = {
  marketId: string;
  range: AnalyticsRange;
  source: AnalyticsDataSource;
  series: MarketChartPoint[];
};

export type MarketActivityQuery = MarketAnalyticsQuery & {
  limit?: number;
  cursor?: string | null;
  actor?: string;
  action?: string;
};

export type MarketActivityItem = {
  id: string;
  transactionDigest: string;
  timestampMs: string;
  actor: string | null;
  action: string;
  asset: AnalyticsOrderbookAsset | "sy" | "lp" | "reward" | null;
  syAmount: string | null;
  ptAmount: string | null;
  ytAmount: string | null;
  lpAmount: string | null;
  sourceEventType: string;
};

export type MarketActivityPage = {
  marketId: string;
  source: AnalyticsDataSource;
  items: MarketActivityItem[];
  nextCursor: string | null;
};

export type OrderbookLadderQuery = MarketAnalyticsQuery & {
  asset: AnalyticsOrderbookAsset;
  bucket?: "raw" | "bps";
};

export type OrderbookLadderLevel = {
  priceRaw: string;
  sizePt: string;
  totalSy: string;
  orderCount: number;
};

export type OrderbookLadderResult = {
  marketId: string;
  asset: AnalyticsOrderbookAsset;
  source: AnalyticsDataSource;
  routeSupported: boolean;
  bids: OrderbookLadderLevel[];
  asks: OrderbookLadderLevel[];
  bestBid: string | null;
  bestAsk: string | null;
  midPriceRaw: string | null;
  spreadRaw: string | null;
  updatedAtMs: string | null;
};

export type RewardSummaryQuery = {
  network: JitterConfigNetworkInput;
  projectId: string;
  userAddress: string;
};

export type RewardSummaryResult = {
  projectId: string;
  userAddress: string;
  source: AnalyticsDataSource;
  onChainPoints: string;
  offChainXp: string | null;
  rank: number | null;
  updatedAtMs: string | null;
};

export type RewardLeaderboardQuery = {
  network: JitterConfigNetworkInput;
  projectId: string;
  limit?: number;
};

export type RewardLeaderboardRow = {
  rank: number;
  userAddress: string;
  onChainPoints: string;
  offChainXp: string | null;
  updatedAtMs: string | null;
};

export type RewardLeaderboardResult = {
  projectId: string;
  source: AnalyticsDataSource;
  rows: RewardLeaderboardRow[];
  updatedAtMs: string | null;
};

export interface JitterAnalyticsReader {
  getMarketAnalytics(query: MarketAnalyticsQuery): Promise<MarketAnalyticsResult>;
  getMarketChart(query: MarketChartQuery): Promise<MarketChartSeries>;
  getMarketActivity(query: MarketActivityQuery): Promise<MarketActivityPage>;
  getOrderbookLadder(query: OrderbookLadderQuery): Promise<OrderbookLadderResult>;
  getRewardSummary(query: RewardSummaryQuery): Promise<RewardSummaryResult>;
  getRewardLeaderboard(query: RewardLeaderboardQuery): Promise<RewardLeaderboardResult>;
}
