import type {
  JitterAnalyticsReader,
  MarketActivityPage,
  MarketActivityQuery,
  MarketAnalyticsQuery,
  MarketAnalyticsResult,
  MarketChartQuery,
  MarketChartSeries,
  OrderbookLadderQuery,
  OrderbookLadderResult,
  RewardLeaderboardQuery,
  RewardLeaderboardResult,
  RewardSummaryQuery,
  RewardSummaryResult,
} from "../ports/analytics-reader.js";

type AnalyticsFetch = (
  input: string,
  init?: { method?: string; headers?: Record<string, string> },
) => Promise<Response>;

export type HttpJitterAnalyticsReaderOptions = {
  baseUrl: string;
  fetch?: AnalyticsFetch;
};

export class HttpJitterAnalyticsReader implements JitterAnalyticsReader {
  private readonly baseUrl: string;
  private readonly fetcher: AnalyticsFetch;

  constructor(options: HttpJitterAnalyticsReaderOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetcher = options.fetch ?? fetch;
  }

  getMarketAnalytics(query: MarketAnalyticsQuery): Promise<MarketAnalyticsResult> {
    return this.getJson<MarketAnalyticsResult>(
      `/v1/markets/${encodeURIComponent(query.marketId)}/analytics`,
      { network: query.network },
    );
  }

  getMarketChart(query: MarketChartQuery): Promise<MarketChartSeries> {
    return this.getJson<MarketChartSeries>(
      `/v1/markets/${encodeURIComponent(query.marketId)}/chart`,
      {
        network: query.network,
        range: query.range,
        product: query.product,
        series: query.series?.join(","),
      },
    );
  }

  getMarketActivity(query: MarketActivityQuery): Promise<MarketActivityPage> {
    return this.getJson<MarketActivityPage>(
      `/v1/markets/${encodeURIComponent(query.marketId)}/activity`,
      {
        network: query.network,
        limit: query.limit,
        cursor: query.cursor ?? undefined,
        actor: query.actor,
        action: query.action,
      },
    );
  }

  getOrderbookLadder(query: OrderbookLadderQuery): Promise<OrderbookLadderResult> {
    return this.getJson<OrderbookLadderResult>(
      `/v1/markets/${encodeURIComponent(query.marketId)}/orderbook`,
      {
        network: query.network,
        asset: query.asset,
        bucket: query.bucket,
      },
    );
  }

  getRewardSummary(query: RewardSummaryQuery): Promise<RewardSummaryResult> {
    return this.getJson<RewardSummaryResult>(
      `/v1/rewards/${encodeURIComponent(query.projectId)}/users/${encodeURIComponent(query.userAddress)}`,
      { network: query.network },
    );
  }

  getRewardLeaderboard(query: RewardLeaderboardQuery): Promise<RewardLeaderboardResult> {
    return this.getJson<RewardLeaderboardResult>(
      `/v1/rewards/${encodeURIComponent(query.projectId)}/leaderboard`,
      { network: query.network, limit: query.limit },
    );
  }

  private async getJson<T>(
    path: string,
    query: Record<string, string | number | undefined>,
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      url.searchParams.set(key, String(value));
    }

    const response = await this.fetcher(url.toString(), {
      method: "GET",
      headers: { "accept": "application/json" },
    });
    if (!response.ok) {
      throw new Error(
        `Jitter analytics request failed: ${response.status} ${response.statusText}`,
      );
    }
    return (await response.json()) as T;
  }
}
