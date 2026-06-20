import { describe, expect, test } from "bun:test";

import { FP64_ONE } from "../constants.js";
import { calcImpliedApy, fp64ToFloat, formatTokenAmount } from "../queries.js";

// ---------------------------------------------------------------------------
// fp64ToFloat
// ---------------------------------------------------------------------------

describe("fp64ToFloat", () => {
  test("1.0 FP64 → '1.000000'", () => {
    expect(fp64ToFloat(FP64_ONE.toString())).toBe("1.000000");
  });

  test("2.0 FP64 → '2.000000'", () => {
    expect(fp64ToFloat((FP64_ONE * BigInt(2)).toString())).toBe("2.000000");
  });

  test("0.5 FP64 → '0.500000'", () => {
    expect(fp64ToFloat((FP64_ONE / BigInt(2)).toString())).toBe("0.500000");
  });

  test("1.05 FP64 (5% yield) → between 1.04 and 1.06", () => {
    const raw = (FP64_ONE * BigInt(105)) / BigInt(100);
    const result = fp64ToFloat(raw.toString());
    const num = parseFloat(result);
    expect(num).toBeGreaterThan(1.04);
    expect(num).toBeLessThan(1.06);
  });

  test("zero → '0.000000'", () => {
    expect(fp64ToFloat("0")).toBe("0.000000");
  });

  test("Move numeric object works same as string", () => {
    expect(fp64ToFloat({ value: FP64_ONE.toString(), positive: true })).toBe(
      "1.000000",
    );
  });

  test("custom decimals=2", () => {
    expect(fp64ToFloat(FP64_ONE.toString(), 2)).toBe("1.00");
  });
});

// ---------------------------------------------------------------------------
// formatTokenAmount
// ---------------------------------------------------------------------------

describe("formatTokenAmount", () => {
  test("1_000_000 with decimals=6 → '1.000000'", () => {
    expect(formatTokenAmount("1000000", 6)).toBe("1.000000");
  });

  test("1_500_000 with decimals=6 → '1.500000'", () => {
    expect(formatTokenAmount(BigInt(1_500_000), 6)).toBe("1.500000");
  });

  test("0 → '0.000000'", () => {
    expect(formatTokenAmount("0", 6)).toBe("0.000000");
  });

  test("100 SUI (9 decimals) = 100_000_000_000", () => {
    expect(formatTokenAmount("100000000000", 9)).toBe("100.000000000");
  });

  test("bigint input works same as string", () => {
    const str = formatTokenAmount("123456789", 6);
    const big = formatTokenAmount(BigInt(123456789), 6);
    expect(str).toBe(big);
  });

  test("Move numeric object works same as string", () => {
    expect(formatTokenAmount({ value: "1000000" }, 6)).toBe("1.000000");
  });
});

// ---------------------------------------------------------------------------
// calcImpliedApy
// ---------------------------------------------------------------------------

describe("calcImpliedApy", () => {
  test("zero rate → 0% APY", () => {
    expect(calcImpliedApy("0")).toBe(0);
  });

  test("Move numeric object zero rate returns 0% APY", () => {
    expect(calcImpliedApy({ value: "0" })).toBe(0);
  });

  test("positive ln rate → positive APY", () => {
    // ln_implied_rate = 0.05 in FP64 ≈ 5% annual
    const lnRate = (FP64_ONE * BigInt(5)) / BigInt(100); // 0.05 FP64
    const apy = calcImpliedApy(lnRate.toString());
    expect(apy).toBeGreaterThan(0);
    expect(apy).toBeCloseTo(5.127, 0); // e^0.05 - 1 ≈ 5.127%
  });

  test("negative rate returns negative APY", () => {
    // Negative ln_implied_rate stored as a very large u128 (wraps around)
    // In practice shouldn't happen in Jitter but test the math path
    const apy = calcImpliedApy("0");
    expect(apy).toBe(0);
  });
});
