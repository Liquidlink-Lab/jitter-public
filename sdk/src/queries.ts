/**
 * @jitter/sdk — queries.ts
 *
 * Read-only helpers for fetching on-chain Jitter state.
 */

import {
  getSuiClient,
  getSuiGrpcClient,
  grpcRequest,
  type GrpcNetworkKind,
} from "./rpc.js";
import { FP64_ONE } from "./constants.js";
import type {
  DemoMarketVaultFields,
  JitterPositionFields,
  JitterMarketConfig,
  LpPositionFields,
  MoveNumericField,
  PoolFields,
  PyPositionFields,
  PyStateFields,
} from "./types.js";

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

export type PoolCreatedEvent = {
  pool_id: string;
  py_state_id: string;
  expiry: string;
};

export type MarketCreatedEvent = {
  market_id: string;
  expiry: string;
  created_by: string;
  sy_type: { name: string } | string;
  pt_type: { name: string } | string;
  yt_type: { name: string } | string;
};

export type PyStateCreatedEvent = {
  state_id: string;
  market_id: string;
  expiry: string;
};

export type SwapEvent = {
  pool_id: string;
  is_pt_to_sy: boolean;
  amount_in: string;
  amount_out: string;
  fee: string;
  trader: string;
};

export type RouterSwapYtEvent = {
  user: string;
  sy_amount_in: string;
  yt_amount_out: string;
  sy_amount_out: string;
};

export type RouterSwapYtForSyEvent = {
  user: string;
  yt_amount_in: string;
  sy_amount_out: string;
  sy_amount_repaid: string;
};

export type AddLiquidityEvent = {
  pool_id: string;
  position_id: string;
  sy_amount: string;
  pt_amount: string;
  lp_amount: string;
};

export type RemoveLiquidityEvent = {
  pool_id: string;
  position_id: string;
  sy_amount: string;
  pt_amount: string;
  lp_amount: string;
  provider: string;
};

export type PoolActivityKind = "swap" | "add_liquidity" | "remove_liquidity";

export type PoolActivityEntry = {
  kind: PoolActivityKind;
  poolId: string;
  timestampMs: number;
  digest: string;
  sender: string;
  // swap fields
  swapAsset?: "pt" | "yt";
  isPtToSy?: boolean;
  amountIn?: string;
  amountOut?: string;
  fee?: string;
  syAmountOut?: string;
  syAmountRepaid?: string;
  // liquidity fields
  positionId?: string;
  syAmount?: string;
  ptAmount?: string;
  lpAmount?: string;
};

export type ImpliedRateUpdatedEvent = {
  pool_id: string;
  ln_implied_rate_raw: string;
  pt_price_raw?: string;
  total_pt: string;
  total_sy: string;
  lp_supply: string;
};

export type PoolImpliedRatePoint = {
  timestamp: number;
  impliedApy: number;
  ptPrice: number | null;
  poolId: string;
  digest: string;
};

export type PoolVolumeStats = {
  volume24hSy: bigint;
  volume7dSy: bigint;
  totalFeesSy: bigint;
  swapCount24h: number;
  swapCount7d: number;
};

export type InterestCollectedEvent = {
  state_id: string;
  user_interest_raw: string;
  treasury_interest_raw: string;
  py_index_raw: string;
};

export type TreasuryInterestCollectedEvent = {
  py_state_id: string;
  market_id: string;
  amount: string;
  dust_remainder_raw: string;
  collected_by: string;
};

export type UnderlyingApyPoint = {
  timestamp: number;
  pyIndexRaw: string;
  underlyingApy: number;
};

export type ScallopQuoteCollectedEvent = {
  market_id: string;
  scallop_market_id: string;
  sy_index: string;
  updated_at: string;
};

export type ScallopMarketBalanceSheet = {
  cash: string;
  debt: string;
  revenue: string;
  marketCoinSupply: string;
};

export type ScallopMarketIndex = {
  marketId: string;
  scallopMarketId: string;
  underlyingTypeTag: string;
  balanceSheet: ScallopMarketBalanceSheet;
  syIndexRaw: string;
  syIndex: number;
  utilization: number;
  borrowApr: number;
  supplyApy: number;
  revenueFactor: number;
};

export type LiquidlinkScoreInfo = {
  exists: boolean;
  totalScore: bigint;
  unconvertedScore: bigint;
  /** Score debt created by tokenization, redemption, or explicit subtract operations. */
  convertedScore: bigint;
  storedScore: bigint;
  scorePerDuration: bigint;
  durationMs: bigint;
  updatedAtMs: bigint;
  linearPausedMsAtUpdate: bigint;
};

export type LiquidlinkLeaderboardEntry = LiquidlinkScoreInfo & {
  rank: number;
  owner: string;
};

export type OrderbookSide = "bid" | "ask";
export type OrderbookAsset = "pt" | "yt";

export type OrderbookOrder = {
  id: string;
  asset: OrderbookAsset;
  owner: string;
  side: OrderbookSide;
  priceRaw: string;
  remainingPt: string;
  escrowSy: string;
  escrowPt: string;
  claimableSy: string;
  claimablePt: string;
  createdAt: string;
  expiryMs: string;
};

export type AggregatorCreatedEvent = {
  aggregator_id: string;
  market_id: string;
  max_staleness_ms: string;
  min_total_weight_bps: string;
  outlier_tolerance_bps: string;
};

export type MarketVaultCreatedEvent = {
  vault_id: string;
  market_id: string;
  created_by: string;
};

// ---------------------------------------------------------------------------
// Generic object fetcher
// ---------------------------------------------------------------------------

async function getObject<T>(network: GrpcNetworkKind, objectId: string): Promise<T> {
  const response = await grpcRequest<{
    data: { content: { fields: T } };
  }>(network, "sui_getObject", [objectId, { showContent: true }]);
  return response.data.content.fields;
}

function normalizeMoveObjectId(
  id: string | { id?: string } | undefined,
  fallbackObjectId: string,
): { id: string } {
  if (typeof id === "string" && id.length > 0) return { id };
  if (typeof id === "object" && id?.id) return { id: id.id };
  return { id: fallbackObjectId };
}

function normalizeMoveIdValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "string") return id;
  }
  return value == null ? "" : String(value);
}

function normalizeMoveScalar(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") return value.toString();
  if (value && typeof value === "object" && "value" in value) {
    const raw = (value as { value?: unknown }).value;
    return raw == null ? "0" : String(raw);
  }
  return value == null ? "0" : String(value);
}

function normalizePyPositionFields(
  fields: PyPositionFields | JitterPositionFields,
  objectId: string,
): PyPositionFields {
  const raw = fields as unknown as Record<string, unknown>;
  const py = readRawField(raw.py);
  return {
    id: normalizeMoveObjectId(fields.id, objectId),
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

function normalizeLpPositionFields(
  fields: LpPositionFields | JitterPositionFields,
  objectId: string,
): LpPositionFields {
  const raw = fields as unknown as Record<string, unknown>;
  const lp = readRawField(raw.lp);
  return {
    id: normalizeMoveObjectId(fields.id, objectId),
    lp_amount: normalizeMoveScalar(lp.lp_amount ?? raw.lp_amount),
    pool_id: normalizeMoveIdValue(lp.pool_id ?? raw.pool_id),
    expiry: normalizeMoveScalar(raw.expiry),
    created_at: normalizeMoveScalar(raw.created_at),
  };
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

function readStringField(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") return value.toString();
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === "string") return id;
  }
  return "";
}

function readBalanceField(value: unknown): string {
  const fields = readRawField(value);
  return readStringField(fields.value ?? value);
}

function readRequiredStringField(value: unknown, field: string): string {
  const stringValue = readStringField(value);
  if (!stringValue) {
    throw new Error(`Missing on-chain field: ${field}.`);
  }
  return stringValue;
}

function readBigIntField(value: unknown, field: string): bigint {
  const stringValue = readRequiredStringField(value, field);
  return BigInt(stringValue);
}

function readOptionalBigIntField(value: unknown): bigint {
  const stringValue = readStringField(value);
  return stringValue ? BigInt(stringValue) : 0n;
}

function readFixedPoint32Field(value: unknown, field: string): number {
  const raw = readBigIntField(readRawField(value).value ?? value, field);
  return Number(raw) / 2 ** 32;
}

function normalizeObjectId(id: string): string {
  return id.toLowerCase();
}

function normalizeScallopTypeName(typeTag: string): string {
  const parts = typeTag.split("::");
  if (parts.length < 3) return typeTag.replace(/^0x/, "").toLowerCase();

  const address = parts[0].replace(/^0x/, "").toLowerCase().padStart(64, "0");
  return [address, ...parts.slice(1)].join("::");
}

function hasScallopMarketConfig(config: JitterMarketConfig): boolean {
  return Boolean(
    config.scallopAdapterPackageId &&
      config.scallopMarketObjectId &&
      config.scallopMarketVaultObjectId,
  );
}

function resolveLiquidlinkScoreboardObjectId(config: JitterMarketConfig): string | null {
  const liquidlink = config.liquidlink;
  const enabled =
    liquidlink?.enabled ?? Boolean(liquidlink?.scoreboardObjectId || config.liquidlinkScoreboardObjectId);
  if (!enabled) return null;
  return liquidlink?.scoreboardObjectId ?? config.liquidlinkScoreboardObjectId ?? null;
}

function readLiquidlinkScoreDebtField(scoreInfo: Record<string, unknown>): bigint {
  return readOptionalBigIntField(scoreInfo.score_debt ?? scoreInfo.converted_score);
}

function currentLiquidlinkLinearPausedMs(
  scoreboard: Record<string, unknown>,
  nowMs: bigint,
): bigint {
  const paused = Boolean(scoreboard.linear_paused);
  const pausedMs = readOptionalBigIntField(scoreboard.linear_paused_ms);
  const pauseStartedAt = readOptionalBigIntField(scoreboard.linear_pause_started_at);

  if (!paused || nowMs <= pauseStartedAt) return pausedMs;
  return pausedMs + (nowMs - pauseStartedAt);
}

function emptyLiquidlinkScoreInfo(): LiquidlinkScoreInfo {
  return {
    exists: false,
    totalScore: 0n,
    unconvertedScore: 0n,
    convertedScore: 0n,
    storedScore: 0n,
    scorePerDuration: 0n,
    durationMs: 0n,
    updatedAtMs: 0n,
    linearPausedMsAtUpdate: 0n,
  };
}

function calculateLiquidlinkTotalScore(
  storedScore: bigint,
  scorePerDuration: bigint,
  durationMs: bigint,
  updatedAtMs: bigint,
  nowMs: bigint,
  linearPausedMsAtUpdate: bigint = 0n,
  currentLinearPausedMs: bigint = 0n,
): bigint {
  if (durationMs <= 0n || nowMs <= updatedAtMs || scorePerDuration <= 0n) {
    return storedScore;
  }
  const elapsed = nowMs - updatedAtMs;
  const pausedDelta =
    currentLinearPausedMs > linearPausedMsAtUpdate
      ? currentLinearPausedMs - linearPausedMsAtUpdate
      : 0n;
  if (pausedDelta >= elapsed) return storedScore;

  return storedScore + (scorePerDuration * (elapsed - pausedDelta)) / durationMs;
}

function readLiquidlinkScoreInfo(
  scoreInfo: Record<string, unknown>,
  nowMs: bigint,
  currentLinearPausedMs: bigint,
): LiquidlinkScoreInfo {
  const storedScore = readOptionalBigIntField(scoreInfo.score);
  const scorePerDuration = readOptionalBigIntField(scoreInfo.score_per_duration);
  const durationMs = readOptionalBigIntField(scoreInfo.duration);
  const updatedAtMs = readOptionalBigIntField(scoreInfo.updated_at);
  const linearPausedMsAtUpdate = readOptionalBigIntField(
    scoreInfo.linear_paused_ms_at_update,
  );
  const convertedScore = readLiquidlinkScoreDebtField(scoreInfo);
  const totalScore = calculateLiquidlinkTotalScore(
    storedScore,
    scorePerDuration,
    durationMs,
    updatedAtMs,
    nowMs,
    linearPausedMsAtUpdate,
    currentLinearPausedMs,
  );

  return {
    exists: true,
    totalScore,
    unconvertedScore: totalScore > convertedScore ? totalScore - convertedScore : 0n,
    convertedScore,
    storedScore,
    scorePerDuration,
    durationMs,
    updatedAtMs,
    linearPausedMsAtUpdate,
  };
}

function readDynamicFieldAddressName(value: unknown): string {
  if (typeof value === "string") return value;
  const fields = readRawField(value);
  return readStringField(fields.value ?? fields.name ?? fields.id ?? value);
}

/**
 * Read a user's LiquidLink scoreboard entry for a configured Jitter market.
 *
 * The Scoreboard stores linear point streams in a Sui Table keyed by address,
 * so this uses the table dynamic field directly and calculates the current
 * score client-side using the same formula as LiquidLink's Move module.
 */
export async function getLiquidlinkScoreInfo(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  owner: string,
  nowMs: bigint = BigInt(Date.now()),
): Promise<LiquidlinkScoreInfo> {
  const scoreboardObjectId = resolveLiquidlinkScoreboardObjectId(config);
  if (!scoreboardObjectId) {
    return emptyLiquidlinkScoreInfo();
  }

  const scoreboard = await getObject<Record<string, unknown>>(
    network,
    scoreboardObjectId,
  );
  const scores = readRawField(scoreboard.scores);
  const scoresTableId = readRequiredStringField(scores.id, "scoreboard.scores.id");
  const currentPausedMs = currentLiquidlinkLinearPausedMs(scoreboard, nowMs);
  const client = getSuiClient(network);
  const dynamicField = await client.getDynamicFieldObject({
    parentId: scoresTableId,
    name: {
      type: "address",
      value: owner,
    },
  });

  if ("error" in dynamicField && dynamicField.error) {
    return emptyLiquidlinkScoreInfo();
  }

  const data = "data" in dynamicField ? dynamicField.data : undefined;
  const content = data?.content;
  if (!content || content.dataType !== "moveObject") {
    return emptyLiquidlinkScoreInfo();
  }

  const fields = readRawField(content.fields);
  const value = readRawField(fields.value);
  const scoreInfo = Object.keys(value).length > 0 ? value : fields;
  return readLiquidlinkScoreInfo(scoreInfo, nowMs, currentPausedMs);
}

export async function getLiquidlinkLeaderboard(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  limit = 50,
  nowMs: bigint = BigInt(Date.now()),
): Promise<LiquidlinkLeaderboardEntry[]> {
  const scoreboardObjectId = resolveLiquidlinkScoreboardObjectId(config);
  if (!scoreboardObjectId || limit <= 0) return [];

  const scoreboard = await getObject<Record<string, unknown>>(
    network,
    scoreboardObjectId,
  );
  const scores = readRawField(scoreboard.scores);
  const scoresTableId = readRequiredStringField(scores.id, "scoreboard.scores.id");
  const currentPausedMs = currentLiquidlinkLinearPausedMs(scoreboard, nowMs);
  const client = getSuiGrpcClient(network);
  const entries: Array<Omit<LiquidlinkLeaderboardEntry, "rank">> = [];
  let cursor: string | null | undefined;

  do {
    const page = await client.listDynamicFields({
      parentId: scoresTableId,
      cursor,
      limit: Math.min(Math.max(limit, 1), 50),
    });

    for (const field of page.dynamicFields ?? []) {
      const fieldId = field.fieldId;
      if (!fieldId) continue;

      const response = await client.getObject({
        objectId: fieldId,
        include: { json: true },
      });
      const dynamicField = readRawField(response.object?.json);
      const value = readRawField(dynamicField.value);
      const scoreInfo = Object.keys(value).length > 0 ? value : dynamicField;
      const owner =
        readDynamicFieldAddressName(dynamicField.name) ||
        readDynamicFieldAddressName(field.name);
      if (!owner) continue;

      entries.push({
        owner,
        ...readLiquidlinkScoreInfo(scoreInfo, nowMs, currentPausedMs),
      });
    }

    cursor = page.hasNextPage && entries.length < limit ? page.cursor : null;
  } while (cursor);

  return entries
    .sort((a, b) => {
      if (a.totalScore === b.totalScore) return a.owner.localeCompare(b.owner);
      return a.totalScore > b.totalScore ? -1 : 1;
    })
    .slice(0, limit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

async function findScallopTableValue(
  network: GrpcNetworkKind,
  tableId: string,
  typeTag: string,
): Promise<Record<string, unknown> | null> {
  const client = getSuiGrpcClient(network);
  const expectedTypeName = normalizeScallopTypeName(typeTag);
  let cursor: string | null | undefined;

  do {
    const page = await client.listDynamicFields({
      parentId: tableId,
      cursor,
      limit: 50,
    });

    for (const field of page.dynamicFields ?? []) {
      const fieldId = field.fieldId;
      if (!fieldId) continue;

      const response = await client.getObject({
        objectId: fieldId,
        include: { json: true },
      });
      const json = response.object?.json;
      const fields = readRawField(json);
      const fieldTypeName = normalizeScallopTypeName(readStringField(fields.name));
      if (fieldTypeName !== expectedTypeName) continue;

      const value = readRawField(fields.value);
      return Object.keys(value).length > 0 ? value : null;
    }

    cursor = page.hasNextPage ? page.cursor : null;
  } while (cursor);

  return null;
}

function buildUnderlyingApyFromIndexSamples(
  samples: Array<{ timestampMs: number; indexRaw: string }>,
): { points: UnderlyingApyPoint[]; averageApy: number } {
  const ordered = [...samples].sort((a, b) => a.timestampMs - b.timestampMs);
  if (ordered.length < 2) return { points: [], averageApy: 0 };

  const msPerYear = 365 * 24 * 60 * 60 * 1000;
  const points: UnderlyingApyPoint[] = [];
  let weightedSum = 0;
  let totalElapsed = 0;

  for (let i = 1; i < ordered.length; i++) {
    const prev = ordered[i - 1];
    const curr = ordered[i];
    const prevIndex = BigInt(prev.indexRaw);
    const currIndex = BigInt(curr.indexRaw);
    const elapsedMs = curr.timestampMs - prev.timestampMs;

    if (prevIndex === 0n || currIndex <= prevIndex || elapsedMs <= 0) {
      points.push({
        timestamp: Math.floor(curr.timestampMs / 1000),
        pyIndexRaw: curr.indexRaw,
        underlyingApy: 0,
      });
      continue;
    }

    const growth = Number(currIndex - prevIndex) / Number(prevIndex);
    const apy = growth * (msPerYear / elapsedMs);
    points.push({
      timestamp: Math.floor(curr.timestampMs / 1000),
      pyIndexRaw: curr.indexRaw,
      underlyingApy: apy,
    });
    weightedSum += apy * elapsedMs;
    totalElapsed += elapsedMs;
  }

  return {
    points,
    averageApy: totalElapsed > 0 ? weightedSum / totalElapsed : 0,
  };
}

// ---------------------------------------------------------------------------
// User-owned positions
// ---------------------------------------------------------------------------

export async function getUserPyPositions(
  network: GrpcNetworkKind,
  owner: string,
  config: JitterMarketConfig,
): Promise<PyPositionFields[]> {
  const response = await grpcRequest<{
    data: Array<{ data: { objectId: string; content: { fields: JitterPositionFields } } }>;
  }>(network, "suix_getOwnedObjects", [
    owner,
    {
      filter: { StructType: `${config.jitterPackageId}::jitter_position::JitterPosition` },
      options: { showContent: true },
    },
    null,
    50,
  ]);

  return response.data
    .map((item) =>
      normalizePyPositionFields(item.data.content.fields, item.data.objectId),
    )
    .filter((f) => f.py_state_id === config.pyStateObjectId);
}

export async function getUserLpPositions(
  network: GrpcNetworkKind,
  owner: string,
  config: JitterMarketConfig,
): Promise<LpPositionFields[]> {
  const response = await grpcRequest<{
    data: Array<{ data: { objectId: string; content: { fields: JitterPositionFields } } }>;
  }>(network, "suix_getOwnedObjects", [
    owner,
    {
      filter: { StructType: `${config.jitterPackageId}::jitter_position::JitterPosition` },
      options: { showContent: true },
    },
    null,
    50,
  ]);

  return response.data
    .map((item) =>
      normalizeLpPositionFields(item.data.content.fields, item.data.objectId),
    )
    .filter((f) => f.pool_id === config.poolObjectId);
}

export async function getUserUnderlyingCoins(
  network: GrpcNetworkKind,
  owner: string,
  config: JitterMarketConfig,
): Promise<Array<{ objectId: string; balance: bigint }>> {
  return getUserCoins(network, owner, config.underlyingTypeTag);
}

export async function getUserCoins(
  network: GrpcNetworkKind,
  owner: string,
  coinTypeTag: string,
): Promise<Array<{ objectId: string; balance: bigint }>> {
  const response = await grpcRequest<{
    data: Array<{ data: { objectId: string; content: { fields: { balance: string } } } }>;
  }>(network, "suix_getOwnedObjects", [
    owner,
    {
      filter: { StructType: `0x2::coin::Coin<${coinTypeTag}>` },
      options: { showContent: true },
    },
    null,
    50,
  ]);

  return response.data.map((item) => ({
    objectId: item.data.objectId,
    balance: BigInt(item.data.content.fields.balance),
  }));
}

export async function getUserSyCoins(
  network: GrpcNetworkKind,
  owner: string,
  config: JitterMarketConfig,
): Promise<Array<{ objectId: string; balance: bigint }>> {
  const response = await grpcRequest<{
    data: Array<{ data: { objectId: string; content: { fields: { balance: string } } } }>;
  }>(network, "suix_getOwnedObjects", [
    owner,
    {
      filter: { StructType: `0x2::coin::Coin<${config.syTypeTag}>` },
      options: { showContent: true },
    },
    null,
    50,
  ]);

  return response.data.map((item) => ({
    objectId: item.data.objectId,
    balance: BigInt(item.data.content.fields.balance),
  }));
}

export async function getOrderbookOrders(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  asset: OrderbookAsset = "pt",
): Promise<OrderbookOrder[]> {
  const orderbookObjectId =
    asset === "yt" ? config.ytOrderbookObjectId : config.orderbookObjectId;
  if (!orderbookObjectId) return [];

  const client = getSuiGrpcClient(network);
  const orders: OrderbookOrder[] = [];
  let cursor: string | null | undefined;

  do {
    const page = await client.listDynamicFields({
      parentId: orderbookObjectId,
      cursor,
      limit: 50,
    });

    for (const field of page.dynamicFields ?? []) {
      const fieldId = field.fieldId;
      if (!fieldId) continue;

      const response = await client.getObject({
        objectId: fieldId,
        include: { json: true },
      });
      const dynamicField = readRawField(response.object?.json);
      const order = readRawField(dynamicField.value);
      const id = readStringField(order.id);
      if (!id || !("remaining_pt" in order) || !("price_raw" in order)) {
        continue;
      }

      const sideRaw = Number(readStringField(order.side));
      orders.push({
        id,
        asset,
        owner: readStringField(order.owner),
        side: sideRaw === 1 ? "ask" : "bid",
        priceRaw: readStringField(order.price_raw),
        remainingPt: readStringField(order.remaining_pt),
        escrowSy: readBalanceField(order.escrow_sy),
        escrowPt: readBalanceField(order.escrow_pt),
        claimableSy: readBalanceField(order.claimable_sy),
        claimablePt: readBalanceField(order.claimable_pt),
        createdAt: readStringField(order.created_at),
        expiryMs: readStringField(order.expiry_ms),
      });
    }

    cursor = page.hasNextPage ? page.cursor : null;
  } while (cursor);

  return orders.sort((a, b) => Number(BigInt(a.id) - BigInt(b.id)));
}

// ---------------------------------------------------------------------------
// Shared market state
// ---------------------------------------------------------------------------

export async function getPoolState(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
): Promise<PoolFields> {
  return getObject<PoolFields>(network, config.poolObjectId);
}

export async function getPyState(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
): Promise<PyStateFields> {
  return getObject<PyStateFields>(network, config.pyStateObjectId);
}

export async function getDemoVaultState(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
): Promise<DemoMarketVaultFields> {
  return getObject<DemoMarketVaultFields>(network, config.demoMarketVaultObjectId);
}

export async function getPyPositionById(
  network: GrpcNetworkKind,
  objectId: string,
): Promise<PyPositionFields> {
  return normalizePyPositionFields(await getObject<JitterPositionFields>(network, objectId), objectId);
}

export async function getLpPositionById(
  network: GrpcNetworkKind,
  objectId: string,
): Promise<LpPositionFields> {
  return normalizeLpPositionFields(await getObject<JitterPositionFields>(network, objectId), objectId);
}

// ---------------------------------------------------------------------------
// Numeric helpers
// ---------------------------------------------------------------------------

function moveNumericToBigInt(raw: MoveNumericField): bigint {
  if (typeof raw === "object" && raw !== null && "value" in raw) {
    const value = BigInt(raw.value);
    return raw.positive === false ? -value : value;
  }

  return BigInt(raw);
}

export function fp64ToFloat(raw: MoveNumericField, decimals = 6): string {
  const value = moveNumericToBigInt(raw);
  const scaled = (value * BigInt(10 ** decimals)) / FP64_ONE;
  const intPart = scaled / BigInt(10 ** decimals);
  const fracPart = scaled % BigInt(10 ** decimals);
  return `${intPart}.${fracPart.toString().padStart(decimals, "0")}`;
}

export function formatTokenAmount(raw: MoveNumericField, decimals = 6): string {
  const value = moveNumericToBigInt(raw);
  const factor = BigInt(10 ** decimals);
  const intPart = value / factor;
  const fracPart = value % factor;
  return `${intPart}.${fracPart.toString().padStart(decimals, "0")}`;
}

export function calcImpliedApy(lnImpliedRateRaw: MoveNumericField): number {
  const raw = moveNumericToBigInt(lnImpliedRateRaw);
  if (raw === BigInt(0)) return 0;
  const asFloat = Number(raw) / Number(FP64_ONE);
  return (Math.exp(asFloat) - 1) * 100;
}

export function fp64RawToNumber(raw: MoveNumericField): number {
  return Number(moveNumericToBigInt(raw)) / Number(FP64_ONE);
}

// ---------------------------------------------------------------------------
// Event queries for market discovery and APY history
// ---------------------------------------------------------------------------

/**
 * Query on-chain PoolCreatedEvent records for the given package.
 * Used by the frontend to auto-discover all deployed pools.
 */
export async function queryPoolCreatedEvents(
  network: GrpcNetworkKind,
  jitterPackageId: string,
  limit = 50,
): Promise<PoolCreatedEvent[]> {
  const client = getSuiClient(network);
  const result = await client.queryEvents({
    query: { MoveEventType: `${jitterPackageId}::pool::PoolCreatedEvent` },
    limit,
    order: "descending",
  });
  return (result.data ?? []).map((e) => e.parsedJson as PoolCreatedEvent);
}

/**
 * Query on-chain PyStateCreatedEvent records for the given package.
 */
export async function queryPyStateCreatedEvents(
  network: GrpcNetworkKind,
  jitterPackageId: string,
  limit = 50,
): Promise<PyStateCreatedEvent[]> {
  const client = getSuiClient(network);
  const result = await client.queryEvents({
    query: { MoveEventType: `${jitterPackageId}::py_state::PyStateCreatedEvent` },
    limit,
    order: "descending",
  });
  return (result.data ?? []).map((e) => e.parsedJson as PyStateCreatedEvent);
}

/**
 * Query SwapEvent records for a specific pool. Used for volume reconstruction.
 */
export async function querySwapEvents(
  network: GrpcNetworkKind,
  jitterPackageId: string,
  poolId: string,
  limit = 200,
): Promise<Array<SwapEvent & { timestampMs: number; digest: string; sender: string }>> {
  const client = getSuiClient(network);
  const result = await client.queryEvents({
    query: { MoveEventType: `${jitterPackageId}::pool::SwapEvent` },
    limit,
    order: "descending",
  });

  return (result.data ?? [])
    .filter((e) => (e.parsedJson as SwapEvent).pool_id === poolId)
    .map((e) => ({
      ...(e.parsedJson as SwapEvent),
      timestampMs: Number(e.timestampMs ?? 0),
      digest: e.id.txDigest,
      sender: e.sender ?? "",
    }));
}

/**
 * Query RouterSwapYtEvent records. These events do not carry pool_id, so
 * callers correlate them to a pool through the same transaction digest's
 * pool::SwapEvent.
 */
export async function queryRouterSwapYtEvents(
  network: GrpcNetworkKind,
  jitterPackageId: string,
  limit = 200,
): Promise<
  Array<RouterSwapYtEvent & { timestampMs: number; digest: string; sender: string }>
> {
  const client = getSuiClient(network);
  const result = await client.queryEvents({
    query: { MoveEventType: `${jitterPackageId}::router::RouterSwapYtEvent` },
    limit,
    order: "descending",
  });

  return (result.data ?? []).map((e) => ({
    ...(e.parsedJson as RouterSwapYtEvent),
    timestampMs: Number(e.timestampMs ?? 0),
    digest: e.id.txDigest,
    sender: e.sender ?? "",
  }));
}

/**
 * Query RouterSwapYtForSyEvent records. These events identify YT sell routes
 * that otherwise look like ordinary SY -> PT settlement swaps at pool level.
 */
export async function queryRouterSwapYtForSyEvents(
  network: GrpcNetworkKind,
  jitterPackageId: string,
  limit = 200,
): Promise<
  Array<RouterSwapYtForSyEvent & { timestampMs: number; digest: string; sender: string }>
> {
  const client = getSuiClient(network);
  const result = await client.queryEvents({
    query: { MoveEventType: `${jitterPackageId}::router::RouterSwapYtForSyEvent` },
    limit,
    order: "descending",
  });

  return (result.data ?? []).map((e) => ({
    ...(e.parsedJson as RouterSwapYtForSyEvent),
    timestampMs: Number(e.timestampMs ?? 0),
    digest: e.id.txDigest,
    sender: e.sender ?? "",
  }));
}

/**
 * Query AddLiquidityEvent records for a specific pool.
 */
export async function queryAddLiquidityEvents(
  network: GrpcNetworkKind,
  jitterPackageId: string,
  poolId: string,
  limit = 200,
): Promise<Array<AddLiquidityEvent & { timestampMs: number; digest: string; sender: string }>> {
  const client = getSuiClient(network);
  const result = await client.queryEvents({
    query: { MoveEventType: `${jitterPackageId}::pool::AddLiquidityEvent` },
    limit,
    order: "descending",
  });

  return (result.data ?? [])
    .filter((e) => (e.parsedJson as AddLiquidityEvent).pool_id === poolId)
    .map((e) => ({
      ...(e.parsedJson as AddLiquidityEvent),
      timestampMs: Number(e.timestampMs ?? 0),
      digest: e.id.txDigest,
      sender: e.sender ?? "",
    }));
}

/**
 * Query RemoveLiquidityEvent records for a specific pool.
 */
export async function queryRemoveLiquidityEvents(
  network: GrpcNetworkKind,
  jitterPackageId: string,
  poolId: string,
  limit = 200,
): Promise<Array<RemoveLiquidityEvent & { timestampMs: number; digest: string; sender: string }>> {
  const client = getSuiClient(network);
  const result = await client.queryEvents({
    query: { MoveEventType: `${jitterPackageId}::pool::RemoveLiquidityEvent` },
    limit,
    order: "descending",
  });

  return (result.data ?? [])
    .filter((e) => (e.parsedJson as RemoveLiquidityEvent).pool_id === poolId)
    .map((e) => ({
      ...(e.parsedJson as RemoveLiquidityEvent),
      timestampMs: Number(e.timestampMs ?? 0),
      digest: e.id.txDigest,
      sender: e.sender ?? "",
    }));
}

/**
 * Merge swap and liquidity events for a pool into a single activity feed
 * sorted newest-first. Caller can split by `kind` to render separate tabs.
 */
export async function getPoolActivity(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  limit = 100,
): Promise<PoolActivityEntry[]> {
  const eventScanLimit = Math.max(limit, 200);
  const [swaps, ytBuys, ytSells, adds, removes] = await Promise.all([
    querySwapEvents(
      network,
      config.jitterPackageId,
      config.poolObjectId,
      eventScanLimit,
    ),
    queryRouterSwapYtEvents(network, config.jitterPackageId, eventScanLimit),
    queryRouterSwapYtForSyEvents(network, config.jitterPackageId, eventScanLimit),
    queryAddLiquidityEvents(
      network,
      config.jitterPackageId,
      config.poolObjectId,
      eventScanLimit,
    ),
    queryRemoveLiquidityEvents(
      network,
      config.jitterPackageId,
      config.poolObjectId,
      eventScanLimit,
    ),
  ]);

  const entries: PoolActivityEntry[] = [];
  const ytBuysByDigest = new Map<string, typeof ytBuys>();
  const ytSellsByDigest = new Map<string, typeof ytSells>();

  for (const y of ytBuys) {
    const digestEntries = ytBuysByDigest.get(y.digest);
    if (digestEntries) {
      digestEntries.push(y);
    } else {
      ytBuysByDigest.set(y.digest, [y]);
    }
  }

  for (const y of ytSells) {
    const digestEntries = ytSellsByDigest.get(y.digest);
    if (digestEntries) {
      digestEntries.push(y);
    } else {
      ytSellsByDigest.set(y.digest, [y]);
    }
  }

  for (const s of swaps) {
    const ytBuyCandidates = s.is_pt_to_sy
      ? ytBuysByDigest.get(s.digest)
      : undefined;
    const ytBuy = ytBuyCandidates?.shift();

    if (ytBuy) {
      entries.push({
        kind: "swap",
        poolId: s.pool_id,
        timestampMs: ytBuy.timestampMs || s.timestampMs,
        digest: ytBuy.digest,
        sender: ytBuy.user || ytBuy.sender,
        swapAsset: "yt",
        isPtToSy: false,
        amountIn: ytBuy.sy_amount_in,
        amountOut: ytBuy.yt_amount_out,
        syAmountOut: ytBuy.sy_amount_out,
        fee: s.fee,
      });
      continue;
    }

    const ytSellCandidates = !s.is_pt_to_sy
      ? ytSellsByDigest.get(s.digest)
      : undefined;
    const ytSell = ytSellCandidates?.shift();

    if (ytSell) {
      entries.push({
        kind: "swap",
        poolId: s.pool_id,
        timestampMs: ytSell.timestampMs || s.timestampMs,
        digest: ytSell.digest,
        sender: ytSell.user || ytSell.sender,
        swapAsset: "yt",
        isPtToSy: true,
        amountIn: ytSell.yt_amount_in,
        amountOut: ytSell.sy_amount_out,
        syAmountOut: ytSell.sy_amount_out,
        syAmountRepaid: ytSell.sy_amount_repaid,
        fee: s.fee,
      });
      continue;
    }

    entries.push({
      kind: "swap",
      poolId: s.pool_id,
      timestampMs: s.timestampMs,
      digest: s.digest,
      sender: s.trader || s.sender,
      swapAsset: "pt",
      isPtToSy: s.is_pt_to_sy,
      amountIn: s.amount_in,
      amountOut: s.amount_out,
      fee: s.fee,
    });
  }

  for (const a of adds) {
    entries.push({
      kind: "add_liquidity",
      poolId: a.pool_id,
      timestampMs: a.timestampMs,
      digest: a.digest,
      sender: a.sender,
      positionId: a.position_id,
      syAmount: a.sy_amount,
      ptAmount: a.pt_amount,
      lpAmount: a.lp_amount,
    });
  }

  for (const r of removes) {
    entries.push({
      kind: "remove_liquidity",
      poolId: r.pool_id,
      timestampMs: r.timestampMs,
      digest: r.digest,
      sender: r.provider || r.sender,
      positionId: r.position_id,
      syAmount: r.sy_amount,
      ptAmount: r.pt_amount,
      lpAmount: r.lp_amount,
    });
  }

  entries.sort((a, b) => b.timestampMs - a.timestampMs);
  return entries;
}

/**
 * Query ImpliedRateUpdatedEvent records. Each event carries the exact
 * `ln_implied_rate_raw` booked at that moment, so the time series reconstructs
 * without replaying devInspect on each digest.
 */
export async function queryImpliedRateEvents(
  network: GrpcNetworkKind,
  jitterPackageId: string,
  poolId: string,
  limit = 200,
): Promise<Array<ImpliedRateUpdatedEvent & { timestampMs: number; digest: string }>> {
  const client = getSuiClient(network);
  const result = await client.queryEvents({
    query: { MoveEventType: `${jitterPackageId}::pool::ImpliedRateUpdatedEvent` },
    limit,
    order: "descending",
  });

  return (result.data ?? [])
    .filter((e) => (e.parsedJson as ImpliedRateUpdatedEvent).pool_id === poolId)
    .map((e) => ({
      ...(e.parsedJson as ImpliedRateUpdatedEvent),
      timestampMs: Number(e.timestampMs ?? 0),
      digest: e.id.txDigest,
    }));
}

/**
 * Build the implied-APY time series for a pool.
 *
 * Prefers `ImpliedRateUpdatedEvent` — those carry the exact rate at swap time,
 * so the curve is faithful to on-chain history. If the pool was deployed
 * before the event was added, falls back to SwapEvent timestamps anchored to
 * the current rate (flat line).
 *
 * Returns points sorted oldest-first for charting libraries.
 */
export async function getPoolApyHistory(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  limit = 200,
): Promise<PoolImpliedRatePoint[]> {
  const rateEvents = await queryImpliedRateEvents(
    network,
    config.jitterPackageId,
    config.poolObjectId,
    limit,
  );

  if (rateEvents.length > 0) {
    return rateEvents
      .map((e) => ({
        timestamp: Math.floor(e.timestampMs / 1000),
        impliedApy: calcImpliedApy(e.ln_implied_rate_raw),
        ptPrice: e.pt_price_raw ? fp64RawToNumber(e.pt_price_raw) : null,
        poolId: e.pool_id,
        digest: e.digest,
      }))
      .reverse();
  }

  const swaps = await querySwapEvents(
    network,
    config.jitterPackageId,
    config.poolObjectId,
    limit,
  );
  if (swaps.length === 0) return [];

  const pool = await getPoolState(network, config);
  const latestApy = calcImpliedApy(pool.last_ln_implied_rate);

  return swaps
    .map((swap) => ({
      timestamp: Math.floor(swap.timestampMs / 1000),
      impliedApy: latestApy,
      ptPrice: null,
      poolId: swap.pool_id,
      digest: swap.digest,
    }))
    .reverse();
}

/**
 * Compute rolling volume / fee / swap count stats from SwapEvent.
 * All amounts are SY u64 units. Time windows are relative to `now`.
 */
export async function getPoolVolumeStats(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  now: number = Date.now(),
  limit = 500,
): Promise<PoolVolumeStats> {
  const swaps = await querySwapEvents(
    network,
    config.jitterPackageId,
    config.poolObjectId,
    limit,
  );

  const dayMs = 24 * 60 * 60 * 1000;
  const weekMs = 7 * dayMs;

  let volume24h = 0n;
  let volume7d = 0n;
  let totalFees = 0n;
  let count24h = 0;
  let count7d = 0;

  for (const s of swaps) {
    const age = now - s.timestampMs;
    const syUnits = s.is_pt_to_sy ? BigInt(s.amount_out) : BigInt(s.amount_in);
    totalFees += BigInt(s.fee);
    if (age <= dayMs) {
      volume24h += syUnits;
      count24h += 1;
    }
    if (age <= weekMs) {
      volume7d += syUnits;
      count7d += 1;
    }
  }

  return {
    volume24hSy: volume24h,
    volume7dSy: volume7d,
    totalFeesSy: totalFees,
    swapCount24h: count24h,
    swapCount7d: count7d,
  };
}

/**
 * Query InterestCollectedEvent records for a specific PyState. These are
 * emitted on every interest update, carrying the freshly-rolled py_index_raw.
 */
export async function queryInterestCollectedEvents(
  network: GrpcNetworkKind,
  jitterPackageId: string,
  pyStateId: string,
  limit = 200,
): Promise<Array<InterestCollectedEvent & { timestampMs: number; digest: string }>> {
  const client = getSuiClient(network);
  const result = await client.queryEvents({
    query: { MoveEventType: `${jitterPackageId}::py_state::InterestCollectedEvent` },
    limit,
    order: "descending",
  });

  return (result.data ?? [])
    .filter((e) => (e.parsedJson as InterestCollectedEvent).state_id === pyStateId)
    .map((e) => ({
      ...(e.parsedJson as InterestCollectedEvent),
      timestampMs: Number(e.timestampMs ?? 0),
      digest: e.id.txDigest,
    }));
}

/**
 * Query TreasuryInterestCollectedEvent records for a specific PyState.
 * Newest first. Each record represents a single `collect_treasury_interest_by_*`
 * call, with the withdrawn SY amount and the FP64-raw dust left behind.
 */
export async function queryTreasuryInterestCollectedEvents(
  network: GrpcNetworkKind,
  jitterPackageId: string,
  pyStateId: string,
  limit = 100,
): Promise<Array<TreasuryInterestCollectedEvent & { timestampMs: number; digest: string }>> {
  const client = getSuiClient(network);
  const result = await client.queryEvents({
    query: {
      MoveEventType: `${jitterPackageId}::py_state::TreasuryInterestCollectedEvent`,
    },
    limit,
    order: "descending",
  });

  return (result.data ?? [])
    .filter(
      (e) => (e.parsedJson as TreasuryInterestCollectedEvent).py_state_id === pyStateId,
    )
    .map((e) => ({
      ...(e.parsedJson as TreasuryInterestCollectedEvent),
      timestampMs: Number(e.timestampMs ?? 0),
      digest: e.id.txDigest,
    }));
}

/**
 * Query Scallop adapter quote samples for a configured market. Each sample is
 * the same SY index consumed by on-chain mint/redeem/quote PTBs.
 */
export async function queryScallopQuoteCollectedEvents(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  limit = 200,
): Promise<Array<ScallopQuoteCollectedEvent & { timestampMs: number; digest: string }>> {
  if (!config.scallopAdapterPackageId || !config.scallopMarketObjectId) return [];

  const client = getSuiClient(network);
  const result = await client.queryEvents({
    query: {
      MoveEventType: `${config.scallopAdapterPackageId}::scallop_price_ticket::QuoteCollectedEvent`,
    },
    limit,
    order: "descending",
  });

  const marketId = normalizeObjectId(config.marketObjectId);
  const scallopMarketId = normalizeObjectId(config.scallopMarketObjectId);

  return (result.data ?? [])
    .filter((e) => {
      const event = e.parsedJson as ScallopQuoteCollectedEvent;
      return (
        normalizeObjectId(event.market_id) === marketId &&
        normalizeObjectId(event.scallop_market_id) === scallopMarketId
      );
    })
    .map((e) => {
      const event = e.parsedJson as ScallopQuoteCollectedEvent;
      return {
        ...event,
        timestampMs: Number(event.updated_at || e.timestampMs || 0),
        digest: e.id.txDigest,
      };
    });
}

/**
 * Read Scallop's current market balance sheet and derive the same SY index used
 * by `scallop_price_ticket::current_sy_index`, plus an instantaneous supply APY
 * from the current borrow rate, utilization, and revenue factor.
 */
export async function getScallopMarketIndex(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
): Promise<ScallopMarketIndex> {
  if (!config.scallopMarketObjectId) {
    throw new Error("Missing Scallop market object id in Jitter config.");
  }

  const market = await getObject<Record<string, unknown>>(
    network,
    config.scallopMarketObjectId,
  );
  const vault = readRawField(market.vault);
  const balanceSheets = readRawField(vault.balance_sheets);
  const borrowDynamics = readRawField(market.borrow_dynamics);
  const interestModels = readRawField(market.interest_models);
  const balanceSheetTable = readRawField(balanceSheets.table);
  const borrowDynamicsTable = readRawField(borrowDynamics.table);
  const interestModelsTable = readRawField(interestModels.table);

  const balanceSheet = await findScallopTableValue(
    network,
    readRequiredStringField(balanceSheetTable.id, "vault.balance_sheets.table.id"),
    config.underlyingTypeTag,
  );
  if (!balanceSheet) {
    throw new Error(`Scallop balance sheet not found for ${config.underlyingTypeTag}.`);
  }

  const borrowDynamic = await findScallopTableValue(
    network,
    readRequiredStringField(borrowDynamicsTable.id, "borrow_dynamics.table.id"),
    config.underlyingTypeTag,
  );
  const interestModel = await findScallopTableValue(
    network,
    readRequiredStringField(interestModelsTable.id, "interest_models.table.id"),
    config.underlyingTypeTag,
  );

  const cash = readBigIntField(balanceSheet.cash, "balance_sheet.cash");
  const debt = readBigIntField(balanceSheet.debt, "balance_sheet.debt");
  const revenue = readBigIntField(balanceSheet.revenue, "balance_sheet.revenue");
  const marketCoinSupply = readBigIntField(
    balanceSheet.market_coin_supply,
    "balance_sheet.market_coin_supply",
  );

  if (marketCoinSupply === 0n) {
    throw new Error(`Scallop market coin supply is zero for ${config.underlyingTypeTag}.`);
  }
  if (cash + debt < revenue) {
    throw new Error(`Invalid Scallop balance sheet for ${config.underlyingTypeTag}.`);
  }

  const netUnderlying = cash + debt - revenue;
  const syIndexRaw = (netUnderlying * FP64_ONE) / marketCoinSupply;
  const utilization =
    netUnderlying > 0n ? Number(debt) / Number(netUnderlying) : 0;
  const borrowRatePerSecond = borrowDynamic
    ? readFixedPoint32Field(borrowDynamic.interest_rate, "borrow_dynamic.interest_rate")
    : 0;
  const borrowApr = borrowRatePerSecond * 365 * 24 * 60 * 60;
  const revenueFactor = interestModel
    ? readFixedPoint32Field(interestModel.revenue_factor, "interest_model.revenue_factor")
    : 0;
  const supplyApy = Math.max(
    borrowApr * utilization * Math.max(1 - revenueFactor, 0),
    0,
  );

  return {
    marketId: config.marketObjectId,
    scallopMarketId: config.scallopMarketObjectId,
    underlyingTypeTag: config.underlyingTypeTag,
    balanceSheet: {
      cash: cash.toString(),
      debt: debt.toString(),
      revenue: revenue.toString(),
      marketCoinSupply: marketCoinSupply.toString(),
    },
    syIndexRaw: syIndexRaw.toString(),
    syIndex: Number(syIndexRaw) / Number(FP64_ONE),
    utilization,
    borrowApr,
    supplyApy,
    revenueFactor,
  };
}

export async function getScallopUnderlyingApyHistory(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  limit = 200,
): Promise<{ points: UnderlyingApyPoint[]; averageApy: number }> {
  const [currentIndex, quoteEvents] = await Promise.all([
    getScallopMarketIndex(network, config),
    queryScallopQuoteCollectedEvents(network, config, limit).catch(() => []),
  ]);

  const samples = quoteEvents.map((event) => ({
    timestampMs: event.timestampMs,
    indexRaw: event.sy_index,
  }));

  const nowMs = Date.now();
  const latest = samples
    .filter((sample) => sample.timestampMs > 0)
    .sort((a, b) => b.timestampMs - a.timestampMs)[0];
  if (
    !latest ||
    latest.indexRaw !== currentIndex.syIndexRaw ||
    nowMs - latest.timestampMs > 60_000
  ) {
    samples.push({ timestampMs: nowMs, indexRaw: currentIndex.syIndexRaw });
  }

  const history = buildUnderlyingApyFromIndexSamples(samples);
  return {
    points: history.points,
    averageApy: history.averageApy > 0 ? history.averageApy : currentIndex.supplyApy,
  };
}

/**
 * Estimate the annualized underlying APY from py_index growth.
 *
 * Returns an array of points annualised between consecutive py_index samples,
 * plus the average APY across all samples (useful as a headline number).
 *
 * `underlyingApy` is expressed as a fraction (e.g. 0.05 = 5%).
 */
export async function getUnderlyingApyHistory(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  limit = 200,
): Promise<{ points: UnderlyingApyPoint[]; averageApy: number }> {
  if (hasScallopMarketConfig(config)) {
    try {
      return await getScallopUnderlyingApyHistory(network, config, limit);
    } catch {
      // Fall back to Jitter interest events if the Scallop market is temporarily
      // unreadable or the market config is stale.
    }
  }

  const events = await queryInterestCollectedEvents(
    network,
    config.jitterPackageId,
    config.pyStateObjectId,
    limit,
  );
  return buildUnderlyingApyFromIndexSamples(
    events.map((event) => ({
      timestampMs: event.timestampMs,
      indexRaw: event.py_index_raw,
    })),
  );
}

// ---------------------------------------------------------------------------
// Multi-market discovery
// ---------------------------------------------------------------------------

export type MarketCreatedEventRaw = {
  market_id: string;
  expiry: string;
  created_by: string;
  sy_type: { name: string } | string;
  pt_type: { name: string } | string;
  yt_type: { name: string } | string;
};

/**
 * A market descriptor stitched together from three chain events. Frontends
 * can feed this straight into the market explorer without needing env vars
 * per market.
 */
export type DiscoveredJitterMarket = {
  marketId: string;
  poolId: string;
  pyStateId: string;
  expiry: number;
  createdAtMs: number;
  /** Fully-qualified 0x::module::Name type tag, from MarketCreatedEvent. */
  syTypeTag: string | null;
  ptTypeTag: string | null;
  ytTypeTag: string | null;
  /** Market-scoped oracle aggregator shared object. */
  priceAggregatorObjectId: string | null;
  /** Demo adapter vault shared object. */
  demoMarketVaultObjectId: string | null;
  /** True when the market has enough metadata for the SDK to build PTBs safely. */
  isTradeReady: boolean;
};

function parseTypeTag(value: { name: string } | string | undefined | null): string | null {
  if (!value) return null;
  if (typeof value === "string") return normalizeTypeTag(value);
  return normalizeTypeTag(value.name);
}

function normalizeTypeTag(raw: string): string {
  if (!raw) return raw;
  // BCS-serialised TypeName is the bare "address::module::struct" form without
  // the leading 0x; normalise so it round-trips into type-argument callers.
  if (raw.startsWith("0x")) return raw;
  return `0x${raw}`;
}

/**
 * Enumerate every (market, py_state, pool) triple currently deployed under
 * the given package id. Useful when env-based single-market config is not
 * enough for the UI.
 *
 * Also returns the SY/PT/YT type tags harvested from `MarketCreatedEvent`
 * so the caller can pass them straight into `devInspect`-based queries.
 */
export async function listJitterMarkets(
  network: GrpcNetworkKind,
  jitterPackageId: string,
  limit = 100,
  options?: {
    oraclePackageId?: string;
    demoAdapterPackageId?: string;
  },
): Promise<DiscoveredJitterMarket[]> {
  const client = getSuiClient(network);

  const [poolsRaw, pyStatesRaw, marketsRaw, aggregatorsRaw, vaultsRaw] =
    await Promise.all([
    client.queryEvents({
      query: { MoveEventType: `${jitterPackageId}::pool::PoolCreatedEvent` },
      limit,
      order: "descending",
    }),
    client.queryEvents({
      query: { MoveEventType: `${jitterPackageId}::py_state::PyStateCreatedEvent` },
      limit,
      order: "descending",
    }),
    client.queryEvents({
      query: { MoveEventType: `${jitterPackageId}::market::MarketCreatedEvent` },
      limit,
      order: "descending",
    }),
    options?.oraclePackageId
      ? client.queryEvents({
          query: {
            MoveEventType:
              `${options.oraclePackageId}::aggregator::AggregatorCreatedEvent`,
          },
          limit,
          order: "descending",
        })
      : Promise.resolve({ data: [] }),
    options?.demoAdapterPackageId
      ? client.queryEvents({
          query: {
            MoveEventType:
              `${options.demoAdapterPackageId}::demo_market_vault::MarketVaultCreatedEvent`,
          },
          limit,
          order: "descending",
        })
      : Promise.resolve({ data: [] }),
  ]);

  const poolTimestamps = new Map<string, number>();
  const pools: PoolCreatedEvent[] = [];
  for (const evt of poolsRaw.data ?? []) {
    const parsed = evt.parsedJson as PoolCreatedEvent;
    pools.push(parsed);
    poolTimestamps.set(parsed.pool_id, Number(evt.timestampMs ?? 0));
  }

  const pyByStateId = new Map<string, PyStateCreatedEvent>();
  for (const evt of pyStatesRaw.data ?? []) {
    const parsed = evt.parsedJson as PyStateCreatedEvent;
    pyByStateId.set(parsed.state_id, parsed);
  }

  const marketsByMarketId = new Map<string, MarketCreatedEventRaw>();
  for (const evt of marketsRaw.data ?? []) {
    const parsed = evt.parsedJson as MarketCreatedEventRaw;
    marketsByMarketId.set(parsed.market_id, parsed);
  }

  const aggregatorsByMarketId = new Map<string, string>();
  for (const evt of aggregatorsRaw.data ?? []) {
    const parsed = evt.parsedJson as AggregatorCreatedEvent;
    if (!aggregatorsByMarketId.has(parsed.market_id)) {
      aggregatorsByMarketId.set(parsed.market_id, parsed.aggregator_id);
    }
  }

  const vaultsByMarketId = new Map<string, string>();
  for (const evt of vaultsRaw.data ?? []) {
    const parsed = evt.parsedJson as MarketVaultCreatedEvent;
    if (!vaultsByMarketId.has(parsed.market_id)) {
      vaultsByMarketId.set(parsed.market_id, parsed.vault_id);
    }
  }

  const markets: DiscoveredJitterMarket[] = [];
  for (const pool of pools) {
    const py = pyByStateId.get(pool.py_state_id);
    if (!py) continue;
    const marketEvt = marketsByMarketId.get(py.market_id);
    const priceAggregatorObjectId = aggregatorsByMarketId.get(py.market_id) ?? null;
    const demoMarketVaultObjectId = vaultsByMarketId.get(py.market_id) ?? null;
    const syTypeTag = parseTypeTag(marketEvt?.sy_type);
    const ptTypeTag = parseTypeTag(marketEvt?.pt_type);
    const ytTypeTag = parseTypeTag(marketEvt?.yt_type);

    markets.push({
      marketId: py.market_id,
      poolId: pool.pool_id,
      pyStateId: pool.py_state_id,
      expiry: Number(pool.expiry),
      createdAtMs: poolTimestamps.get(pool.pool_id) ?? 0,
      syTypeTag,
      ptTypeTag,
      ytTypeTag,
      priceAggregatorObjectId,
      demoMarketVaultObjectId,
      isTradeReady: Boolean(
        syTypeTag &&
          ptTypeTag &&
          ytTypeTag &&
          priceAggregatorObjectId &&
          demoMarketVaultObjectId,
      ),
    });
  }

  return markets;
}
