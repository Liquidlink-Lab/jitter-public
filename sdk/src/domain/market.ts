import { normalizeMoveNumeric } from "./amounts.js";
import type {
  JitterMarketConfig,
  PoolFields,
  PyStateFields,
} from "../types.js";

export type MarketLifecycleStatus = "active" | "paused" | "matured" | "settled";

export type MarketLifecycle = {
  status: MarketLifecycleStatus;
  expiryMs: number;
  isActive: boolean;
  isPaused: boolean;
  isMatured: boolean;
  isSettled: boolean;
  maturityBucket: "near" | "mid" | "far" | "matured";
};

export function resolveMarketLifecycle(input: {
  pool: PoolFields;
  pyState: PyStateFields;
  nowMs?: number;
}): MarketLifecycle {
  const nowMs = input.nowMs ?? Date.now();
  const expiryMs = Number(
    normalizeMoveNumeric(input.pool.expiry ?? input.pyState.expiry),
  );
  const isSettled = Boolean(input.pyState.is_settled);
  const isPaused = Boolean(input.pool.paused);
  const isMatured = expiryMs <= nowMs;
  const isActive = !isSettled && !isPaused && !isMatured;

  return {
    status: isSettled
      ? "settled"
      : isPaused
        ? "paused"
        : isMatured
          ? "matured"
          : "active",
    expiryMs,
    isActive,
    isPaused,
    isMatured,
    isSettled,
    maturityBucket: getMaturityBucket(expiryMs, nowMs),
  };
}

export function getMaturityBucket(
  expiryMs: number,
  nowMs: number,
): "near" | "mid" | "far" | "matured" {
  if (expiryMs <= nowMs) return "matured";

  const daysToExpiry = (expiryMs - nowMs) / (24 * 60 * 60 * 1000);
  if (daysToExpiry <= 14) return "near";
  if (daysToExpiry <= 60) return "mid";
  return "far";
}

export function isScallopMarketConfig(config: JitterMarketConfig): boolean {
  return Boolean(config.scallopMarketVaultObjectId);
}

export function getMarketDisplaySymbol(config: JitterMarketConfig): string {
  const symbol = extractCoinSymbol(config.underlyingTypeTag);
  if (!isScallopMarketConfig(config)) return symbol;
  return symbol === "SUI" ? "sSUI" : `s${symbol}`;
}

export function getMarketProtocolLabel(config: JitterMarketConfig): string {
  return isScallopMarketConfig(config) ? "Scallop" : "Jitter";
}

export function extractCoinSymbol(typeTag: string): string {
  const trimmed = typeTag.trim();
  const innerTypeStart = trimmed.lastIndexOf("<");
  const source =
    innerTypeStart === -1
      ? trimmed
      : trimmed.slice(innerTypeStart + 1).replace(/>+$/u, "");
  const parts = source.split("::");
  return (parts[parts.length - 1] || "TOKEN").replace(/[>,\s]+$/u, "");
}
