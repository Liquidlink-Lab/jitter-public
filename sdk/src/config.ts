/**
 * @jitter/sdk -- config.ts
 *
 * SDK-maintained market registry. Keep deployed market configs here so apps
 * can bootstrap without carrying their own env-var list.
 */

import type {
  JitterMarketConfig,
  PoolFields,
  PyStateFields,
} from "./types.js";

export type JitterConfigNetwork = "mainnet" | "testnet";
export type JitterConfigNetworkInput = JitterConfigNetwork | "devnet";

export type JitterMarketConfigEntry = {
  id: string;
  name: string;
  network: JitterConfigNetwork;
  chainId: string;
  /**
   * Overrides automatic route readiness detection. Use false for display-only
   * markets whose deployed objects are stale or not yet wired for PTBs.
   */
  tradeReady?: boolean;
  displaySnapshot?: JitterMarketDisplaySnapshot;
  isDefault?: boolean;
  config: JitterMarketConfig;
};

export type JitterMarketDisplaySnapshot = {
  pool: PoolFields;
  pyState: PyStateFields;
  volume?: {
    volume24hSy?: string;
    volume7dSy?: string;
    totalFeesSy?: string;
    swapCount24h?: number;
    swapCount7d?: number;
  };
  underlyingApy?: number;
};

const TESTNET_DEMO_MARKET_CONFIG: JitterMarketConfig = {
  jitterPackageId: "0xee830f28950a54c5410b25a304c3803d5ba44069d6eee882c122fb43aa477264",
  jitterRegistryPackageId: "0x9080895a0f481c6122a94fcd112cd4c2ccf865f128e64487130aca57eae134e1",
  jitterFrameworkPackageId: "0xfb1e1ee1e3b467b577c560fa9ac7357d1396951df41eec9978c08a38024913ec",
  jitterExtensionsPackageId: "0x208be54af3ae34908c64e84cfdab5b67a92d030f05b63faeedfcc8b639807006",
  demoAdapterPackageId: "0x6531f7ed1bb6d8580d1f2b55ed545632ac6964f96dda212a729353e3b5debb4e",
  oraclePackageId: "0x05595049bd68374d3047ea7c742a9ddccad444ddfd1eef0416ebbe1b0946fff9",

  syStateObjectId: "0x01e2aae4c11a7c6b891496e15ca07266e072d3bfbec96afe41c8a98731bd858c",
  globalConfigObjectId: "0xdfed3bb43d23b3ce87c7d562478070fe598b6b0e36091645a5eda3cd445ce4b3",
  rewardDistributorObjectId: "0x67b3530f00d80b97c827d6af341f3c54178f8e475b524f1dee0e5c5b12a1159a",
  marketRegistryObjectId: "0x5d2a4414e6055bbc8878fe3d47080d910f975e48539295f7188e97b3551deb88",
  aclObjectId: "0x157d64b856c0d436c33acda737ba7f9d7c07f803082a291d17da4b3aa5b0733f",

  marketObjectId: "0x0961bcf638b6ad3822939eb49fa8b2c23ac76a85d027a300d8704f423a49a838",
  pyStateObjectId: "0xb585218dbd043346d702eff716452c43509d15f9420f3aed8e860ce8276644a7",
  poolObjectId: "0x793e05b2ac352eaced170cbc0cb70c1244fb156968176fd019d9af94e6a3d5e3",
  orderbookObjectId: null,
  ytOrderbookObjectId: null,
  priceAggregatorObjectId: "0x024951d28940404dcc7f0ed7aaf5e6bad54ef26c83469d7123ea233dbf6f5dab",
  demoMarketVaultObjectId: "0x0cd13164a61af642a2bdc7215b51ab6242e02a0fe26e8b44745e41b6fbdb2b9c",

  underlyingTypeTag: "0xb841aefc7597c010c453da6cd3e4f55ba91a3a459b8ec69bdff4c521335e2156::demo_underlying::DEMO_UNDERLYING",
  syTypeTag: "0xdfb2d5b535686a013d33661e96664cedc51bbcb90970c3ed67659c1fb5549f50::SY::SY",
  ptTypeTag: "0x76f66d0fd7f08eabf829cfd38f3c33d27d16e644d55dd7c826e5549c9dc13455::PT::PT",
  ytTypeTag: "0xacf14657a23e5bc6c6a694b0d195260918dc924222d10887c8a2420f32d2f92a::YT::YT",
  underlyingDecimals: 6,
  marketDecimals: 6,
  rawSyMarketCap: "0",
  assetMarketCap: "0",
  projectId: "demo",
  liquidlink: {
    enabled: true,
    liquidlinkGlobalConfigObjectId: "0x783e14c74e4973a83f22b7c63b45d3a19c49beebefff573c5728a25aa561b63a",
    pointConfigObjectId: "0xeac9bbac1cc9a20f1cc35cc0aeda769083b3955ce182dfc7f84c80b5ea56873c",
    scoreboardObjectId: "0xc72e871ec1b3d90c76a530900b55256f69246b200ebb239e9e7280a5ab84f56f",
    lpPointStateObjectId: "0x8861e7e97df01a69e585910b7de57bebb1f681e271b2e6930cb37fb05ea9964f",
    checkIn: {
      packageId: "0xed177e5217070246e30d181bdb32dc87dadc486c7fe89487cfcdc0803580191a",
      globalConfigObjectId: "0xfcaad1ec082badb6e52391013012285743972de09f992f788fa0b593056c6546",
      campaignObjectId: "0xe581c019fb381016510eadd712e7f0781f05042793ed1d9816def58450d2174b",
      defaultPointsPerCheckIn: "50",
      resetOffsetMs: "46800000",
      dayLengthMs: "86400000",
    },
    ytMultiplierBps: 10000,
    lpMultiplierBps: 10000,
  },
  coinReward: {
    rewardCoinTypeTag: "0xbcfa2cdc5eead060f3148b547244ac686da5ce4c348247c674103e82af9ae3d6::qa_reward::QA_REWARD",
    ytRewarderObjectId: "0x13d653140612ec71e00062752c19825d0939c1b29ab3c28663dd6b901c5ee1de",
    lpRewarderObjectId: "0xfa68f04cffeb06c94652710e92eda1bd3376b29932ba1e646c8bbc0c944e7d1a",
    emissionPerMs: "1",
    fundedAmount: "1000000000",
  },
};

const MAINNET_SCALLOP_SSUI_MARKET_CONFIG: JitterMarketConfig = {
  jitterPackageId: "0x0f1fd761493f6011ba6be55012fac15443a10115eaf158109a52c231cc2c684d",
  jitterRegistryPackageId: "0xf18fbd6b75e1db6b4b901d4a50bc40c5c9cdd7d59a14e68d580b67efab447d3c",
  jitterFrameworkPackageId: "0xee3302aca1669f5245e55bfe8182fa9d2185964856560c89c9f271bb2d923f4f",
  jitterExtensionsPackageId: "0x382734813f4b18418c7f1e21904ba81215da4380ef251df713bd6b08d58c3497",
  demoAdapterPackageId: "",
  scallopAdapterPackageId: "0x101573bcc1c107bd66bc8326b84cd2f11067776f5785604984ddba75f775a9e1",
  scallopProtocolPackageId: "0xde5c09ad171544aa3724dc67216668c80e754860f419136a68d78504eb2e2805",
  oraclePackageId: "0x69f77a0611125c2dec3b75eba583157b0c0d3d582e0eb01d2dff4469b778bf5a",

  syStateObjectId: "0x5850a300671e2c6e3c1624b19ff2748b4c4389158f4f02a5c5ff3d4cab1e67c6",
  globalConfigObjectId: "0x4b9b1e9e41951abdb6d8d0581b0c698b40f87400081557c5d3ca4c92c1c66f6f",
  rewardDistributorObjectId: "0x167f99256bcda4eb792f43bcdc124d9a259d108506e927d5e50b545f49d4e976",
  marketRegistryObjectId: "0x6752787249255ccdbc67b9a2465c20d8889e45d7f69b0f1425dcdd0d5b0de443",
  aclObjectId: "0x19ec7a7e0c52153c3080e9251839eeef20f6a99b64f284e05b2f0e1b58493c58",

  marketObjectId: "0x71d10c7f7c02aad3cddf6e94b750b9dc38fd7b64b2d76ef61a88a7ad1bf2cefd",
  pyStateObjectId: "0xcc556a8d02bdbad7a75d547187900a9e40876ccb4ad52c2ca100b1893e1e37f7",
  poolObjectId: "0x764137161ab1209514b5c88ebb137c046eabb4df62c1568024e3a887f2b8966d",
  orderbookObjectId: null,
  ytOrderbookObjectId: null,
  priceAggregatorObjectId: "0xe1549b6da7b842231e1ab65e62172d84dcc15e1cc98dd0bef7d90875a95cd157",
  demoMarketVaultObjectId: "",
  scallopMarketVaultObjectId: "0x3b8fec9ae63422b637689859597029ce6de90be1f274e8b72ca7ca855a1cbe15",
  scallopMarketObjectId: "0xa757975255146dc9686aa823b7838b507f315d704f428cbadad2f4ea061939d9",
  scallopVersionObjectId: "0x07871c4b3c847a0f674510d4978d5cf6f960452795e8ff6f189fd2088a3f6ac7",

  underlyingTypeTag: "0x2::sui::SUI",
  scallopMarketCoinTypeTag: "0xaafc4f740de0dd0dde642a31148fb94517087052f19afb0f7bed1dc41a50c77b::scallop_sui::SCALLOP_SUI",
  syTypeTag: "0xa62a47bcb68f0fe3a1904602261d0dfa4be3f3f21d88c47369adfa7b1a1330e3::SY::SY",
  ptTypeTag: "0xf67cc731fb2821a3218fad4f93cdb114b86068b31102475efbd968045c717ba8::PT::PT",
  ytTypeTag: "0xc9425608e857383652402ecaadea274151ad6ff5c93db0c05b933ef75cb30564::YT::YT",
  underlyingDecimals: 9,
  marketDecimals: 9,
  rawSyMarketCap: "0",
  assetMarketCap: "0",
  projectId: "scallop",
  liquidlink: {
    enabled: true,
    liquidlinkGlobalConfigObjectId: "0x360a5199d803c1004becacffa8785ba798a6858d25a91fbdd69cc8d73f46c3d5",
    pointConfigObjectId: "0x67b8ac6d4894a3a318b1b2a5671d1a6cae0e10fea7c4cbf392b970031468f2eb",
    scoreboardObjectId: "0x441028526fafacf3ff9929f8328f46208571f9f046e7051ed5302186abacd7f5",
    lpPointStateObjectId: "0xe622b34e66208bb56a31d92a225f12b191b4b02aa8d741b432769b8632a61618",
    checkIn: {
      packageId: "0xf03886dacd7a9a542a1c02ffcfe2dc0b5aa03f3275a6c440e4f9cd10c765cfdb",
      globalConfigObjectId: "0x37b1bbd7a6086ea710cbb7956c2f538b61ab02112a3344a325600c2e5a200c94",
      campaignObjectId: "0x1c8ef20c59ca1627e00e3e355b796c0c2fed9b01fc65bc83309e0df360ad0467",
      defaultPointsPerCheckIn: "1",
      resetOffsetMs: "46800000",
      dayLengthMs: "86400000",
    },
    ytMultiplierBps: 10000,
    lpMultiplierBps: 12000,
    pointDurationMs: "86400000000000000",
  },
};

const STATIC_MAINNET_JITTER_MARKET_CONFIGS = [
  {
    id: "scallop-ssui-2026-09-17",
    name: "Scallop sSUI",
    network: "mainnet",
    chainId: "35834a8a",
    isDefault: true,
    tradeReady: true,
    config: MAINNET_SCALLOP_SSUI_MARKET_CONFIG,
  },
] as const satisfies readonly JitterMarketConfigEntry[];

const STATIC_TESTNET_JITTER_MARKET_CONFIGS = [
  {
    id: "demo",
    name: "Demo Market",
    network: "testnet",
    chainId: "4c78adac",
    isDefault: true,
    config: TESTNET_DEMO_MARKET_CONFIG,
  },
] as const satisfies readonly JitterMarketConfigEntry[];

export const MAINNET_JITTER_MARKET_CONFIGS = withEnvMarketConfigs(
  "mainnet",
  STATIC_MAINNET_JITTER_MARKET_CONFIGS,
);

export const TESTNET_JITTER_MARKET_CONFIGS = withEnvMarketConfigs(
  "testnet",
  STATIC_TESTNET_JITTER_MARKET_CONFIGS,
);

export const JITTER_MARKET_CONFIGS_BY_NETWORK = {
  mainnet: MAINNET_JITTER_MARKET_CONFIGS,
  testnet: TESTNET_JITTER_MARKET_CONFIGS,
} as const satisfies Record<JitterConfigNetwork, readonly JitterMarketConfigEntry[]>;

type EnvMarketConfigPayload =
  | readonly JitterMarketConfigEntry[]
  | Partial<Record<JitterConfigNetwork, readonly JitterMarketConfigEntry[]>>;

function withEnvMarketConfigs(
  network: JitterConfigNetwork,
  staticEntries: readonly JitterMarketConfigEntry[],
): JitterMarketConfigEntry[] {
  const envEntries = readEnvMarketConfigs(network);
  if (envEntries.length === 0) return staticEntries.map(cloneMarketEntry);

  const merged = new Map<string, JitterMarketConfigEntry>();
  for (const entry of staticEntries) {
    merged.set(entry.id, cloneMarketEntry(entry));
  }
  for (const entry of envEntries) {
    merged.set(entry.id, cloneMarketEntry(entry));
  }

  return [...merged.values()];
}

function readEnvMarketConfigs(
  network: JitterConfigNetwork,
): JitterMarketConfigEntry[] {
  const payload = parseEnvMarketConfigPayload(
    process.env[`NEXT_PUBLIC_${network.toUpperCase()}_JITTER_MARKET_CONFIGS_JSON`] ??
      process.env[`${network.toUpperCase()}_JITTER_MARKET_CONFIGS_JSON`] ??
      process.env.NEXT_PUBLIC_JITTER_MARKET_CONFIGS_JSON ??
      process.env.JITTER_MARKET_CONFIGS_JSON,
  );
  if (!payload) return [];

  const rawEntries: readonly unknown[] = Array.isArray(payload)
    ? payload
    : readNetworkEnvEntries(payload, network);
  return rawEntries.flatMap((entry) =>
    isJitterMarketConfigEntry(entry) && entry.network === network
      ? [cloneMarketEntry(entry)]
      : [],
  );
}

function readNetworkEnvEntries(
  payload: EnvMarketConfigPayload,
  network: JitterConfigNetwork,
): readonly unknown[] {
  if (Array.isArray(payload)) return payload;
  const value = (
    payload as Partial<Record<JitterConfigNetwork, readonly unknown[]>>
  )[network];
  return Array.isArray(value) ? value : [];
}

function parseEnvMarketConfigPayload(
  raw: string | undefined,
): EnvMarketConfigPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as readonly JitterMarketConfigEntry[];
    if (parsed && typeof parsed === "object") {
      return parsed as Partial<
        Record<JitterConfigNetwork, readonly JitterMarketConfigEntry[]>
      >;
    }
  } catch {
    return null;
  }
  return null;
}

function isJitterMarketConfigEntry(
  value: unknown,
): value is JitterMarketConfigEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<JitterMarketConfigEntry>;
  return (
    typeof entry.id === "string" &&
    typeof entry.name === "string" &&
    (entry.network === "mainnet" || entry.network === "testnet") &&
    typeof entry.chainId === "string" &&
    Boolean(entry.config) &&
    typeof entry.config === "object"
  );
}

function isRegistryNetwork(
  network: JitterConfigNetworkInput,
): network is JitterConfigNetwork {
  return network === "mainnet" || network === "testnet";
}

function cloneMarketConfig(config: JitterMarketConfig): JitterMarketConfig {
  return { ...config };
}

function cloneMarketEntry(entry: JitterMarketConfigEntry): JitterMarketConfigEntry {
  return {
    ...entry,
    config: cloneMarketConfig(entry.config),
    displaySnapshot: cloneDisplaySnapshot(entry.displaySnapshot),
  };
}

function cloneDisplaySnapshot(
  snapshot: JitterMarketDisplaySnapshot | undefined,
): JitterMarketDisplaySnapshot | undefined {
  return snapshot ? structuredClone(snapshot) : undefined;
}

export function listJitterMarketConfigs(
  network: JitterConfigNetworkInput,
): JitterMarketConfigEntry[] {
  if (!isRegistryNetwork(network)) return [];
  return JITTER_MARKET_CONFIGS_BY_NETWORK[network].map(cloneMarketEntry);
}

export function getJitterMarketConfigEntry(
  network: JitterConfigNetworkInput,
  id: string,
): JitterMarketConfigEntry | null {
  return (
    listJitterMarketConfigs(network).find((entry) => entry.id === id) ?? null
  );
}

export function getDefaultJitterMarketConfigEntry(
  network: JitterConfigNetworkInput,
): JitterMarketConfigEntry | null {
  const configs = listJitterMarketConfigs(network);
  return configs.find((entry) => entry.isDefault) ?? configs[0] ?? null;
}

export function getJitterMarketConfig(
  network: JitterConfigNetworkInput,
  id: string,
): JitterMarketConfig | null {
  return getJitterMarketConfigEntry(network, id)?.config ?? null;
}

export function getDefaultJitterMarketConfig(
  network: JitterConfigNetworkInput,
): JitterMarketConfig | null {
  return getDefaultJitterMarketConfigEntry(network)?.config ?? null;
}
