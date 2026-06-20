import { FP64_ONE } from "../constants.js";
import { resolveMarketLifecycle } from "../domain/market.js";
import type { JitterChainReader } from "../ports/chain-reader.js";
import type { GrpcNetworkKind } from "../rpc.js";
import {
  quoteIsMarketExpired as simulateIsMarketExpired,
  quoteLpValue as simulateLpValue,
  quoteAddLiquidity as simulateAddLiquidity,
  quoteAddLiquidityFromSy as simulateAddLiquidityFromSy,
  quoteAddLiquidityKeepYt as simulateAddLiquidityKeepYt,
  quoteSwapPtForSy as simulateSwapPtForSy,
  quoteSwapSyForYt as simulateSwapSyForYt,
  quoteSwapYtForSy as simulateSwapYtForSy,
  quoteSwapSyForPt as simulateSwapSyForPt,
  type QuoteAddLiquidity,
  type QuoteAddLiquidityFromSy,
  type QuoteAddLiquidityKeepYt,
  type QuoteLpValue,
  type QuoteSwapPtForSy,
  type QuoteSwapSyForPt,
  type QuoteSwapSyForYt,
  type QuoteSwapYtForSy,
} from "../simulation.js";
import { getScallopMarketIndex } from "../queries.js";
import type { ProfitScenarioInput, ProfitScenarioResult } from "../domain/profit-scenario.js";
import { calculateProfitScenario } from "../domain/profit-scenario.js";
import type { JitterMarketConfig } from "../types.js";

export type {
  QuoteLpValue,
  QuoteSwapSyForPt,
} from "../simulation.js";
export type {
  ProfitScenarioInput,
  ProfitScenarioResult,
} from "../domain/profit-scenario.js";

export type JitterPreviewSource = {
  kind: "delegate" | "simulation" | "snapshot" | "unavailable";
  detail?: string;
};

export type JitterPreviewAssumption = {
  key: string;
  value: string | number | bigint;
  source: "sdk" | "user" | "chain" | "unavailable";
};

export type PreviewPositionDelta = {
  pt: bigint;
  yt: bigint;
  lp: bigint;
};

export type PreviewWalletDelta = {
  sy: bigint;
};

export type PreviewFees = {
  totalSy: bigint;
};

export type PreviewBuyPtParams = {
  syIn: bigint;
  syIndex?: bigint;
};

export type PreviewSellPtParams = {
  ptIn: bigint;
  syIndex?: bigint;
};

export type PreviewBuyYtParams = {
  syIn: bigint;
  syIndex?: bigint;
};

export type PreviewSellYtParams = {
  ytIn: bigint;
  syIndex?: bigint;
};

export type PreviewAddLpParams = {
  syIn: bigint;
  ptIn?: bigint;
};

export type PreviewAddLpKeepYtParams = {
  syIn: bigint;
  syIndex?: bigint;
};

export type PreviewAddLpFromSyParams = {
  syIn: bigint;
  syIndex?: bigint;
};

export type PreviewRemoveLpParams = {
  lpIn: bigint;
};

export type PreviewRemoveLpToSyParams = {
  lpIn: bigint;
  syIndex?: bigint;
};

type PreviewBase<TKind extends string, TInput, TOutput> = {
  kind: TKind;
  input: TInput;
  output: TOutput;
  positionDelta: PreviewPositionDelta;
  walletDelta: PreviewWalletDelta;
  fees: PreviewFees;
  slippageBps: bigint;
  source: JitterPreviewSource;
  assumptions: JitterPreviewAssumption[];
};

export type PreviewBuyPtResult = PreviewBase<
  "buy-pt",
  { syIn: bigint },
  { ptOut: bigint }
>;
export type PreviewSellPtResult = PreviewBase<
  "sell-pt",
  { ptIn: bigint },
  { syOut: bigint }
>;
export type PreviewBuyYtResult = PreviewBase<
  "buy-yt",
  { syIn: bigint },
  { ytOut: bigint; syRefund: bigint }
>;
export type PreviewSellYtResult = PreviewBase<
  "sell-yt",
  { ytIn: bigint },
  { syOut: bigint; syRedeemOut: bigint; syRepaid: bigint }
>;
export type PreviewAddLpResult = PreviewBase<
  "add-lp",
  { syIn: bigint; ptIn: bigint },
  { lpOut: bigint; pairedPt: bigint }
>;
export type PreviewAddLpKeepYtResult = PreviewBase<
  "add-lp-keep-yt",
  { syIn: bigint },
  {
    lpOut: bigint;
    pairedPt: bigint;
    keptYt: bigint;
    syToMintHint: bigint;
    syForLiquidity: bigint;
    minLpOutHint: bigint;
  }
>;
export type PreviewAddLpFromSyResult = PreviewBase<
  "add-lp-from-sy",
  { syIn: bigint },
  {
    lpOut: bigint;
    pairedPt: bigint;
    syToMintHint: bigint;
    syForLiquidity: bigint;
    ytToSell: bigint;
    syOut: bigint;
    syRedeemOut: bigint;
    syRepaid: bigint;
    minLpOutHint: bigint;
    minSyOutHint: bigint;
  }
>;
export type PreviewRemoveLpResult = PreviewBase<
  "remove-lp",
  { lpIn: bigint },
  { syOut: bigint; ptOut: bigint }
>;
export type PreviewRemoveLpToSyResult = PreviewBase<
  "remove-lp-to-sy",
  { lpIn: bigint },
  { syOut: bigint; ptOut: bigint; swappedSyOut: bigint; totalSyOut: bigint }
>;

export type QuoteSwapUnderlyingForPt = QuoteSwapSyForPt & {
  syIn: bigint;
  syIndex: bigint;
};

export type QuoteUnderlyingToSy = {
  syIn: bigint;
  syIndex: bigint;
};

export type JitterQuoteDelegates = {
  resolveSyIndex?: () => Promise<bigint> | bigint;
  quoteSwapSyForPt?: (
    syIn: bigint,
    syIndex?: bigint,
  ) => Promise<QuoteSwapSyForPt>;
  quoteSwapPtForSy?: (
    ptIn: bigint,
    syIndex?: bigint,
  ) => Promise<QuoteSwapPtForSy>;
  quoteSwapSyForYt?: (
    syIn: bigint,
    syIndex: bigint,
  ) => Promise<QuoteSwapSyForYt>;
  quoteSwapYtForSy?: (
    ytIn: bigint,
    syIndex: bigint,
  ) => Promise<QuoteSwapYtForSy>;
  quoteAddLiquidity?: (
    syIn: bigint,
    ptIn?: bigint,
  ) => Promise<QuoteAddLiquidity>;
  quoteAddLiquidityKeepYt?: (
    syIn: bigint,
    syIndex: bigint,
  ) => Promise<QuoteAddLiquidityKeepYt>;
  quoteAddLiquidityFromSy?: (
    syIn: bigint,
    syIndex: bigint,
  ) => Promise<QuoteAddLiquidityFromSy>;
  quoteLpValue?: (lpAmount: bigint) => Promise<QuoteLpValue>;
  quoteIsMarketExpired?: () => Promise<boolean>;
};

export type CreateJitterQuoteServiceOptions = {
  network?: GrpcNetworkKind;
  config: JitterMarketConfig;
  chainReader?: JitterChainReader;
  delegates?: JitterQuoteDelegates;
};

export type JitterQuoteService = {
  quoteSwapSyForPt(
    syIn: bigint,
    syIndex?: bigint,
  ): Promise<QuoteSwapSyForPt>;
  quoteUnderlyingToSy(
    underlyingIn: bigint,
    syIndex?: bigint,
  ): Promise<QuoteUnderlyingToSy>;
  quoteSwapUnderlyingForPt(
    underlyingIn: bigint,
    syIndex?: bigint,
  ): Promise<QuoteSwapUnderlyingForPt>;
  quoteLpValue(lpAmount: bigint): Promise<QuoteLpValue>;
  quoteIsMarketExpired(nowMs?: number): Promise<boolean>;
  previewBuyPt(params: PreviewBuyPtParams): Promise<PreviewBuyPtResult>;
  previewSellPt(params: PreviewSellPtParams): Promise<PreviewSellPtResult>;
  previewBuyYt(params: PreviewBuyYtParams): Promise<PreviewBuyYtResult>;
  previewSellYt(params: PreviewSellYtParams): Promise<PreviewSellYtResult>;
  previewAddLp(params: PreviewAddLpParams): Promise<PreviewAddLpResult>;
  previewAddLpKeepYt(
    params: PreviewAddLpKeepYtParams,
  ): Promise<PreviewAddLpKeepYtResult>;
  previewAddLpFromSy(
    params: PreviewAddLpFromSyParams,
  ): Promise<PreviewAddLpFromSyResult>;
  previewRemoveLp(params: PreviewRemoveLpParams): Promise<PreviewRemoveLpResult>;
  previewRemoveLpToSy(
    params: PreviewRemoveLpToSyParams,
  ): Promise<PreviewRemoveLpToSyResult>;
  calculateProfitScenario(params: ProfitScenarioInput): ProfitScenarioResult;
};

export function createJitterQuoteService(
  options: CreateJitterQuoteServiceOptions,
): JitterQuoteService {
  return {
    async quoteSwapSyForPt(
      syIn: bigint,
      syIndex?: bigint,
    ): Promise<QuoteSwapSyForPt> {
      if (options.delegates?.quoteSwapSyForPt) {
        return options.delegates.quoteSwapSyForPt(syIn, syIndex);
      }

      return simulateSwapSyForPt(
        requireNetwork(options),
        options.config,
        syIn,
        syIndex,
      );
    },

    async previewBuyPt(params: PreviewBuyPtParams): Promise<PreviewBuyPtResult> {
      const quote = await this.quoteSwapSyForPt(params.syIn, params.syIndex);
      return previewResult({
        kind: "buy-pt" as const,
        input: { syIn: params.syIn },
        output: { ptOut: quote.ptOut },
        positionDelta: { pt: quote.ptOut, yt: 0n, lp: 0n },
        walletDelta: { sy: -params.syIn },
        slippageBps: quote.slippageBps,
        source: quoteSource(options, "quoteSwapSyForPt"),
      });
    },

    async previewSellPt(params: PreviewSellPtParams): Promise<PreviewSellPtResult> {
      const quote = await quoteSwapPtForSy(options, params.ptIn, params.syIndex);
      return previewResult({
        kind: "sell-pt" as const,
        input: { ptIn: params.ptIn },
        output: { syOut: quote.syOut },
        positionDelta: { pt: -params.ptIn, yt: 0n, lp: 0n },
        walletDelta: { sy: quote.syOut },
        slippageBps: quote.slippageBps,
        source: quoteSource(options, "quoteSwapPtForSy"),
      });
    },

    async previewBuyYt(params: PreviewBuyYtParams): Promise<PreviewBuyYtResult> {
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const quote = await quoteSwapSyForYt(options, params.syIn, syIndex);
      return previewResult({
        kind: "buy-yt" as const,
        input: { syIn: params.syIn },
        output: { ytOut: quote.ytOut, syRefund: quote.syRefund },
        positionDelta: { pt: 0n, yt: quote.ytOut, lp: 0n },
        walletDelta: { sy: quote.syRefund - params.syIn },
        slippageBps: quote.slippageBps,
        source: quoteSource(options, "quoteSwapSyForYt"),
      });
    },

    async previewSellYt(params: PreviewSellYtParams): Promise<PreviewSellYtResult> {
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const quote = await quoteSwapYtForSy(options, params.ytIn, syIndex);
      return previewResult({
        kind: "sell-yt" as const,
        input: { ytIn: params.ytIn },
        output: {
          syOut: quote.syOut,
          syRedeemOut: quote.syRedeemOut,
          syRepaid: quote.syRepaid,
        },
        positionDelta: { pt: 0n, yt: -params.ytIn, lp: 0n },
        walletDelta: { sy: quote.syOut },
        slippageBps: quote.slippageBps,
        source: quoteSource(options, "quoteSwapYtForSy"),
      });
    },

    async previewAddLp(params: PreviewAddLpParams): Promise<PreviewAddLpResult> {
      const ptIn = params.ptIn ?? 0n;
      const quote = await quoteAddLiquidity(options, params.syIn, ptIn);
      return previewResult({
        kind: "add-lp" as const,
        input: { syIn: params.syIn, ptIn },
        output: { lpOut: quote.lpOut, pairedPt: quote.pairedPt },
        positionDelta: { pt: -quote.pairedPt, yt: 0n, lp: quote.lpOut },
        walletDelta: { sy: -params.syIn },
        slippageBps: 0n,
        source: quoteSource(options, "quoteAddLiquidity"),
      });
    },

    async previewAddLpKeepYt(
      params: PreviewAddLpKeepYtParams,
    ): Promise<PreviewAddLpKeepYtResult> {
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const quote = await quoteAddLiquidityKeepYt(options, params.syIn, syIndex);
      return previewResult({
        kind: "add-lp-keep-yt" as const,
        input: { syIn: params.syIn },
        output: {
          lpOut: quote.lpOut,
          pairedPt: quote.pairedPt,
          keptYt: quote.keptYt,
          syToMintHint: quote.syToMint,
          syForLiquidity: quote.syForLiquidity,
          minLpOutHint: quote.lpOut,
        },
        positionDelta: { pt: 0n, yt: quote.keptYt, lp: quote.lpOut },
        walletDelta: { sy: -params.syIn },
        slippageBps: 0n,
        source: quoteSource(options, "quoteAddLiquidityKeepYt"),
      });
    },

    async previewAddLpFromSy(
      params: PreviewAddLpFromSyParams,
    ): Promise<PreviewAddLpFromSyResult> {
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const quote = await quoteAddLiquidityFromSy(options, params.syIn, syIndex);
      return previewResult({
        kind: "add-lp-from-sy" as const,
        input: { syIn: params.syIn },
        output: {
          lpOut: quote.lpOut,
          pairedPt: quote.pairedPt,
          syToMintHint: quote.syToMint,
          syForLiquidity: quote.syForLiquidity,
          ytToSell: quote.ytToSell,
          syOut: quote.syOut,
          syRedeemOut: quote.syRedeemOut,
          syRepaid: quote.syRepaid,
          minLpOutHint: quote.lpOut,
          minSyOutHint: quote.syOut,
        },
        positionDelta: { pt: 0n, yt: 0n, lp: quote.lpOut },
        walletDelta: { sy: quote.syOut - params.syIn },
        slippageBps: quote.slippageBps,
        source: quoteSource(options, "quoteAddLiquidityFromSy"),
      });
    },

    async previewRemoveLp(params: PreviewRemoveLpParams): Promise<PreviewRemoveLpResult> {
      const quote = await this.quoteLpValue(params.lpIn);
      return previewResult({
        kind: "remove-lp" as const,
        input: { lpIn: params.lpIn },
        output: { syOut: quote.syValue, ptOut: quote.ptValue },
        positionDelta: { pt: quote.ptValue, yt: 0n, lp: -params.lpIn },
        walletDelta: { sy: quote.syValue },
        slippageBps: 0n,
        source: quoteSource(options, "quoteLpValue"),
        assumptions: [
          {
            key: "removeLpKeepYt",
            value: "alias-of-remove-lp",
            source: "sdk",
          },
        ],
      });
    },

    async previewRemoveLpToSy(
      params: PreviewRemoveLpToSyParams,
    ): Promise<PreviewRemoveLpToSyResult> {
      const lpQuote = await this.quoteLpValue(params.lpIn);
      const sellPtQuote =
        lpQuote.ptValue > 0n
          ? await quoteSwapPtForSy(options, lpQuote.ptValue, params.syIndex)
          : { syOut: 0n, slippageBps: 0n };
      const swappedSyOut = sellPtQuote.syOut;
      return previewResult({
        kind: "remove-lp-to-sy" as const,
        input: { lpIn: params.lpIn },
        output: {
          syOut: lpQuote.syValue,
          ptOut: lpQuote.ptValue,
          swappedSyOut,
          totalSyOut: lpQuote.syValue + swappedSyOut,
        },
        positionDelta: { pt: 0n, yt: 0n, lp: -params.lpIn },
        walletDelta: { sy: lpQuote.syValue + swappedSyOut },
        slippageBps: sellPtQuote.slippageBps,
        source: quoteSource(options, "quoteSwapPtForSy"),
      });
    },

    calculateProfitScenario(params: ProfitScenarioInput): ProfitScenarioResult {
      return calculateProfitScenario(params);
    },

    async quoteUnderlyingToSy(
      underlyingIn: bigint,
      syIndex?: bigint,
    ): Promise<QuoteUnderlyingToSy> {
      const resolvedSyIndex = await resolveSyIndex(options, syIndex);
      return {
        syIn: underlyingToSyAmount(underlyingIn, resolvedSyIndex),
        syIndex: resolvedSyIndex,
      };
    },

    async quoteSwapUnderlyingForPt(
      underlyingIn: bigint,
      syIndex?: bigint,
    ): Promise<QuoteSwapUnderlyingForPt> {
      const converted = await this.quoteUnderlyingToSy(underlyingIn, syIndex);
      const quote = await this.quoteSwapSyForPt(
        converted.syIn,
        converted.syIndex,
      );
      return { ...quote, ...converted };
    },

    async quoteLpValue(lpAmount: bigint): Promise<QuoteLpValue> {
      if (options.delegates?.quoteLpValue) {
        return options.delegates.quoteLpValue(lpAmount);
      }

      if (options.chainReader) {
        const pool = await options.chainReader.getPoolState(options.config);
        const totalLp = BigInt(pool.lp_supply);
        if (lpAmount <= 0n || totalLp <= 0n) {
          return { syValue: 0n, ptValue: 0n, value: 0n };
        }

        const syValue = mulDivFloor(lpAmount, BigInt(pool.total_sy), totalLp);
        const ptValue = mulDivFloor(lpAmount, BigInt(pool.total_pt), totalLp);
        return { syValue, ptValue, value: syValue };
      }

      return simulateLpValue(requireNetwork(options), options.config, lpAmount);
    },

    async quoteIsMarketExpired(nowMs?: number): Promise<boolean> {
      if (options.chainReader) {
        const [pool, pyState] = await Promise.all([
          options.chainReader.getPoolState(options.config),
          options.chainReader.getPyState(options.config),
        ]);
        const lifecycle = resolveMarketLifecycle({ pool, pyState, nowMs });
        return lifecycle.isMatured || lifecycle.isSettled;
      }

      if (options.delegates?.quoteIsMarketExpired) {
        return options.delegates.quoteIsMarketExpired();
      }

      return simulateIsMarketExpired(requireNetwork(options), options.config);
    },
  };
}

export function underlyingToSyAmount(
  underlyingAmount: bigint,
  syIndexRaw: bigint,
): bigint {
  if (underlyingAmount <= 0n) return 0n;
  if (syIndexRaw <= 0n) throw new Error("Invalid sy_index for conversion.");
  return mulDivFloor(underlyingAmount, FP64_ONE, syIndexRaw);
}

async function resolveSyIndex(
  options: CreateJitterQuoteServiceOptions,
  override?: bigint,
): Promise<bigint> {
  if (override !== undefined) return override;
  if (options.delegates?.resolveSyIndex) {
    return options.delegates.resolveSyIndex();
  }
  if (hasScallopRouteConfigured(options.config) && options.network) {
    const scallopIndex = await getScallopMarketIndex(
      options.network,
      options.config,
    );
    return BigInt(scallopIndex.syIndexRaw);
  }
  if (options.chainReader) {
    const pyState = await options.chainReader.getPyState(options.config);
    const storedIndex = BigInt(pyState.py_index_stored ?? 0);
    return storedIndex > 0n ? storedIndex : FP64_ONE;
  }

  throw new Error("SY index is required when no chain reader is configured.");
}

function hasScallopRouteConfigured(config: JitterMarketConfig): boolean {
  return Boolean(
    config.scallopAdapterPackageId &&
      config.scallopMarketVaultObjectId &&
      config.scallopMarketObjectId &&
      config.scallopVersionObjectId,
  );
}

function requireNetwork(options: CreateJitterQuoteServiceOptions): GrpcNetworkKind {
  if (!options.network) {
    throw new Error("A Sui network or quote delegate is required for this preview.");
  }
  return options.network;
}

async function quoteSwapPtForSy(
  options: CreateJitterQuoteServiceOptions,
  ptIn: bigint,
  syIndex?: bigint,
): Promise<QuoteSwapPtForSy> {
  if (options.delegates?.quoteSwapPtForSy) {
    return options.delegates.quoteSwapPtForSy(ptIn, syIndex);
  }
  return simulateSwapPtForSy(requireNetwork(options), options.config, ptIn, syIndex);
}

async function quoteSwapSyForYt(
  options: CreateJitterQuoteServiceOptions,
  syIn: bigint,
  syIndex: bigint,
): Promise<QuoteSwapSyForYt> {
  if (options.delegates?.quoteSwapSyForYt) {
    return options.delegates.quoteSwapSyForYt(syIn, syIndex);
  }
  return simulateSwapSyForYt(requireNetwork(options), options.config, syIn, syIndex);
}

async function quoteSwapYtForSy(
  options: CreateJitterQuoteServiceOptions,
  ytIn: bigint,
  syIndex: bigint,
): Promise<QuoteSwapYtForSy> {
  if (options.delegates?.quoteSwapYtForSy) {
    return options.delegates.quoteSwapYtForSy(ytIn, syIndex);
  }
  return simulateSwapYtForSy(requireNetwork(options), options.config, ytIn, syIndex);
}

async function quoteAddLiquidity(
  options: CreateJitterQuoteServiceOptions,
  syIn: bigint,
  ptIn?: bigint,
): Promise<QuoteAddLiquidity> {
  if (options.delegates?.quoteAddLiquidity) {
    return options.delegates.quoteAddLiquidity(syIn, ptIn);
  }
  return simulateAddLiquidity(requireNetwork(options), options.config, syIn, ptIn);
}

async function quoteAddLiquidityKeepYt(
  options: CreateJitterQuoteServiceOptions,
  syIn: bigint,
  syIndex: bigint,
): Promise<QuoteAddLiquidityKeepYt> {
  if (options.delegates?.quoteAddLiquidityKeepYt) {
    return options.delegates.quoteAddLiquidityKeepYt(syIn, syIndex);
  }
  return simulateAddLiquidityKeepYt(requireNetwork(options), options.config, syIn, syIndex);
}

async function quoteAddLiquidityFromSy(
  options: CreateJitterQuoteServiceOptions,
  syIn: bigint,
  syIndex: bigint,
): Promise<QuoteAddLiquidityFromSy> {
  if (options.delegates?.quoteAddLiquidityFromSy) {
    return options.delegates.quoteAddLiquidityFromSy(syIn, syIndex);
  }
  return simulateAddLiquidityFromSy(requireNetwork(options), options.config, syIn, syIndex);
}

function quoteSource(
  options: CreateJitterQuoteServiceOptions,
  delegateName: keyof JitterQuoteDelegates,
): JitterPreviewSource {
  if (options.delegates?.[delegateName]) return { kind: "delegate" };
  if (options.chainReader && delegateName === "quoteLpValue") return { kind: "snapshot" };
  if (options.network) return { kind: "simulation" };
  return { kind: "unavailable" };
}

function previewResult<T extends object>(
  result: T & { assumptions?: JitterPreviewAssumption[]; fees?: PreviewFees },
): Omit<T, "assumptions" | "fees"> & {
  assumptions: JitterPreviewAssumption[];
  fees: PreviewFees;
} {
  return {
    ...result,
    fees: result.fees ?? { totalSy: 0n },
    assumptions: result.assumptions ?? [],
  };
}

function mulDivFloor(a: bigint, b: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) {
    throw new Error("Invalid denominator for mulDivFloor.");
  }
  return (a * b) / denominator;
}
