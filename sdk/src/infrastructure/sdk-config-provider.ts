import {
  getDefaultJitterMarketConfigEntry,
  getJitterMarketConfigEntry,
  listJitterMarketConfigs,
  type JitterConfigNetworkInput,
  type JitterMarketConfigEntry,
} from "../config.js";
import type { JitterMarketConfigProvider } from "../ports/config-provider.js";

export class SdkJitterMarketConfigProvider
  implements JitterMarketConfigProvider
{
  listMarketConfigEntries(
    network: JitterConfigNetworkInput,
  ): readonly JitterMarketConfigEntry[] {
    return listJitterMarketConfigs(network);
  }

  getDefaultMarketConfigEntry(
    network: JitterConfigNetworkInput,
  ): JitterMarketConfigEntry | null {
    return getDefaultJitterMarketConfigEntry(network);
  }

  getMarketConfigEntry(
    network: JitterConfigNetworkInput,
    id: string,
  ): JitterMarketConfigEntry | null {
    return getJitterMarketConfigEntry(network, id);
  }
}
