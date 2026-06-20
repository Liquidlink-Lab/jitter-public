import {
  getPoolState as queryPoolState,
  getPoolVolumeStats as queryPoolVolumeStats,
  getPyState as queryPyState,
} from "../queries.js";
import { grpcRequest, type GrpcNetworkKind } from "../rpc.js";
import type {
  DynamicFieldObjectQuery,
  JitterChainReader,
  OwnedObjectQuery,
  PoolVolumeStatsSnapshot,
} from "../ports/chain-reader.js";
import type {
  JitterMarketConfig,
  PoolFields,
  PyStateFields,
} from "../types.js";

export type SuiJitterChainReaderDelegates = {
  getObject?: <TFields>(
    network: GrpcNetworkKind,
    objectId: string,
  ) => Promise<TFields>;
  getPoolState?: (
    network: GrpcNetworkKind,
    config: JitterMarketConfig,
  ) => Promise<PoolFields>;
  getPyState?: (
    network: GrpcNetworkKind,
    config: JitterMarketConfig,
  ) => Promise<PyStateFields>;
  getPoolVolumeStats?: (
    network: GrpcNetworkKind,
    config: JitterMarketConfig,
  ) => Promise<PoolVolumeStatsSnapshot>;
  getOwnedObjects?: <TFields>(
    network: GrpcNetworkKind,
    query: OwnedObjectQuery,
  ) => Promise<TFields[]>;
  getDynamicFieldObjects?: <TFields>(
    network: GrpcNetworkKind,
    query: DynamicFieldObjectQuery,
  ) => Promise<TFields[]>;
};

export class SuiJitterChainReader implements JitterChainReader {
  constructor(
    private readonly network: GrpcNetworkKind,
    private readonly delegates: SuiJitterChainReaderDelegates = {},
  ) {}

  getObject<TFields>(objectId: string): Promise<TFields> {
    const getObject = this.delegates.getObject ?? defaultGetObject;
    return getObject<TFields>(this.network, objectId);
  }

  getPoolState(config: JitterMarketConfig): Promise<PoolFields> {
    const getPoolState = this.delegates.getPoolState ?? queryPoolState;
    return getPoolState(this.network, config);
  }

  getPyState(config: JitterMarketConfig): Promise<PyStateFields> {
    const getPyState = this.delegates.getPyState ?? queryPyState;
    return getPyState(this.network, config);
  }

  getPoolVolumeStats(
    config: JitterMarketConfig,
  ): Promise<PoolVolumeStatsSnapshot> {
    const getPoolVolumeStats =
      this.delegates.getPoolVolumeStats ?? queryPoolVolumeStats;
    return getPoolVolumeStats(this.network, config);
  }

  getOwnedObjects<TFields>(query: OwnedObjectQuery): Promise<TFields[]> {
    const getOwnedObjects =
      this.delegates.getOwnedObjects ?? defaultGetOwnedObjects;
    return getOwnedObjects<TFields>(this.network, query);
  }

  getDynamicFieldObjects<TFields>(
    query: DynamicFieldObjectQuery,
  ): Promise<TFields[]> {
    const getDynamicFieldObjects =
      this.delegates.getDynamicFieldObjects ?? defaultGetDynamicFieldObjects;
    return getDynamicFieldObjects<TFields>(this.network, query);
  }
}

async function defaultGetObject<TFields>(
  network: GrpcNetworkKind,
  objectId: string,
): Promise<TFields> {
  const response = await grpcRequest<{
    data: { content: { fields: TFields } };
  }>(network, "sui_getObject", [objectId, { showContent: true }]);
  return response.data.content.fields;
}

async function defaultGetOwnedObjects<TFields>(
  network: GrpcNetworkKind,
  query: OwnedObjectQuery,
): Promise<TFields[]> {
  const response = await grpcRequest<{
    data: Array<{ data: { content: { fields: TFields } } }>;
  }>(network, "suix_getOwnedObjects", [
    query.owner,
    {
      filter: { StructType: query.structType },
      options: { showContent: true },
    },
    query.cursor ?? null,
    query.limit ?? 50,
  ]);

  return response.data.map((item) => item.data.content.fields);
}

async function defaultGetDynamicFieldObjects<TFields>(
  network: GrpcNetworkKind,
  query: DynamicFieldObjectQuery,
): Promise<TFields[]> {
  const objectIds: string[] = [];
  let cursor = query.cursor ?? null;
  const limit = query.limit ?? 50;

  do {
    const response = await grpcRequest<{
      data: Array<{ objectId: string }>;
      nextCursor?: string | null;
      hasNextPage?: boolean;
    }>(network, "suix_getDynamicFields", [
      query.parentId,
      cursor,
      limit,
    ]);

    objectIds.push(...response.data.map((field) => field.objectId));
    cursor = response.hasNextPage ? response.nextCursor ?? null : null;
  } while (cursor);

  return Promise.all(
    objectIds.map((objectId) => defaultGetObject<TFields>(network, objectId)),
  );
}
