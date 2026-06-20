/**
 * @jitter/sdk — constants.ts
 */

export const SUI_CLOCK_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000006";

export const SUI_TYPE_TAG = "0x2::sui::SUI";

/** FP64 representation of 1.0 = 2^64 */
export const FP64_ONE: bigint = BigInt("18446744073709551616");

/**
 * Default SY index for the demo adapter (1.0 in FP64).
 * Increase to simulate yield accrual. e.g. 1.05 * FP64_ONE = 5% yield.
 */
export const DEFAULT_DEMO_SY_INDEX: bigint = FP64_ONE;

// ---------------------------------------------------------------------------
// Package IDs (sourced from NEXT_PUBLIC_* env vars — works in both
// Next.js and Node.js; in Node.js set the vars without the prefix)
// ---------------------------------------------------------------------------
export const JITTER_PACKAGE_ID =
  process.env.NEXT_PUBLIC_JITTER_PACKAGE_ID ?? process.env.JITTER_PACKAGE_ID ?? "";

export const JITTER_EXTENSIONS_PACKAGE_ID =
  process.env.NEXT_PUBLIC_JITTER_EXTENSIONS_PACKAGE_ID ?? process.env.JITTER_EXTENSIONS_PACKAGE_ID ?? "";

export const JITTER_FRAMEWORK_PACKAGE_ID =
  process.env.NEXT_PUBLIC_JITTER_FRAMEWORK_PACKAGE_ID ?? process.env.JITTER_FRAMEWORK_PACKAGE_ID ?? "";

export const DEMO_ADAPTER_PACKAGE_ID =
  process.env.NEXT_PUBLIC_DEMO_ADAPTER_PACKAGE_ID ?? process.env.DEMO_ADAPTER_PACKAGE_ID ?? "";

export const SCALLOP_ADAPTER_PACKAGE_ID =
  process.env.NEXT_PUBLIC_SCALLOP_ADAPTER_PACKAGE_ID ?? process.env.SCALLOP_ADAPTER_PACKAGE_ID ?? "";

export const SCALLOP_PROTOCOL_PACKAGE_ID =
  process.env.NEXT_PUBLIC_SCALLOP_PROTOCOL_PACKAGE_ID ??
  process.env.SCALLOP_PROTOCOL_PACKAGE_ID ??
  "0xde5c09ad171544aa3724dc67216668c80e754860f419136a68d78504eb2e2805";

export const JITTER_ADMIN_PACKAGE_ID =
  process.env.NEXT_PUBLIC_JITTER_ADMIN_PACKAGE_ID ?? process.env.JITTER_ADMIN_PACKAGE_ID ?? "";

export const JITTER_ORACLE_PACKAGE_ID =
  process.env.NEXT_PUBLIC_JITTER_ORACLE_PACKAGE_ID ?? process.env.JITTER_ORACLE_PACKAGE_ID ?? "";

export const JITTER_MATH_PACKAGE_ID =
  process.env.NEXT_PUBLIC_JITTER_MATH_PACKAGE_ID ?? process.env.JITTER_MATH_PACKAGE_ID ?? "";

// ---------------------------------------------------------------------------
// Shared object IDs
// ---------------------------------------------------------------------------
export const JITTER_SY_STATE_OBJECT_ID =
  process.env.NEXT_PUBLIC_JITTER_SY_STATE_OBJECT_ID ?? process.env.JITTER_SY_STATE_OBJECT_ID ?? "";

export const JITTER_YIELD_CONFIG_OBJECT_ID =
  process.env.NEXT_PUBLIC_JITTER_YIELD_CONFIG_OBJECT_ID ?? process.env.JITTER_YIELD_CONFIG_OBJECT_ID ?? "";

export const JITTER_AMM_CONFIG_OBJECT_ID =
  process.env.NEXT_PUBLIC_JITTER_AMM_CONFIG_OBJECT_ID ?? process.env.JITTER_AMM_CONFIG_OBJECT_ID ?? "";

export const JITTER_ACL_OBJECT_ID =
  process.env.NEXT_PUBLIC_JITTER_ACL_OBJECT_ID ?? process.env.JITTER_ACL_OBJECT_ID ?? "";

// ---------------------------------------------------------------------------
// Demo market object IDs
// ---------------------------------------------------------------------------
export const DEMO_MARKET_OBJECT_ID =
  process.env.NEXT_PUBLIC_DEMO_MARKET_OBJECT_ID ?? process.env.DEMO_MARKET_OBJECT_ID ?? "";

export const DEMO_PY_STATE_OBJECT_ID =
  process.env.NEXT_PUBLIC_DEMO_PY_STATE_OBJECT_ID ?? process.env.DEMO_PY_STATE_OBJECT_ID ?? "";

export const DEMO_POOL_OBJECT_ID =
  process.env.NEXT_PUBLIC_DEMO_POOL_OBJECT_ID ?? process.env.DEMO_POOL_OBJECT_ID ?? "";

export const DEMO_ORDERBOOK_OBJECT_ID =
  process.env.NEXT_PUBLIC_DEMO_ORDERBOOK_OBJECT_ID ?? process.env.DEMO_ORDERBOOK_OBJECT_ID ?? "";

export const DEMO_YT_ORDERBOOK_OBJECT_ID =
  process.env.NEXT_PUBLIC_DEMO_YT_ORDERBOOK_OBJECT_ID ?? process.env.DEMO_YT_ORDERBOOK_OBJECT_ID ?? "";

export const DEMO_PRICE_AGGREGATOR_OBJECT_ID =
  process.env.NEXT_PUBLIC_DEMO_PRICE_AGGREGATOR_OBJECT_ID ?? process.env.DEMO_PRICE_AGGREGATOR_OBJECT_ID ?? "";

export const DEMO_MARKET_VAULT_OBJECT_ID =
  process.env.NEXT_PUBLIC_DEMO_MARKET_VAULT_OBJECT_ID ?? process.env.DEMO_MARKET_VAULT_OBJECT_ID ?? "";

export const SCALLOP_MARKET_OBJECT_ID =
  process.env.NEXT_PUBLIC_SCALLOP_MARKET_OBJECT_ID ??
  process.env.SCALLOP_MARKET_OBJECT_ID ??
  "0xa757975255146dc9686aa823b7838b507f315d704f428cbadad2f4ea061939d9";

export const SCALLOP_VERSION_OBJECT_ID =
  process.env.NEXT_PUBLIC_SCALLOP_VERSION_OBJECT_ID ??
  process.env.SCALLOP_VERSION_OBJECT_ID ??
  "0x07871c4b3c847a0f674510d4978d5cf6f960452795e8ff6f189fd2088a3f6ac7";

export const SCALLOP_MARKET_VAULT_OBJECT_ID =
  process.env.NEXT_PUBLIC_SCALLOP_MARKET_VAULT_OBJECT_ID ??
  process.env.SCALLOP_MARKET_VAULT_OBJECT_ID ??
  "";

// ---------------------------------------------------------------------------
// Demo market type tags
// ---------------------------------------------------------------------------
export const DEMO_UNDERLYING_TYPE_TAG =
  process.env.NEXT_PUBLIC_DEMO_UNDERLYING_TYPE_TAG ?? process.env.DEMO_UNDERLYING_TYPE_TAG ?? "";

export const DEMO_SY_TYPE_TAG =
  process.env.NEXT_PUBLIC_DEMO_SY_TYPE_TAG ?? process.env.DEMO_SY_TYPE_TAG ?? "";

export const DEMO_PT_TYPE_TAG =
  process.env.NEXT_PUBLIC_DEMO_PT_TYPE_TAG ?? process.env.DEMO_PT_TYPE_TAG ?? "";

export const DEMO_YT_TYPE_TAG =
  process.env.NEXT_PUBLIC_DEMO_YT_TYPE_TAG ?? process.env.DEMO_YT_TYPE_TAG ?? "";

export const SCALLOP_MARKET_COIN_TYPE_TAG =
  process.env.NEXT_PUBLIC_SCALLOP_MARKET_COIN_TYPE_TAG ??
  process.env.SCALLOP_MARKET_COIN_TYPE_TAG ??
  "";

export const SCALLOP_TESTNET_USDC_TYPE_TAG =
  "0xfacbeda4e0bef2ba45f295d27b4eaaed116f5ff5b5c61dbf6eccaae044b7c70e::usdc::USDC";

export const SCALLOP_TESTNET_SUI_TYPE_TAG = SUI_TYPE_TAG;
