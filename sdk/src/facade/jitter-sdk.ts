import { SdkJitterMarketConfigProvider } from "../infrastructure/sdk-config-provider.js";
import { getJitterAdapterManifest } from "../adapters/registry.js";
import type { JitterAdapterManifest } from "../adapters/types.js";
import { SuiJitterChainReader } from "../infrastructure/sui-chain-reader.js";
import type { JitterChainReader } from "../ports/chain-reader.js";
import type { JitterAnalyticsReader } from "../ports/analytics-reader.js";
import type { JitterMarketConfigProvider } from "../ports/config-provider.js";
import type { GrpcNetworkKind } from "../rpc.js";
import {
  createJitterAccountService,
  type JitterAccountService,
} from "../services/account-service.js";
import {
  createJitterMarketDataService,
  type JitterMarketDataService,
} from "../services/market-data-service.js";
import {
  createJitterOrderbookService,
  type JitterOrderbookService,
} from "../services/orderbook-service.js";
import {
  createJitterQuoteService,
  type JitterQuoteService,
} from "../services/quote-service.js";
import {
  createJitterTradeService,
  type JitterTradeService,
} from "../services/trade-service.js";
import {
  createJitterTransactionService,
  type JitterTransactionService,
} from "../services/transaction-service.js";
import type { JitterMarketConfig } from "../types.js";

export type CreateJitterSdkOptions = {
  network: GrpcNetworkKind;
  configProvider?: JitterMarketConfigProvider;
  chainReader?: JitterChainReader;
  analyticsReader?: JitterAnalyticsReader;
  getUnderlyingApy?: (
    config: JitterMarketConfig,
  ) => number | Promise<number>;
  resolveSyIndex?: (
    config: JitterMarketConfig,
  ) => bigint | Promise<bigint>;
};

export type JitterMarketSdk = {
  adapter: JitterAdapterManifest;
  accounts: JitterAccountService;
  orderbooks: JitterOrderbookService;
  quotes: JitterQuoteService;
  trades: JitterTradeService;
  transactions: JitterTransactionService;
};

export type JitterSdk = {
  network: GrpcNetworkKind;
  markets: JitterMarketDataService;
  forMarket(config: JitterMarketConfig): JitterMarketSdk;
};

export function createJitterSdk(options: CreateJitterSdkOptions): JitterSdk {
  const configProvider =
    options.configProvider ?? new SdkJitterMarketConfigProvider();
  const chainReader =
    options.chainReader ?? new SuiJitterChainReader(options.network);
  const markets = createJitterMarketDataService({
    network: options.network,
    configProvider,
    chainReader,
    analyticsReader: options.analyticsReader,
    getUnderlyingApy: options.getUnderlyingApy,
  });

  return {
    network: options.network,
    markets,
    forMarket(config: JitterMarketConfig): JitterMarketSdk {
      const adapter = getJitterAdapterManifest(config);
      const marketId = resolveMarketId(configProvider, options.network, config);
      const orderbooks = createJitterOrderbookService({
        config,
        chainReader,
        network: options.network,
        marketId,
        analyticsReader: options.analyticsReader,
      });
      const quotes = createJitterQuoteService({
        network: options.network,
        config,
        chainReader,
        delegates: options.resolveSyIndex
          ? { resolveSyIndex: () => options.resolveSyIndex?.(config) ?? 0n }
          : undefined,
      });
      const transactions = createJitterTransactionService({
        config,
        adapter,
        resolveSyIndex: options.resolveSyIndex
          ? () => options.resolveSyIndex?.(config) ?? 0n
          : undefined,
      });
      return {
        adapter,
        orderbooks,
        accounts: createJitterAccountService({
          config,
          chainReader,
          orderbookService: orderbooks,
          network: options.network,
          marketId,
          analyticsReader: options.analyticsReader,
        }),
        quotes,
        trades: createJitterTradeService({
          marketId,
          config,
          network: options.network,
          metadata: markets.getMarketTradeMetadata(marketId),
          quoteService: quotes,
          transactionService: transactions,
        }),
        transactions,
      };
    },
  };
}

function resolveMarketId(
  configProvider: JitterMarketConfigProvider,
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
): string {
  const entry = configProvider
    .listMarketConfigEntries(network)
    .find((candidate) => candidate.config.poolObjectId === config.poolObjectId);
  return entry?.id ?? config.marketObjectId;
}
