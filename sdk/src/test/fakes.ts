import type {
  JitterConfigNetworkInput,
  JitterMarketConfigEntry,
} from "../config.js";
import type {
  DynamicFieldObjectQuery,
  JitterChainReader,
  OwnedObjectQuery,
  PoolVolumeStatsSnapshot,
} from "../ports/chain-reader.js";
import type { JitterMarketConfigProvider } from "../ports/config-provider.js";
import type {
  EventReaderQuery,
  JitterEventReader,
} from "../ports/event-reader.js";
import type {
  JitterMarketConfig,
  PoolFields,
  PyStateFields,
} from "../types.js";

type ChainReaderState = {
  objects?: Map<string, unknown>;
  pools?: Map<string, PoolFields>;
  pyStates?: Map<string, PyStateFields>;
  poolVolumeStats?: Map<string, PoolVolumeStatsSnapshot>;
  ownedObjects?: Map<string, readonly unknown[]>;
  dynamicFieldObjects?: Map<string, readonly unknown[]>;
};

export class InMemoryJitterMarketConfigProvider
  implements JitterMarketConfigProvider
{
  private readonly entries: JitterMarketConfigEntry[];

  constructor(entries: readonly JitterMarketConfigEntry[]) {
    this.entries = entries.map(cloneMarketEntry);
  }

  listMarketConfigEntries(
    network: JitterConfigNetworkInput,
  ): readonly JitterMarketConfigEntry[] {
    return this.entries
      .filter((entry) => entry.network === network)
      .map(cloneMarketEntry);
  }

  getDefaultMarketConfigEntry(
    network: JitterConfigNetworkInput,
  ): JitterMarketConfigEntry | null {
    const entries = this.listMarketConfigEntries(network);
    const entry = entries.find((item) => item.isDefault) ?? entries[0] ?? null;
    return entry ? cloneMarketEntry(entry) : null;
  }

  getMarketConfigEntry(
    network: JitterConfigNetworkInput,
    id: string,
  ): JitterMarketConfigEntry | null {
    const entry =
      this.listMarketConfigEntries(network).find((item) => item.id === id) ??
      null;
    return entry ? cloneMarketEntry(entry) : null;
  }
}

export class InMemoryJitterChainReader implements JitterChainReader {
  private readonly objects: Map<string, unknown>;
  private readonly pools: Map<string, PoolFields>;
  private readonly pyStates: Map<string, PyStateFields>;
  private readonly poolVolumeStats: Map<string, PoolVolumeStatsSnapshot>;
  private readonly ownedObjects: Map<string, readonly unknown[]>;
  private readonly dynamicFieldObjects: Map<string, readonly unknown[]>;

  constructor(state: ChainReaderState = {}) {
    this.objects = new Map(state.objects);
    this.pools = new Map(state.pools);
    this.pyStates = new Map(state.pyStates);
    this.poolVolumeStats = new Map(state.poolVolumeStats);
    this.ownedObjects = new Map(state.ownedObjects);
    this.dynamicFieldObjects = new Map(state.dynamicFieldObjects);
  }

  async getObject<TFields>(objectId: string): Promise<TFields> {
    const object =
      this.objects.get(objectId) ??
      this.pools.get(objectId) ??
      this.pyStates.get(objectId);

    if (!object) {
      throw new Error(`No fake chain object registered for ${objectId}.`);
    }

    return clone(object) as TFields;
  }

  async getPoolState(config: JitterMarketConfig): Promise<PoolFields> {
    return this.getObject<PoolFields>(config.poolObjectId);
  }

  async getPyState(config: JitterMarketConfig): Promise<PyStateFields> {
    return this.getObject<PyStateFields>(config.pyStateObjectId);
  }

  async getPoolVolumeStats(
    config: JitterMarketConfig,
  ): Promise<PoolVolumeStatsSnapshot> {
    return clone(
      this.poolVolumeStats.get(config.poolObjectId) ?? EMPTY_POOL_VOLUME,
    );
  }

  async getOwnedObjects<TFields>(
    query: OwnedObjectQuery,
  ): Promise<TFields[]> {
    const objects = this.ownedObjects.get(ownedObjectKey(query)) ?? [];
    return objects.map((object) => clone(object) as TFields);
  }

  async getDynamicFieldObjects<TFields>(
    query: DynamicFieldObjectQuery,
  ): Promise<TFields[]> {
    const objects = this.dynamicFieldObjects.get(query.parentId) ?? [];
    return objects.map((object) => clone(object) as TFields);
  }
}

export class InMemoryJitterEventReader implements JitterEventReader {
  private readonly events: Map<string, readonly unknown[]>;

  constructor(events: Map<string, readonly unknown[]> = new Map()) {
    this.events = new Map(events);
  }

  async queryEvents<TEvent>(query: EventReaderQuery): Promise<TEvent[]> {
    const events = [...(this.events.get(query.eventType) ?? [])];
    const ordered =
      query.order === "descending" ? events.reverse() : events;
    const limited =
      query.limit === undefined ? ordered : ordered.slice(0, query.limit);
    return limited.map((event) => clone(event) as TEvent);
  }
}

export function makeTestMarketConfig(
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
    underlyingTypeTag: "0x2::sui::SUI",
    syTypeTag: "0xb::SY::SY",
    ptTypeTag: "0xc::PT::PT",
    ytTypeTag: "0xd::YT::YT",
    underlyingDecimals: 9,
    marketDecimals: 9,
    ...overrides,
  };
}

export function makeTestPoolFields(
  overrides: Partial<PoolFields> = {},
): PoolFields {
  return {
    id: { id: "0xpool" },
    total_pt: "0",
    total_sy: "0",
    lp_supply: "0",
    last_ln_implied_rate: "0",
    scalar_root: "0",
    initial_anchor: "0",
    ln_fee_rate_root: "0",
    paused: false,
    expiry: "4102444800000",
    ...overrides,
  };
}

export function makeTestPyStateFields(
  overrides: Partial<PyStateFields> = {},
): PyStateFields {
  return {
    id: { id: "0xpy" },
    pt_supply: "0",
    yt_supply: "0",
    sy_balance: "0",
    py_index_stored: "0",
    global_interest_index: "0",
    is_settled: false,
    settled_py_index: "0",
    expiry: "4102444800000",
    market_id: "0xmarket",
    ...overrides,
  };
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function cloneMarketEntry(
  entry: JitterMarketConfigEntry,
): JitterMarketConfigEntry {
  return {
    ...entry,
    config: { ...entry.config },
  };
}

function ownedObjectKey(query: OwnedObjectQuery): string {
  return `${query.owner}:${query.structType}`;
}

const EMPTY_POOL_VOLUME: PoolVolumeStatsSnapshot = {
  volume24hSy: 0n,
  volume7dSy: 0n,
  totalFeesSy: 0n,
  swapCount24h: 0,
  swapCount7d: 0,
};
