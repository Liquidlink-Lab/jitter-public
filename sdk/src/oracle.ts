/**
 * @jitter/sdk — oracle.ts
 */

import type { Transaction, TransactionObjectArgument } from "@mysten/sui/transactions";

import { _new as collectorNew } from "./generated/jitter_oracle/collector.js";
import { quote as demoPriceTicketQuote } from "./generated/demo_adapter/demo_price_ticket.js";
import { quote as scallopPriceTicketQuote } from "./generated/scallop_adapter/scallop_price_ticket.js";
import { quote as emberPriceTicketQuote } from "./generated/ember_adapter/ember_price_ticket.js";
import { quote as suilendPriceTicketQuote } from "./generated/suilend_adapter/suilend_price_ticket.js";
import { quote as naviPriceTicketQuote } from "./generated/navi_adapter/navi_price_ticket.js";
import { aggregate } from "./generated/jitter_oracle/aggregator.js";

import type { JitterMarketConfig } from "./types.js";

function requireConfigValue(value: string | undefined, field: string): string {
  if (!value) {
    throw new Error(`Missing Jitter market config field: ${field}.`);
  }
  return value;
}

/**
 * Append the demo oracle pipeline to a PTB and return PriceInfo<SY>.
 *
 * PriceInfo is a hot-potato — it must be consumed exactly once in the same PTB.
 * Create a new PriceInfo per consumer call (e.g. once for mintSyExactIn,
 * a second time for mintPyFromSy).
 *
 * @param syIndex - SY exchange rate as raw FP64 u128 (use FP64_ONE for 1:1).
 */
export function addDemoPriceInfo(
  tx: Transaction,
  config: JitterMarketConfig,
  syIndex: bigint,
): TransactionObjectArgument {
  const collector = collectorNew({
    package: config.oraclePackageId,
    arguments: [config.marketObjectId],
    typeArguments: [config.syTypeTag],
  })(tx);

  demoPriceTicketQuote({
    package: config.demoAdapterPackageId,
    arguments: [collector as TransactionObjectArgument, syIndex, config.demoMarketVaultObjectId],
    typeArguments: [
      config.underlyingTypeTag,
      config.syTypeTag,
      config.ptTypeTag,
      config.ytTypeTag,
    ],
  })(tx);

  return aggregate({
    package: config.oraclePackageId,
    arguments: [config.priceAggregatorObjectId, collector as TransactionObjectArgument],
    typeArguments: [config.syTypeTag],
  })(tx) as TransactionObjectArgument;
}

/**
 * Append the Scallop oracle pipeline to a PTB and return PriceInfo<SY>.
 *
 * The SY index is derived on-chain from Scallop's Market balance sheet:
 * (cash + debt - revenue) / market_coin_supply, encoded as FP64.
 */
export function addScallopPriceInfo(
  tx: Transaction,
  config: JitterMarketConfig,
): TransactionObjectArgument {
  const collector = collectorNew({
    package: config.oraclePackageId,
    arguments: [config.marketObjectId],
    typeArguments: [config.syTypeTag],
  })(tx);

  scallopPriceTicketQuote({
    package: requireConfigValue(config.scallopAdapterPackageId, "scallopAdapterPackageId"),
    arguments: [
      collector as TransactionObjectArgument,
      requireConfigValue(config.scallopMarketVaultObjectId, "scallopMarketVaultObjectId"),
      requireConfigValue(config.scallopVersionObjectId, "scallopVersionObjectId"),
      requireConfigValue(config.scallopMarketObjectId, "scallopMarketObjectId"),
    ],
    typeArguments: [
      config.underlyingTypeTag,
      config.syTypeTag,
      config.ptTypeTag,
      config.ytTypeTag,
    ],
  })(tx);

  return aggregate({
    package: config.oraclePackageId,
    arguments: [config.priceAggregatorObjectId, collector as TransactionObjectArgument],
    typeArguments: [config.syTypeTag],
  })(tx) as TransactionObjectArgument;
}

/**
 * Append the Ember oracle pipeline to a PTB and return PriceInfo<SY>.
 *
 * Ember Vault rate is shares-per-underlying at 1e9 scale. The adapter converts
 * it on-chain into Jitter's underlying-per-SY FP64 index.
 */
export function addEmberPriceInfo(
  tx: Transaction,
  config: JitterMarketConfig,
): TransactionObjectArgument {
  const collector = collectorNew({
    package: config.oraclePackageId,
    arguments: [config.marketObjectId],
    typeArguments: [config.syTypeTag],
  })(tx);

  emberPriceTicketQuote({
    package: requireConfigValue(config.emberAdapterPackageId, "emberAdapterPackageId"),
    arguments: [
      collector as TransactionObjectArgument,
      requireConfigValue(config.emberMarketVaultObjectId, "emberMarketVaultObjectId"),
      requireConfigValue(config.emberVaultObjectId, "emberVaultObjectId"),
    ],
    typeArguments: [
      config.underlyingTypeTag,
      requireConfigValue(config.emberReceiptTypeTag, "emberReceiptTypeTag"),
      config.syTypeTag,
      config.ptTypeTag,
      config.ytTypeTag,
    ],
  })(tx);

  return aggregate({
    package: config.oraclePackageId,
    arguments: [config.priceAggregatorObjectId, collector as TransactionObjectArgument],
    typeArguments: [config.syTypeTag],
  })(tx) as TransactionObjectArgument;
}

/**
 * Append the Suilend oracle pipeline to a PTB and return PriceInfo<SY>.
 *
 * The SY index is derived on-chain from Suilend's simulated cToken ratio.
 */
export function addSuilendPriceInfo(
  tx: Transaction,
  config: JitterMarketConfig,
): TransactionObjectArgument {
  const collector = collectorNew({
    package: config.oraclePackageId,
    arguments: [config.marketObjectId],
    typeArguments: [config.syTypeTag],
  })(tx);

  suilendPriceTicketQuote({
    package: requireConfigValue(config.suilendAdapterPackageId, "suilendAdapterPackageId"),
    arguments: [
      collector as TransactionObjectArgument,
      requireConfigValue(config.suilendMarketVaultObjectId, "suilendMarketVaultObjectId"),
      requireConfigValue(config.suilendReserveObjectId, "suilendReserveObjectId"),
    ],
    typeArguments: [
      requireConfigValue(config.suilendProtocolTypeTag, "suilendProtocolTypeTag"),
      config.underlyingTypeTag,
      config.syTypeTag,
      config.ptTypeTag,
      config.ytTypeTag,
    ],
  })(tx);

  return aggregate({
    package: config.oraclePackageId,
    arguments: [config.priceAggregatorObjectId, collector as TransactionObjectArgument],
    typeArguments: [config.syTypeTag],
  })(tx) as TransactionObjectArgument;
}

/**
 * Append the NAVI oracle pipeline to a PTB and return PriceInfo<SY>.
 *
 * The SY index is derived on-chain from NAVI's current supply index.
 */
export function addNaviPriceInfo(
  tx: Transaction,
  config: JitterMarketConfig,
): TransactionObjectArgument {
  const collector = collectorNew({
    package: config.oraclePackageId,
    arguments: [config.marketObjectId],
    typeArguments: [config.syTypeTag],
  })(tx);

  naviPriceTicketQuote({
    package: requireConfigValue(config.naviAdapterPackageId, "naviAdapterPackageId"),
    arguments: [
      collector as TransactionObjectArgument,
      requireConfigValue(config.naviMarketVaultObjectId, "naviMarketVaultObjectId"),
      requireConfigValue(config.naviStorageObjectId, "naviStorageObjectId"),
      requireConfigValue(config.naviPoolObjectId, "naviPoolObjectId"),
    ],
    typeArguments: [
      config.underlyingTypeTag,
      config.syTypeTag,
      config.ptTypeTag,
      config.ytTypeTag,
    ],
  })(tx);

  return aggregate({
    package: config.oraclePackageId,
    arguments: [config.priceAggregatorObjectId, collector as TransactionObjectArgument],
    typeArguments: [config.syTypeTag],
  })(tx) as TransactionObjectArgument;
}
