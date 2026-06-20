import {
  Transaction,
  TransactionArgument,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";

import { SUI_CLOCK_ID } from "./constants.js";
import type { JitterMarketConfig } from "./types.js";

export type CoinRewardScope = "yt" | "lp";

function asObjectArg(
  tx: Transaction,
  value: TransactionObjectArgument | string,
): TransactionObjectArgument {
  return typeof value === "string" ? tx.object(value) : value;
}

function requireCoinReward(config: JitterMarketConfig, scope: CoinRewardScope) {
  const rewarderObjectId =
    scope === "yt"
      ? config.coinReward?.ytRewarderObjectId
      : config.coinReward?.lpRewarderObjectId;

  if (!config.jitterExtensionsPackageId) {
    throw new Error("Coin reward requires jitterExtensionsPackageId in market config.");
  }
  if (!config.rewardDistributorObjectId) {
    throw new Error("Coin reward requires rewardDistributorObjectId in market config.");
  }
  if (!config.coinReward?.rewardCoinTypeTag || !rewarderObjectId) {
    throw new Error(`Coin reward is not configured for ${scope.toUpperCase()} exposure.`);
  }
  if (!config.globalConfigObjectId) {
    throw new Error("Coin reward requires globalConfigObjectId in market config.");
  }

  return {
    extensionsPackageId: config.jitterExtensionsPackageId,
    globalConfigObjectId: config.globalConfigObjectId,
    distributorObjectId: config.rewardDistributorObjectId,
    rewardCoinTypeTag: config.coinReward.rewardCoinTypeTag,
    rewarderObjectId,
  };
}

function scopeValue(scope: CoinRewardScope): number {
  return scope === "yt" ? 1 : 2;
}

function beginCoinRewardOperation(
  tx: Transaction,
  config: JitterMarketConfig,
  position: TransactionObjectArgument | string,
  owner: string,
  scope: CoinRewardScope,
): {
  reward: ReturnType<typeof requireCoinReward>;
  positionArg: TransactionObjectArgument;
  positionId: TransactionArgument;
  operation: TransactionArgument;
  exposureState: TransactionObjectArgument;
} {
  const reward = requireCoinReward(config, scope);
  const positionArg = asObjectArg(tx, position);
  const positionId = tx.moveCall({
    target: `${config.jitterPackageId}::jitter_position::id`,
    arguments: [positionArg],
  }) as TransactionArgument;
  const currentExposure = tx.moveCall({
    target: `${config.jitterPackageId}::jitter_position::${scope === "yt" ? "yt_balance" : "lp_amount"}`,
    arguments: [positionArg],
  }) as TransactionArgument;
  const guard = tx.moveCall({
    target: `${config.jitterPackageId}::jitter_position::${scope === "yt" ? "yt_reward_guard" : "lp_reward_guard"}`,
    arguments: [positionArg],
  }) as TransactionArgument;
  const operation = tx.moveCall({
    target: `${config.jitterPackageId}::reward_distributor::begin_scoped_operation_for_profile_with_guard`,
    arguments: [
      tx.object(reward.distributorObjectId),
      tx.object(reward.globalConfigObjectId),
      tx.pure.id(scope === "yt" ? config.marketObjectId : config.poolObjectId),
      tx.pure.u8(scopeValue(scope)),
      tx.pure.address(owner),
      positionId,
      currentExposure,
      guard,
    ],
  }) as TransactionArgument;
  const exposureState =
    scope === "yt" ? tx.object(config.pyStateObjectId) : tx.object(config.poolObjectId);

  return {
    reward,
    positionArg,
    positionId,
    operation,
    exposureState,
  };
}

function finishAndDestroySettlement(
  tx: Transaction,
  config: JitterMarketConfig,
  globalConfigObjectId: string,
  operation: TransactionArgument,
): void {
  const settlement = tx.moveCall({
    target: `${config.jitterPackageId}::reward_distributor::finish_operation`,
    arguments: [tx.object(globalConfigObjectId), operation],
  }) as TransactionArgument;
  tx.moveCall({
    target: `${config.jitterPackageId}::reward_distributor::destroy_settlement`,
    arguments: [tx.object(globalConfigObjectId), settlement],
  });
}

export function hasCoinRewardConfig(
  config: JitterMarketConfig | null | undefined,
  scope?: CoinRewardScope,
): boolean {
  if (!config?.jitterExtensionsPackageId || !config.rewardDistributorObjectId) {
    return false;
  }
  if (!config.coinReward?.rewardCoinTypeTag) {
    return false;
  }
  if (scope === "yt") return Boolean(config.coinReward.ytRewarderObjectId);
  if (scope === "lp") return Boolean(config.coinReward.lpRewarderObjectId);
  return Boolean(config.coinReward.ytRewarderObjectId || config.coinReward.lpRewarderObjectId);
}

export function addSettleAndClaimCoinReward(
  tx: Transaction,
  config: JitterMarketConfig,
  position: TransactionObjectArgument | string,
  owner: string,
  scope: CoinRewardScope,
): TransactionObjectArgument {
  const {
    reward,
    positionArg,
    operation,
    exposureState,
  } = beginCoinRewardOperation(tx, config, position, owner, scope);

  const target =
    scope === "yt"
      ? `${reward.extensionsPackageId}::coin_rewarder::claim_yt_position`
      : `${reward.extensionsPackageId}::coin_rewarder::claim_lp_position`;
  const coinOut = tx.moveCall({
    target,
    typeArguments: [reward.rewardCoinTypeTag, config.syTypeTag],
    arguments: [
      tx.object(reward.rewarderObjectId),
      tx.object(reward.globalConfigObjectId),
      tx.object(reward.distributorObjectId),
      operation,
      positionArg,
      exposureState,
      tx.object(SUI_CLOCK_ID),
    ],
  }) as TransactionObjectArgument;
  finishAndDestroySettlement(tx, config, reward.globalConfigObjectId, operation);

  return coinOut;
}

export function addSettleCoinReward(
  tx: Transaction,
  config: JitterMarketConfig,
  position: TransactionObjectArgument | string,
  owner: string,
  scope: CoinRewardScope,
): TransactionArgument {
  const {
    reward,
    positionArg,
    positionId,
    operation,
    exposureState,
  } = beginCoinRewardOperation(tx, config, position, owner, scope);

  const settlementTarget =
    scope === "yt"
      ? `${reward.extensionsPackageId}::coin_rewarder::settle_yt_position`
      : `${reward.extensionsPackageId}::coin_rewarder::settle_lp_position`;

  tx.moveCall({
    target: settlementTarget,
    typeArguments: [reward.rewardCoinTypeTag, config.syTypeTag],
    arguments: [
      tx.object(reward.rewarderObjectId),
      tx.object(reward.globalConfigObjectId),
      tx.object(reward.distributorObjectId),
      operation,
      positionArg,
      exposureState,
      tx.object(SUI_CLOCK_ID),
    ],
  });

  finishAndDestroySettlement(tx, config, reward.globalConfigObjectId, operation);

  return positionId;
}

export function buildClaimCoinRewardTx(
  config: JitterMarketConfig,
  positionId: string,
  owner: string,
  scope: CoinRewardScope,
): Transaction {
  const tx = new Transaction();
  tx.setSender(owner);
  tx.setGasBudget(BigInt(200_000_000));
  const rewardCoin = addSettleAndClaimCoinReward(tx, config, positionId, owner, scope);
  tx.transferObjects([rewardCoin], tx.pure.address(owner));
  return tx;
}
