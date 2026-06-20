import type {
  JitterMarketConfig,
  PoolFields,
  PyStateFields,
} from "../types.js";

export type OwnedObjectQuery = {
  owner: string;
  structType: string;
  cursor?: string | null;
  limit?: number;
};

export type DynamicFieldObjectQuery = {
  parentId: string;
  cursor?: string | null;
  limit?: number;
};

export type PoolVolumeStatsSnapshot = {
  volume24hSy: bigint;
  volume7dSy: bigint;
  totalFeesSy: bigint;
  swapCount24h: number;
  swapCount7d: number;
};

export interface JitterChainReader {
  getObject<TFields>(objectId: string): Promise<TFields>;
  getPoolState(config: JitterMarketConfig): Promise<PoolFields>;
  getPyState(config: JitterMarketConfig): Promise<PyStateFields>;
  getPoolVolumeStats?(
    config: JitterMarketConfig,
  ): Promise<PoolVolumeStatsSnapshot>;
  getOwnedObjects<TFields>(query: OwnedObjectQuery): Promise<TFields[]>;
  getDynamicFieldObjects<TFields>(
    query: DynamicFieldObjectQuery,
  ): Promise<TFields[]>;
}
