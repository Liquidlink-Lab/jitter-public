/**
 * @jitter/sdk — sy.ts
 */

import type { Transaction, TransactionObjectArgument } from "@mysten/sui/transactions";

import type { JitterMarketConfig } from "./types.js";

function requireConfigValue(value: string | undefined, field: string): string {
  if (!value) {
    throw new Error(`Missing Jitter market config field: ${field}.`);
  }
  return value;
}

function requireGlobalConfig(config: JitterMarketConfig): string {
  return requireConfigValue(config.globalConfigObjectId, "globalConfigObjectId");
}

// ---------------------------------------------------------------------------
// SY minting
// ---------------------------------------------------------------------------

/**
 * Mint SY from underlying (exact underlying amount in).
 * Returns [Coin<SY>, MintSyRequest<SY>].  Consume MintSyRequest with addDemoDeposit.
 */
export function addMintSyExactIn(
  tx: Transaction,
  config: JitterMarketConfig,
  priceInfo: TransactionObjectArgument,
  exactIn: bigint,
): [TransactionObjectArgument, TransactionObjectArgument] {
  const result = tx.moveCall({
    target: `${config.jitterPackageId}::sy::mint_sy_exact_in`,
    arguments: [
      tx.object(config.marketObjectId),
      tx.object(requireGlobalConfig(config)),
      priceInfo,
      tx.pure.u64(exactIn),
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag, config.ptTypeTag, config.ytTypeTag],
  });
  return [result[0] as TransactionObjectArgument, result[1] as TransactionObjectArgument];
}

/**
 * Satisfy a MintSyRequest by depositing underlying into the demo vault.
 */
export function addDemoDeposit(
  tx: Transaction,
  config: JitterMarketConfig,
  mintRequest: TransactionObjectArgument,
  underlyingCoin: TransactionObjectArgument,
): void {
  tx.moveCall({
    target: `${config.demoAdapterPackageId}::demo_market_vault::deposit`,
    arguments: [
      mintRequest,
      underlyingCoin,
      tx.object(config.syStateObjectId),
      tx.object(requireGlobalConfig(config)),
      tx.object(config.demoMarketVaultObjectId),
      tx.object(config.marketObjectId),
      tx.object.clock(),
    ],
    typeArguments: [
      config.underlyingTypeTag,
      config.syTypeTag,
      config.ptTypeTag,
      config.ytTypeTag,
    ],
  });
}

/**
 * Mint Scallop MarketCoin<Underlying> from base Coin<Underlying>.
 */
export function addScallopMintMarketCoin(
  tx: Transaction,
  config: JitterMarketConfig,
  underlyingCoin: TransactionObjectArgument,
): TransactionObjectArgument {
  return tx.moveCall({
    target: `${requireConfigValue(config.scallopProtocolPackageId, "scallopProtocolPackageId")}::mint::mint`,
    arguments: [
      tx.object(requireConfigValue(config.scallopVersionObjectId, "scallopVersionObjectId")),
      tx.object(requireConfigValue(config.scallopMarketObjectId, "scallopMarketObjectId")),
      underlyingCoin,
      tx.object.clock(),
    ],
    typeArguments: [config.underlyingTypeTag],
  }) as TransactionObjectArgument;
}

/**
 * Satisfy a MintSyRequest by escrowing Scallop MarketCoin<Underlying> in the
 * Scallop adapter vault.
 *
 * minMarketCoinOut should normally be the SY amount minted by mint_sy_exact_in.
 */
export function addScallopDeposit(
  tx: Transaction,
  config: JitterMarketConfig,
  mintRequest: TransactionObjectArgument,
  underlyingCoin: TransactionObjectArgument,
  minMarketCoinOut: bigint | number = 1n,
): TransactionObjectArgument {
  return tx.moveCall({
    target: `${requireConfigValue(config.scallopAdapterPackageId, "scallopAdapterPackageId")}::scallop_market_vault::deposit`,
    arguments: [
      mintRequest,
      underlyingCoin,
      tx.pure.u64(minMarketCoinOut),
      tx.object(config.syStateObjectId),
      tx.object(requireGlobalConfig(config)),
      tx.object(requireConfigValue(config.scallopMarketVaultObjectId, "scallopMarketVaultObjectId")),
      tx.object(config.marketObjectId),
      tx.object(requireConfigValue(config.scallopVersionObjectId, "scallopVersionObjectId")),
      tx.object(requireConfigValue(config.scallopMarketObjectId, "scallopMarketObjectId")),
      tx.object.clock(),
    ],
    typeArguments: [
      config.underlyingTypeTag,
      config.syTypeTag,
      config.ptTypeTag,
      config.ytTypeTag,
    ],
  }) as TransactionObjectArgument;
}

/**
 * Satisfy a MintSyRequest from base underlying by first minting Scallop
 * MarketCoin<Underlying>, then escrowing the receipt coin in the Jitter adapter.
 */
export function addScallopDepositFromUnderlying(
  tx: Transaction,
  config: JitterMarketConfig,
  mintRequest: TransactionObjectArgument,
  underlyingCoin: TransactionObjectArgument,
  minMarketCoinOut: bigint | number = 1n,
): TransactionObjectArgument {
  const marketCoin = addScallopMintMarketCoin(tx, config, underlyingCoin);
  return addScallopDeposit(tx, config, mintRequest, marketCoin, minMarketCoinOut);
}

/**
 * Satisfy a MintSyRequest by escrowing Ember receipt shares in the Ember
 * adapter vault.
 *
 * This is the `Ember receipt asset -> Jitter SY` path. Base asset ->
 * Ember receipt asset conversion is an external routing step and is not
 * performed by this adapter. Returns excess receipt coin, if any.
 */
export function addEmberDeposit(
  tx: Transaction,
  config: JitterMarketConfig,
  mintRequest: TransactionObjectArgument,
  receiptCoin: TransactionObjectArgument,
): TransactionObjectArgument {
  return tx.moveCall({
    target: `${requireConfigValue(config.emberAdapterPackageId, "emberAdapterPackageId")}::ember_market_vault::deposit`,
    arguments: [
      mintRequest,
      receiptCoin,
      tx.object(config.syStateObjectId),
      tx.object(requireGlobalConfig(config)),
      tx.object(requireConfigValue(config.emberMarketVaultObjectId, "emberMarketVaultObjectId")),
      tx.object(config.marketObjectId),
      tx.object(requireConfigValue(config.emberVaultObjectId, "emberVaultObjectId")),
      tx.object.clock(),
    ],
    typeArguments: [
      config.underlyingTypeTag,
      requireConfigValue(config.emberReceiptTypeTag, "emberReceiptTypeTag"),
      config.syTypeTag,
      config.ptTypeTag,
      config.ytTypeTag,
    ],
  }) as TransactionObjectArgument;
}

/**
 * Satisfy a MintSyRequest by escrowing Suilend CToken<P, Underlying>.
 *
 * Supplying underlying into Suilend and receiving the cToken is an external
 * route step. This call wraps the cToken receipt into Jitter SY and returns
 * any excess cToken.
 */
export function addSuilendDeposit(
  tx: Transaction,
  config: JitterMarketConfig,
  mintRequest: TransactionObjectArgument,
  ctokenCoin: TransactionObjectArgument,
): TransactionObjectArgument {
  return tx.moveCall({
    target: `${requireConfigValue(config.suilendAdapterPackageId, "suilendAdapterPackageId")}::suilend_market_vault::deposit`,
    arguments: [
      mintRequest,
      ctokenCoin,
      tx.object(config.syStateObjectId),
      tx.object(requireGlobalConfig(config)),
      tx.object(requireConfigValue(config.suilendMarketVaultObjectId, "suilendMarketVaultObjectId")),
      tx.object(config.marketObjectId),
      tx.object(requireConfigValue(config.suilendReserveObjectId, "suilendReserveObjectId")),
      tx.object.clock(),
    ],
    typeArguments: [
      requireConfigValue(config.suilendProtocolTypeTag, "suilendProtocolTypeTag"),
      config.underlyingTypeTag,
      config.syTypeTag,
      config.ptTypeTag,
      config.ytTypeTag,
    ],
  }) as TransactionObjectArgument;
}

/**
 * Satisfy a MintSyRequest by depositing underlying into NAVI through the
 * adapter-owned NAVI AccountCap.
 */
export function addNaviDeposit(
  tx: Transaction,
  config: JitterMarketConfig,
  mintRequest: TransactionObjectArgument,
  underlyingCoin: TransactionObjectArgument,
): void {
  tx.moveCall({
    target: `${requireConfigValue(config.naviAdapterPackageId, "naviAdapterPackageId")}::navi_market_vault::deposit`,
    arguments: [
      mintRequest,
      underlyingCoin,
      tx.object(config.syStateObjectId),
      tx.object(requireGlobalConfig(config)),
      tx.object(requireConfigValue(config.naviMarketVaultObjectId, "naviMarketVaultObjectId")),
      tx.object(config.marketObjectId),
      tx.object(requireConfigValue(config.naviStorageObjectId, "naviStorageObjectId")),
      tx.object(requireConfigValue(config.naviPoolObjectId, "naviPoolObjectId")),
      tx.object(requireConfigValue(config.naviIncentiveV2ObjectId, "naviIncentiveV2ObjectId")),
      tx.object(requireConfigValue(config.naviIncentiveV3ObjectId, "naviIncentiveV3ObjectId")),
      tx.object.clock(),
    ],
    typeArguments: [
      config.underlyingTypeTag,
      config.syTypeTag,
      config.ptTypeTag,
      config.ytTypeTag,
    ],
  });
}

// ---------------------------------------------------------------------------
// SY burning
// ---------------------------------------------------------------------------

/**
 * Burn SY (exact SY in).  Returns BurnSyRequest<SY> hot-potato.
 * Consume with addDemoRedeem.
 */
export function addBurnSyExactIn(
  tx: Transaction,
  config: JitterMarketConfig,
  priceInfo: TransactionObjectArgument,
  syInCoin: TransactionObjectArgument,
): TransactionObjectArgument {
  return tx.moveCall({
    target: `${config.jitterPackageId}::sy::burn_sy_exact_in`,
    arguments: [
      tx.object(config.marketObjectId),
      tx.object(requireGlobalConfig(config)),
      priceInfo,
      syInCoin,
      tx.object.clock(),
    ],
    typeArguments: [config.syTypeTag, config.ptTypeTag, config.ytTypeTag],
  }) as TransactionObjectArgument;
}

/**
 * Satisfy a BurnSyRequest by withdrawing underlying from the demo vault.
 * Returns Coin<Underlying>.
 */
export function addDemoRedeem(
  tx: Transaction,
  config: JitterMarketConfig,
  burnRequest: TransactionObjectArgument,
): TransactionObjectArgument {
  return tx.moveCall({
    target: `${config.demoAdapterPackageId}::demo_market_vault::redeem`,
    arguments: [
      burnRequest,
      tx.object(config.syStateObjectId),
      tx.object(requireGlobalConfig(config)),
      tx.object(config.demoMarketVaultObjectId),
      tx.object(config.marketObjectId),
      tx.object.clock(),
    ],
    typeArguments: [
      config.underlyingTypeTag,
      config.syTypeTag,
      config.ptTypeTag,
      config.ytTypeTag,
    ],
  }) as TransactionObjectArgument;
}

/**
 * Satisfy a BurnSyRequest by redeeming Scallop MarketCoin<Underlying>.
 *
 * marketCoinIn should match the SY amount that was burned, because this adapter
 * models SY as Scallop sCoin shares.
 */
export function addScallopRedeem(
  tx: Transaction,
  config: JitterMarketConfig,
  burnRequest: TransactionObjectArgument,
  marketCoinIn: bigint | number,
): TransactionObjectArgument {
  return tx.moveCall({
    target: `${requireConfigValue(config.scallopAdapterPackageId, "scallopAdapterPackageId")}::scallop_market_vault::redeem`,
    arguments: [
      burnRequest,
      tx.pure.u64(marketCoinIn),
      tx.object(config.syStateObjectId),
      tx.object(requireGlobalConfig(config)),
      tx.object(requireConfigValue(config.scallopMarketVaultObjectId, "scallopMarketVaultObjectId")),
      tx.object(config.marketObjectId),
      tx.object(requireConfigValue(config.scallopVersionObjectId, "scallopVersionObjectId")),
      tx.object(requireConfigValue(config.scallopMarketObjectId, "scallopMarketObjectId")),
      tx.object.clock(),
    ],
    typeArguments: [
      config.underlyingTypeTag,
      config.syTypeTag,
      config.ptTypeTag,
      config.ytTypeTag,
    ],
  }) as TransactionObjectArgument;
}

/**
 * Redeem Scallop MarketCoin<Underlying> back to base Coin<Underlying>.
 */
export function addScallopRedeemMarketCoinToUnderlying(
  tx: Transaction,
  config: JitterMarketConfig,
  marketCoin: TransactionObjectArgument,
): TransactionObjectArgument {
  return tx.moveCall({
    target: `${requireConfigValue(config.scallopProtocolPackageId, "scallopProtocolPackageId")}::redeem::redeem`,
    arguments: [
      tx.object(requireConfigValue(config.scallopVersionObjectId, "scallopVersionObjectId")),
      tx.object(requireConfigValue(config.scallopMarketObjectId, "scallopMarketObjectId")),
      marketCoin,
      tx.object.clock(),
    ],
    typeArguments: [config.underlyingTypeTag],
  }) as TransactionObjectArgument;
}

/**
 * Satisfy a BurnSyRequest and return base Coin<Underlying> by routing the
 * adapter's MarketCoin<Underlying> output through Scallop redeem.
 */
export function addScallopRedeemToUnderlying(
  tx: Transaction,
  config: JitterMarketConfig,
  burnRequest: TransactionObjectArgument,
  marketCoinIn: bigint | number,
): TransactionObjectArgument {
  const marketCoin = addScallopRedeem(tx, config, burnRequest, marketCoinIn);
  return addScallopRedeemMarketCoinToUnderlying(tx, config, marketCoin);
}

/**
 * Satisfy a BurnSyRequest by returning Ember receipt shares from the adapter
 * vault.
 *
 * This is the reverse `Jitter SY -> Ember receipt asset` exit path. It does
 * not create an Ember withdrawal request; base-asset withdrawal from Ember is
 * an external routing step.
 */
export function addEmberRedeem(
  tx: Transaction,
  config: JitterMarketConfig,
  burnRequest: TransactionObjectArgument,
): TransactionObjectArgument {
  return tx.moveCall({
    target: `${requireConfigValue(config.emberAdapterPackageId, "emberAdapterPackageId")}::ember_market_vault::redeem`,
    arguments: [
      burnRequest,
      tx.object(config.syStateObjectId),
      tx.object(requireGlobalConfig(config)),
      tx.object(requireConfigValue(config.emberMarketVaultObjectId, "emberMarketVaultObjectId")),
      tx.object(config.marketObjectId),
      tx.object(requireConfigValue(config.emberVaultObjectId, "emberVaultObjectId")),
      tx.object.clock(),
    ],
    typeArguments: [
      config.underlyingTypeTag,
      requireConfigValue(config.emberReceiptTypeTag, "emberReceiptTypeTag"),
      config.syTypeTag,
      config.ptTypeTag,
      config.ytTypeTag,
    ],
  }) as TransactionObjectArgument;
}

/**
 * Satisfy a BurnSyRequest by returning Suilend CToken<P, Underlying>.
 *
 * Redeeming cToken back to underlying is an external route step.
 */
export function addSuilendRedeem(
  tx: Transaction,
  config: JitterMarketConfig,
  burnRequest: TransactionObjectArgument,
): TransactionObjectArgument {
  return tx.moveCall({
    target: `${requireConfigValue(config.suilendAdapterPackageId, "suilendAdapterPackageId")}::suilend_market_vault::redeem`,
    arguments: [
      burnRequest,
      tx.object(config.syStateObjectId),
      tx.object(requireGlobalConfig(config)),
      tx.object(requireConfigValue(config.suilendMarketVaultObjectId, "suilendMarketVaultObjectId")),
      tx.object(config.marketObjectId),
      tx.object(requireConfigValue(config.suilendReserveObjectId, "suilendReserveObjectId")),
      tx.object.clock(),
    ],
    typeArguments: [
      requireConfigValue(config.suilendProtocolTypeTag, "suilendProtocolTypeTag"),
      config.underlyingTypeTag,
      config.syTypeTag,
      config.ptTypeTag,
      config.ytTypeTag,
    ],
  }) as TransactionObjectArgument;
}

/**
 * Satisfy a BurnSyRequest by withdrawing underlying from NAVI through the
 * adapter-owned NAVI AccountCap. Use this for non-SUI NAVI markets.
 */
export function addNaviRedeem(
  tx: Transaction,
  config: JitterMarketConfig,
  burnRequest: TransactionObjectArgument,
): TransactionObjectArgument {
  return tx.moveCall({
    target: `${requireConfigValue(config.naviAdapterPackageId, "naviAdapterPackageId")}::navi_market_vault::redeem`,
    arguments: [
      burnRequest,
      tx.object(config.syStateObjectId),
      tx.object(requireGlobalConfig(config)),
      tx.object(requireConfigValue(config.naviMarketVaultObjectId, "naviMarketVaultObjectId")),
      tx.object(config.marketObjectId),
      tx.object(requireConfigValue(config.naviStorageObjectId, "naviStorageObjectId")),
      tx.object(requireConfigValue(config.naviPoolObjectId, "naviPoolObjectId")),
      tx.object(requireConfigValue(config.naviOracleObjectId, "naviOracleObjectId")),
      tx.object(requireConfigValue(config.naviIncentiveV2ObjectId, "naviIncentiveV2ObjectId")),
      tx.object(requireConfigValue(config.naviIncentiveV3ObjectId, "naviIncentiveV3ObjectId")),
      tx.object.clock(),
    ],
    typeArguments: [
      config.underlyingTypeTag,
      config.syTypeTag,
      config.ptTypeTag,
      config.ytTypeTag,
    ],
  }) as TransactionObjectArgument;
}

/**
 * SuiSystem-aware NAVI redeem path. Use this for SUI NAVI markets.
 */
export function addNaviRedeemV2(
  tx: Transaction,
  config: JitterMarketConfig,
  burnRequest: TransactionObjectArgument,
): TransactionObjectArgument {
  return tx.moveCall({
    target: `${requireConfigValue(config.naviAdapterPackageId, "naviAdapterPackageId")}::navi_market_vault::redeem_v2`,
    arguments: [
      burnRequest,
      tx.object(config.syStateObjectId),
      tx.object(requireGlobalConfig(config)),
      tx.object(requireConfigValue(config.naviMarketVaultObjectId, "naviMarketVaultObjectId")),
      tx.object(config.marketObjectId),
      tx.object(requireConfigValue(config.naviStorageObjectId, "naviStorageObjectId")),
      tx.object(requireConfigValue(config.naviPoolObjectId, "naviPoolObjectId")),
      tx.object(requireConfigValue(config.naviOracleObjectId, "naviOracleObjectId")),
      tx.object(requireConfigValue(config.naviIncentiveV2ObjectId, "naviIncentiveV2ObjectId")),
      tx.object(requireConfigValue(config.naviIncentiveV3ObjectId, "naviIncentiveV3ObjectId")),
      tx.object(requireConfigValue(config.naviSuiSystemStateObjectId, "naviSuiSystemStateObjectId")),
      tx.object.clock(),
    ],
    typeArguments: [
      config.underlyingTypeTag,
      config.syTypeTag,
      config.ptTypeTag,
      config.ytTypeTag,
    ],
  }) as TransactionObjectArgument;
}
