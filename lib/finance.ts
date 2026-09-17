export type FundingScenario = {
  enrollment: number;
  attendanceRate: number;
  basicAllotment: number;
};

export function calculateAda({ enrollment, attendanceRate }: FundingScenario) {
  return enrollment * attendanceRate;
}

export function calculateGrossBaseFormulaValue(input: FundingScenario) {
  return calculateAda(input) * input.basicAllotment;
}

export function calculateOnePointAttendanceValue(input: FundingScenario) {
  return input.enrollment * 0.01 * input.basicAllotment;
}

export function calculateFundingScenario(input: FundingScenario) {
  const ada = calculateAda(input);
  const grossBaseFormulaValue = calculateGrossBaseFormulaValue(input);
  const onePointAda = input.enrollment * 0.01;
  const onePointGrossValue = calculateOnePointAttendanceValue(input);

  return {
    ...input,
    ada,
    grossBaseFormulaValue,
    onePointAda,
    onePointGrossValue,
  };
}

export const TEXAS_2026_27_BASIC_ALLOTMENT = 6215;
