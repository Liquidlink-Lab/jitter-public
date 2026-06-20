import type { MoveNumericField } from "../types.js";

export function normalizeMoveNumeric(raw: MoveNumericField): bigint {
  if (typeof raw === "object" && raw !== null && "value" in raw) {
    const value = BigInt(raw.value);
    return raw.positive === false ? -value : value;
  }

  return BigInt(raw);
}

export function tokenScale(decimals: number): bigint {
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new Error(`Invalid token decimals: ${decimals}`);
  }

  return 10n ** BigInt(decimals);
}

export function formatDecimalUnits(
  raw: MoveNumericField,
  decimals: number,
): string {
  const value = normalizeMoveNumeric(raw);
  const sign = value < 0n ? "-" : "";
  const absValue = value < 0n ? -value : value;
  const scale = tokenScale(decimals);
  const intPart = absValue / scale;
  const fracPart = absValue % scale;

  if (decimals === 0) return `${sign}${intPart}`;

  return `${sign}${intPart}.${fracPart.toString().padStart(decimals, "0")}`;
}

export function toDecimalUnits(
  raw: MoveNumericField,
  decimals: number,
): number {
  return Number(normalizeMoveNumeric(raw)) / Number(tokenScale(decimals));
}
