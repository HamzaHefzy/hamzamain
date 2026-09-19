import { describe, expect, it } from "vitest";
import {
  calculateAda,
  calculateFundingScenario,
  calculateOnePointAttendanceValue,
} from "@/lib/finance";

describe("funding calculations", () => {
  it("calculates ADA from enrollment and attendance rate", () => {
    expect(calculateAda({
      enrollment: 10000,
      attendanceRate: 0.93,
      basicAllotment: 6215,
    })).toBe(9300);
  });

  it("calculates the gross one-point scenario consistently", () => {
    expect(calculateOnePointAttendanceValue({
      enrollment: 10000,
      attendanceRate: 0.93,
      basicAllotment: 6215,
    })).toBe(621500);
  });

  it("returns a complete transparent scenario", () => {
    expect(calculateFundingScenario({
      enrollment: 10000,
      attendanceRate: 0.93,
      basicAllotment: 6215,
    })).toEqual({
      enrollment: 10000,
      attendanceRate: 0.93,
      basicAllotment: 6215,
      ada: 9300,
      grossBaseFormulaValue: 57799500,
      onePointAda: 100,
      onePointGrossValue: 621500,
    });
  });
});
