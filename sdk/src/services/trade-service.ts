import type { JitterMarketConfig } from "../types.js";
import {
  createJitterQuoteService,
  type JitterPreviewAssumption,
  type JitterPreviewSource,
  type JitterQuoteService,
} from "./quote-service.js";
import type {
  JitterMarketTradeMetadata,
  JitterTradeActionId,
  JitterTradeAsset,
  JitterTradeProduct,
  JitterTradeSide,
} from "./market-data-service.js";
import {
  createJitterTransactionService,
  type JitterTransactionService,
} from "./transaction-service.js";
import { getSuiGrpcClient, type GrpcNetworkKind } from "../rpc.js";

export type JitterTradeRequestSide =
  | JitterTradeSide
  | "deposit"
  | "withdraw";

export type JitterTradeQuoteRequest = {
  marketId: string;
  product: JitterTradeProduct;
  side: JitterTradeRequestSide;
  inputAsset: JitterTradeAsset;
  amount: string;
  slippageBps: number;
  owner: string;
  actionId?: JitterTradeActionId;
  pairedPtAmount?: string;
  syIndex?: string;
};

export type JitterTradeBuildTransactionRequest = JitterTradeQuoteRequest & {
  inputCoinId?: string;
  inputCoinIds?: string[];
  positionId?: string;
  deadlineMs?: string;
};

export type JitterTradeQuoteStatus = "available" | "stale" | "unavailable";

export type JitterTradeAmount = {
  asset: JitterTradeAsset;
  amount: string;
};

export type JitterTradeQuoteSource = {
  kind: JitterPreviewSource["kind"];
  state: JitterTradeQuoteStatus;
  stale: boolean;
  updatedAtMs: number | null;
  detail?: string;
};

export type JitterTradePreviewSnapshot = {
  positionDelta: {
    pt: string;
    yt: string;
    lp: string;
  };
  walletDelta: {
    sy: string;
  };
  input: Record<string, string>;
  output: Record<string, string>;
  assumptions: JitterPreviewAssumption[];
};

export type JitterTradeQuoteResponse = {
  status: JitterTradeQuoteStatus;
  marketId: string;
  actionId: JitterTradeActionId;
  product: JitterTradeProduct;
  side: JitterTradeRequestSide;
  inputAsset: JitterTradeAsset;
  inputAmount: string;
  slippageBps: number;
  expectedOutput: JitterTradeAmount[];
  fee: {
    totalSy: string;
  };
  priceImpactBps: string | null;
  apyChangeBps: string | null;
  minReceived: JitterTradeAmount[];
  maxInput: JitterTradeAmount[] | null;
  source: JitterTradeQuoteSource;
  unavailableReason: string | null;
  preview: JitterTradePreviewSnapshot | null;
};

export type JitterTradeBuildTransactionResponse = {
  status: "ready";
  marketId: string;
  actionId: JitterTradeActionId;
  owner: string;
  unsigned: true;
  transactionEncoding: "sui-transaction-json-v2";
  transactionJson: string;
  quote: JitterTradeQuoteResponse;
};

export type CreateJitterTradeServiceOptions = {
  marketId: string;
  config: JitterMarketConfig;
  network?: GrpcNetworkKind;
  metadata?: JitterMarketTradeMetadata | null;
  quoteService?: JitterQuoteService;
  transactionService?: JitterTransactionService;
};

export type JitterTradeService = {
  quoteTrade(
    request: JitterTradeQuoteRequest,
  ): Promise<JitterTradeQuoteResponse>;
  buildTradeTransaction(
    request: JitterTradeBuildTransactionRequest,
  ): Promise<JitterTradeBuildTransactionResponse>;
};

type ActionSpec = {
  product: JitterTradeProduct;
  side: JitterTradeRequestSide;
  inputAssets: readonly JitterTradeAsset[];
};

const ACTION_SPECS: Record<JitterTradeActionId, ActionSpec> = {
  buy_pt: { product: "pt", side: "buy", inputAssets: ["underlying", "sy"] },
  sell_pt: { product: "pt", side: "sell", inputAssets: ["pt"] },
  buy_yt: { product: "yt", side: "buy", inputAssets: ["underlying", "sy"] },
  sell_yt: { product: "yt", side: "sell", inputAssets: ["yt"] },
  add_lp: { product: "lp", side: "add", inputAssets: ["sy"] },
  add_lp_from_sy: {
    product: "lp",
    side: "add",
    inputAssets: ["underlying", "sy"],
  },
  add_lp_keep_yt: {
    product: "lp",
    side: "add",
    inputAssets: ["underlying", "sy"],
  },
  remove_lp: { product: "lp", side: "remove", inputAssets: ["lp"] },
  remove_lp_to_sy: { product: "lp", side: "remove", inputAssets: ["lp"] },
};

const BASIS_POINTS = 10_000n;

export function createJitterTradeService(
  options: CreateJitterTradeServiceOptions,
): JitterTradeService {
  const quoteService =
    options.quoteService ?? createJitterQuoteService({ config: options.config });
  const transactionService =
    options.transactionService ??
    createJitterTransactionService({ config: options.config });

  return {
    async quoteTrade(
      request: JitterTradeQuoteRequest,
    ): Promise<JitterTradeQuoteResponse> {
      const actionId = resolveActionId(request);
      const unavailableReason = getUnavailableReason(options, request, actionId);
      if (unavailableReason) {
        return unavailableQuoteResponse(request, actionId, unavailableReason);
      }

      const amount = parseAtomicAmount(request.amount, "amount");
      const syIndex = parseOptionalBigInt(request.syIndex, "syIndex");
      const slippageBps = parseSlippageBps(request.slippageBps);

      try {
        switch (actionId) {
          case "buy_pt": {
            const input = await resolveSyTradeInput(
              quoteService,
              request.inputAsset,
              amount,
              syIndex,
            );
            const preview = await quoteService.previewBuyPt({
              syIn: input.syIn,
              syIndex: input.syIndex,
            });
            return availableQuoteResponse(request, actionId, slippageBps, {
              expectedOutput: [{ asset: "pt", amount: preview.output.ptOut }],
              minReceived: [
                { asset: "pt", amount: applySlippage(preview.output.ptOut, slippageBps) },
              ],
              priceImpactBps: preview.slippageBps,
              feeTotalSy: preview.fees.totalSy,
              source: preview.source,
              preview: previewSnapshot(preview),
            });
          }
          case "sell_pt": {
            const preview = await quoteService.previewSellPt({ ptIn: amount, syIndex });
            return availableQuoteResponse(request, actionId, slippageBps, {
              expectedOutput: [{ asset: "sy", amount: preview.output.syOut }],
              minReceived: [
                { asset: "sy", amount: applySlippage(preview.output.syOut, slippageBps) },
              ],
              priceImpactBps: preview.slippageBps,
              feeTotalSy: preview.fees.totalSy,
              source: preview.source,
              preview: previewSnapshot(preview),
            });
          }
          case "buy_yt": {
            const input = await resolveSyTradeInput(
              quoteService,
              request.inputAsset,
              amount,
              syIndex,
            );
            const preview = await quoteService.previewBuyYt({
              syIn: input.syIn,
              syIndex: input.syIndex,
            });
            return availableQuoteResponse(request, actionId, slippageBps, {
              expectedOutput: [
                { asset: "yt", amount: preview.output.ytOut },
                { asset: "sy", amount: preview.output.syRefund },
              ],
              minReceived: [
                { asset: "yt", amount: applySlippage(preview.output.ytOut, slippageBps) },
                { asset: "sy", amount: applySlippage(preview.output.syRefund, slippageBps) },
              ],
              priceImpactBps: preview.slippageBps,
              feeTotalSy: preview.fees.totalSy,
              source: preview.source,
              preview: previewSnapshot(preview),
            });
          }
          case "sell_yt": {
            const preview = await quoteService.previewSellYt({ ytIn: amount, syIndex });
            return availableQuoteResponse(request, actionId, slippageBps, {
              expectedOutput: [{ asset: "sy", amount: preview.output.syOut }],
              minReceived: [
                { asset: "sy", amount: applySlippage(preview.output.syOut, slippageBps) },
              ],
              priceImpactBps: preview.slippageBps,
              feeTotalSy: preview.fees.totalSy,
              source: preview.source,
              preview: previewSnapshot(preview),
            });
          }
          case "add_lp": {
            const pairedPtAmount = parseAtomicAmount(
              request.pairedPtAmount ?? "",
              "pairedPtAmount",
            );
            const preview = await quoteService.previewAddLp({
              syIn: amount,
              ptIn: pairedPtAmount,
            });
            return availableQuoteResponse(request, actionId, slippageBps, {
              expectedOutput: [{ asset: "lp", amount: preview.output.lpOut }],
              minReceived: [
                { asset: "lp", amount: applySlippage(preview.output.lpOut, slippageBps) },
              ],
              priceImpactBps: preview.slippageBps,
              feeTotalSy: preview.fees.totalSy,
              source: preview.source,
              preview: previewSnapshot(preview),
            });
          }
          case "add_lp_keep_yt": {
            const input = await resolveSyTradeInput(
              quoteService,
              request.inputAsset,
              amount,
              syIndex,
            );
            const preview = await quoteService.previewAddLpKeepYt({
              syIn: input.syIn,
              syIndex: input.syIndex,
            });
            return availableQuoteResponse(request, actionId, slippageBps, {
              expectedOutput: [
                { asset: "lp", amount: preview.output.lpOut },
                { asset: "yt", amount: preview.output.keptYt },
              ],
              minReceived: [
                { asset: "lp", amount: applySlippage(preview.output.lpOut, slippageBps) },
                { asset: "yt", amount: applySlippage(preview.output.keptYt, slippageBps) },
              ],
              priceImpactBps: preview.slippageBps,
              feeTotalSy: preview.fees.totalSy,
              source: preview.source,
              preview: previewSnapshot(preview),
            });
          }
          case "add_lp_from_sy": {
            const input = await resolveSyTradeInput(
              quoteService,
              request.inputAsset,
              amount,
              syIndex,
            );
            const preview = await quoteService.previewAddLpFromSy({
              syIn: input.syIn,
              syIndex: input.syIndex,
            });
            if (preview.output.ytToSell > 0n && preview.output.syOut === 0n) {
              return unavailableQuoteResponse(
                request,
                actionId,
                "Pool is not initialized or has insufficient PT inventory for non-keep YT zap. Use Keep YT mode for the initial LP deposit.",
              );
            }
            return availableQuoteResponse(request, actionId, slippageBps, {
              expectedOutput: [
                { asset: "lp", amount: preview.output.lpOut },
                { asset: "sy", amount: preview.output.syOut },
              ],
              minReceived: [
                { asset: "lp", amount: applySlippage(preview.output.lpOut, slippageBps) },
                { asset: "sy", amount: applySlippage(preview.output.syOut, slippageBps) },
              ],
              priceImpactBps: preview.slippageBps,
              feeTotalSy: preview.fees.totalSy,
              source: preview.source,
              preview: previewSnapshot(preview),
            });
          }
          case "remove_lp": {
            const preview = await quoteService.previewRemoveLp({ lpIn: amount });
            return availableQuoteResponse(request, actionId, slippageBps, {
              expectedOutput: [
                { asset: "sy", amount: preview.output.syOut },
                { asset: "pt", amount: preview.output.ptOut },
              ],
              minReceived: [
                { asset: "sy", amount: applySlippage(preview.output.syOut, slippageBps) },
                { asset: "pt", amount: applySlippage(preview.output.ptOut, slippageBps) },
              ],
              priceImpactBps: preview.slippageBps,
              feeTotalSy: preview.fees.totalSy,
              source: preview.source,
              preview: previewSnapshot(preview),
            });
          }
          case "remove_lp_to_sy": {
            const preview = await quoteService.previewRemoveLpToSy({
              lpIn: amount,
              syIndex,
            });
            return availableQuoteResponse(request, actionId, slippageBps, {
              expectedOutput: [
                { asset: "sy", amount: preview.output.totalSyOut },
              ],
              minReceived: [
                {
                  asset: "sy",
                  amount: applySlippage(preview.output.totalSyOut, slippageBps),
                },
              ],
              priceImpactBps: preview.slippageBps,
              feeTotalSy: preview.fees.totalSy,
              source: preview.source,
              preview: previewSnapshot(preview),
            });
          }
        }
      } catch (error) {
        return unavailableQuoteResponse(
          request,
          actionId,
          formatQuotePreviewError(error),
        );
      }
    },

    async buildTradeTransaction(
      request: JitterTradeBuildTransactionRequest,
    ): Promise<JitterTradeBuildTransactionResponse> {
      const quote = await this.quoteTrade(request);
      if (quote.status !== "available") {
        throw new Error(
          `Cannot build trade transaction: ${quote.unavailableReason ?? "quote unavailable"}`,
        );
      }

      const amount = parseAtomicAmount(request.amount, "amount");
      const syIndex = parseOptionalBigInt(request.syIndex, "syIndex");
      const deadlineMs = parseOptionalBigInt(request.deadlineMs, "deadlineMs");
      const rewardSettlement = { strategy: "empty-vector" as const };

      const transaction = await (async () => {
        switch (quote.actionId) {
          case "buy_pt":
            if (quote.inputAsset === "underlying") {
              return transactionService.buildBuyPtFromUnderlyingTx({
                senderAddress: request.owner,
                underlyingCoinId: request.inputCoinId,
                underlyingCoinIds: request.inputCoinIds,
                underlyingAmount: amount,
                minPtOut: minReceivedAmount(quote, "pt"),
                positionId: request.positionId,
                deadlineMs,
                syIndex,
                rewardSettlement,
              });
            }
            return transactionService.buildBuyPtTx({
              senderAddress: request.owner,
              inputCoinId: requireField(request.inputCoinId, "inputCoinId"),
              inputCoinIds: request.inputCoinIds,
              inputAmount: amount,
              minPtOut: minReceivedAmount(quote, "pt"),
              positionId: request.positionId,
              deadlineMs,
              syIndex,
              rewardSettlement,
            });
          case "sell_pt":
            return transactionService.buildSellPtTx({
              senderAddress: request.owner,
              ptAmount: amount,
              minSyOut: minReceivedAmount(quote, "sy"),
              positionId: requireField(request.positionId, "positionId"),
              deadlineMs,
              syIndex,
              rewardSettlement,
            });
          case "buy_yt":
            if (quote.inputAsset === "underlying") {
              return transactionService.buildBuyYtFromUnderlyingTx({
                senderAddress: request.owner,
                underlyingCoinId: request.inputCoinId,
                underlyingCoinIds: request.inputCoinIds,
                underlyingAmount: amount,
                minYtOut: minReceivedAmount(quote, "yt"),
                minSyOut: minReceivedAmount(quote, "sy", 0n),
                positionId: request.positionId,
                deadlineMs,
                syIndex,
                rewardSettlement,
              });
            }
            return transactionService.buildBuyYtTx({
              senderAddress: request.owner,
              inputCoinId: requireField(request.inputCoinId, "inputCoinId"),
              inputCoinIds: request.inputCoinIds,
              inputAmount: amount,
              minYtOut: minReceivedAmount(quote, "yt"),
              minSyOut: minReceivedAmount(quote, "sy", 0n),
              positionId: request.positionId,
              deadlineMs,
              syIndex,
              rewardSettlement,
            });
          case "sell_yt":
            return transactionService.buildSellYtTx({
              senderAddress: request.owner,
              ytAmount: amount,
              minSyOut: minReceivedAmount(quote, "sy"),
              positionId: requireField(request.positionId, "positionId"),
              deadlineMs,
              syIndex,
              rewardSettlement,
            });
          case "add_lp":
            return transactionService.buildAddLpTx({
              senderAddress: request.owner,
              inputCoinId: requireField(request.inputCoinId, "inputCoinId"),
              inputCoinIds: request.inputCoinIds,
              inputAmount: amount,
              ptAmount: parseAtomicAmount(
                request.pairedPtAmount ?? "",
                "pairedPtAmount",
              ),
              positionId: requireField(request.positionId, "positionId"),
              deadlineMs,
              syIndex,
              rewardSettlement,
            });
          case "add_lp_keep_yt":
            if (quote.inputAsset === "underlying") {
              return transactionService.buildAddLpKeepYtFromUnderlyingTx({
                senderAddress: request.owner,
                underlyingCoinId: request.inputCoinId,
                underlyingCoinIds: request.inputCoinIds,
                underlyingAmount: amount,
                syToMintHint: previewOutputAmount(quote, "syToMintHint"),
                minLpOut: minReceivedAmount(quote, "lp"),
                positionId: request.positionId,
                deadlineMs,
                syIndex,
                rewardSettlement,
              });
            }
            return transactionService.buildAddLpKeepYtTx({
              senderAddress: request.owner,
              inputCoinId: requireField(request.inputCoinId, "inputCoinId"),
              inputCoinIds: request.inputCoinIds,
              inputAmount: amount,
              syToMintHint: previewOutputAmount(quote, "syToMintHint"),
              minLpOut: minReceivedAmount(quote, "lp"),
              positionId: request.positionId,
              deadlineMs,
              syIndex,
              rewardSettlement,
            });
          case "add_lp_from_sy":
            if (quote.inputAsset === "underlying") {
              return transactionService.buildAddLpFromSyFromUnderlyingTx({
                senderAddress: request.owner,
                underlyingCoinId: request.inputCoinId,
                underlyingCoinIds: request.inputCoinIds,
                underlyingAmount: amount,
                syToMintHint: previewOutputAmount(quote, "syToMintHint"),
                minLpOut: minReceivedAmount(quote, "lp"),
                minSyOut: minReceivedAmount(quote, "sy", 0n),
                positionId: request.positionId,
                deadlineMs,
                syIndex,
                rewardSettlement,
              });
            }
            return transactionService.buildAddLpFromSyTx({
              senderAddress: request.owner,
              inputCoinId: requireField(request.inputCoinId, "inputCoinId"),
              inputCoinIds: request.inputCoinIds,
              inputAmount: amount,
              syToMintHint: previewOutputAmount(quote, "syToMintHint"),
              minLpOut: minReceivedAmount(quote, "lp"),
              minSyOut: minReceivedAmount(quote, "sy", 0n),
              positionId: request.positionId,
              deadlineMs,
              syIndex,
              rewardSettlement,
            });
          case "remove_lp":
            return transactionService.buildRemoveLpTx({
              senderAddress: request.owner,
              lpAmount: amount,
              minSyOut: minReceivedAmount(quote, "sy", 0n),
              minPtOut: minReceivedAmount(quote, "pt", 0n),
              positionId: requireField(request.positionId, "positionId"),
              deadlineMs,
              rewardSettlement,
            });
          case "remove_lp_to_sy":
            return transactionService.buildRemoveLpToSyTx({
              senderAddress: request.owner,
              lpAmount: amount,
              minSyOut: applySlippage(
                previewOutputAmount(quote, "syOut"),
                BigInt(quote.slippageBps),
              ),
              minPtOut: applySlippage(
                previewOutputAmount(quote, "ptOut"),
                BigInt(quote.slippageBps),
              ),
              minTotalSyOut: minReceivedAmount(quote, "sy"),
              positionId: requireField(request.positionId, "positionId"),
              deadlineMs,
              syIndex,
              rewardSettlement,
            });
        }
      })();

      return {
        status: "ready",
        marketId: quote.marketId,
        actionId: quote.actionId,
        owner: request.owner,
        unsigned: true,
        transactionEncoding: "sui-transaction-json-v2",
        transactionJson: await transaction.toJSON(
          options.network
            ? { client: getSuiGrpcClient(options.network) }
            : undefined,
        ),
        quote,
      };
    },
  };
}

function resolveActionId(
  request: JitterTradeQuoteRequest,
): JitterTradeActionId {
  if (request.actionId) return request.actionId;

  if (request.product === "pt" && request.side === "buy") return "buy_pt";
  if (request.product === "pt" && request.side === "sell") return "sell_pt";
  if (request.product === "yt" && request.side === "buy") return "buy_yt";
  if (request.product === "yt" && request.side === "sell") return "sell_yt";
  if (request.product === "lp" && request.side === "add_keep_yt") {
    return "add_lp_keep_yt";
  }
  if (request.product === "lp" && request.side === "add") {
    return request.pairedPtAmount === undefined ? "add_lp_from_sy" : "add_lp";
  }
  if (request.product === "lp" && request.side === "remove") return "remove_lp";

  return "buy_pt";
}

function getUnavailableReason(
  options: CreateJitterTradeServiceOptions,
  request: JitterTradeQuoteRequest,
  actionId: JitterTradeActionId,
): string | null {
  if (request.marketId !== options.marketId) {
    return `Trade request marketId ${request.marketId} does not match service market ${options.marketId}.`;
  }

  const spec = ACTION_SPECS[actionId];
  if (spec.product !== request.product) {
    return `Trade action ${actionId} does not support product ${request.product}.`;
  }
  if (spec.side !== request.side && !(actionId === "add_lp_keep_yt" && request.side === "add_keep_yt")) {
    return `Trade action ${actionId} does not support side ${request.side}.`;
  }
  if (!spec.inputAssets.includes(request.inputAsset)) {
    return `Trade action ${actionId} supports ${spec.inputAssets.join(
      " or ",
    )} as the primary input asset.`;
  }
  if (actionId === "add_lp" && request.pairedPtAmount === undefined) {
    return "pairedPtAmount is required for add_lp trades.";
  }

  try {
    const amount = parseAtomicAmount(request.amount, "amount");
    if (amount <= 0n) return "Trade amount must be greater than zero.";
    parseSlippageBps(request.slippageBps);
    if (request.pairedPtAmount !== undefined) {
      parseAtomicAmount(request.pairedPtAmount, "pairedPtAmount");
    }
  } catch (error) {
    return error instanceof Error ? error.message : "Invalid trade request.";
  }

  if (options.metadata) {
    if (!options.metadata.tradeReady) {
      return (
        options.metadata.disabledReason ??
        "Trading is disabled for this market."
      );
    }
    const action = options.metadata.actions.find(
      (candidate) => candidate.id === actionId,
    );
    if (!action) return `Trade action ${actionId} is not supported.`;
    if (action.disabledReason) return action.disabledReason;
  }

  return null;
}

function availableQuoteResponse(
  request: JitterTradeQuoteRequest,
  actionId: JitterTradeActionId,
  slippageBps: bigint,
  fields: {
    expectedOutput: Array<{ asset: JitterTradeAsset; amount: bigint }>;
    minReceived: Array<{ asset: JitterTradeAsset; amount: bigint }>;
    priceImpactBps: bigint;
    feeTotalSy: bigint;
    source: JitterPreviewSource;
    preview: JitterTradePreviewSnapshot;
  },
): JitterTradeQuoteResponse {
  return {
    status: "available",
    marketId: request.marketId,
    actionId,
    product: request.product,
    side: request.side,
    inputAsset: request.inputAsset,
    inputAmount: request.amount,
    slippageBps: Number(slippageBps),
    expectedOutput: serializeAmounts(fields.expectedOutput),
    fee: { totalSy: fields.feeTotalSy.toString() },
    priceImpactBps: fields.priceImpactBps.toString(),
    apyChangeBps: null,
    minReceived: serializeAmounts(fields.minReceived),
    maxInput: null,
    source: quoteSource(fields.source),
    unavailableReason: null,
    preview: fields.preview,
  };
}

function unavailableQuoteResponse(
  request: JitterTradeQuoteRequest,
  actionId: JitterTradeActionId,
  reason: string,
): JitterTradeQuoteResponse {
  return {
    status: "unavailable",
    marketId: request.marketId,
    actionId,
    product: request.product,
    side: request.side,
    inputAsset: request.inputAsset,
    inputAmount: request.amount,
    slippageBps: request.slippageBps,
    expectedOutput: [],
    fee: { totalSy: "0" },
    priceImpactBps: null,
    apyChangeBps: null,
    minReceived: [],
    maxInput: null,
    source: {
      kind: "unavailable",
      state: "unavailable",
      stale: false,
      updatedAtMs: null,
    },
    unavailableReason: reason,
    preview: null,
  };
}

function formatQuotePreviewError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("abort code: 1402") ||
    normalized.includes("e_proportion_too_high") ||
    normalized.includes("calc_trade_proportion")
  ) {
    return "Trade amount is too large for the current pool liquidity.";
  }

  if (normalized.includes("transaction simulation failed")) {
    return "Quote simulation failed. Try a smaller amount or refresh the market.";
  }

  return message || "Quote is unavailable.";
}

function quoteSource(source: JitterPreviewSource): JitterTradeQuoteSource {
  const state = source.kind === "unavailable" ? "unavailable" : "available";
  return {
    kind: source.kind,
    state,
    stale: false,
    updatedAtMs: null,
    ...(source.detail ? { detail: source.detail } : {}),
  };
}

function previewSnapshot(preview: {
  input: Record<string, bigint>;
  output: Record<string, bigint>;
  positionDelta: { pt: bigint; yt: bigint; lp: bigint };
  walletDelta: { sy: bigint };
  assumptions: JitterPreviewAssumption[];
}): JitterTradePreviewSnapshot {
  return {
    positionDelta: stringifyRecord(preview.positionDelta),
    walletDelta: stringifyRecord(preview.walletDelta),
    input: stringifyRecord(preview.input),
    output: stringifyRecord(preview.output),
    assumptions: preview.assumptions,
  };
}

function serializeAmounts(
  amounts: Array<{ asset: JitterTradeAsset; amount: bigint }>,
): JitterTradeAmount[] {
  return amounts.map(({ asset, amount }) => ({
    asset,
    amount: amount.toString(),
  }));
}

async function resolveSyTradeInput(
  quoteService: JitterQuoteService,
  inputAsset: JitterTradeAsset,
  amount: bigint,
  syIndex?: bigint,
): Promise<{ syIn: bigint; syIndex?: bigint }> {
  if (inputAsset === "sy") {
    return { syIn: amount, syIndex };
  }
  if (inputAsset === "underlying") {
    const converted = await quoteService.quoteUnderlyingToSy(amount, syIndex);
    return { syIn: converted.syIn, syIndex: converted.syIndex };
  }
  throw new Error(`Trade input asset ${inputAsset} cannot be quoted as SY.`);
}

function stringifyRecord<T extends Record<string, bigint>>(
  values: T,
): Record<keyof T, string> {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [key, value.toString()]),
  ) as Record<keyof T, string>;
}

function applySlippage(amount: bigint, slippageBps: bigint): bigint {
  if (amount <= 0n) return amount;
  return (amount * (BASIS_POINTS - slippageBps)) / BASIS_POINTS;
}

function minReceivedAmount(
  quote: JitterTradeQuoteResponse,
  asset: JitterTradeAsset,
  fallback?: bigint,
): bigint {
  const amount = quote.minReceived.find((candidate) => candidate.asset === asset);
  if (!amount) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Quote is missing min received amount for ${asset}.`);
  }
  return BigInt(amount.amount);
}

function previewOutputAmount(
  quote: JitterTradeQuoteResponse,
  key: string,
): bigint {
  const amount = quote.preview?.output[key];
  if (amount === undefined) {
    throw new Error(`Quote preview is missing output ${key}.`);
  }
  return BigInt(amount);
}

function parseAtomicAmount(value: string, field: string): bigint {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${field} must be an unsigned integer string.`);
  }
  return BigInt(value);
}

function parseOptionalBigInt(value: string | undefined, field: string): bigint | undefined {
  if (value === undefined) return undefined;
  return parseAtomicAmount(value, field);
}

function parseSlippageBps(value: number): bigint {
  if (!Number.isInteger(value) || value < 0 || value > 10_000) {
    throw new Error("slippageBps must be an integer between 0 and 10000.");
  }
  return BigInt(value);
}

function requireField(value: string | undefined, field: string): string {
  if (!value) throw new Error(`${field} is required.`);
  return value;
}
