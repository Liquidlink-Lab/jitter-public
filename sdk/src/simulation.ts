/**
 * @jitter/sdk — simulation.ts
 *
 * Read-only quote functions using the on-chain `offchain` module.
 * Each function builds a Transaction, runs it through the Sui Core simulation
 * API (no signature needed), and decodes the BCS return values.
 *
 * All amounts are in raw u64 token units unless stated otherwise.
 * Prices/indices are FP64 u128 raw values.
 */

import { bcs } from "@mysten/sui/bcs";
import { Transaction } from "@mysten/sui/transactions";

import { FP64_ONE } from "./constants.js";
import { getPoolState, getPyState, getScallopMarketIndex } from "./queries.js";
import { getSuiGrpcClient, type GrpcNetworkKind } from "./rpc.js";
import type { JitterMarketConfig } from "./types.js";

// ---------------------------------------------------------------------------
// Simulation core
// ---------------------------------------------------------------------------

type SimulationCommandResult = {
  returnValues?: Array<{ bcs: Uint8Array | null }>;
};

type SimulationReturnValue = NonNullable<
  SimulationCommandResult["returnValues"]
>[number];

async function simulate(
  network: GrpcNetworkKind,
  tx: Transaction,
): Promise<SimulationCommandResult[]> {
  const result = await getSuiGrpcClient(network).simulateTransaction({
    transaction: tx,
    checksEnabled: false,
    include: { commandResults: true },
  });

  if (result.$kind === "FailedTransaction") {
    const error = result.FailedTransaction.status.error;
    throw new Error(`Transaction simulation failed: ${error?.message ?? "unknown error"}`);
  }

  return result.commandResults ?? [];
}

function decodeU64(results: SimulationCommandResult[], callIndex = 0): bigint {
  return decodeRequiredU64(results[callIndex]?.returnValues?.[0], callIndex);
}

function decodeU128(results: SimulationCommandResult[], callIndex = 0): bigint {
  const rv = results[callIndex]?.returnValues?.[0]?.bcs;
  if (!rv) throw new Error(`No return value at index ${callIndex}`);
  return BigInt(bcs.u128().parse(rv));
}

function decodeBool(results: SimulationCommandResult[], callIndex = 0): boolean {
  const rv = results[callIndex]?.returnValues?.[0]?.bcs;
  if (!rv) throw new Error(`No return value at index ${callIndex}`);
  return bcs.bool().parse(rv);
}

function decodeRequiredU64(
  value: SimulationReturnValue | undefined,
  callIndex: number,
): bigint {
  if (!value?.bcs) throw new Error(`No return value at index ${callIndex}`);
  return BigInt(bcs.u64().parse(value.bcs));
}

function decodeOptionalU64(
  value: SimulationReturnValue | undefined,
): bigint {
  return value?.bcs ? BigInt(bcs.u64().parse(value.bcs)) : 0n;
}

function mulDivFloor(a: bigint, b: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) return 0n;
  return (a * b) / denominator;
}

function sqrtBigInt(value: bigint): bigint {
  if (value <= 0n) return 0n;
  let x0 = value;
  let x1 = (x0 + 1n) >> 1n;
  while (x1 < x0) {
    x0 = x1;
    x1 = (x1 + value / x1) >> 1n;
  }
  return x0;
}

function hasScallopRouteConfigured(config: JitterMarketConfig): boolean {
  return Boolean(
    config.scallopAdapterPackageId &&
      config.scallopMarketVaultObjectId &&
      config.scallopMarketObjectId &&
      config.scallopVersionObjectId,
  );
}

async function resolveQuoteSyIndex(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  override?: bigint,
): Promise<bigint> {
  if (override !== undefined) return override;
  if (hasScallopRouteConfigured(config)) {
    const scallopIndex = await getScallopMarketIndex(network, config);
    return BigInt(scallopIndex.syIndexRaw);
  }
  const state = await getPyState(network, config);
  const storedIndex = BigInt(state.py_index_stored ?? 0);
  return storedIndex > 0n ? storedIndex : FP64_ONE;
}

function estimateLpOutByPoolMath(
  totalLp: bigint,
  totalSy: bigint,
  totalPt: bigint,
  syIn: bigint,
  ptIn: bigint,
): bigint {
  if (syIn <= 0n || ptIn <= 0n) return 0n;

  if (totalLp === 0n) {
    return sqrtBigInt(syIn * ptIn);
  }

  if (totalSy <= 0n || totalPt <= 0n) {
    return 0n;
  }

  const syRatio = mulDivFloor(syIn, totalLp, totalSy);
  const ptRatio = mulDivFloor(ptIn, totalLp, totalPt);
  return syRatio < ptRatio ? syRatio : ptRatio;
}

function requireGlobalConfigObjectId(config: JitterMarketConfig): string {
  if (!config.globalConfigObjectId) {
    throw new Error("Jitter quote simulation requires globalConfigObjectId in market config.");
  }
  return config.globalConfigObjectId;
}

// ---------------------------------------------------------------------------
// Quote types
// ---------------------------------------------------------------------------

export type QuoteSwapSyForPt = {
  ptOut: bigint;
  slippageBps: bigint;
};

export type QuoteSwapPtForSy = {
  syOut: bigint;
  slippageBps: bigint;
};

export type QuoteSwapSyForExactPt = {
  syIn: bigint;
  slippageBps: bigint;
};

export type QuoteSwapPtForExactSy = {
  ptIn: bigint;
};

export type QuoteSwapSyForYt = {
  ytOut: bigint;
  syRefund: bigint;
  slippageBps: bigint;
};

export type QuoteSwapSyForExactYt = {
  syIn: bigint;
  syToMint: bigint;
  syRefund: bigint;
  slippageBps: bigint;
};

export type QuoteSwapYtForSy = {
  syOut: bigint;
  syRedeemOut: bigint;
  syRepaid: bigint;
  slippageBps: bigint;
};

export type QuotePrices = {
  ptPrice: bigint;
  ytPrice: bigint;
};

export type QuoteLpValue = {
  syValue: bigint;
  ptValue: bigint;
  value: bigint;
};

export type QuoteAddLiquidity = {
  lpOut: bigint;
  pairedPt: bigint;
};

export type QuoteAddLiquidityZap = QuoteAddLiquidity & {
  ptFromSwap: bigint;
  slippageBps: bigint;
  syForLiquidity: bigint;
  syToSwap: bigint;
};

export type QuoteAddLiquidityKeepYt = QuoteAddLiquidity & {
  syToMint: bigint;
  syForLiquidity: bigint;
  keptYt: bigint;
};

export type QuoteAddLiquidityFromSy = QuoteAddLiquidityKeepYt & {
  slippageBps: bigint;
  syOut: bigint;
  syRedeemOut: bigint;
  syRepaid: bigint;
  ytToSell: bigint;
};

export type QuoteClaimableInterest = {
  interest: bigint;
};

// ---------------------------------------------------------------------------
// Individual quote functions
// ---------------------------------------------------------------------------

/** Estimate PT received for exact SY in, with slippage bps. */
export async function quoteSwapSyForPt(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  syIn: bigint,
  syIndex?: bigint,
): Promise<QuoteSwapSyForPt> {
  const tx = new Transaction();
  const syIndexRaw = await resolveQuoteSyIndex(network, config, syIndex);
  const globalConfigObjectId = requireGlobalConfigObjectId(config);

  tx.moveCall({
    target: `${config.jitterPackageId}::offchain::estimate_swap_sy_for_pt`,
    arguments: [
      tx.object(globalConfigObjectId),
      tx.pure.u64(syIn),
      tx.pure.u128(syIndexRaw),
      tx.object(config.poolObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });

  tx.moveCall({
    target: `${config.jitterPackageId}::offchain::estimate_swap_sy_for_pt_slippage_bps`,
    arguments: [
      tx.object(globalConfigObjectId),
      tx.pure.u64(syIn),
      tx.pure.u128(syIndexRaw),
      tx.object(config.poolObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });

  const results = await simulate(network, tx);
  return { ptOut: decodeU64(results, 0), slippageBps: decodeU64(results, 1) };
}

/** Estimate SY received for exact PT in, with slippage bps. */
export async function quoteSwapPtForSy(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  ptIn: bigint,
  syIndex?: bigint,
): Promise<QuoteSwapPtForSy> {
  const tx = new Transaction();
  const syIndexRaw = await resolveQuoteSyIndex(network, config, syIndex);
  const globalConfigObjectId = requireGlobalConfigObjectId(config);

  tx.moveCall({
    target: `${config.jitterPackageId}::offchain::estimate_swap_pt_for_sy`,
    arguments: [
      tx.object(globalConfigObjectId),
      tx.pure.u64(ptIn),
      tx.pure.u128(syIndexRaw),
      tx.object(config.poolObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });

  tx.moveCall({
    target: `${config.jitterPackageId}::offchain::estimate_swap_pt_for_sy_slippage_bps`,
    arguments: [
      tx.object(globalConfigObjectId),
      tx.pure.u64(ptIn),
      tx.pure.u128(syIndexRaw),
      tx.object(config.poolObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });

  const results = await simulate(network, tx);
  return { syOut: decodeU64(results, 0), slippageBps: decodeU64(results, 1) };
}

/** Estimate SY needed to receive exact PT out. */
export async function quoteSwapSyForExactPt(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  ptOut: bigint,
  syIndex?: bigint,
): Promise<QuoteSwapSyForExactPt> {
  const tx = new Transaction();
  const syIndexRaw = await resolveQuoteSyIndex(network, config, syIndex);
  const globalConfigObjectId = requireGlobalConfigObjectId(config);

  tx.moveCall({
    target: `${config.jitterPackageId}::offchain::estimate_swap_sy_for_exact_pt`,
    arguments: [
      tx.object(globalConfigObjectId),
      tx.pure.u64(ptOut),
      tx.pure.u128(syIndexRaw),
      tx.object(config.poolObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });

  tx.moveCall({
    target: `${config.jitterPackageId}::offchain::estimate_swap_sy_for_exact_pt_slippage_bps`,
    arguments: [
      tx.object(globalConfigObjectId),
      tx.pure.u64(ptOut),
      tx.pure.u128(syIndexRaw),
      tx.object(config.poolObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });

  const results = await simulate(network, tx);
  return {
    syIn: decodeU64(results, 0),
    slippageBps: decodeU64(results, 1),
  };
}

/** Estimate PT needed to receive exact SY out. */
export async function quoteSwapPtForExactSy(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  syOut: bigint,
  syIndex?: bigint,
): Promise<QuoteSwapPtForExactSy> {
  const tx = new Transaction();
  const syIndexRaw = await resolveQuoteSyIndex(network, config, syIndex);
  const globalConfigObjectId = requireGlobalConfigObjectId(config);

  tx.moveCall({
    target: `${config.jitterPackageId}::offchain::estimate_swap_pt_for_exact_sy`,
    arguments: [
      tx.object(globalConfigObjectId),
      tx.pure.u64(syOut),
      tx.pure.u128(syIndexRaw),
      tx.object(config.poolObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });

  const results = await simulate(network, tx);
  return { ptIn: decodeU64(results, 0) };
}

/** Estimate YT received for exact SY in, plus returned SY change and slippage. */
export async function quoteSwapSyForYt(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  syIn: bigint,
  syIndex: bigint,
): Promise<QuoteSwapSyForYt> {
  const tx = new Transaction();
  const globalConfigObjectId = requireGlobalConfigObjectId(config);

  // returns (yt_out, sy_change)
  tx.moveCall({
    target: `${config.jitterPackageId}::offchain::estimate_swap_sy_for_yt`,
    arguments: [
      tx.object(globalConfigObjectId),
      tx.pure.u64(syIn),
      tx.pure.u128(syIndex),
      tx.object(config.pyStateObjectId),
      tx.object(config.poolObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });

  tx.moveCall({
    target: `${config.jitterPackageId}::offchain::estimate_swap_sy_for_yt_slippage_bps`,
    arguments: [
      tx.object(globalConfigObjectId),
      tx.pure.u64(syIn),
      tx.pure.u128(syIndex),
      tx.object(config.pyStateObjectId),
      tx.object(config.poolObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });

  const results = await simulate(network, tx);
  // result[0] returns (yt_out, sy_refund) tuple — first two return values
  const rv0 = results[0]?.returnValues;
  const ytOut = decodeOptionalU64(rv0?.[0]);
  const syRefund = decodeOptionalU64(rv0?.[1]);
  const slippageBps = decodeU64(results, 1);
  return { ytOut, syRefund, slippageBps };
}

/** Estimate net SY needed to receive exact YT out, with full breakdown. */
export async function quoteSwapSyForExactYt(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  ytOut: bigint,
  syIndex: bigint,
): Promise<QuoteSwapSyForExactYt> {
  const tx = new Transaction();
  const globalConfigObjectId = requireGlobalConfigObjectId(config);

  // returns (sy_to_mint, sy_from_pt_sale, net_sy_in)
  tx.moveCall({
    target: `${config.jitterPackageId}::offchain::estimate_swap_sy_for_exact_yt`,
    arguments: [
      tx.object(globalConfigObjectId),
      tx.pure.u64(ytOut),
      tx.pure.u128(syIndex),
      tx.object(config.pyStateObjectId),
      tx.object(config.poolObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });

  tx.moveCall({
    target: `${config.jitterPackageId}::offchain::estimate_swap_sy_for_exact_yt_slippage_bps`,
    arguments: [
      tx.object(globalConfigObjectId),
      tx.pure.u64(ytOut),
      tx.pure.u128(syIndex),
      tx.object(config.pyStateObjectId),
      tx.object(config.poolObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });

  const results = await simulate(network, tx);
  const rv0 = results[0]?.returnValues;
  const syToMint = decodeOptionalU64(rv0?.[0]);
  const syRefund = decodeOptionalU64(rv0?.[1]);
  const syIn = decodeOptionalU64(rv0?.[2]);
  const slippageBps = decodeU64(results, 1);
  return { syIn, syToMint, syRefund, slippageBps };
}

/** Estimate SY received for exact YT in, net of the PT settlement leg. */
export async function quoteSwapYtForSy(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  ytIn: bigint,
  syIndex: bigint,
): Promise<QuoteSwapYtForSy> {
  const tx = new Transaction();
  const globalConfigObjectId = requireGlobalConfigObjectId(config);

  tx.moveCall({
    target: `${config.jitterPackageId}::offchain::estimate_swap_yt_for_sy`,
    arguments: [
      tx.object(globalConfigObjectId),
      tx.pure.u64(ytIn),
      tx.pure.u128(syIndex),
      tx.object(config.pyStateObjectId),
      tx.object(config.poolObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });

  tx.moveCall({
    target: `${config.jitterPackageId}::offchain::estimate_swap_yt_for_sy_slippage_bps`,
    arguments: [
      tx.object(globalConfigObjectId),
      tx.pure.u64(ytIn),
      tx.pure.u128(syIndex),
      tx.object(config.pyStateObjectId),
      tx.object(config.poolObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });

  const results = await simulate(network, tx);
  const rv0 = results[0]?.returnValues;
  const syOut = decodeOptionalU64(rv0?.[0]);
  const syRedeemOut = decodeOptionalU64(rv0?.[1]);
  const syRepaid = decodeOptionalU64(rv0?.[2]);
  const slippageBps = decodeU64(results, 1);
  return { syOut, syRedeemOut, syRepaid, slippageBps };
}

/** Estimate current PT and YT prices as FP64 u128. */
export async function quotePrices(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  syIndex: bigint,
): Promise<QuotePrices> {
  const tx = new Transaction();
  const globalConfigObjectId = requireGlobalConfigObjectId(config);

  tx.moveCall({
    target: `${config.jitterPackageId}::offchain::estimate_pt_price`,
    arguments: [
      tx.object(globalConfigObjectId),
      tx.object(config.poolObjectId),
      tx.pure.u128(syIndex),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });

  tx.moveCall({
    target: `${config.jitterPackageId}::offchain::estimate_yt_price`,
    arguments: [
      tx.object(globalConfigObjectId),
      tx.pure.u128(syIndex),
      tx.object(config.pyStateObjectId),
      tx.object(config.poolObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });

  const results = await simulate(network, tx);
  return {
    ptPrice: decodeU128(results, 0),
    ytPrice: decodeU128(results, 1),
  };
}

/** Estimate SY value of LP tokens. */
export async function quoteLpValue(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  lpAmount: bigint,
): Promise<QuoteLpValue> {
  const tx = new Transaction();
  const globalConfigObjectId = requireGlobalConfigObjectId(config);

  tx.moveCall({
    target: `${config.jitterPackageId}::offchain::estimate_lp_value`,
    arguments: [
      tx.object(globalConfigObjectId),
      tx.pure.u64(lpAmount),
      tx.object(config.poolObjectId),
    ],
    typeArguments: [config.syTypeTag],
  });

  const results = await simulate(network, tx);
  const rv = results[0]?.returnValues;
  const syValue = decodeOptionalU64(rv?.[0]);
  const ptValue = decodeOptionalU64(rv?.[1]);
  return {
    syValue,
    ptValue,
    value: syValue,
  };
}

/**
 * Preview LP shares minted when adding `(syIn, ptIn)` to the pool, plus the
 * PT amount that would pair with `syIn` at the current pool ratio. Passing
 * `ptIn = 0n` returns the steady-state pairing for a matched deposit preview.
 *
 * For steady state the pool mints the min-ratio LP amount, so users who
 * deposit off-ratio donate the unpaired token. `pairedPt` is the exact amount
 * that avoids that donation.
 */
export async function quoteAddLiquidity(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  syIn: bigint,
  ptIn: bigint = BigInt(0),
): Promise<QuoteAddLiquidity> {
  if (syIn <= 0n) {
    return { lpOut: 0n, pairedPt: 0n };
  }

  const pool = await getPoolState(network, config);
  const totalSy = BigInt(pool.total_sy);
  const totalPt = BigInt(pool.total_pt);
  const totalLp = BigInt(pool.lp_supply);

  const pairedPt =
    ptIn === 0n
      ? totalSy > 0n && totalPt > 0n
        ? mulDivFloor(syIn, totalPt, totalSy)
        : 0n
      : ptIn;

  const lpOut = estimateLpOutByPoolMath(totalLp, totalSy, totalPt, syIn, pairedPt);
  return { lpOut, pairedPt };
}

/**
 * Preview single-asset LP zap without keeping YT. The zap swaps part of the
 * input SY into PT, then deposits the remaining SY plus the acquired PT.
 */
export async function quoteAddLiquidityZap(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  syIn: bigint,
): Promise<QuoteAddLiquidityZap> {
  const empty = {
    lpOut: 0n,
    pairedPt: 0n,
    ptFromSwap: 0n,
    slippageBps: 0n,
    syForLiquidity: 0n,
    syToSwap: 0n,
  };

  if (syIn <= 1n) return empty;

  const pool = await getPoolState(network, config);
  const totalSy = BigInt(pool.total_sy);
  const totalPt = BigInt(pool.total_pt);
  const totalLp = BigInt(pool.lp_supply);
  if (totalSy <= 0n || totalPt <= 0n || totalLp <= 0n) return empty;

  let low = 1n;
  let high = syIn - 1n;
  let best: QuoteAddLiquidityZap | null = null;
  let bestDiff: bigint | null = null;

  for (let i = 0; i < 12 && low <= high; i += 1) {
    const syToSwap = (low + high) / 2n;
    const syForLiquidity = syIn - syToSwap;
    if (syForLiquidity <= 0n) {
      high = syToSwap - 1n;
      continue;
    }

    let swapQuote: QuoteSwapSyForPt;
    try {
      swapQuote = await quoteSwapSyForPt(network, config, syToSwap);
    } catch {
      high = syToSwap - 1n;
      continue;
    }

    const targetPt = mulDivFloor(syForLiquidity, totalPt, totalSy);
    const diff =
      swapQuote.ptOut > targetPt
        ? swapQuote.ptOut - targetPt
        : targetPt - swapQuote.ptOut;
    const lpOut = estimateLpOutByPoolMath(
      totalLp,
      totalSy,
      totalPt,
      syForLiquidity,
      swapQuote.ptOut,
    );

    if (best === null || bestDiff === null || diff < bestDiff) {
      best = {
        lpOut,
        pairedPt: swapQuote.ptOut,
        ptFromSwap: swapQuote.ptOut,
        slippageBps: swapQuote.slippageBps,
        syForLiquidity,
        syToSwap,
      };
      bestDiff = diff;
    }

    if (swapQuote.ptOut < targetPt) {
      low = syToSwap + 1n;
    } else {
      high = syToSwap - 1n;
    }
  }

  return best ?? empty;
}

/**
 * Preview keep-YT liquidity: split exact SY input into a mint leg and an LP leg.
 * The mint leg creates PT+YT, the PT pairs with the remaining SY, and the YT
 * stays in the user's PyPosition.
 */
export async function quoteAddLiquidityKeepYt(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  syIn: bigint,
  syIndex: bigint,
): Promise<QuoteAddLiquidityKeepYt> {
  if (syIn <= 1n) {
    return {
      lpOut: 0n,
      pairedPt: 0n,
      syToMint: 0n,
      syForLiquidity: 0n,
      keptYt: 0n,
    };
  }

  const [pool, pyState] = await Promise.all([
    getPoolState(network, config),
    getPyState(network, config),
  ]);
  const totalSy = BigInt(pool.total_sy);
  const totalPt = BigInt(pool.total_pt);
  const totalLp = BigInt(pool.lp_supply);
  const pyIndexStored = BigInt(pyState.py_index_stored);
  const pyIndex = syIndex > pyIndexStored ? syIndex : pyIndexStored;

  const syToMint =
    totalSy > 0n && totalPt > 0n
      ? mulDivFloor(
          syIn,
          totalPt * FP64_ONE,
          totalPt * FP64_ONE + totalSy * pyIndex,
        )
      : mulDivFloor(syIn, 7n, 20n);
  const syForLiquidity = syIn > syToMint ? syIn - syToMint : 0n;
  const keptYt = mulDivFloor(syToMint, pyIndex, FP64_ONE);
  const lpOut = estimateLpOutByPoolMath(
    totalLp,
    totalSy,
    totalPt,
    syForLiquidity,
    keptYt,
  );

  return {
    lpOut,
    pairedPt: keptYt,
    syToMint,
    syForLiquidity,
    keptYt,
  };
}

/**
 * Preview single-SY LP without keeping YT. The on-chain route first uses the
 * keep-YT split, then sells the minted YT through the PT borrow/repay route.
 */
export async function quoteAddLiquidityFromSy(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  syIn: bigint,
  syIndex: bigint,
): Promise<QuoteAddLiquidityFromSy> {
  const keepYt = await quoteAddLiquidityKeepYt(network, config, syIn, syIndex);
  const pool = await getPoolState(network, config);
  if (BigInt(pool.lp_supply) === 0n) {
    return {
      ...keepYt,
      slippageBps: 0n,
      syOut: 0n,
      syRedeemOut: 0n,
      syRepaid: 0n,
      ytToSell: keepYt.keptYt,
    };
  }

  if (keepYt.lpOut <= 0n || keepYt.keptYt <= 0n) {
    return {
      ...keepYt,
      slippageBps: 0n,
      syOut: 0n,
      syRedeemOut: 0n,
      syRepaid: 0n,
      ytToSell: 0n,
    };
  }

  try {
    const ytSale = await quoteSwapYtForSy(network, config, keepYt.keptYt, syIndex);
    return {
      ...keepYt,
      slippageBps: ytSale.slippageBps,
      syOut: ytSale.syOut,
      syRedeemOut: ytSale.syRedeemOut,
      syRepaid: ytSale.syRepaid,
      ytToSell: keepYt.keptYt,
    };
  } catch {
    return {
      ...keepYt,
      slippageBps: 0n,
      syOut: 0n,
      syRedeemOut: 0n,
      syRepaid: 0n,
      ytToSell: keepYt.keptYt,
    };
  }
}

/** Estimate claimable YT interest for a PyPosition. */
export async function quoteClaimableInterest(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
  pyPositionId: string,
): Promise<QuoteClaimableInterest> {
  const tx = new Transaction();
  const globalConfigObjectId = requireGlobalConfigObjectId(config);

  tx.moveCall({
    target: `${config.jitterPackageId}::offchain::estimate_claimable_interest`,
    arguments: [
      tx.object(globalConfigObjectId),
      tx.object(pyPositionId),
      tx.object(config.pyStateObjectId),
    ],
    typeArguments: [config.syTypeTag],
  });

  const results = await simulate(network, tx);
  return { interest: decodeU64(results, 0) };
}

/** Check whether the market has expired. */
export async function quoteIsMarketExpired(
  network: GrpcNetworkKind,
  config: JitterMarketConfig,
): Promise<boolean> {
  const tx = new Transaction();
  const globalConfigObjectId = requireGlobalConfigObjectId(config);

  tx.moveCall({
    target: `${config.jitterPackageId}::offchain::is_market_expired`,
    arguments: [
      tx.object(globalConfigObjectId),
      tx.object(config.poolObjectId),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });

  const results = await simulate(network, tx);
  return decodeBool(results, 0);
}
