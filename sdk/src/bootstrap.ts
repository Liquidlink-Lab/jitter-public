/**
 * @jitter/sdk — bootstrap.ts
 *
 * Atomic "create a whole market" PTB. Wraps the AdminCap creation entrypoints a
 * Jitter market needs to end up fully wired for trading:
 *
 *   1. `jitter::market::create_by_ACL`                  — Market<SY,PT,YT>
 *   2. `jitter::py_state::create_py_state_by_ACL`        — PyState<SY>
 *   3. `jitter::pool::create_pool_by_acl`                — Pool<SY> (shares internally)
 *   4. `jitter_oracle::aggregator::create_aggregator_by_ACL` — PriceAggregator<SY>
 *   5. `demo_adapter::demo_market_vault::create_market_vault_by_ACL`
 *        — DemoMarketVault<Underlying,SY,PT,YT> (shares internally, emits seed
 *          QuoteUpdatedEvent)
 *
 * Current implementation uses AdminCap variants and also creates both PT and
 * YT orderbooks. The old ACL names above are kept only in this historical
 * header until the file is regenerated without mojibake comments.
 *
 * Without this bundle, `listJitterMarkets(...)` can discover a half-created
 * market whose aggregator or adapter vault never landed — those markets render
 * read-only on the frontend. Running every step in a single PTB guarantees
 * all five objects are shared (or abort together) before discovery picks them
 * up.
 *
 * The Move code shares Market / PyState for you, but the returned
 * `PriceAggregator<SY>` value still needs a `transfer::public_share_object`.
 * This helper does that for you.
 */

import {
  Transaction,
  type TransactionArgument,
  type TransactionObjectArgument,
} from "@mysten/sui/transactions";

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export type BootstrapMarketParams = {
  /** Caller address. Must own the protocol AdminCap. */
  senderAddress: string;

  /** jitter core package id (declares market / py_state / pool). */
  jitterPackageId: string;
  /** jitter_oracle package id (declares aggregator). */
  jitterOraclePackageId: string;
  /** jitter_math package id (declares fixed point helpers). */
  jitterMathPackageId: string;
  /** demo_adapter package id (declares demo_market_vault). */
  demoAdapterPackageId: string;

  /** Protocol AdminCap object id. */
  adminCapObjectId: string;
  /** Shared GlobalConfig object id. */
  globalConfigObjectId: string;
  /** Shared ACL object id. Kept for older callers; bootstrap setup no longer uses it. */
  aclObjectId?: string;
  /** Fully-qualified type tags: `0x...::module::T`. */
  syTypeTag: string;
  ptTypeTag: string;
  ytTypeTag: string;
  /** Type tag of the underlying coin the adapter vault wraps. */
  underlyingTypeTag: string;

  /** Treasury caps for the three side tokens. Must be owned by sender. */
  syTreasuryCapId: string;
  ptTreasuryCapId: string;
  ytTreasuryCapId: string;

  /** Market expiry timestamp in milliseconds (u64). */
  expiryMs: bigint;

  /** Oracle freshness window for the aggregator (u64 ms). */
  maxStalenessMs: bigint;
  /** Minimum aggregated source weight in bps (u64). */
  minTotalWeightBps: bigint;
  /** Minimum enabled oracle source count (u64). Defaults to 1. */
  minSourceCount?: bigint;
  /** Outlier tolerance threshold in bps (u64). */
  outlierToleranceBps: bigint;

  /** Seed SY index (FP64 raw u128) for the demo vault. Must be > 0. */
  initialSyIndexRaw: bigint;

  /** PyState interest fee rate, FP64 raw. Defaults to 0. */
  yieldInterestFeeRaw?: bigint;
  /** Expiry divisibility guard. Defaults to one day in ms. */
  yieldExpiryDivisorMs?: bigint;
  /** AMM scalar root, signed FP64 raw. */
  ammScalarRootRaw?: bigint;
  /** AMM scalar sign. Defaults to positive. */
  ammScalarRootPositive?: boolean;
  /** AMM initial anchor, signed FP64 raw. */
  ammInitialAnchorRaw?: bigint;
  /** AMM initial anchor sign. Defaults to positive. */
  ammInitialAnchorPositive?: boolean;
  /** AMM ln fee rate root, FP64 raw. */
  ammLnFeeRateRootRaw?: bigint;
  /** AMM protocol/reserve fee share, FP64 raw. */
  ammProtocolFeeRateRaw?: bigint;
  /** Pool raw SY market cap. `0` disables this guard. */
  rawSyMarketCap?: bigint;
  /** Pool indexed asset market cap. `0` disables this guard. */
  assetMarketCap?: bigint;
  /** Treasury address for PyState interest and pool reserve fees. Defaults to sender. */
  treasuryAddress?: string;

  /** Gas budget override. */
  gasBudget?: bigint;
};

const DEFAULT_GAS = BigInt(900_000_000);
const FP64_ONE = BigInt("18446744073709551616");
const DEFAULT_EXPIRY_DIVISOR_MS = BigInt(86_400_000);
const DEFAULT_AMM_SCALAR_ROOT_RAW = FP64_ONE * BigInt(10);
const DEFAULT_AMM_INITIAL_ANCHOR_RAW = FP64_ONE;
const DEFAULT_AMM_LN_FEE_RATE_ROOT_RAW = BigInt("18446744073709551");
const DEFAULT_AMM_PROTOCOL_FEE_RATE_RAW = BigInt("1844674407370955161");
const SUI_CLOCK_ID =
  "0x0000000000000000000000000000000000000000000000000000000000000006";

function fixedPoint64(tx: Transaction, mathPackageId: string, value: bigint): TransactionArgument {
  return tx.moveCall({
    target: `${mathPackageId}::fixed_point64::create_from_raw_value`,
    arguments: [tx.pure.u128(value)],
  }) as TransactionArgument;
}

function fixedPoint64WithSign(
  tx: Transaction,
  mathPackageId: string,
  value: bigint,
  positive = true,
): TransactionArgument {
  return tx.moveCall({
    target: `${mathPackageId}::fixed_point64_with_sign::create_from_raw_value`,
    arguments: [tx.pure.u128(value), tx.pure.bool(positive)],
  }) as TransactionArgument;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Build the atomic bootstrap PTB. Does NOT sign or dispatch.
 *
 * Guarantees:
 *   - On success, on-chain state has a fully-wired (market, py_state, pool,
 *     aggregator, demo vault) tuple that `listJitterMarkets` can discover.
 *   - On any intermediate failure, the entire PTB reverts — discovery never
 *     surfaces a half-created market.
 */
export function buildBootstrapMarketTx(p: BootstrapMarketParams): Transaction {
  const tx = new Transaction();
  tx.setSender(p.senderAddress);
  tx.setGasBudget(p.gasBudget ?? DEFAULT_GAS);

  const sy = p.syTypeTag;
  const pt = p.ptTypeTag;
  const yt = p.ytTypeTag;
  const underlying = p.underlyingTypeTag;
  const treasury = p.treasuryAddress ?? p.senderAddress;

  // 1. Create Market
  const marketObj = tx.moveCall({
    target: `${p.jitterPackageId}::market::create_by_admin_cap`,
    typeArguments: [sy, pt, yt],
    arguments: [
      tx.object(p.adminCapObjectId),
      tx.object(p.globalConfigObjectId),
      tx.pure.u64(p.expiryMs),
      tx.object(p.syTreasuryCapId),
      tx.object(p.ptTreasuryCapId),
      tx.object(p.ytTreasuryCapId),
    ],
  }) as TransactionObjectArgument;

  // Capture market id for downstream calls that want `ID`.
  const marketId = tx.moveCall({
    target: `${p.jitterPackageId}::market::id`,
    typeArguments: [sy, pt, yt],
    arguments: [marketObj],
  });

  // 2. Create PyState (uses the freshly captured market id).
  const pyStateObj = tx.moveCall({
    target: `${p.jitterPackageId}::py_state::create_py_state_by_admin_cap`,
    typeArguments: [sy, pt, yt],
    arguments: [
      tx.object(p.adminCapObjectId),
      tx.object(p.globalConfigObjectId),
      marketObj,
      tx.pure.u128(p.yieldInterestFeeRaw ?? BigInt(0)),
      tx.pure.u64(p.yieldExpiryDivisorMs ?? DEFAULT_EXPIRY_DIVISOR_MS),
      tx.pure.address(treasury),
    ],
  }) as TransactionObjectArgument;

  // 3. Create Pool (shares internally, no return value to capture).
  tx.moveCall({
    target: `${p.jitterPackageId}::pool::create_pool_by_admin`,
    typeArguments: [sy, pt, yt],
    arguments: [
      pyStateObj,
      marketObj,
      tx.object(p.globalConfigObjectId),
      tx.object(p.adminCapObjectId),
      fixedPoint64WithSign(
        tx,
        p.jitterMathPackageId,
        p.ammScalarRootRaw ?? DEFAULT_AMM_SCALAR_ROOT_RAW,
        p.ammScalarRootPositive ?? true,
      ),
      fixedPoint64WithSign(
        tx,
        p.jitterMathPackageId,
        p.ammInitialAnchorRaw ?? DEFAULT_AMM_INITIAL_ANCHOR_RAW,
        p.ammInitialAnchorPositive ?? true,
      ),
      fixedPoint64(tx, p.jitterMathPackageId, p.ammLnFeeRateRootRaw ?? DEFAULT_AMM_LN_FEE_RATE_ROOT_RAW),
      tx.pure.address(treasury),
      fixedPoint64(tx, p.jitterMathPackageId, p.ammProtocolFeeRateRaw ?? DEFAULT_AMM_PROTOCOL_FEE_RATE_RAW),
      tx.pure.u64(p.rawSyMarketCap ?? BigInt(0)),
      tx.pure.u64(p.assetMarketCap ?? BigInt(0)),
      tx.pure.u64(p.expiryMs),
    ],
  });

  // 4. Create OrderBook (shares internally).
  // 5. Create PriceAggregator. Returns the object — share it.
  const aggregatorObj = tx.moveCall({
    target: `${p.jitterOraclePackageId}::aggregator::create_aggregator_by_admin_cap`,
    typeArguments: [sy],
    arguments: [
      tx.object(p.adminCapObjectId),
      marketId,
      tx.pure.u64(p.maxStalenessMs),
      tx.pure.u64(p.minTotalWeightBps),
      tx.pure.u64(p.minSourceCount ?? BigInt(1)),
      tx.pure.u64(p.outlierToleranceBps),
    ],
  }) as TransactionObjectArgument;

  // 6. Create demo adapter market vault (shares internally).
  //    Borrows `&Market` — must come AFTER the aggregator call so we still
  //    have the `marketObj` reference live, and BEFORE the share step below.
  tx.moveCall({
    target: `${p.demoAdapterPackageId}::demo_market_vault::create_market_vault_by_admin`,
    typeArguments: [underlying, sy, pt, yt],
    arguments: [
      tx.object(p.adminCapObjectId),
      marketObj,
      tx.pure.u128(p.initialSyIndexRaw),
      tx.object(SUI_CLOCK_ID),
    ],
  });

  // Share the Market, PyState, and PriceAggregator. Pool + DemoMarketVault
  // are shared by the Move code itself.
  tx.moveCall({
    target: "0x2::transfer::public_share_object",
    typeArguments: [`${p.jitterPackageId}::market::Market<${sy},${pt},${yt}>`],
    arguments: [marketObj],
  });

  tx.moveCall({
    target: "0x2::transfer::public_share_object",
    typeArguments: [`${p.jitterPackageId}::py_state::PyState<${sy}>`],
    arguments: [pyStateObj],
  });

  tx.moveCall({
    target: "0x2::transfer::public_share_object",
    typeArguments: [`${p.jitterOraclePackageId}::aggregator::PriceAggregator<${sy}>`],
    arguments: [aggregatorObj],
  });

  return tx;
}
