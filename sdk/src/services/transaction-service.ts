import {
  Transaction,
  type TransactionArgument,
  type TransactionObjectArgument,
} from "@mysten/sui/transactions";

import { getJitterAdapterManifest } from "../adapters/registry.js";
import type { JitterAdapterManifest } from "../adapters/types.js";

import { DEFAULT_DEMO_SY_INDEX, SUI_TYPE_TAG } from "../constants.js";
import {
  addCancelOrder,
  addClaimOrder,
  addPlaceBidOrder,
  type OrderbookAsset,
} from "../orderbook.js";
import { addClaimYtInterest, addCreatePosition, addCreatePyPosition } from "../py.js";
import { addSwapSyForPt } from "../pool.js";
import {
  addSettleLpRewardOperationWithLiquidlinkPoints,
  addSettlePoolRewardOperationWithLiquidlinkPoints,
  addSettleYtRewardOperationWithLiquidlinkPoints,
} from "../liquidlink-points.js";
import { addBurnSyExactIn, addMintSyExactIn } from "../sy.js";
import type { JitterMarketConfig } from "../types.js";

export type CreateJitterTransactionServiceOptions = {
  config: JitterMarketConfig;
  adapter?: JitterAdapterManifest;
  gasBudget?: bigint;
  resolveSyIndex?: () => Promise<bigint> | bigint;
};

export type SwapSyForPtTxParams = {
  syCoinId: string;
  syAmount: bigint;
  minPtOut: bigint;
  pyPositionId: string;
  senderAddress: string;
  syIndex?: bigint;
};

export type DepositToSyTxParams = {
  underlyingCoinId: string;
  underlyingAmount: bigint;
  senderAddress: string;
  syIndex?: bigint;
};

export type RedeemSyToUnderlyingTxParams = {
  syCoinId: string;
  syAmount: bigint;
  senderAddress: string;
  syIndex?: bigint;
};

export type ClaimYtInterestTxParams = {
  pyPositionId: string;
  senderAddress: string;
  syIndex?: bigint;
};

export type PlaceBidOrderTxParams = {
  syCoinId: string;
  syAmount: bigint;
  priceRaw: bigint;
  minPtAmount: bigint;
  senderAddress: string;
  expiryMs?: bigint;
  asset?: OrderbookAsset;
};

export type OrderActionTxParams = {
  orderId: bigint;
  senderAddress: string;
  asset?: OrderbookAsset;
};

export type EmptyRewardSettlementStrategy = {
  strategy: "empty-vector";
};

export type ProductTxRewardSettlementParams = {
  /**
   * Reward-enabled contracts require explicit settlement handling. For MVP callers
   * must either pass empty-vector for non-reward pools or future settlement inputs.
   */
  rewardSettlement: EmptyRewardSettlementStrategy;
};

export type BuildBuyPtTxParams = ProductTxRewardSettlementParams & {
  senderAddress: string;
  inputCoinId: string;
  inputCoinIds?: readonly string[];
  inputAmount: bigint;
  minPtOut: bigint;
  positionId?: string;
  deadlineMs?: bigint;
  syIndex?: bigint;
};

export type BuildBuyPtFromUnderlyingTxParams = ProductTxRewardSettlementParams & {
  senderAddress: string;
  underlyingCoinId?: string;
  underlyingCoinIds?: readonly string[];
  underlyingAmount: bigint;
  minPtOut: bigint;
  positionId?: string;
  deadlineMs?: bigint;
  syIndex?: bigint;
};

export type BuildSellPtTxParams = ProductTxRewardSettlementParams & {
  senderAddress: string;
  ptAmount: bigint;
  minSyOut: bigint;
  positionId: string;
  deadlineMs?: bigint;
  syIndex?: bigint;
};

export type BuildBuyPtRouteTxParams = ProductTxRewardSettlementParams & {
  senderAddress: string;
  inputCoinId: string;
  inputCoinIds?: readonly string[];
  inputAmount: bigint;
  orderIds: Array<bigint | number | string>;
  maxBookPriceRaw: bigint;
  minTotalPtOut: bigint;
  positionId?: string;
  deadlineMs?: bigint;
  syIndex?: bigint;
};

export type BuildSellPtRouteTxParams = ProductTxRewardSettlementParams & {
  senderAddress: string;
  ptAmount: bigint;
  orderIds: Array<bigint | number | string>;
  minBookPriceRaw: bigint;
  minTotalSyOut: bigint;
  positionId: string;
  deadlineMs?: bigint;
  syIndex?: bigint;
};

export type BuildBuyYtTxParams = ProductTxRewardSettlementParams & {
  senderAddress: string;
  inputCoinId: string;
  inputCoinIds?: readonly string[];
  inputAmount: bigint;
  minYtOut: bigint;
  minSyOut: bigint;
  positionId?: string;
  deadlineMs?: bigint;
  syIndex?: bigint;
};

export type BuildBuyYtFromUnderlyingTxParams = ProductTxRewardSettlementParams & {
  senderAddress: string;
  underlyingCoinId?: string;
  underlyingCoinIds?: readonly string[];
  underlyingAmount: bigint;
  minYtOut: bigint;
  minSyOut: bigint;
  positionId?: string;
  deadlineMs?: bigint;
  syIndex?: bigint;
};

export type BuildSellYtTxParams = ProductTxRewardSettlementParams & {
  senderAddress: string;
  ytAmount: bigint;
  minSyOut: bigint;
  positionId: string;
  deadlineMs?: bigint;
  syIndex?: bigint;
};

export type BuildAddLpTxParams = ProductTxRewardSettlementParams & {
  senderAddress: string;
  inputCoinId: string;
  inputCoinIds?: readonly string[];
  inputAmount: bigint;
  ptAmount: bigint;
  positionId: string;
  deadlineMs?: bigint;
  syIndex?: bigint;
};

export type BuildAddLpKeepYtTxParams = ProductTxRewardSettlementParams & {
  senderAddress: string;
  inputCoinId: string;
  inputCoinIds?: readonly string[];
  inputAmount: bigint;
  syToMintHint: bigint;
  minLpOut: bigint;
  positionId?: string;
  deadlineMs?: bigint;
  syIndex?: bigint;
};

export type BuildAddLpKeepYtFromUnderlyingTxParams =
  ProductTxRewardSettlementParams & {
    senderAddress: string;
    underlyingCoinId?: string;
    underlyingCoinIds?: readonly string[];
    underlyingAmount: bigint;
    syToMintHint: bigint;
    minLpOut: bigint;
    positionId?: string;
    deadlineMs?: bigint;
    syIndex?: bigint;
  };

export type BuildAddLpFromSyTxParams = ProductTxRewardSettlementParams & {
  senderAddress: string;
  inputCoinId: string;
  inputCoinIds?: readonly string[];
  inputAmount: bigint;
  syToMintHint: bigint;
  minLpOut: bigint;
  minSyOut: bigint;
  positionId?: string;
  deadlineMs?: bigint;
  syIndex?: bigint;
};

export type BuildAddLpFromSyFromUnderlyingTxParams =
  ProductTxRewardSettlementParams & {
    senderAddress: string;
    underlyingCoinId?: string;
    underlyingCoinIds?: readonly string[];
    underlyingAmount: bigint;
    syToMintHint: bigint;
    minLpOut: bigint;
    minSyOut: bigint;
    positionId?: string;
    deadlineMs?: bigint;
    syIndex?: bigint;
  };

export type BuildRemoveLpTxParams = ProductTxRewardSettlementParams & {
  senderAddress: string;
  lpAmount: bigint;
  minSyOut: bigint;
  minPtOut: bigint;
  positionId: string;
  deadlineMs?: bigint;
};

export type BuildRemoveLpToSyTxParams = ProductTxRewardSettlementParams & {
  senderAddress: string;
  lpAmount: bigint;
  minSyOut: bigint;
  minPtOut: bigint;
  minTotalSyOut: bigint;
  positionId: string;
  deadlineMs?: bigint;
  syIndex?: bigint;
};

export type JitterTransactionService = {
  buildBuyPtTx(params: BuildBuyPtTxParams): Promise<Transaction>;
  buildBuyPtFromUnderlyingTx(
    params: BuildBuyPtFromUnderlyingTxParams,
  ): Promise<Transaction>;
  buildSellPtTx(params: BuildSellPtTxParams): Promise<Transaction>;
  buildBuyPtRouteTx(params: BuildBuyPtRouteTxParams): Promise<Transaction>;
  buildSellPtRouteTx(params: BuildSellPtRouteTxParams): Promise<Transaction>;
  buildBuyYtTx(params: BuildBuyYtTxParams): Promise<Transaction>;
  buildBuyYtFromUnderlyingTx(
    params: BuildBuyYtFromUnderlyingTxParams,
  ): Promise<Transaction>;
  buildSellYtTx(params: BuildSellYtTxParams): Promise<Transaction>;
  buildAddLpTx(params: BuildAddLpTxParams): Promise<Transaction>;
  buildAddLpKeepYtTx(params: BuildAddLpKeepYtTxParams): Promise<Transaction>;
  buildAddLpKeepYtFromUnderlyingTx(
    params: BuildAddLpKeepYtFromUnderlyingTxParams,
  ): Promise<Transaction>;
  buildAddLpFromSyTx(params: BuildAddLpFromSyTxParams): Promise<Transaction>;
  buildAddLpFromSyFromUnderlyingTx(
    params: BuildAddLpFromSyFromUnderlyingTxParams,
  ): Promise<Transaction>;
  buildRemoveLpTx(params: BuildRemoveLpTxParams): Promise<Transaction>;
  buildRemoveLpToSyTx(params: BuildRemoveLpToSyTxParams): Promise<Transaction>;
  buildDepositToSyTx(params: DepositToSyTxParams): Promise<Transaction>;
  buildRedeemSyToUnderlyingTx(params: RedeemSyToUnderlyingTxParams): Promise<Transaction>;
  buildSwapSyForPtTx(params: SwapSyForPtTxParams): Promise<Transaction>;
  buildClaimYtInterestTx(params: ClaimYtInterestTxParams): Promise<Transaction>;
  buildPlaceBidOrderTx(params: PlaceBidOrderTxParams): Transaction;
  buildClaimOrderTx(params: OrderActionTxParams): Transaction;
  buildCancelOrderTx(params: OrderActionTxParams): Transaction;
};

const DEFAULT_GAS_BUDGET = 300_000_000n;

export function createJitterTransactionService(
  options: CreateJitterTransactionServiceOptions,
): JitterTransactionService {
  const adapter = options.adapter ?? getJitterAdapterManifest(options.config);
  return {
    async buildBuyPtTx(params: BuildBuyPtTxParams): Promise<Transaction> {
      assertEmptyRewardSettlement(params.rewardSettlement);
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const tx = newTransaction(options, params.senderAddress);
      const position = ensurePyPosition(tx, options.config, params.positionId);
      const syCoin = splitCoinFromIds(tx, {
        primaryCoinId: params.inputCoinId,
        coinIds: params.inputCoinIds,
        amount: params.inputAmount,
      });
      const priceInfo = adapter.addPriceInfo({ tx, config: options.config, syIndex });
      const [, syChange, postOps] = addBuyPt(tx, options.config, {
        syCoin,
        minPtOut: params.minPtOut,
        position: position.argument,
        ownerAddress: params.senderAddress,
        priceInfo,
        deadlineMs: params.deadlineMs ?? 0n,
      });
      finishOrDestroyRewardOperations(tx, options.config, postOps, [REWARD_SCOPE_POOL]);
      tx.transferObjects([syChange], tx.pure.address(params.senderAddress));
      transferCreatedPosition(tx, options.config, position, params.senderAddress);
      return tx;
    },

    async buildBuyPtFromUnderlyingTx(
      params: BuildBuyPtFromUnderlyingTxParams,
    ): Promise<Transaction> {
      assertEmptyRewardSettlement(params.rewardSettlement);
      assertDirectUnderlyingDeposit(adapter, "buildBuyPtFromUnderlyingTx");
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const tx = newTransaction(options, params.senderAddress);
      const position = ensurePyPosition(tx, options.config, params.positionId);
      const { syCoin, excessCoin } = addSyFromUnderlyingExactIn(
        tx,
        options.config,
        adapter,
        {
          underlyingCoinId: params.underlyingCoinId,
          underlyingCoinIds: params.underlyingCoinIds,
          underlyingAmount: params.underlyingAmount,
          syIndex,
        },
      );
      const priceInfo = adapter.addPriceInfo({ tx, config: options.config, syIndex });
      const [, syChange, postOps] = addBuyPt(tx, options.config, {
        syCoin,
        minPtOut: params.minPtOut,
        position: position.argument,
        ownerAddress: params.senderAddress,
        priceInfo,
        deadlineMs: params.deadlineMs ?? 0n,
      });
      finishOrDestroyRewardOperations(tx, options.config, postOps, [REWARD_SCOPE_POOL]);
      tx.transferObjects(
        appendOptionalObject([syChange], excessCoin),
        tx.pure.address(params.senderAddress),
      );
      transferCreatedPosition(tx, options.config, position, params.senderAddress);
      return tx;
    },

    async buildSellPtTx(params: BuildSellPtTxParams): Promise<Transaction> {
      assertEmptyRewardSettlement(params.rewardSettlement);
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const tx = newTransaction(options, params.senderAddress);
      const priceInfo = adapter.addPriceInfo({ tx, config: options.config, syIndex });
      const [syCoin, postOps] = addSellPt(tx, options.config, {
        ptAmount: params.ptAmount,
        minSyOut: params.minSyOut,
        positionId: params.positionId,
        ownerAddress: params.senderAddress,
        priceInfo,
        deadlineMs: params.deadlineMs ?? 0n,
      });
      finishOrDestroyRewardOperations(tx, options.config, postOps, [REWARD_SCOPE_POOL]);
      tx.transferObjects([syCoin], tx.pure.address(params.senderAddress));
      return tx;
    },

    async buildBuyPtRouteTx(params: BuildBuyPtRouteTxParams): Promise<Transaction> {
      assertEmptyRewardSettlement(params.rewardSettlement);
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const tx = newTransaction(options, params.senderAddress);
      const position = ensurePyPosition(tx, options.config, params.positionId);
      const syCoin = splitCoinFromIds(tx, {
        primaryCoinId: params.inputCoinId,
        coinIds: params.inputCoinIds,
        amount: params.inputAmount,
      });
      const priceInfo = adapter.addPriceInfo({ tx, config: options.config, syIndex });
      const [syChange, postOps] = addBuyPtRoute(tx, options.config, {
        syCoin,
        orderIds: params.orderIds,
        maxBookPriceRaw: params.maxBookPriceRaw,
        minTotalPtOut: params.minTotalPtOut,
        position: position.argument,
        priceInfo,
      });
      destroyEmptyRewardOperations(tx, options.config, postOps);
      tx.transferObjects([syChange], tx.pure.address(params.senderAddress));
      transferCreatedPosition(tx, options.config, position, params.senderAddress);
      return tx;
    },

    async buildSellPtRouteTx(params: BuildSellPtRouteTxParams): Promise<Transaction> {
      assertEmptyRewardSettlement(params.rewardSettlement);
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const tx = newTransaction(options, params.senderAddress);
      const priceInfo = adapter.addPriceInfo({ tx, config: options.config, syIndex });
      const [syCoin, postOps] = addSellPtRoute(tx, options.config, {
        ptAmount: params.ptAmount,
        orderIds: params.orderIds,
        minBookPriceRaw: params.minBookPriceRaw,
        minTotalSyOut: params.minTotalSyOut,
        positionId: params.positionId,
        priceInfo,
      });
      destroyEmptyRewardOperations(tx, options.config, postOps);
      tx.transferObjects([syCoin], tx.pure.address(params.senderAddress));
      return tx;
    },

    async buildBuyYtTx(params: BuildBuyYtTxParams): Promise<Transaction> {
      assertEmptyRewardSettlement(params.rewardSettlement);
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const tx = newTransaction(options, params.senderAddress);
      const position = ensurePyPosition(tx, options.config, params.positionId);
      const syCoin = splitCoinFromIds(tx, {
        primaryCoinId: params.inputCoinId,
        coinIds: params.inputCoinIds,
        amount: params.inputAmount,
      });
      const priceInfo = adapter.addPriceInfo({ tx, config: options.config, syIndex });
      const [, syChange, postOps] = addBuyYt(tx, options.config, {
        syCoin,
        minYtOut: params.minYtOut,
        minSyOut: params.minSyOut,
        position: position.argument,
        ownerAddress: params.senderAddress,
        priceInfo,
        deadlineMs: params.deadlineMs ?? 0n,
      });
      finishOrDestroyRewardOperations(tx, options.config, postOps, [REWARD_SCOPE_POOL, REWARD_SCOPE_YT], position.argument);
      tx.transferObjects([syChange], tx.pure.address(params.senderAddress));
      transferCreatedPosition(tx, options.config, position, params.senderAddress);
      return tx;
    },

    async buildBuyYtFromUnderlyingTx(
      params: BuildBuyYtFromUnderlyingTxParams,
    ): Promise<Transaction> {
      assertEmptyRewardSettlement(params.rewardSettlement);
      assertDirectUnderlyingDeposit(adapter, "buildBuyYtFromUnderlyingTx");
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const tx = newTransaction(options, params.senderAddress);
      const position = ensurePyPosition(tx, options.config, params.positionId);
      const { syCoin, excessCoin } = addSyFromUnderlyingExactIn(
        tx,
        options.config,
        adapter,
        {
          underlyingCoinId: params.underlyingCoinId,
          underlyingCoinIds: params.underlyingCoinIds,
          underlyingAmount: params.underlyingAmount,
          syIndex,
        },
      );
      const priceInfo = adapter.addPriceInfo({ tx, config: options.config, syIndex });
      const [, syChange, postOps] = addBuyYt(tx, options.config, {
        syCoin,
        minYtOut: params.minYtOut,
        minSyOut: params.minSyOut,
        position: position.argument,
        ownerAddress: params.senderAddress,
        priceInfo,
        deadlineMs: params.deadlineMs ?? 0n,
      });
      finishOrDestroyRewardOperations(tx, options.config, postOps, [REWARD_SCOPE_POOL, REWARD_SCOPE_YT], position.argument);
      tx.transferObjects(
        appendOptionalObject([syChange], excessCoin),
        tx.pure.address(params.senderAddress),
      );
      transferCreatedPosition(tx, options.config, position, params.senderAddress);
      return tx;
    },

    async buildSellYtTx(params: BuildSellYtTxParams): Promise<Transaction> {
      assertEmptyRewardSettlement(params.rewardSettlement);
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const tx = newTransaction(options, params.senderAddress);
      const priceInfo = adapter.addPriceInfo({ tx, config: options.config, syIndex });
      const [syCoin, postOps] = addSellYt(tx, options.config, {
        ytAmount: params.ytAmount,
        minSyOut: params.minSyOut,
        positionId: params.positionId,
        ownerAddress: params.senderAddress,
        priceInfo,
        deadlineMs: params.deadlineMs ?? 0n,
      });
      finishOrDestroyRewardOperations(tx, options.config, postOps, [REWARD_SCOPE_POOL, REWARD_SCOPE_YT], params.positionId);
      tx.transferObjects([syCoin], tx.pure.address(params.senderAddress));
      return tx;
    },

    async buildAddLpTx(params: BuildAddLpTxParams): Promise<Transaction> {
      assertEmptyRewardSettlement(params.rewardSettlement);
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const tx = newTransaction(options, params.senderAddress);
      const syCoin = splitCoinFromIds(tx, {
        primaryCoinId: params.inputCoinId,
        coinIds: params.inputCoinIds,
        amount: params.inputAmount,
      });
      const priceInfo = adapter.addPriceInfo({ tx, config: options.config, syIndex });
      const [, , syChange, postOps] = addLp(tx, options.config, {
        syCoin,
        ptAmount: params.ptAmount,
        positionId: params.positionId,
        ownerAddress: params.senderAddress,
        priceInfo,
        deadlineMs: params.deadlineMs ?? 0n,
      });
      finishOrDestroyRewardOperations(tx, options.config, postOps, [REWARD_SCOPE_POOL, REWARD_SCOPE_LP], params.positionId);
      tx.transferObjects([syChange], tx.pure.address(params.senderAddress));
      return tx;
    },

    async buildAddLpKeepYtTx(params: BuildAddLpKeepYtTxParams): Promise<Transaction> {
      assertEmptyRewardSettlement(params.rewardSettlement);
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const tx = newTransaction(options, params.senderAddress);
      const position = ensureFullPosition(tx, options.config, params.positionId);
      const syCoin = splitCoinFromIds(tx, {
        primaryCoinId: params.inputCoinId,
        coinIds: params.inputCoinIds,
        amount: params.inputAmount,
      });
      const priceInfo = adapter.addPriceInfo({ tx, config: options.config, syIndex });
      const [, , syChange, postOps] = addLpKeepYt(tx, options.config, {
        syCoin,
        syToMintHint: params.syToMintHint,
        minLpOut: params.minLpOut,
        position: position.argument,
        ownerAddress: params.senderAddress,
        priceInfo,
        deadlineMs: params.deadlineMs ?? 0n,
      });
      finishOrDestroyRewardOperations(tx, options.config, postOps, [REWARD_SCOPE_POOL, REWARD_SCOPE_LP, REWARD_SCOPE_YT], position.argument);
      tx.transferObjects([syChange], tx.pure.address(params.senderAddress));
      transferCreatedPosition(tx, options.config, position, params.senderAddress);
      return tx;
    },

    async buildAddLpKeepYtFromUnderlyingTx(
      params: BuildAddLpKeepYtFromUnderlyingTxParams,
    ): Promise<Transaction> {
      assertEmptyRewardSettlement(params.rewardSettlement);
      assertDirectUnderlyingDeposit(
        adapter,
        "buildAddLpKeepYtFromUnderlyingTx",
      );
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const tx = newTransaction(options, params.senderAddress);
      const position = ensureFullPosition(tx, options.config, params.positionId);
      const { syCoin, excessCoin } = addSyFromUnderlyingExactIn(
        tx,
        options.config,
        adapter,
        {
          underlyingCoinId: params.underlyingCoinId,
          underlyingCoinIds: params.underlyingCoinIds,
          underlyingAmount: params.underlyingAmount,
          syIndex,
        },
      );
      const priceInfo = adapter.addPriceInfo({ tx, config: options.config, syIndex });
      const [, , syChange, postOps] = addLpKeepYt(tx, options.config, {
        syCoin,
        syToMintHint: params.syToMintHint,
        minLpOut: params.minLpOut,
        position: position.argument,
        ownerAddress: params.senderAddress,
        priceInfo,
        deadlineMs: params.deadlineMs ?? 0n,
      });
      finishOrDestroyRewardOperations(tx, options.config, postOps, [REWARD_SCOPE_POOL, REWARD_SCOPE_LP, REWARD_SCOPE_YT], position.argument);
      tx.transferObjects(
        appendOptionalObject([syChange], excessCoin),
        tx.pure.address(params.senderAddress),
      );
      transferCreatedPosition(tx, options.config, position, params.senderAddress);
      return tx;
    },

    async buildAddLpFromSyTx(params: BuildAddLpFromSyTxParams): Promise<Transaction> {
      assertEmptyRewardSettlement(params.rewardSettlement);
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const tx = newTransaction(options, params.senderAddress);
      const position = ensureFullPosition(tx, options.config, params.positionId);
      const syCoin = splitCoinFromIds(tx, {
        primaryCoinId: params.inputCoinId,
        coinIds: params.inputCoinIds,
        amount: params.inputAmount,
      });
      const priceInfo = adapter.addPriceInfo({ tx, config: options.config, syIndex });
      const [, syChange, postOps] = addLpFromSy(tx, options.config, {
        syCoin,
        syToMintHint: params.syToMintHint,
        minLpOut: params.minLpOut,
        minSyOut: params.minSyOut,
        position: position.argument,
        ownerAddress: params.senderAddress,
        priceInfo,
        deadlineMs: params.deadlineMs ?? 0n,
      });
      finishOrDestroyRewardOperations(tx, options.config, postOps, [REWARD_SCOPE_POOL, REWARD_SCOPE_LP, REWARD_SCOPE_YT], position.argument);
      tx.transferObjects([syChange], tx.pure.address(params.senderAddress));
      transferCreatedPosition(tx, options.config, position, params.senderAddress);
      return tx;
    },

    async buildAddLpFromSyFromUnderlyingTx(
      params: BuildAddLpFromSyFromUnderlyingTxParams,
    ): Promise<Transaction> {
      assertEmptyRewardSettlement(params.rewardSettlement);
      assertDirectUnderlyingDeposit(
        adapter,
        "buildAddLpFromSyFromUnderlyingTx",
      );
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const tx = newTransaction(options, params.senderAddress);
      const position = ensureFullPosition(tx, options.config, params.positionId);
      const { syCoin, excessCoin } = addSyFromUnderlyingExactIn(
        tx,
        options.config,
        adapter,
        {
          underlyingCoinId: params.underlyingCoinId,
          underlyingCoinIds: params.underlyingCoinIds,
          underlyingAmount: params.underlyingAmount,
          syIndex,
        },
      );
      const priceInfo = adapter.addPriceInfo({ tx, config: options.config, syIndex });
      const [, syChange, postOps] = addLpFromSy(tx, options.config, {
        syCoin,
        syToMintHint: params.syToMintHint,
        minLpOut: params.minLpOut,
        minSyOut: params.minSyOut,
        position: position.argument,
        ownerAddress: params.senderAddress,
        priceInfo,
        deadlineMs: params.deadlineMs ?? 0n,
      });
      finishOrDestroyRewardOperations(tx, options.config, postOps, [REWARD_SCOPE_POOL, REWARD_SCOPE_LP, REWARD_SCOPE_YT], position.argument);
      tx.transferObjects(
        appendOptionalObject([syChange], excessCoin),
        tx.pure.address(params.senderAddress),
      );
      transferCreatedPosition(tx, options.config, position, params.senderAddress);
      return tx;
    },

    async buildRemoveLpTx(params: BuildRemoveLpTxParams): Promise<Transaction> {
      assertEmptyRewardSettlement(params.rewardSettlement);
      const tx = newTransaction(options, params.senderAddress);
      const [syCoin, , postOps] = addRemoveLp(tx, options.config, {
        lpAmount: params.lpAmount,
        minSyOut: params.minSyOut,
        minPtOut: params.minPtOut,
        positionId: params.positionId,
        ownerAddress: params.senderAddress,
        deadlineMs: params.deadlineMs ?? 0n,
      });
      finishOrDestroyRewardOperations(tx, options.config, postOps, [REWARD_SCOPE_POOL, REWARD_SCOPE_LP], params.positionId);
      tx.transferObjects([syCoin], tx.pure.address(params.senderAddress));
      return tx;
    },

    async buildRemoveLpToSyTx(params: BuildRemoveLpToSyTxParams): Promise<Transaction> {
      assertEmptyRewardSettlement(params.rewardSettlement);
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const tx = newTransaction(options, params.senderAddress);
      const [syCoin, ptAmount, removePostOps] = addRemoveLp(tx, options.config, {
        lpAmount: params.lpAmount,
        minSyOut: params.minSyOut,
        minPtOut: params.minPtOut,
        positionId: params.positionId,
        ownerAddress: params.senderAddress,
        deadlineMs: params.deadlineMs ?? 0n,
      });
      finishOrDestroyRewardOperations(tx, options.config, removePostOps, [REWARD_SCOPE_POOL, REWARD_SCOPE_LP], params.positionId);
      const priceInfo = adapter.addPriceInfo({ tx, config: options.config, syIndex });
      const [swappedSyCoin, sellPostOps] = addSellPt(tx, options.config, {
        ptAmount,
        minSyOut:
          params.minTotalSyOut > params.minSyOut
            ? params.minTotalSyOut - params.minSyOut
            : 0n,
        positionId: params.positionId,
        ownerAddress: params.senderAddress,
        priceInfo,
        deadlineMs: params.deadlineMs ?? 0n,
      });
      finishOrDestroyRewardOperations(tx, options.config, sellPostOps, [REWARD_SCOPE_POOL]);
      tx.mergeCoins(syCoin, [swappedSyCoin]);
      tx.transferObjects([syCoin], tx.pure.address(params.senderAddress));
      return tx;
    },

    async buildDepositToSyTx(params: DepositToSyTxParams): Promise<Transaction> {
      if (!adapter.canDepositUnderlying) {
        throw new Error(
          `Adapter ${adapter.kind} does not support direct underlying deposits through buildDepositToSyTx.`,
        );
      }
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const tx = newTransaction(options, params.senderAddress);
      const underlyingCoin = splitUnderlyingCoinExactIn(tx, options.config, {
        underlyingCoinId: params.underlyingCoinId,
        underlyingAmount: params.underlyingAmount,
      });
      const priceInfo = adapter.addPriceInfo({ tx, config: options.config, syIndex });
      const [syCoin, mintRequest] = addMintSyExactIn(
        tx,
        options.config,
        priceInfo,
        params.underlyingAmount,
      );
      const depositResult = adapter.addDepositToSy({
        tx,
        config: options.config,
        mintRequest,
        inputCoin: underlyingCoin,
        syAmount: params.underlyingAmount,
      });
      const transferObjects = depositResult.excessCoin
        ? [syCoin, depositResult.excessCoin]
        : [syCoin];
      tx.transferObjects(transferObjects, tx.pure.address(params.senderAddress));
      return tx;
    },

    async buildRedeemSyToUnderlyingTx(
      params: RedeemSyToUnderlyingTxParams,
    ): Promise<Transaction> {
      if (!adapter.canRedeemUnderlying) {
        throw new Error(
          `Adapter ${adapter.kind} does not support direct underlying redemptions through buildRedeemSyToUnderlyingTx.`,
        );
      }
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const tx = newTransaction(options, params.senderAddress);
      const syCoin = tx.splitCoins(tx.object(params.syCoinId), [
        tx.pure.u64(params.syAmount),
      ]);
      const priceInfo = adapter.addPriceInfo({ tx, config: options.config, syIndex });
      const burnRequest = addBurnSyExactIn(tx, options.config, priceInfo, syCoin);
      const redeemResult = adapter.addRedeemFromSy({
        tx,
        config: options.config,
        burnRequest,
        syAmount: params.syAmount,
      });
      tx.transferObjects(
        [redeemResult.outputCoin],
        tx.pure.address(params.senderAddress),
      );
      return tx;
    },

    async buildSwapSyForPtTx(params: SwapSyForPtTxParams): Promise<Transaction> {
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const tx = newTransaction(options, params.senderAddress);
      const syCoin = tx.splitCoins(tx.object(params.syCoinId), [
        tx.pure.u64(params.syAmount),
      ]);
      const priceInfo = adapter.addPriceInfo({ tx, config: options.config, syIndex });
      const [, syChange] = addSwapSyForPt(
        tx,
        options.config,
        syCoin,
        params.minPtOut,
        priceInfo,
        params.pyPositionId,
      );
      tx.transferObjects([syChange], tx.pure.address(params.senderAddress));
      return tx;
    },

    async buildClaimYtInterestTx(
      params: ClaimYtInterestTxParams,
    ): Promise<Transaction> {
      const syIndex = await resolveSyIndex(options, params.syIndex);
      const tx = newTransaction(options, params.senderAddress);
      const priceInfo = adapter.addPriceInfo({ tx, config: options.config, syIndex });
      const syCoin = addClaimYtInterest(
        tx,
        options.config,
        priceInfo,
        params.pyPositionId,
      );
      tx.transferObjects([syCoin], tx.pure.address(params.senderAddress));
      return tx;
    },

    buildPlaceBidOrderTx(params: PlaceBidOrderTxParams): Transaction {
      const tx = newTransaction(options, params.senderAddress);
      const syCoin = tx.splitCoins(tx.object(params.syCoinId), [
        tx.pure.u64(params.syAmount),
      ]);
      addPlaceBidOrder(
        tx,
        options.config,
        syCoin,
        params.priceRaw,
        params.minPtAmount,
        params.expiryMs ?? 0n,
        params.asset ?? "pt",
      );
      return tx;
    },

    buildClaimOrderTx(params: OrderActionTxParams): Transaction {
      const tx = newTransaction(options, params.senderAddress);
      const [syCoin, assetCoin] = addClaimOrder(
        tx,
        options.config,
        params.orderId,
        params.asset ?? "pt",
      );
      tx.transferObjects([syCoin, assetCoin], tx.pure.address(params.senderAddress));
      return tx;
    },

    buildCancelOrderTx(params: OrderActionTxParams): Transaction {
      const tx = newTransaction(options, params.senderAddress);
      const [syCoin, assetCoin] = addCancelOrder(
        tx,
        options.config,
        params.orderId,
        params.asset ?? "pt",
      );
      tx.transferObjects([syCoin, assetCoin], tx.pure.address(params.senderAddress));
      return tx;
    },
  };
}

function addBuyPt(
  tx: Transaction,
  config: JitterMarketConfig,
  params: {
    syCoin: TransactionObjectArgument;
    minPtOut: bigint;
    position: TransactionObjectArgument | string;
    ownerAddress: string;
    priceInfo: TransactionObjectArgument;
    deadlineMs: bigint;
  },
): [TransactionArgument, TransactionObjectArgument, TransactionArgument] {
  const poolSettlements = poolRewardSettlementVector(tx, config);
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::router::buy_pt`,
    arguments: [
      poolSettlements,
      tx.object(requireRewardDistributorObjectId(config)),
      params.syCoin,
      tx.pure.u64(params.minPtOut),
      tx.object(config.poolObjectId),
      positionArgument(tx, params.position),
      tx.object(config.pyStateObjectId),
      tx.object(requireGlobalConfigObjectId(config)),
      params.priceInfo,
      tx.pure.u64(params.deadlineMs),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [
    result[0] as TransactionArgument,
    result[1] as TransactionObjectArgument,
    result[2] as TransactionArgument,
  ];
}

function addSellPt(
  tx: Transaction,
  config: JitterMarketConfig,
  params: {
    ptAmount: bigint | TransactionArgument;
    minSyOut: bigint;
    positionId: string;
    ownerAddress: string;
    priceInfo: TransactionObjectArgument;
    deadlineMs: bigint;
  },
): [TransactionObjectArgument, TransactionArgument] {
  const poolSettlements = poolRewardSettlementVector(tx, config);
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::router::sell_pt`,
    arguments: [
      poolSettlements,
      tx.object(requireRewardDistributorObjectId(config)),
      u64Argument(tx, params.ptAmount),
      tx.pure.u64(params.minSyOut),
      tx.object(config.poolObjectId),
      tx.object(params.positionId),
      tx.object(config.pyStateObjectId),
      tx.object(requireGlobalConfigObjectId(config)),
      params.priceInfo,
      tx.pure.u64(params.deadlineMs),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [result[0] as TransactionObjectArgument, result[1] as TransactionArgument];
}

function addBuyPtRoute(
  tx: Transaction,
  config: JitterMarketConfig,
  params: {
    syCoin: TransactionObjectArgument;
    orderIds: Array<bigint | number | string>;
    maxBookPriceRaw: bigint;
    minTotalPtOut: bigint;
    position: TransactionObjectArgument | string;
    priceInfo: TransactionObjectArgument;
  },
): [TransactionObjectArgument, TransactionArgument] {
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::router::buy_pt_route`,
    arguments: [
      emptyRewardSettlementVector(tx, config),
      emptyRewardSettlementVector(tx, config),
      tx.object(requireRewardDistributorObjectId(config)),
      params.syCoin,
      tx.object(requirePtOrderbookObjectId(config)),
      orderIdsArg(tx, params.orderIds),
      tx.pure.u128(params.maxBookPriceRaw),
      tx.pure.u64(params.minTotalPtOut),
      tx.object(config.marketObjectId),
      tx.object(config.poolObjectId),
      positionArgument(tx, params.position),
      tx.object(config.pyStateObjectId),
      params.priceInfo,
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag, config.ptTypeTag, config.ytTypeTag],
  });
  return [result[0] as TransactionObjectArgument, result[1] as TransactionArgument];
}

function addSellPtRoute(
  tx: Transaction,
  config: JitterMarketConfig,
  params: {
    ptAmount: bigint;
    orderIds: Array<bigint | number | string>;
    minBookPriceRaw: bigint;
    minTotalSyOut: bigint;
    positionId: string;
    priceInfo: TransactionObjectArgument;
  },
): [TransactionObjectArgument, TransactionArgument] {
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::router::sell_pt_route`,
    arguments: [
      emptyRewardSettlementVector(tx, config),
      emptyRewardSettlementVector(tx, config),
      tx.object(requireRewardDistributorObjectId(config)),
      tx.pure.u64(params.ptAmount),
      tx.object(requirePtOrderbookObjectId(config)),
      orderIdsArg(tx, params.orderIds),
      tx.pure.u128(params.minBookPriceRaw),
      tx.pure.u64(params.minTotalSyOut),
      tx.object(config.marketObjectId),
      tx.object(config.poolObjectId),
      tx.object(params.positionId),
      tx.object(config.pyStateObjectId),
      params.priceInfo,
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag, config.ptTypeTag, config.ytTypeTag],
  });
  return [result[0] as TransactionObjectArgument, result[1] as TransactionArgument];
}

function addBuyYt(
  tx: Transaction,
  config: JitterMarketConfig,
  params: {
    syCoin: TransactionObjectArgument;
    minYtOut: bigint;
    minSyOut: bigint;
    position: TransactionObjectArgument | string;
    ownerAddress: string;
    priceInfo: TransactionObjectArgument;
    deadlineMs: bigint;
  },
): [TransactionArgument, TransactionObjectArgument, TransactionArgument] {
  const position = positionArgument(tx, params.position);
  const poolSettlements = poolRewardSettlementVector(tx, config);
  const ytSettlements = ytRewardSettlementVector(tx, config, position, params.ownerAddress);
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::router::buy_yt`,
    arguments: [
      poolSettlements,
      ytSettlements,
      tx.object(requireRewardDistributorObjectId(config)),
      params.syCoin,
      tx.pure.u64(params.minYtOut),
      tx.pure.u64(params.minSyOut),
      tx.object(config.poolObjectId),
      position,
      tx.object(config.pyStateObjectId),
      tx.object(requireGlobalConfigObjectId(config)),
      params.priceInfo,
      tx.pure.u64(params.deadlineMs),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [
    result[0] as TransactionArgument,
    result[1] as TransactionObjectArgument,
    result[2] as TransactionArgument,
  ];
}

function addSellYt(
  tx: Transaction,
  config: JitterMarketConfig,
  params: {
    ytAmount: bigint;
    minSyOut: bigint;
    positionId: string;
    ownerAddress: string;
    priceInfo: TransactionObjectArgument;
    deadlineMs: bigint;
  },
): [TransactionObjectArgument, TransactionArgument] {
  const position = tx.object(params.positionId);
  const poolSettlements = poolRewardSettlementVector(tx, config);
  const ytSettlements = ytRewardSettlementVector(tx, config, position, params.ownerAddress);
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::router::sell_yt`,
    arguments: [
      poolSettlements,
      ytSettlements,
      tx.object(requireRewardDistributorObjectId(config)),
      tx.pure.u64(params.ytAmount),
      tx.pure.u64(params.minSyOut),
      tx.object(config.poolObjectId),
      position,
      tx.object(config.pyStateObjectId),
      tx.object(requireGlobalConfigObjectId(config)),
      params.priceInfo,
      tx.pure.u64(params.deadlineMs),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [result[0] as TransactionObjectArgument, result[1] as TransactionArgument];
}

function addLp(
  tx: Transaction,
  config: JitterMarketConfig,
  params: {
    syCoin: TransactionObjectArgument;
    ptAmount: bigint;
    positionId: string;
    ownerAddress: string;
    priceInfo: TransactionObjectArgument;
    deadlineMs: bigint;
  },
): [TransactionArgument, TransactionArgument, TransactionObjectArgument, TransactionArgument] {
  const position = tx.object(params.positionId);
  const poolSettlements = poolRewardSettlementVector(tx, config);
  const lpSettlements = lpRewardSettlementVector(tx, config, position, params.ownerAddress);
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::router::add_lp`,
    arguments: [
      poolSettlements,
      lpSettlements,
      tx.object(requireRewardDistributorObjectId(config)),
      params.syCoin,
      tx.pure.u64(params.ptAmount),
      tx.pure.u64(0),
      tx.object(config.poolObjectId),
      position,
      tx.object(config.pyStateObjectId),
      tx.object(requireGlobalConfigObjectId(config)),
      params.priceInfo,
      tx.pure.u64(params.deadlineMs),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [
    result[0] as TransactionArgument,
    result[1] as TransactionArgument,
    result[2] as TransactionObjectArgument,
    result[3] as TransactionArgument,
  ];
}

function addLpKeepYt(
  tx: Transaction,
  config: JitterMarketConfig,
  params: {
    syCoin: TransactionObjectArgument;
    syToMintHint: bigint;
    minLpOut: bigint;
    position: TransactionObjectArgument | string;
    ownerAddress: string;
    priceInfo: TransactionObjectArgument;
    deadlineMs: bigint;
  },
): [TransactionArgument, TransactionArgument, TransactionObjectArgument, TransactionArgument] {
  const position = positionArgument(tx, params.position);
  const poolSettlements = poolRewardSettlementVector(tx, config);
  const ytSettlements = ytRewardSettlementVector(tx, config, position, params.ownerAddress);
  const lpSettlements = lpRewardSettlementVector(tx, config, position, params.ownerAddress);
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::router::add_lp_keep_yt`,
    arguments: [
      poolSettlements,
      ytSettlements,
      lpSettlements,
      tx.object(requireRewardDistributorObjectId(config)),
      params.syCoin,
      tx.pure.u64(params.syToMintHint),
      tx.pure.u64(params.minLpOut),
      tx.object(config.poolObjectId),
      position,
      tx.object(config.pyStateObjectId),
      tx.object(requireGlobalConfigObjectId(config)),
      params.priceInfo,
      tx.pure.u64(params.deadlineMs),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [
    result[0] as TransactionArgument,
    result[1] as TransactionArgument,
    result[2] as TransactionObjectArgument,
    result[3] as TransactionArgument,
  ];
}

function addLpFromSy(
  tx: Transaction,
  config: JitterMarketConfig,
  params: {
    syCoin: TransactionObjectArgument;
    syToMintHint: bigint;
    minLpOut: bigint;
    minSyOut: bigint;
    position: TransactionObjectArgument | string;
    ownerAddress: string;
    priceInfo: TransactionObjectArgument;
    deadlineMs: bigint;
  },
): [TransactionArgument, TransactionObjectArgument, TransactionArgument] {
  const position = positionArgument(tx, params.position);
  const poolSettlements = poolRewardSettlementVector(tx, config);
  const ytSettlements = ytRewardSettlementVector(tx, config, position, params.ownerAddress);
  const lpSettlements = lpRewardSettlementVector(tx, config, position, params.ownerAddress);
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::router::add_lp_from_sy`,
    arguments: [
      poolSettlements,
      ytSettlements,
      lpSettlements,
      tx.object(requireRewardDistributorObjectId(config)),
      params.syCoin,
      tx.pure.u64(params.syToMintHint),
      tx.pure.u64(params.minLpOut),
      tx.pure.u64(params.minSyOut),
      tx.object(config.poolObjectId),
      position,
      tx.object(config.pyStateObjectId),
      tx.object(requireGlobalConfigObjectId(config)),
      params.priceInfo,
      tx.pure.u64(params.deadlineMs),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [
    result[0] as TransactionArgument,
    result[1] as TransactionObjectArgument,
    result[2] as TransactionArgument,
  ];
}

function addRemoveLp(
  tx: Transaction,
  config: JitterMarketConfig,
  params: {
    lpAmount: bigint;
    minSyOut: bigint;
    minPtOut: bigint;
    positionId: string;
    ownerAddress: string;
    deadlineMs: bigint;
  },
): [TransactionObjectArgument, TransactionArgument, TransactionArgument] {
  const position = tx.object(params.positionId);
  const poolSettlements = poolRewardSettlementVector(tx, config);
  const lpSettlements = lpRewardSettlementVector(tx, config, position, params.ownerAddress);
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::router::remove_lp`,
    arguments: [
      poolSettlements,
      lpSettlements,
      tx.object(requireRewardDistributorObjectId(config)),
      tx.pure.u64(params.lpAmount),
      tx.pure.u64(params.minSyOut),
      tx.pure.u64(params.minPtOut),
      tx.object(config.poolObjectId),
      position,
      tx.object(requireGlobalConfigObjectId(config)),
      tx.pure.u64(params.deadlineMs),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag],
  });
  return [
    result[0] as TransactionObjectArgument,
    result[1] as TransactionArgument,
    result[2] as TransactionArgument,
  ];
}

function addSyFromUnderlyingExactIn(
  tx: Transaction,
  config: JitterMarketConfig,
  adapter: JitterAdapterManifest,
  params: {
    underlyingCoinId?: string;
    underlyingCoinIds?: readonly string[];
    underlyingAmount: bigint;
    syIndex: bigint;
  },
): {
  syCoin: TransactionObjectArgument;
  excessCoin?: TransactionObjectArgument;
} {
  const underlyingCoin = splitUnderlyingCoinExactIn(tx, config, params);
  const priceInfo = adapter.addPriceInfo({ tx, config, syIndex: params.syIndex });
  const [syCoin, mintRequest] = addMintSyExactIn(
    tx,
    config,
    priceInfo,
    params.underlyingAmount,
  );
  const depositResult = adapter.addDepositToSy({
    tx,
    config,
    mintRequest,
    inputCoin: underlyingCoin,
    syAmount: params.underlyingAmount,
  });
  return {
    syCoin,
    ...(depositResult.excessCoin ? { excessCoin: depositResult.excessCoin } : {}),
  };
}

function splitUnderlyingCoinExactIn(
  tx: Transaction,
  config: JitterMarketConfig,
  params: {
    underlyingCoinId?: string;
    underlyingCoinIds?: readonly string[];
    underlyingAmount: bigint;
  },
): TransactionObjectArgument {
  if (config.underlyingTypeTag === SUI_TYPE_TAG) {
    return tx.coin({ balance: params.underlyingAmount });
  }

  return splitCoinFromIds(tx, {
    primaryCoinId: requireUnderlyingCoinId(params.underlyingCoinId),
    coinIds: params.underlyingCoinIds,
    amount: params.underlyingAmount,
  });
}

function requireUnderlyingCoinId(coinId: string | undefined): string {
  if (!coinId) {
    throw new Error("underlyingCoinId is required for non-SUI underlying inputs.");
  }
  return coinId;
}

function splitCoinFromIds(
  tx: Transaction,
  params: {
    primaryCoinId: string;
    coinIds?: readonly string[];
    amount: bigint;
  },
): TransactionObjectArgument {
  const coinIds = normalizeCoinIds(params.primaryCoinId, params.coinIds);
  const primaryCoin = tx.object(coinIds[0]);
  const mergeCoinIds = coinIds.slice(1);

  if (mergeCoinIds.length > 0) {
    tx.mergeCoins(
      primaryCoin,
      mergeCoinIds.map((coinId) => tx.object(coinId)),
    );
  }

  return tx.splitCoins(primaryCoin, [tx.pure.u64(params.amount)]);
}

function normalizeCoinIds(
  primaryCoinId: string,
  coinIds: readonly string[] | undefined,
): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const coinId of [primaryCoinId, ...(coinIds ?? [])]) {
    if (seen.has(coinId)) continue;
    seen.add(coinId);
    normalized.push(coinId);
  }

  return normalized;
}

function ensurePyPosition(
  tx: Transaction,
  config: JitterMarketConfig,
  positionId?: string,
): {
  argument: TransactionObjectArgument | string;
  created: TransactionObjectArgument | null;
  transferKind: "py" | null;
} {
  if (positionId) {
    return { argument: positionId, created: null, transferKind: null };
  }

  const created = addCreatePyPosition(tx, config);
  return { argument: created, created, transferKind: "py" };
}

function ensureFullPosition(
  tx: Transaction,
  config: JitterMarketConfig,
  positionId?: string,
): {
  argument: TransactionObjectArgument | string;
  created: TransactionObjectArgument | null;
  transferKind: "full" | null;
} {
  if (positionId) {
    return { argument: positionId, created: null, transferKind: null };
  }

  const created = addCreatePosition(tx, config);
  return { argument: created, created, transferKind: "full" };
}

function positionArgument(
  tx: Transaction,
  position: TransactionObjectArgument | string,
): TransactionObjectArgument {
  return typeof position === "string" ? tx.object(position) : position;
}

function transferCreatedPosition(
  tx: Transaction,
  config: JitterMarketConfig,
  position: {
    created: TransactionObjectArgument | null;
    transferKind: "py" | "full" | null;
  },
  senderAddress: string,
): void {
  if (!position.created || !position.transferKind) return;

  if (!shouldUseCoreRewardSettlements(config)) {
    tx.moveCall({
      target: `${config.jitterPackageId}::router::transfer_position`,
      arguments: [
        position.created,
        tx.object(requireGlobalConfigObjectId(config)),
        tx.pure.address(senderAddress),
      ],
    });
    return;
  }

  if (position.transferKind === "py") {
    const ytSettlements = ytRewardSettlementVector(
      tx,
      config,
      position.created,
      senderAddress,
    );
    tx.moveCall({
      target: `${config.jitterPackageId}::router::transfer_py_position_after_reward_settlement`,
      arguments: [
        ytSettlements,
        tx.object(requireRewardDistributorObjectId(config)),
        position.created,
        tx.object(config.pyStateObjectId),
        tx.object(requireGlobalConfigObjectId(config)),
        tx.pure.address(senderAddress),
      ],
      typeArguments: [config.syTypeTag],
    });
    return;
  }

  const ytSettlements = ytRewardSettlementVector(
    tx,
    config,
    position.created,
    senderAddress,
  );
  const lpSettlements = lpRewardSettlementVector(
    tx,
    config,
    position.created,
    senderAddress,
  );
  tx.moveCall({
    target: `${config.jitterPackageId}::router::transfer_position_after_reward_settlement`,
    arguments: [
      ytSettlements,
      lpSettlements,
      tx.object(requireRewardDistributorObjectId(config)),
      position.created,
      tx.object(config.pyStateObjectId),
      tx.object(requireGlobalConfigObjectId(config)),
      tx.object(config.poolObjectId),
      tx.pure.address(senderAddress),
    ],
    typeArguments: [config.syTypeTag],
  });
}

function appendOptionalObject(
  objects: TransactionObjectArgument[],
  optionalObject?: TransactionObjectArgument,
): TransactionObjectArgument[] {
  return optionalObject ? [...objects, optionalObject] : objects;
}

function emptyRewardSettlementVector(
  tx: Transaction,
  config: JitterMarketConfig,
): TransactionArgument {
  return tx.makeMoveVec({
    type: `${config.jitterPackageId}::reward_distributor::RewardSettlement`,
    elements: [],
  });
}

const REWARD_SCOPE_YT = 1;
const REWARD_SCOPE_LP = 2;
const REWARD_SCOPE_POOL = 3;
const ZERO_ADDRESS = "0x0";
type RewardScope =
  | typeof REWARD_SCOPE_YT
  | typeof REWARD_SCOPE_LP
  | typeof REWARD_SCOPE_POOL;

function shouldUseCoreRewardSettlements(config: JitterMarketConfig): boolean {
  return Boolean(config.rewardDistributorObjectId && config.liquidlink?.enabled);
}

function rewardSettlementVector(
  tx: Transaction,
  config: JitterMarketConfig,
  settlements: TransactionArgument[],
): TransactionArgument {
  return tx.makeMoveVec({
    type: `${config.jitterPackageId}::reward_distributor::RewardSettlement`,
    elements: settlements as unknown as TransactionObjectArgument[],
  });
}

function finishRewardOperation(
  tx: Transaction,
  config: JitterMarketConfig,
  operation: TransactionArgument,
): TransactionArgument {
  return tx.moveCall({
    target: `${config.jitterPackageId}::reward_distributor::finish_operation`,
    arguments: [tx.object(requireGlobalConfigObjectId(config)), operation],
  }) as TransactionArgument;
}

function destroyRewardSettlement(
  tx: Transaction,
  config: JitterMarketConfig,
  settlement: TransactionArgument,
): void {
  tx.moveCall({
    target: `${config.jitterPackageId}::reward_distributor::destroy_settlement`,
    arguments: [tx.object(requireGlobalConfigObjectId(config)), settlement],
  });
}

function settleRewardOperation(
  tx: Transaction,
  config: JitterMarketConfig,
  operation: TransactionArgument,
  scope: RewardScope,
  position?: TransactionObjectArgument | string,
): void {
  if (scope === REWARD_SCOPE_POOL) {
    addSettlePoolRewardOperationWithLiquidlinkPoints(tx, config, operation);
    return;
  }

  if (!position) {
    throw new Error("Reward operation settlement requires a position object for YT/LP scopes.");
  }

  if (scope === REWARD_SCOPE_YT) {
    addSettleYtRewardOperationWithLiquidlinkPoints(tx, config, operation, position);
    return;
  }

  addSettleLpRewardOperationWithLiquidlinkPoints(tx, config, operation, position);
}

function beginFinishedProfileSettlementWithGuard(
  tx: Transaction,
  config: JitterMarketConfig,
  params: {
    profileId: TransactionArgument;
    scope: RewardScope;
    owner: string;
    subjectId: TransactionArgument;
    exposure: TransactionArgument;
    guard: TransactionArgument;
    position?: TransactionObjectArgument | string;
  },
): TransactionArgument {
  const operation = tx.moveCall({
    target: `${config.jitterPackageId}::reward_distributor::begin_scoped_operation_for_profile_with_guard`,
    arguments: [
      tx.object(requireRewardDistributorObjectId(config)),
      tx.object(requireGlobalConfigObjectId(config)),
      params.profileId,
      tx.pure.u8(params.scope),
      tx.pure.address(params.owner),
      params.subjectId,
      params.exposure,
      params.guard,
    ],
  }) as TransactionArgument;
  settleRewardOperation(tx, config, operation, params.scope, params.position);
  return finishRewardOperation(tx, config, operation);
}

function poolRewardSettlementVector(
  tx: Transaction,
  config: JitterMarketConfig,
): TransactionArgument {
  if (!shouldUseCoreRewardSettlements(config)) {
    return emptyRewardSettlementVector(tx, config);
  }
  const exposure = tx.moveCall({
    target: `${config.jitterPackageId}::pool::total_sy`,
    arguments: [tx.object(config.poolObjectId)],
    typeArguments: [config.syTypeTag],
  }) as TransactionArgument;
  const guard = tx.moveCall({
    target: `${config.jitterPackageId}::pool::reward_guard`,
    arguments: [tx.object(config.poolObjectId)],
    typeArguments: [config.syTypeTag],
  }) as TransactionArgument;
  const settlement = beginFinishedProfileSettlementWithGuard(tx, config, {
    profileId: tx.pure.id(config.poolObjectId),
    scope: REWARD_SCOPE_POOL,
    owner: ZERO_ADDRESS,
    subjectId: tx.pure.id(config.poolObjectId),
    exposure,
    guard,
  });
  return rewardSettlementVector(tx, config, [settlement]);
}

function ytRewardSettlementVector(
  tx: Transaction,
  config: JitterMarketConfig,
  position: TransactionObjectArgument,
  ownerAddress: string,
): TransactionArgument {
  if (!shouldUseCoreRewardSettlements(config)) {
    return emptyRewardSettlementVector(tx, config);
  }
  const positionId = tx.moveCall({
    target: `${config.jitterPackageId}::jitter_position::id`,
    arguments: [position],
  }) as TransactionArgument;
  const exposure = tx.moveCall({
    target: `${config.jitterPackageId}::jitter_position::yt_balance`,
    arguments: [position],
  }) as TransactionArgument;
  const guard = tx.moveCall({
    target: `${config.jitterPackageId}::jitter_position::yt_reward_guard`,
    arguments: [position],
  }) as TransactionArgument;
  const settlement = beginFinishedProfileSettlementWithGuard(tx, config, {
    profileId: tx.pure.id(config.marketObjectId),
    scope: REWARD_SCOPE_YT,
    owner: ownerAddress,
    subjectId: positionId,
    exposure,
    guard,
    position,
  });
  return rewardSettlementVector(tx, config, [settlement]);
}

function lpRewardSettlementVector(
  tx: Transaction,
  config: JitterMarketConfig,
  position: TransactionObjectArgument,
  ownerAddress: string,
): TransactionArgument {
  if (!shouldUseCoreRewardSettlements(config)) {
    return emptyRewardSettlementVector(tx, config);
  }
  const positionId = tx.moveCall({
    target: `${config.jitterPackageId}::jitter_position::id`,
    arguments: [position],
  }) as TransactionArgument;
  const exposure = tx.moveCall({
    target: `${config.jitterPackageId}::jitter_position::lp_amount`,
    arguments: [position],
  }) as TransactionArgument;
  const guard = tx.moveCall({
    target: `${config.jitterPackageId}::jitter_position::lp_reward_guard`,
    arguments: [position],
  }) as TransactionArgument;
  const settlement = beginFinishedProfileSettlementWithGuard(tx, config, {
    profileId: tx.pure.id(config.poolObjectId),
    scope: REWARD_SCOPE_LP,
    owner: ownerAddress,
    subjectId: positionId,
    exposure,
    guard,
    position,
  });
  return rewardSettlementVector(tx, config, [settlement]);
}

function destroyEmptyRewardOperations(
  tx: Transaction,
  config: JitterMarketConfig,
  postOps: TransactionArgument,
): void {
  tx.moveCall({
    target: `0x1::vector::destroy_empty`,
    arguments: [postOps],
    typeArguments: [`${config.jitterPackageId}::reward_distributor::RewardOperation`],
  });
}

function finishOrDestroyRewardOperations(
  tx: Transaction,
  config: JitterMarketConfig,
  postOps: TransactionArgument,
  scopesFromPopBack: RewardScope[],
  position?: TransactionObjectArgument | string,
): void {
  if (!shouldUseCoreRewardSettlements(config)) {
    destroyEmptyRewardOperations(tx, config, postOps);
    return;
  }

  for (const scope of scopesFromPopBack) {
    const operation = tx.moveCall({
      target: `0x1::vector::pop_back`,
      arguments: [postOps],
      typeArguments: [`${config.jitterPackageId}::reward_distributor::RewardOperation`],
    }) as TransactionArgument;
    settleRewardOperation(tx, config, operation, scope, position);
    const settlement = finishRewardOperation(tx, config, operation);
    destroyRewardSettlement(tx, config, settlement);
  }

  destroyEmptyRewardOperations(tx, config, postOps);
}

function assertEmptyRewardSettlement(
  settlement: EmptyRewardSettlementStrategy,
): void {
  if (settlement.strategy !== "empty-vector") {
    throw new Error(`Unsupported reward settlement strategy: ${settlement.strategy}`);
  }
}

function assertDirectUnderlyingDeposit(
  adapter: JitterAdapterManifest,
  builderName: string,
): void {
  if (!adapter.canDepositUnderlying) {
    throw new Error(
      `Adapter ${adapter.kind} does not support direct underlying deposits through ${builderName}.`,
    );
  }
}

function requireRewardDistributorObjectId(config: JitterMarketConfig): string {
  if (!config.rewardDistributorObjectId) {
    throw new Error("Product transaction builders require rewardDistributorObjectId in market config.");
  }
  return config.rewardDistributorObjectId;
}

function requireGlobalConfigObjectId(config: JitterMarketConfig): string {
  if (!config.globalConfigObjectId) {
    throw new Error("Product transaction builders require globalConfigObjectId in market config.");
  }
  return config.globalConfigObjectId;
}

function u64Argument(
  tx: Transaction,
  value: bigint | TransactionArgument,
): TransactionArgument {
  return typeof value === "bigint" ? tx.pure.u64(value) : value;
}

function requirePtOrderbookObjectId(config: JitterMarketConfig): string {
  if (!config.orderbookObjectId) {
    throw new Error("PT route transaction builders require orderbookObjectId in market config.");
  }
  return config.orderbookObjectId;
}

function orderIdsArg(
  tx: Transaction,
  orderIds: Array<bigint | number | string>,
): TransactionArgument {
  return tx.pure.vector(
    "u64",
    orderIds.map((value) => BigInt(value)),
  );
}

function newTransaction(
  options: CreateJitterTransactionServiceOptions,
  senderAddress: string,
): Transaction {
  const tx = new Transaction();
  tx.setSender(senderAddress);
  tx.setGasBudget(options.gasBudget ?? DEFAULT_GAS_BUDGET);
  return tx;
}

async function resolveSyIndex(
  options: CreateJitterTransactionServiceOptions,
  override?: bigint,
): Promise<bigint> {
  if (override !== undefined) return override;
  if (options.resolveSyIndex) return options.resolveSyIndex();
  return DEFAULT_DEMO_SY_INDEX;
}

