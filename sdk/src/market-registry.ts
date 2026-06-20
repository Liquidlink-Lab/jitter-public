import type { JitterChainReader } from "./ports/chain-reader.js";
import type { JitterMarketConfig } from "./types.js";

const NONE_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export type JitterMarketRegistryRecord = {
  projectId: string;
  marketId: string;
  pyStateId: string;
  poolId: string;
  ptOrderbookId: string | null;
  ytOrderbookId: string | null;
  rewardDistributorId: string | null;
  expiryMs: string;
};

type MarketRegistryFields = {
  id?: unknown;
  market_count?: unknown;
  market_ids?: unknown;
};

type MarketRegistryDynamicField = {
  id?: unknown;
  name?: unknown;
  value?: unknown;
};

type RawMarketRecord = {
  project_id?: unknown;
  market_id?: unknown;
  py_state_id?: unknown;
  pool_id?: unknown;
  pt_orderbook_id?: unknown;
  yt_orderbook_id?: unknown;
  reward_distributor_id?: unknown;
  expiry?: unknown;
};

export async function listJitterMarketRegistryRecords(
  chainReader: JitterChainReader,
  config: Pick<
    JitterMarketConfig,
    "marketRegistryObjectId" | "marketObjectId"
  >,
): Promise<JitterMarketRegistryRecord[]> {
  if (!config.marketRegistryObjectId) return [];

  const [registry, fields] = await Promise.all([
    chainReader.getObject<MarketRegistryFields>(config.marketRegistryObjectId),
    chainReader.getDynamicFieldObjects<MarketRegistryDynamicField>({
      parentId: config.marketRegistryObjectId,
      limit: 100,
    }),
  ]);

  const marketIds = readIdVector(registry.market_ids);
  const recordsByMarketId = new Map<string, JitterMarketRegistryRecord>();

  for (const field of fields) {
    const record = readMarketRecord(field);
    if (!record) continue;
    recordsByMarketId.set(record.marketId.toLowerCase(), record);
  }

  if (marketIds.length === 0) {
    return [...recordsByMarketId.values()];
  }

  return marketIds.flatMap((marketId) => {
    const record = recordsByMarketId.get(marketId.toLowerCase());
    return record ? [record] : [];
  });
}

export async function overlayJitterMarketConfigFromRegistry(
  chainReader: JitterChainReader,
  config: JitterMarketConfig,
): Promise<JitterMarketConfig> {
  const records = await listJitterMarketRegistryRecords(chainReader, config);
  if (records.length === 0) return { ...config };

  const record =
    records.find(
      (candidate) =>
        candidate.marketId.toLowerCase() === config.marketObjectId.toLowerCase(),
    ) ?? (records.length === 1 ? records[0] : null);
  if (!record) return { ...config };

  return {
    ...config,
    marketObjectId: record.marketId,
    pyStateObjectId: record.pyStateId,
    poolObjectId: record.poolId,
    orderbookObjectId: record.ptOrderbookId,
    ytOrderbookObjectId: record.ytOrderbookId,
    rewardDistributorObjectId:
      record.rewardDistributorId ?? config.rewardDistributorObjectId,
  };
}

function readMarketRecord(
  field: MarketRegistryDynamicField,
): JitterMarketRegistryRecord | null {
  const value = readRawField(field.value) as RawMarketRecord;
  const marketId = normalizeId(value.market_id);
  if (!marketId) return null;

  const pyStateId = normalizeId(value.py_state_id);
  const poolId = normalizeId(value.pool_id);
  if (!pyStateId || !poolId) return null;

  return {
    projectId: normalizeScalar(value.project_id),
    marketId,
    pyStateId,
    poolId,
    ptOrderbookId: normalizeOptionalId(value.pt_orderbook_id),
    ytOrderbookId: normalizeOptionalId(value.yt_orderbook_id),
    rewardDistributorId: normalizeOptionalId(value.reward_distributor_id),
    expiryMs: normalizeScalar(value.expiry),
  };
}

function readIdVector(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const id = normalizeId(item);
    return id ? [id] : [];
  });
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

function normalizeOptionalId(value: unknown): string | null {
  const id = normalizeId(value);
  return !id || id.toLowerCase() === NONE_ID ? null : id;
}

function normalizeId(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) {
    const nested = (value as { id?: unknown }).id;
    return typeof nested === "string" ? nested : "";
  }
  if (value && typeof value === "object" && "pos0" in value) {
    const nested = (value as { pos0?: unknown }).pos0;
    return typeof nested === "string" ? nested : "";
  }
  return "";
}

function normalizeScalar(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "bigint") return value.toString();
  if (value && typeof value === "object" && "value" in value) {
    const nested = (value as { value?: unknown }).value;
    return nested == null ? "0" : String(nested);
  }
  return value == null ? "0" : String(value);
}
