import { describe, expect, it } from "vitest";
import { calculateValueRealization } from "../lib/value-realization";

describe("value realization calculations", () => {
  it("prorates annual cost to the 90-day reporting window", () => {
    const result = calculateValueRealization({
      annualAnchorCost: 100000,
      onePointGrossValue: 621500,
      onePointAda: 100,
      resolvedCases90d: 20,
      commitmentsTotal90d: 40,
      verifiedCommitments90d: 30,
      observedAdditionalAttendedDays: 15,
      recoveredVirtualSessions30d: 5,
    });

    expect(result.allocatedCost90d).toBeCloseTo(100000 * 90 / 365, 6);
    expect(result.costPerResolvedCase).toBeCloseTo((100000 * 90 / 365) / 20, 6);
    expect(result.costPerVerifiedCommitment).toBeCloseTo((100000 * 90 / 365) / 30, 6);
    expect(result.costPerObservedAdditionalAttendedDay).toBeCloseTo((100000 * 90 / 365) / 15, 6);
  });

  it("calculates break-even attendance movement only from aggregate planning values", () => {
    const result = calculateValueRealization({
      annualAnchorCost: 100000,
      onePointGrossValue: 621500,
      onePointAda: 100,
      resolvedCases90d: 20,
      commitmentsTotal90d: 40,
      verifiedCommitments90d: 30,
      observedAdditionalAttendedDays: 15,
      recoveredVirtualSessions30d: 5,
    });

    expect(result.breakEvenAttendancePoints).toBeCloseTo(100000 / 621500, 8);
    expect(result.breakEvenAda).toBeCloseTo(100 * (100000 / 621500), 8);
  });

  it("leaves financial efficiency blank when contract cost is not configured", () => {
    const result = calculateValueRealization({
      annualAnchorCost: null,
      onePointGrossValue: 621500,
      onePointAda: 100,
      resolvedCases90d: 20,
      commitmentsTotal90d: 40,
      verifiedCommitments90d: 30,
      observedAdditionalAttendedDays: 15,
      recoveredVirtualSessions30d: 5,
    });

    expect(result.allocatedCost90d).toBeNull();
    expect(result.costPerResolvedCase).toBeNull();
    expect(result.costPerVerifiedCommitment).toBeNull();
    expect(result.breakEvenAttendancePoints).toBeNull();
    expect(result.breakEvenAda).toBeNull();
  });

  it("does not calculate cost per observed day when observed movement is zero or negative", () => {
    const result = calculateValueRealization({
      annualAnchorCost: 100000,
      onePointGrossValue: 621500,
      onePointAda: 100,
      resolvedCases90d: 20,
      commitmentsTotal90d: 40,
      verifiedCommitments90d: 30,
      observedAdditionalAttendedDays: 0,
      recoveredVirtualSessions30d: 5,
    });

    expect(result.costPerObservedAdditionalAttendedDay).toBeNull();
  });
});
