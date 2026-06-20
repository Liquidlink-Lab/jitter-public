/**
 * Legacy one-shot transaction builders kept for backwards compatibility.
 * New product-level flows should prefer services/transaction-service.ts.
 */

import { Transaction, type TransactionObjectArgument } from "@mysten/sui/transactions";

import { getJitterAdapterManifest } from "../adapters/registry.js";
import { DEFAULT_DEMO_SY_INDEX } from "../constants.js";
import { addDemoPriceInfo } from "../oracle.js";
import {
  addClaimYtInterest,
  addCreateLpPosition,
  addCreatePyPosition,
  addMintPyFromSy,
  addRedeemAfterExpiry,
  addRedeemBeforeExpiry,
} from "../py.js";
import {
  addLiquidityFromPosition,
  addRemoveLiquidityToPosition,
  addSwapPtForSy,
  addSwapPtForExactSy,
  addSwapSyForPt,
  addSwapSyForYt,
  addSwapSyForExactYt,
} from "../pool.js";
import {
  addDemoDeposit,
  addMintSyExactIn,
  addBurnSyExactIn,
} from "../sy.js";
import {
  addSettleLpPositionWithLiquidlinkPoints,
  addSyncPyPositionWithLiquidlinkPoints,
  hasLiquidlinkLpPointsConfig,
  hasLiquidlinkPointsConfig,
} from "../liquidlink-points.js";
import type { JitterMarketConfig } from "../types.js";

function addTransferCreatedPyPosition(
  tx: Transaction,
  config: JitterMarketConfig,
  position: TransactionObjectArgument,
  recipient: string,
): void {
  if (hasLiquidlinkPointsConfig(config)) {
    addSyncPyPositionWithLiquidlinkPoints(tx, config, position);
  }
  addTransferPosition(tx, config, position, recipient);
}

function addTransferCreatedLpPosition(
  tx: Transaction,
  config: JitterMarketConfig,
  position: TransactionObjectArgument,
  recipient: string,
): void {
  if (hasLiquidlinkLpPointsConfig(config)) {
    addSettleLpPositionWithLiquidlinkPoints(tx, config, position);
  }
  addTransferPosition(tx, config, position, recipient);
}

function addTransferPosition(
  tx: Transaction,
  config: JitterMarketConfig,
  position: TransactionObjectArgument,
  recipient: string,
): void {
  tx.moveCall({
    target: `${config.jitterPackageId}::router::transfer_position`,
    arguments: [position, tx.pure.address(recipient)],
  });
}

// ---------------------------------------------------------------------------
const DEFAULT_GAS: bigint = BigInt(300_000_000);

// ---------------------------------------------------------------------------
// A. Deposit underlying → Mint PT + YT
// ---------------------------------------------------------------------------
export function buildDepositAndMintPyTx(
  config: JitterMarketConfig,
  underlyingCoinId: string,
  underlyingAmount: bigint,
  syIndex: bigint,
  pyPositionId: string,
  senderAddress: string,
): Transaction {
  const tx = new Transaction();
  tx.setSender(senderAddress);
  tx.setGasBudget(DEFAULT_GAS);

  const underlyingCoin = tx.splitCoins(tx.object(underlyingCoinId), [tx.pure.u64(underlyingAmount)]);
  const priceInfo1 = addDemoPriceInfo(tx, config, syIndex);
  const [syCoin, mintRequest] = addMintSyExactIn(tx, config, priceInfo1, underlyingAmount);
  addDemoDeposit(tx, config, mintRequest, underlyingCoin);
  const priceInfo2 = addDemoPriceInfo(tx, config, syIndex);
  addMintPyFromSy(tx, config, syCoin, priceInfo2, pyPositionId);

  return tx;
}

// ---------------------------------------------------------------------------
// B. Swap SY → PT
// ---------------------------------------------------------------------------
export function buildSwapSyForPtTx(
  config: JitterMarketConfig,
  syCoinId: string,
  syAmount: bigint,
  minPtOut: bigint,
  pyPositionId: string,
  senderAddress: string,
  syIndex: bigint = DEFAULT_DEMO_SY_INDEX,
): Transaction {
  const tx = new Transaction();
  tx.setSender(senderAddress);
  tx.setGasBudget(DEFAULT_GAS);

  const syCoin = tx.splitCoins(tx.object(syCoinId), [tx.pure.u64(syAmount)]);
  const priceInfo = addDemoPriceInfo(tx, config, syIndex);
  const [, syChange] = addSwapSyForPt(tx, config, syCoin, minPtOut, priceInfo, pyPositionId);
  tx.transferObjects([syChange], tx.pure.address(senderAddress));

  return tx;
}

// ---------------------------------------------------------------------------
// C. Swap SY → YT (leveraged yield)
// ---------------------------------------------------------------------------
export function buildSwapSyForYtTx(
  config: JitterMarketConfig,
  syCoinId: string,
  syAmount: bigint,
  minYtOut: bigint,
  syIndex: bigint,
  pyPositionId: string,
  senderAddress: string,
): Transaction {
  const tx = new Transaction();
  tx.setSender(senderAddress);
  tx.setGasBudget(DEFAULT_GAS);

  const syCoin = tx.splitCoins(tx.object(syCoinId), [tx.pure.u64(syAmount)]);
  const priceInfo = addDemoPriceInfo(tx, config, syIndex);
  const [, syChange] = addSwapSyForYt(tx, config, syCoin, minYtOut, BigInt(0), priceInfo, pyPositionId);
  tx.transferObjects([syChange], tx.pure.address(senderAddress));

  return tx;
}

// ---------------------------------------------------------------------------
// D. Swap PT → SY
// ---------------------------------------------------------------------------
export function buildSwapPtForSyTx(
  config: JitterMarketConfig,
  ptAmount: bigint,
  minSyOut: bigint,
  pyPositionId: string,
  senderAddress: string,
  syIndex: bigint = DEFAULT_DEMO_SY_INDEX,
): Transaction {
  const tx = new Transaction();
  tx.setSender(senderAddress);
  tx.setGasBudget(DEFAULT_GAS);

  const priceInfo = addDemoPriceInfo(tx, config, syIndex);
  const syCoin = addSwapPtForSy(tx, config, ptAmount, minSyOut, priceInfo, pyPositionId);
  tx.transferObjects([syCoin], tx.pure.address(senderAddress));

  return tx;
}

// ---------------------------------------------------------------------------
// E. Add liquidity
// ---------------------------------------------------------------------------
export function buildAddLiquidityTx(
  config: JitterMarketConfig,
  syCoinId: string,
  syAmount: bigint,
  ptAmount: bigint,
  pyPositionId: string,
  lpPositionId: string,
  senderAddress: string,
  syIndex: bigint = DEFAULT_DEMO_SY_INDEX,
): Transaction {
  const tx = new Transaction();
  tx.setSender(senderAddress);
  tx.setGasBudget(DEFAULT_GAS);

  const syCoin = tx.splitCoins(tx.object(syCoinId), [tx.pure.u64(syAmount)]);
  const priceInfo = addDemoPriceInfo(tx, config, syIndex);
  const [, , syChange] = addLiquidityFromPosition(
    tx,
    config,
    syCoin,
    ptAmount,
    priceInfo,
    pyPositionId,
    lpPositionId,
  );
  tx.transferObjects([syChange], tx.pure.address(senderAddress));

  return tx;
}

// ---------------------------------------------------------------------------
// F. Remove liquidity
// ---------------------------------------------------------------------------
export function buildRemoveLiquidityTx(
  config: JitterMarketConfig,
  lpAmount: bigint,
  pyPositionId: string,
  lpPositionId: string,
  senderAddress: string,
): Transaction {
  const tx = new Transaction();
  tx.setSender(senderAddress);
  tx.setGasBudget(DEFAULT_GAS);

  const [syCoin] = addRemoveLiquidityToPosition(tx, config, lpAmount, pyPositionId, lpPositionId);
  tx.transferObjects([syCoin], tx.pure.address(senderAddress));

  return tx;
}

// ---------------------------------------------------------------------------
// G. Redeem PT + YT before expiry
// ---------------------------------------------------------------------------
export function buildRedeemBeforeExpiryTx(
  config: JitterMarketConfig,
  ptAmount: bigint,
  syIndex: bigint,
  pyPositionId: string,
  senderAddress: string,
): Transaction {
  const tx = new Transaction();
  tx.setSender(senderAddress);
  tx.setGasBudget(DEFAULT_GAS);

  const priceInfo = addDemoPriceInfo(tx, config, syIndex);
  const syCoin = addRedeemBeforeExpiry(tx, config, ptAmount, priceInfo, pyPositionId);
  tx.transferObjects([syCoin], tx.pure.address(senderAddress));

  return tx;
}

// ---------------------------------------------------------------------------
// H. Redeem PT after expiry
// ---------------------------------------------------------------------------
export function buildRedeemAfterExpiryTx(
  config: JitterMarketConfig,
  ptAmount: bigint,
  _syIndex: bigint,
  pyPositionId: string,
  senderAddress: string,
): Transaction {
  const tx = new Transaction();
  tx.setSender(senderAddress);
  tx.setGasBudget(DEFAULT_GAS);

  const syCoin = addRedeemAfterExpiry(tx, config, ptAmount, pyPositionId);
  tx.transferObjects([syCoin], tx.pure.address(senderAddress));

  return tx;
}

// ---------------------------------------------------------------------------
// I. Claim YT interest
// ---------------------------------------------------------------------------
export function buildClaimYtInterestTx(
  config: JitterMarketConfig,
  syIndex: bigint,
  pyPositionId: string,
  senderAddress: string,
): Transaction {
  const tx = new Transaction();
  tx.setSender(senderAddress);
  tx.setGasBudget(DEFAULT_GAS);

  const priceInfo = addDemoPriceInfo(tx, config, syIndex);
  const syCoin = addClaimYtInterest(tx, config, priceInfo, pyPositionId);
  tx.transferObjects([syCoin], tx.pure.address(senderAddress));

  return tx;
}

// ---------------------------------------------------------------------------
// J. Create PyPosition
// ---------------------------------------------------------------------------
export function buildCreatePyPositionTx(
  config: JitterMarketConfig,
  senderAddress: string,
): Transaction {
  const tx = new Transaction();
  tx.setSender(senderAddress);
  tx.setGasBudget(DEFAULT_GAS);

  const position = addCreatePyPosition(tx, config);
  addTransferCreatedPyPosition(tx, config, position, senderAddress);

  return tx;
}

// ---------------------------------------------------------------------------
// K. Create LpPosition
// ---------------------------------------------------------------------------
export function buildCreateLpPositionTx(
  config: JitterMarketConfig,
  senderAddress: string,
): Transaction {
  const tx = new Transaction();
  tx.setSender(senderAddress);
  tx.setGasBudget(DEFAULT_GAS);

  const position = addCreateLpPosition(tx, config);
  addTransferCreatedLpPosition(tx, config, position, senderAddress);

  return tx;
}

// ---------------------------------------------------------------------------
// L. Redeem SY → underlying
// ---------------------------------------------------------------------------
export function buildRedeemSyToUnderlyingTx(
  config: JitterMarketConfig,
  syCoinId: string,
  syAmount: bigint,
  syIndex: bigint,
  senderAddress: string,
): Transaction {
  const tx = new Transaction();
  tx.setSender(senderAddress);
  tx.setGasBudget(DEFAULT_GAS);

  const adapter = getJitterAdapterManifest(config);
  if (!adapter.canRedeemUnderlying) {
    throw new Error(
      `Adapter ${adapter.kind} does not support direct underlying redemptions through buildRedeemSyToUnderlyingTx.`,
    );
  }
  const syCoin = tx.splitCoins(tx.object(syCoinId), [tx.pure.u64(syAmount)]);
  const priceInfo = adapter.addPriceInfo({ tx, config, syIndex });
  const burnRequest = addBurnSyExactIn(tx, config, priceInfo, syCoin);
  const redeemResult = adapter.addRedeemFromSy({
    tx,
    config,
    burnRequest,
    syAmount,
  });
  tx.transferObjects([redeemResult.outputCoin], tx.pure.address(senderAddress));

  return tx;
}

// ---------------------------------------------------------------------------
// M. Swap SY → exact YT
// ---------------------------------------------------------------------------
export function buildSwapSyForExactYtTx(
  config: JitterMarketConfig,
  syCoinId: string,
  syBudget: bigint,
  ytOut: bigint,
  maxSyIn: bigint,
  syIndex: bigint,
  pyPositionId: string,
  senderAddress: string,
): Transaction {
  const tx = new Transaction();
  tx.setSender(senderAddress);
  tx.setGasBudget(DEFAULT_GAS);

  const syCoin = tx.splitCoins(tx.object(syCoinId), [tx.pure.u64(syBudget)]);
  const priceInfo = addDemoPriceInfo(tx, config, syIndex);
  const [, syChange] = addSwapSyForExactYt(tx, config, syCoin, ytOut, maxSyIn, priceInfo, pyPositionId);
  tx.transferObjects([syChange], tx.pure.address(senderAddress));

  return tx;
}

// ---------------------------------------------------------------------------
// N. Swap PT → exact SY
// ---------------------------------------------------------------------------
export function buildSwapPtForExactSyTx(
  config: JitterMarketConfig,
  syOut: bigint,
  maxPtIn: bigint,
  pyPositionId: string,
  senderAddress: string,
  syIndex: bigint = DEFAULT_DEMO_SY_INDEX,
): Transaction {
  const tx = new Transaction();
  tx.setSender(senderAddress);
  tx.setGasBudget(DEFAULT_GAS);

  const priceInfo = addDemoPriceInfo(tx, config, syIndex);
  const syCoin = addSwapPtForExactSy(tx, config, syOut, maxPtIn, priceInfo, pyPositionId);
  tx.transferObjects([syCoin], tx.pure.address(senderAddress));

  return tx;
}

// ---------------------------------------------------------------------------
// O. Deposit underlying → SY only
// ---------------------------------------------------------------------------
export function buildDepositToSyTx(
  config: JitterMarketConfig,
  underlyingCoinId: string,
  underlyingAmount: bigint,
  syIndex: bigint,
  senderAddress: string,
): Transaction {
  const tx = new Transaction();
  tx.setSender(senderAddress);
  tx.setGasBudget(DEFAULT_GAS);

  const adapter = getJitterAdapterManifest(config);
  if (!adapter.canDepositUnderlying) {
    throw new Error(
      `Adapter ${adapter.kind} does not support direct underlying deposits through buildDepositToSyTx.`,
    );
  }
  const underlyingCoin = tx.splitCoins(tx.object(underlyingCoinId), [tx.pure.u64(underlyingAmount)]);
  const priceInfo = adapter.addPriceInfo({ tx, config, syIndex });
  const [syCoin, mintRequest] = addMintSyExactIn(tx, config, priceInfo, underlyingAmount);
  const depositResult = adapter.addDepositToSy({
    tx,
    config,
    mintRequest,
    inputCoin: underlyingCoin,
    syAmount: underlyingAmount,
  });
  const transferObjects = depositResult.excessCoin
    ? [syCoin, depositResult.excessCoin]
    : [syCoin];
  tx.transferObjects(transferObjects, tx.pure.address(senderAddress));

  return tx;
}
