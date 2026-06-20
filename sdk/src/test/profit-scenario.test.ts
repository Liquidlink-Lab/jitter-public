import { describe, expect, test } from "bun:test";

import { calculateProfitScenario } from "../domain/profit-scenario.js";

describe("profit scenario calculator", () => {
  test("requires explicit future APY assumption", () => {
    expect(() =>
      calculateProfitScenario({
        principalSy: 100n,
        daysToMaturity: 30,
      }),
    ).toThrow("future APY assumption");
  });

  test("returns assumptions instead of pretending projected yield is on-chain fact", () => {
    const result = calculateProfitScenario({
      principalSy: 1_000_000n,
      daysToMaturity: 30,
      futureApyBps: 1200,
      rewardAprBps: 300,
    });

    expect(result.projectedYieldSy).toBeGreaterThan(0n);
    expect(result.projectedRewardSy).toBeGreaterThan(0n);
    expect(result.assumptions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "futureApyBps", source: "user" }),
        expect.objectContaining({ key: "rewardAprBps", source: "user" }),
      ]),
    );
  });
});
