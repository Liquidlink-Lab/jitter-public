/**
 * @jitter/sdk — types.ts
 */

import {
  DEMO_ADAPTER_PACKAGE_ID,
  DEMO_MARKET_OBJECT_ID,
  DEMO_MARKET_VAULT_OBJECT_ID,
  DEMO_ORDERBOOK_OBJECT_ID,
  DEMO_POOL_OBJECT_ID,
  DEMO_PRICE_AGGREGATOR_OBJECT_ID,
  DEMO_PT_TYPE_TAG,
  DEMO_PY_STATE_OBJECT_ID,
  DEMO_SY_TYPE_TAG,
  DEMO_UNDERLYING_TYPE_TAG,
  DEMO_YT_ORDERBOOK_OBJECT_ID,
  DEMO_YT_TYPE_TAG,
  JITTER_ACL_OBJECT_ID,
  JITTER_EXTENSIONS_PACKAGE_ID,
  JITTER_FRAMEWORK_PACKAGE_ID,
  JITTER_ORACLE_PACKAGE_ID,
  JITTER_PACKAGE_ID,
  JITTER_SY_STATE_OBJECT_ID,
  SCALLOP_ADAPTER_PACKAGE_ID,
  SCALLOP_MARKET_COIN_TYPE_TAG,
  SCALLOP_MARKET_OBJECT_ID,
  SCALLOP_MARKET_VAULT_OBJECT_ID,
  SCALLOP_PROTOCOL_PACKAGE_ID,
  SCALLOP_VERSION_OBJECT_ID,
} from "./constants.js";
import {
  getDefaultJitterMarketConfig,
  type JitterConfigNetworkInput,
} from "./config.js";

// ---------------------------------------------------------------------------
// Market configuration
// ---------------------------------------------------------------------------

export type JitterMarketConfig = {
  jitterPackageId: string;
  jitterRegistryPackageId?: string;
  jitterFrameworkPackageId?: string;
  jitterExtensionsPackageId?: string;
  demoAdapterPackageId: string;
  scallopAdapterPackageId?: string;
  scallopProtocolPackageId?: string;
  emberAdapterPackageId?: string;
  suilendAdapterPackageId?: string;
  naviAdapterPackageId?: string;
  oraclePackageId: string;

  syStateObjectId: string;
  globalConfigObjectId?: string;
  /** @deprecated AMM/Yield params are embedded in Pool/PyState on current contracts. */
  yieldConfigObjectId?: string;
  /** @deprecated AMM/Yield params are embedded in Pool/PyState on current contracts. */
  ammConfigObjectId?: string;
  rewardDistributorObjectId?: string;
  marketRegistryObjectId?: string;
  aclObjectId: string;

  marketObjectId: string;
  pyStateObjectId: string;
  poolObjectId: string;
  orderbookObjectId?: string | null;
  ytOrderbookObjectId?: string | null;
  priceAggregatorObjectId: string;
  demoMarketVaultObjectId: string;
  scallopMarketVaultObjectId?: string;
  scallopMarketObjectId?: string;
  scallopVersionObjectId?: string;
  emberMarketVaultObjectId?: string;
  emberVaultObjectId?: string;
  suilendMarketVaultObjectId?: string;
  suilendReserveObjectId?: string;
  naviMarketVaultObjectId?: string;
  naviStorageObjectId?: string;
  naviPoolObjectId?: string;
  naviIncentiveV2ObjectId?: string;
  naviIncentiveV3ObjectId?: string;
  naviOracleObjectId?: string;
  naviSuiSystemStateObjectId?: string;
  naviAssetId?: number;

  underlyingTypeTag: string;
  syTypeTag: string;
  ptTypeTag: string;
  ytTypeTag: string;
  scallopMarketCoinTypeTag?: string;
  emberReceiptTypeTag?: string;
  suilendProtocolTypeTag?: string;

  /** Display/accounting decimals for user funding coin amounts. */
  underlyingDecimals?: number;
  /** Display/accounting decimals for SY/PT/YT/LP market amounts. */
  marketDecimals?: number;
  /** Optional USD price hint for one underlying unit. Used for display/portfolio valuation only. */
  underlyingPriceUsd?: number;

  /** Raw SY cap configured on the pool. "0" means disabled. */
  rawSyMarketCap?: string;
  /** Indexed asset exposure cap configured on the pool. "0" means disabled. */
  assetMarketCap?: string;

  /** Project id used to group multiple markets under one points scoreboard. */
  projectId?: string;
  /** Project-level LiquidLink points settings inherited by this market. */
  liquidlink?: JitterLiquidlinkProjectConfig;
  /** Optional no-stake coin rewards for frontend QA and reward distributor integrations. */
  coinReward?: JitterCoinRewardConfig;

  /** @deprecated Use liquidlink.pointConfigObjectId. */
  liquidlinkPointConfigObjectId?: string;
  /** @deprecated Use liquidlink.scoreboardObjectId. */
  liquidlinkScoreboardObjectId?: string;
};

export type JitterLiquidlinkProjectConfig = {
  /** Disabled or missing means this project's markets use normal Jitter calls. */
  enabled?: boolean;
  /** Shared jitter_extensions::liquidlink_points::PointConfig object for the project. */
  pointConfigObjectId?: string;
  /** Shared liquidlink_incentive_system::point_cap::PointCap object for direct point issuers. */
  pointCapObjectId?: string;
  /** Shared liquidlink_incentive_system::global_config::GlobalConfig object. */
  liquidlinkGlobalConfigObjectId?: string;
  /** Shared liquidlink_incentive_system::scoreboard::Scoreboard object. */
  scoreboardObjectId?: string;
  /** Shared jitter_extensions::liquidlink_points::LpPointState object for this market pool. */
  lpPointStateObjectId?: string;
  /** Optional daily check-in campaign config. Missing means check-in is not deployed for this project. */
  checkIn?: JitterCheckInConfig;
  /** Display-only multiplier hint. On-chain source of truth is PointConfig. */
  ytMultiplierBps?: number;
  /** Display-only multiplier hint. On-chain source of truth is PointConfig. */
  lpMultiplierBps?: number;
  /** Display-only duration hint. sSUI raw-unit point configs use 86_400_000 * 1e9. */
  pointDurationMs?: string;
  /** Optional Liquidlink tokenized point market settings. Missing means point trading is not enabled. */
  tokenizedPoint?: JitterLiquidlinkTokenizedPointConfig;
};

export type JitterLiquidlinkTokenizedPointConfig = {
  /** Disabled or missing means the frontend only shows score/claim surfaces. */
  enabled?: boolean;
  /** Optional Liquidlink package override for browser/admin configs. */
  packageId?: string;
  /** Token type used for tokenized points, e.g. 0x...::jitter_point::JITTER_POINT. */
  tokenTypeTag?: string;
  /** Shared liquidlink_incentive_system::project_profile::ProjectProfile. */
  projectProfileObjectId?: string;
  /** Shared liquidlink_incentive_system::token::TreasuryCapStore<T>. */
  treasuryCapStoreObjectId?: string;
  /** Shared liquidlink_incentive_system::token::TokenHoldingRegistry<T>. */
  tokenHoldingRegistryObjectId?: string;
  /** Project profile scale. Example: 1 point -> 1 token unit uses "1". */
  tokenPointScale?: string;
  /** Optional quote token type for Liquidlink orderbook trading. */
  quoteTokenTypeTag?: string;
  /** Shared TreasuryCapStore for quote token. */
  quoteTreasuryCapStoreObjectId?: string;
  /** Shared TokenHoldingRegistry for quote token. */
  quoteTokenHoldingRegistryObjectId?: string;
  /** Shared liquidlink_incentive_system::orderbook::OrderBook<base, quote>. */
  orderbookObjectId?: string;
  /** Optional display label for quote token. */
  quoteSymbol?: string;
};

export type JitterCheckInConfig = {
  /** jitter_check_in package id used for move calls. */
  packageId?: string;
  /** Shared jitter_check_in::check_in::GlobalConfig object. */
  globalConfigObjectId?: string;
  /** Shared jitter_check_in::check_in::CheckInCampaign object. */
  campaignObjectId?: string;
  /** Display hint only. On-chain source of truth is CheckInCampaign. */
  defaultPointsPerCheckIn?: string;
  /** Display hint only. Milliseconds from UTC day start. 21:00 Taipei = 46_800_000. */
  resetOffsetMs?: string;
  /** Display hint only. Defaults to 86_400_000 on-chain. */
  dayLengthMs?: string;
};

const DEFAULT_MARKET_DECIMALS = 6;

export function getMarketUnderlyingDecimals(
  config: JitterMarketConfig | null | undefined,
): number {
  return config?.underlyingDecimals ?? config?.marketDecimals ?? DEFAULT_MARKET_DECIMALS;
}

export function getMarketAccountingDecimals(
  config: JitterMarketConfig | null | undefined,
): number {
  return config?.marketDecimals ?? config?.underlyingDecimals ?? DEFAULT_MARKET_DECIMALS;
}

const DEMO_MARKET_CONFIG_ENTRIES: Array<[string, string]> = [
  ["JITTER_PACKAGE_ID", JITTER_PACKAGE_ID],
  ["DEMO_ADAPTER_PACKAGE_ID", DEMO_ADAPTER_PACKAGE_ID],
  ["JITTER_ORACLE_PACKAGE_ID", JITTER_ORACLE_PACKAGE_ID],
  ["JITTER_SY_STATE_OBJECT_ID", JITTER_SY_STATE_OBJECT_ID],
  ["JITTER_ACL_OBJECT_ID", JITTER_ACL_OBJECT_ID],
  ["DEMO_MARKET_OBJECT_ID", DEMO_MARKET_OBJECT_ID],
  ["DEMO_PY_STATE_OBJECT_ID", DEMO_PY_STATE_OBJECT_ID],
  ["DEMO_POOL_OBJECT_ID", DEMO_POOL_OBJECT_ID],
  ["DEMO_PRICE_AGGREGATOR_OBJECT_ID", DEMO_PRICE_AGGREGATOR_OBJECT_ID],
  ["DEMO_MARKET_VAULT_OBJECT_ID", DEMO_MARKET_VAULT_OBJECT_ID],
  ["DEMO_UNDERLYING_TYPE_TAG", DEMO_UNDERLYING_TYPE_TAG],
  ["DEMO_SY_TYPE_TAG", DEMO_SY_TYPE_TAG],
  ["DEMO_PT_TYPE_TAG", DEMO_PT_TYPE_TAG],
  ["DEMO_YT_TYPE_TAG", DEMO_YT_TYPE_TAG],
];

const SCALLOP_MARKET_CONFIG_ENTRIES: Array<[string, string]> = [
  ["SCALLOP_ADAPTER_PACKAGE_ID", SCALLOP_ADAPTER_PACKAGE_ID],
  ["SCALLOP_MARKET_VAULT_OBJECT_ID", SCALLOP_MARKET_VAULT_OBJECT_ID],
  ["SCALLOP_MARKET_OBJECT_ID", SCALLOP_MARKET_OBJECT_ID],
  ["SCALLOP_VERSION_OBJECT_ID", SCALLOP_VERSION_OBJECT_ID],
];

function resolveDemoMarketConfigNetwork(
  network?: JitterConfigNetworkInput,
): JitterConfigNetworkInput {
  if (network === "mainnet" || network === "testnet" || network === "devnet") {
    return network;
  }

  const envNetwork = process.env.NEXT_PUBLIC_SUI_NETWORK ?? process.env.SUI_NETWORK;
  if (envNetwork === "mainnet" || envNetwork === "testnet" || envNetwork === "devnet") {
    return envNetwork;
  }

  return "testnet";
}

export function getMissingDemoMarketEnvKeys(): string[] {
  return DEMO_MARKET_CONFIG_ENTRIES.filter(([, value]) => !value).map(([key]) => key);
}

function hasAnyDemoMarketEnvValue(): boolean {
  return DEMO_MARKET_CONFIG_ENTRIES.some(([, value]) => Boolean(value));
}

function getEnvDemoMarketConfig(): JitterMarketConfig {
  return {
    jitterPackageId: JITTER_PACKAGE_ID,
    jitterFrameworkPackageId: JITTER_FRAMEWORK_PACKAGE_ID || undefined,
    jitterExtensionsPackageId: JITTER_EXTENSIONS_PACKAGE_ID || undefined,
    demoAdapterPackageId: DEMO_ADAPTER_PACKAGE_ID,
    scallopAdapterPackageId: SCALLOP_ADAPTER_PACKAGE_ID || undefined,
    scallopProtocolPackageId: SCALLOP_PROTOCOL_PACKAGE_ID || undefined,
    oraclePackageId: JITTER_ORACLE_PACKAGE_ID,
    syStateObjectId: JITTER_SY_STATE_OBJECT_ID,
    aclObjectId: JITTER_ACL_OBJECT_ID,
    marketObjectId: DEMO_MARKET_OBJECT_ID,
    pyStateObjectId: DEMO_PY_STATE_OBJECT_ID,
    poolObjectId: DEMO_POOL_OBJECT_ID,
    orderbookObjectId: DEMO_ORDERBOOK_OBJECT_ID || null,
    ytOrderbookObjectId: DEMO_YT_ORDERBOOK_OBJECT_ID || null,
    priceAggregatorObjectId: DEMO_PRICE_AGGREGATOR_OBJECT_ID,
    demoMarketVaultObjectId: DEMO_MARKET_VAULT_OBJECT_ID,
    scallopMarketVaultObjectId: SCALLOP_MARKET_VAULT_OBJECT_ID || undefined,
    scallopMarketObjectId: SCALLOP_MARKET_OBJECT_ID || undefined,
    scallopVersionObjectId: SCALLOP_VERSION_OBJECT_ID || undefined,
    underlyingTypeTag: DEMO_UNDERLYING_TYPE_TAG,
    syTypeTag: DEMO_SY_TYPE_TAG,
    ptTypeTag: DEMO_PT_TYPE_TAG,
    ytTypeTag: DEMO_YT_TYPE_TAG,
    scallopMarketCoinTypeTag: SCALLOP_MARKET_COIN_TYPE_TAG || undefined,
  };
}

export function getMissingScallopMarketEnvKeys(): string[] {
  return SCALLOP_MARKET_CONFIG_ENTRIES.filter(([, value]) => !value).map(([key]) => key);
}

export function getMissingDemoMarketConfigKeys(
  network?: JitterConfigNetworkInput,
): string[] {
  const missingEnvKeys = getMissingDemoMarketEnvKeys();
  if (missingEnvKeys.length === 0) return [];
  if (hasAnyDemoMarketEnvValue()) return missingEnvKeys;

  return getDefaultJitterMarketConfig(resolveDemoMarketConfigNetwork(network))
    ? []
    : missingEnvKeys;
}

export function hasDemoMarketConfig(network?: JitterConfigNetworkInput): boolean {
  return tryGetDemoMarketConfig(network) !== null;
}

export function tryGetDemoMarketConfig(
  network?: JitterConfigNetworkInput,
): JitterMarketConfig | null {
  const missingEnvKeys = getMissingDemoMarketEnvKeys();
  if (missingEnvKeys.length === 0) return getEnvDemoMarketConfig();
  if (hasAnyDemoMarketEnvValue()) return null;

  return getDefaultJitterMarketConfig(resolveDemoMarketConfigNetwork(network));
}

/**
 * Build a JitterMarketConfig from env vars or the SDK-maintained registry.
 * Env vars override registry values when all required values are present.
 */
export function getDemoMarketConfig(
  network?: JitterConfigNetworkInput,
): JitterMarketConfig {
  const missingEnvKeys = getMissingDemoMarketEnvKeys();
  if (missingEnvKeys.length === 0) return getEnvDemoMarketConfig();

  if (hasAnyDemoMarketEnvValue()) {
    throw new Error(
      `Missing Jitter SDK env vars: ${missingEnvKeys.join(", ")}. ` +
        "Set all values via NEXT_PUBLIC_* (browser) or bare names (Node.js), " +
        "or remove the partial env override to use the SDK-maintained config.",
    );
  }

  const resolvedNetwork = resolveDemoMarketConfigNetwork(network);
  const registeredConfig = getDefaultJitterMarketConfig(resolvedNetwork);
  if (registeredConfig) return registeredConfig;

  throw new Error(
    `No SDK-maintained Jitter market config for ${resolvedNetwork}. ` +
      `Set Jitter SDK env vars: ${missingEnvKeys.join(", ")}.`,
  );
}

// ---------------------------------------------------------------------------
// On-chain object field shapes
// ---------------------------------------------------------------------------

export type PyPositionFields = {
  id: { id: string };
  pt_balance: string;
  yt_balance: string;
  index: string;
  py_index: string;
  accrued: string;
  py_state_id: string;
  market_id: string;
  expiry: string;
  created_at: string;
};

export type JitterCoinRewardConfig = {
  rewardCoinTypeTag: string;
  ytRewarderObjectId?: string;
  lpRewarderObjectId?: string;
  emissionPerMs?: string;
  fundedAmount?: string;
};

export type LpPositionFields = {
  id: { id: string };
  lp_amount: string;
  pool_id: string;
  expiry: string;
  created_at: string;
};

export type JitterPositionFields = {
  id: { id: string };
  py_state_id: string;
  market_id: string;
  expiry: string;
  created_at: string;
  py: { fields: Omit<PyPositionFields, "id" | "py_state_id" | "market_id" | "expiry" | "created_at"> };
  lp: { fields: Pick<LpPositionFields, "pool_id" | "lp_amount"> };
};

export type PoolFields = {
  id: { id: string };
  total_pt: string;
  total_sy: string;
  lp_supply: string;
  last_ln_implied_rate: MoveNumericField;
  scalar_root: MoveNumericField;
  initial_anchor: MoveNumericField;
  ln_fee_rate_root: MoveNumericField;
  paused: boolean;
  expiry: string;
};

export type MoveNumericField =
  | string
  | number
  | bigint
  | {
      value: string | number | bigint;
      positive?: boolean;
    };

export type PyStateFields = {
  id: { id: string };
  pt_supply: string;
  yt_supply: string;
  sy_balance: string;
  py_index_stored: string;
  global_interest_index: string;
  is_settled: boolean;
  settled_py_index: string;
  expiry: string;
  market_id: string;
  /** FP64 raw treasury interest accrued (u128 as string). */
  total_treasury_interest?: string;
  /** FP64 raw last collected interest index (u128 as string). */
  last_collect_interest_index?: string;
};

export type DemoMarketVaultFields = {
  id: { id: string };
  market_id: string;
  underlying_balance: string;
  updated_at: string;
};

export type ScallopMarketVaultFields = {
  id: { id: string };
  market_id: string;
  scallop_market_id: string;
  market_coin_balance: string;
  underlying_dust: string;
  updated_at: string;
};

export type SuilendMarketVaultFields = {
  id: { id: string };
  market_id: string;
  reserve_id: string;
  reserve_array_index: string;
  ctoken_balance: string;
  updated_at: string;
};

export type NaviMarketVaultFields = {
  id: { id: string };
  market_id: string;
  navi_storage_id: string;
  navi_pool_id: string;
  asset_id: number | string;
  total_underlying_deposited: string;
  total_underlying_withdrawn: string;
  updated_at: string;
};
