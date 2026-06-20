export type ProfitScenarioAssumption = {
  key: string;
  value: string | number | bigint;
  source: "user" | "unavailable";
};

export type ProfitScenarioInput = {
  principalSy: bigint;
  daysToMaturity: number;
  futureApyBps?: number;
  rewardAprBps?: number;
};

export type ProfitScenarioResult = {
  principalSy: bigint;
  projectedYieldSy: bigint;
  projectedRewardSy: bigint;
  projectedTotalSy: bigint;
  assumptions: ProfitScenarioAssumption[];
};

export function calculateProfitScenario(
  input: ProfitScenarioInput,
): ProfitScenarioResult {
  if (input.futureApyBps === undefined) {
    throw new Error("Profit scenario requires a future APY assumption.");
  }
  if (input.daysToMaturity < 0) {
    throw new Error("daysToMaturity must be non-negative.");
  }

  const assumptions: ProfitScenarioAssumption[] = [
    { key: "futureApyBps", value: input.futureApyBps, source: "user" },
  ];

  const projectedYieldSy = annualizedBpsToPeriodAmount(
    input.principalSy,
    input.futureApyBps,
    input.daysToMaturity,
  );
  const rewardAprBps = input.rewardAprBps ?? 0;
  const projectedRewardSy = annualizedBpsToPeriodAmount(
    input.principalSy,
    rewardAprBps,
    input.daysToMaturity,
  );

  if (input.rewardAprBps === undefined) {
    assumptions.push({ key: "rewardAprBps", value: "unavailable", source: "unavailable" });
  } else {
    assumptions.push({ key: "rewardAprBps", value: input.rewardAprBps, source: "user" });
  }

  return {
    principalSy: input.principalSy,
    projectedYieldSy,
    projectedRewardSy,
    projectedTotalSy: input.principalSy + projectedYieldSy + projectedRewardSy,
    assumptions,
  };
}

function annualizedBpsToPeriodAmount(
  principal: bigint,
  annualBps: number,
  days: number,
): bigint {
  if (principal <= 0n || annualBps <= 0 || days <= 0) return 0n;
  return (principal * BigInt(Math.trunc(annualBps)) * BigInt(Math.trunc(days))) / 3_650_000n;
}
