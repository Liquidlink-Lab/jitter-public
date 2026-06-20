import type {
  JitterConfigNetworkInput,
  JitterMarketConfigEntry,
} from "../config.js";

export interface JitterMarketConfigProvider {
  listMarketConfigEntries(
    network: JitterConfigNetworkInput,
  ): readonly JitterMarketConfigEntry[];
  getDefaultMarketConfigEntry(
    network: JitterConfigNetworkInput,
  ): JitterMarketConfigEntry | null;
  getMarketConfigEntry(
    network: JitterConfigNetworkInput,
    id: string,
  ): JitterMarketConfigEntry | null;
}
