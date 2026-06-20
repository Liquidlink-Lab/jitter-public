import type {
  JitterAnalyticsReader,
  OrderbookLadderLevel,
  OrderbookLadderResult,
} from "../ports/analytics-reader.js";
import type { JitterChainReader } from "../ports/chain-reader.js";
import type {
  JitterMarketConfig,
  MoveNumericField,
} from "../types.js";
import { normalizeMoveNumeric } from "../domain/amounts.js";
import type {
  OrderbookAsset,
  OrderbookOrder,
  OrderbookSide,
} from "../queries.js";

export type { OrderbookAsset, OrderbookOrder, OrderbookSide } from "../queries.js";

export type CreateJitterOrderbookServiceOptions = {
  config: JitterMarketConfig;
  chainReader: JitterChainReader;
  network?: import("../config.js").JitterConfigNetworkInput;
  marketId?: string;
  analyticsReader?: JitterAnalyticsReader;
};

export type JitterOrderbookService = {
  getOrderbookOrders(
    owner?: string,
    asset?: OrderbookAsset,
  ): Promise<OrderbookOrder[]>;
  getAllOrderbookOrders(owner?: string): Promise<OrderbookOrder[]>;
  getLadder(asset?: OrderbookAsset): Promise<OrderbookLadderResult>;
};

type OrderbookOrderLike = Partial<OrderbookOrder> & {
  id?: string | { id?: string };
  fields?: Partial<OrderbookOrder>;
  price_raw?: MoveNumericField;
  remaining_pt?: MoveNumericField;
  escrow_sy?: MoveNumericField;
  escrow_pt?: MoveNumericField;
  claimable_sy?: MoveNumericField;
  claimable_pt?: MoveNumericField;
  created_at?: MoveNumericField;
  expiry_ms?: MoveNumericField;
};

export function createJitterOrderbookService(
  options: CreateJitterOrderbookServiceOptions,
): JitterOrderbookService {
  return {
    async getOrderbookOrders(
      owner?: string,
      asset: OrderbookAsset = "pt",
    ): Promise<OrderbookOrder[]> {
      const orderbookObjectId = getOrderbookObjectId(options.config, asset);
      if (!orderbookObjectId) return [];

      const rawOrders = await options.chainReader.getDynamicFieldObjects<
        OrderbookOrderLike
      >({ parentId: orderbookObjectId });
      const orders = rawOrders.map((order) => normalizeOrderbookOrder(order, asset));
      if (!owner) return orders;

      const normalizedOwner = owner.toLowerCase();
      return orders.filter(
        (order) => order.owner.toLowerCase() === normalizedOwner,
      );
    },

    async getAllOrderbookOrders(owner?: string): Promise<OrderbookOrder[]> {
      const [ptOrders, ytOrders] = await Promise.all([
        this.getOrderbookOrders(owner, "pt"),
        this.getOrderbookOrders(owner, "yt"),
      ]);
      return [...ptOrders, ...ytOrders];
    },

    async getLadder(asset: OrderbookAsset = "pt"): Promise<OrderbookLadderResult> {
      const marketId = options.marketId ?? options.config.marketObjectId;
      if (options.analyticsReader) {
        return options.analyticsReader.getOrderbookLadder({
          network: options.network ?? "testnet",
          marketId,
          asset,
        });
      }

      const orders = await this.getOrderbookOrders(undefined, asset);
      return buildLocalLadder(marketId, asset, orders);
    },
  };
}

function getOrderbookObjectId(
  config: JitterMarketConfig,
  asset: OrderbookAsset,
): string | null | undefined {
  return asset === "yt" ? config.ytOrderbookObjectId : config.orderbookObjectId;
}

function buildLocalLadder(
  marketId: string,
  asset: OrderbookAsset,
  orders: readonly OrderbookOrder[],
): OrderbookLadderResult {
  const bids = buildLevels(orders.filter((order) => order.side === "bid"), true);
  const asks = buildLevels(orders.filter((order) => order.side === "ask"), false);
  const bestBid = bids[0]?.priceRaw ?? null;
  const bestAsk = asks[0]?.priceRaw ?? null;

  return {
    marketId,
    asset,
    source: "contract",
    routeSupported: asset === "pt",
    bids,
    asks,
    bestBid,
    bestAsk,
    midPriceRaw: calculateMidPrice(bestBid, bestAsk),
    spreadRaw: calculateSpread(bestBid, bestAsk),
    updatedAtMs: null,
  };
}

function buildLevels(
  orders: readonly OrderbookOrder[],
  descending: boolean,
): OrderbookLadderLevel[] {
  const levels = new Map<string, { sizePt: bigint; totalSy: bigint; orderCount: number }>();
  for (const order of orders) {
    const existing = levels.get(order.priceRaw) ?? {
      sizePt: 0n,
      totalSy: 0n,
      orderCount: 0,
    };
    existing.sizePt += BigInt(order.remainingPt || "0");
    existing.totalSy += BigInt(order.escrowSy || "0");
    existing.orderCount += 1;
    levels.set(order.priceRaw, existing);
  }

  return [...levels.entries()]
    .sort(([left], [right]) =>
      descending ? compareNumericDesc(left, right) : compareNumericAsc(left, right),
    )
    .map(([priceRaw, level]) => ({
      priceRaw,
      sizePt: level.sizePt.toString(),
      totalSy: level.totalSy.toString(),
      orderCount: level.orderCount,
    }));
}

function compareNumericAsc(left: string, right: string): number {
  const leftValue = BigInt(left || "0");
  const rightValue = BigInt(right || "0");
  if (leftValue < rightValue) return -1;
  if (leftValue > rightValue) return 1;
  return 0;
}

function compareNumericDesc(left: string, right: string): number {
  return compareNumericAsc(right, left);
}

function calculateMidPrice(bestBid: string | null, bestAsk: string | null): string | null {
  if (!bestBid || !bestAsk) return null;
  return ((BigInt(bestBid) + BigInt(bestAsk)) / 2n).toString();
}

function calculateSpread(bestBid: string | null, bestAsk: string | null): string | null {
  if (!bestBid || !bestAsk) return null;
  return (BigInt(bestAsk) - BigInt(bestBid)).toString();
}

function normalizeOrderbookOrder(
  raw: OrderbookOrderLike,
  asset: OrderbookAsset,
): OrderbookOrder {
  const fields = raw.fields ?? raw;
  return {
    id: readId(fields.id) || readId(raw.id),
    asset,
    owner: stringField(fields.owner),
    side: normalizeSide(fields.side),
    priceRaw: numericString(fields.priceRaw ?? raw.price_raw),
    remainingPt: numericString(fields.remainingPt ?? raw.remaining_pt),
    escrowSy: numericString(fields.escrowSy ?? raw.escrow_sy),
    escrowPt: numericString(fields.escrowPt ?? raw.escrow_pt),
    claimableSy: numericString(fields.claimableSy ?? raw.claimable_sy),
    claimablePt: numericString(fields.claimablePt ?? raw.claimable_pt),
    createdAt: numericString(fields.createdAt ?? raw.created_at),
    expiryMs: numericString(fields.expiryMs ?? raw.expiry_ms),
  };
}

function readId(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    return typeof id === "string" ? id : "";
  }
  return "";
}

function stringField(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function numericString(value: MoveNumericField | undefined): string {
  if (value === undefined) return "0";
  return normalizeMoveNumeric(value).toString();
}

function normalizeSide(value: unknown): OrderbookSide {
  return value === "ask" ? "ask" : "bid";
}
