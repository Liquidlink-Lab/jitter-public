import { normalizeMoveNumeric } from "../domain/amounts.js";
import type {
  JitterAnalyticsReader,
  MarketActivityPage,
} from "../ports/analytics-reader.js";
import type { JitterChainReader } from "../ports/chain-reader.js";
import type {
  JitterMarketConfig,
  JitterPositionFields,
  LpPositionFields,
  MoveNumericField,
  PyPositionFields,
} from "../types.js";
import type {
  JitterOrderbookService,
  OrderbookOrder,
} from "./orderbook-service.js";

export type JitterCoinBalance = {
  objectId: string;
  balance: bigint;
};

export type JitterUserPortfolio = {
  pyPositions: PyPositionFields[];
  lpPositions: LpPositionFields[];
  underlyingCoins: JitterCoinBalance[];
  syCoins: JitterCoinBalance[];
  totalUnderlyingBalance: bigint;
  totalSyBalance: bigint;
  orders: OrderbookOrder[];
};

export type CreateJitterAccountServiceOptions = {
  config: JitterMarketConfig;
  chainReader: JitterChainReader;
  orderbookService?: JitterOrderbookService;
  network?: import("../config.js").JitterConfigNetworkInput;
  marketId?: string;
  analyticsReader?: JitterAnalyticsReader;
};

export type JitterAccountService = {
  getUserPyPositions(owner: string): Promise<PyPositionFields[]>;
  getUserLpPositions(owner: string): Promise<LpPositionFields[]>;
  getUserCoins(owner: string, coinTypeTag: string): Promise<JitterCoinBalance[]>;
  getUserUnderlyingCoins(owner: string): Promise<JitterCoinBalance[]>;
  getUserSyCoins(owner: string): Promise<JitterCoinBalance[]>;
  getPortfolio(owner: string): Promise<JitterUserPortfolio>;
  getTransactionHistory(owner: string, limit?: number): Promise<MarketActivityPage>;
};

type CoinObjectLike = {
  objectId?: string;
  id?: string | { id?: string };
  balance?: MoveNumericField;
};

export function createJitterAccountService(
  options: CreateJitterAccountServiceOptions,
): JitterAccountService {
  return {
    async getUserPyPositions(owner: string): Promise<PyPositionFields[]> {
      const positions = await getUnifiedPositions(options, owner);
      return positions
        .map((position) => normalizePyPosition(position))
        .filter((position) => position.py_state_id === options.config.pyStateObjectId);
    },

    async getUserLpPositions(owner: string): Promise<LpPositionFields[]> {
      const positions = await getUnifiedPositions(options, owner);
      return positions
        .map((position) => normalizeLpPosition(position))
        .filter((position) => position.pool_id === options.config.poolObjectId);
    },

    getUserCoins(owner: string, coinTypeTag: string): Promise<JitterCoinBalance[]> {
      return getCoins(options, owner, coinTypeTag);
    },

    getUserUnderlyingCoins(owner: string): Promise<JitterCoinBalance[]> {
      return getCoins(options, owner, options.config.underlyingTypeTag);
    },

    getUserSyCoins(owner: string): Promise<JitterCoinBalance[]> {
      return getCoins(options, owner, options.config.syTypeTag);
    },

    async getPortfolio(owner: string): Promise<JitterUserPortfolio> {
      const [
        pyPositions,
        lpPositions,
        underlyingCoins,
        syCoins,
        orders,
      ] = await Promise.all([
        this.getUserPyPositions(owner),
        this.getUserLpPositions(owner),
        this.getUserUnderlyingCoins(owner),
        this.getUserSyCoins(owner),
        options.orderbookService?.getAllOrderbookOrders(owner) ?? [],
      ]);

      return {
        pyPositions,
        lpPositions,
        underlyingCoins,
        syCoins,
        totalUnderlyingBalance: sumCoinBalances(underlyingCoins),
        totalSyBalance: sumCoinBalances(syCoins),
        orders,
      };
    },

    getTransactionHistory(owner: string, limit = 50): Promise<MarketActivityPage> {
      return getTransactionHistory(options, owner, limit);
    },
  };
}

async function getTransactionHistory(
  options: CreateJitterAccountServiceOptions,
  owner: string,
  limit: number,
): Promise<MarketActivityPage> {
  const marketId = options.marketId ?? options.config.marketObjectId;
  if (options.analyticsReader) {
    return options.analyticsReader.getMarketActivity({
      network: options.network ?? "testnet",
      marketId,
      actor: owner,
      limit,
    });
  }

  return {
    marketId,
    source: "unavailable",
    items: [],
    nextCursor: null,
  };
}

async function getUnifiedPositions(
  options: CreateJitterAccountServiceOptions,
  owner: string,
): Promise<JitterPositionFields[]> {
  return options.chainReader.getOwnedObjects<JitterPositionFields>({
    owner,
    structType: `${options.config.jitterPackageId}::jitter_position::JitterPosition`,
  });
}

async function getCoins(
  options: CreateJitterAccountServiceOptions,
  owner: string,
  coinTypeTag: string,
): Promise<JitterCoinBalance[]> {
  const coins = await options.chainReader.getOwnedObjects<CoinObjectLike>({
    owner,
    structType: `0x2::coin::Coin<${coinTypeTag}>`,
  });

  return coins.map((coin) => ({
    objectId: readObjectId(coin),
    balance: coin.balance === undefined ? 0n : normalizeMoveNumeric(coin.balance),
  }));
}

function normalizePyPosition(position: JitterPositionFields): PyPositionFields {
  const raw = position as unknown as Record<string, unknown>;
  const py = readRawField(raw.py);
  return {
    id: normalizeMoveObjectId(raw.id),
    pt_balance: normalizeMoveScalar(py.pt_balance ?? raw.pt_balance),
    yt_balance: normalizeMoveScalar(py.yt_balance ?? raw.yt_balance),
    index: normalizeMoveScalar(py.index ?? raw.index),
    py_index: normalizeMoveScalar(py.py_index ?? raw.py_index),
    accrued: normalizeMoveScalar(py.accrued ?? raw.accrued),
    py_state_id: normalizeMoveIdValue(raw.py_state_id),
    market_id: normalizeMoveIdValue(raw.market_id),
    expiry: normalizeMoveScalar(raw.expiry),
    created_at: normalizeMoveScalar(raw.created_at),
  };
}

function normalizeLpPosition(position: JitterPositionFields): LpPositionFields {
  const raw = position as unknown as Record<string, unknown>;
  const lp = readRawField(raw.lp);
  return {
    id: normalizeMoveObjectId(raw.id),
    lp_amount: normalizeMoveScalar(lp.lp_amount ?? raw.lp_amount),
    pool_id: normalizeMoveIdValue(lp.pool_id ?? raw.pool_id),
    expiry: normalizeMoveScalar(raw.expiry),
    created_at: normalizeMoveScalar(raw.created_at),
  };
}

function normalizeMoveObjectId(id: unknown): { id: string } {
  if (typeof id === "string" && id.length > 0) return { id };
  if (id && typeof id === "object" && "id" in id) {
    const nestedId = (id as { id?: unknown }).id;
    if (typeof nestedId === "string") return { id: nestedId };
  }
  return { id: "" };
}

function normalizeMoveIdValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) {
    const nestedId = (value as { id?: unknown }).id;
    if (typeof nestedId === "string") return nestedId;
  }
  return value == null ? "" : String(value);
}

function normalizeMoveScalar(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") return value.toString();
  if (value && typeof value === "object" && "value" in value) {
    const rawValue = (value as { value?: unknown }).value;
    return rawValue == null ? "0" : String(rawValue);
  }
  return value == null ? "0" : String(value);
}

function readRawField(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && "fields" in value) {
    const fields = (value as { fields?: unknown }).fields;
    return fields && typeof fields === "object"
      ? (fields as Record<string, unknown>)
      : {};
  }
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readObjectId(object: CoinObjectLike): string {
  if (object.objectId) return object.objectId;
  if (typeof object.id === "string") return object.id;
  return object.id?.id ?? "";
}

function sumCoinBalances(coins: readonly JitterCoinBalance[]): bigint {
  return coins.reduce((sum, coin) => sum + coin.balance, 0n);
}
