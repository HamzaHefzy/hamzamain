import { getDashboardSnapshot, type DashboardSnapshot } from "@/lib/data-access";
import { getEvidenceSnapshot, type EvidenceSnapshot } from "@/lib/evidence";

export type ValueRealizationInputs = {
  annualAnchorCost: number | null;
  onePointGrossValue: number | null;
  onePointAda: number;
  resolvedCases90d: number;
  commitmentsTotal90d: number;
  verifiedCommitments90d: number;
  observedAdditionalAttendedDays: number;
  recoveredVirtualSessions30d: number;
};

export type ValueRealizationMetrics = {
  annualAnchorCost: number | null;
  reportingWindowDays: number;
  allocatedCost90d: number | null;
  costPerResolvedCase: number | null;
  costPerVerifiedCommitment: number | null;
  costPerObservedAdditionalAttendedDay: number | null;
  breakEvenAttendancePoints: number | null;
  breakEvenAda: number | null;
  onePointGrossValue: number | null;
  onePointAda: number;
  resolvedCases90d: number;
  commitmentsTotal90d: number;
  verifiedCommitments90d: number;
  observedAdditionalAttendedDays: number;
  recoveredVirtualSessions30d: number;
};

function safeDivide(numerator: number | null, denominator: number) {
  if (numerator === null || denominator <= 0) return null;
  return numerator / denominator;
}

export function calculateValueRealization(
  input: ValueRealizationInputs,
): ValueRealizationMetrics {
  const reportingWindowDays = 90;
  const allocatedCost90d = input.annualAnchorCost === null
    ? null
    : input.annualAnchorCost * reportingWindowDays / 365;

  const breakEvenAttendancePoints =
    input.annualAnchorCost !== null &&
    input.onePointGrossValue !== null &&
    input.onePointGrossValue > 0
      ? input.annualAnchorCost / input.onePointGrossValue
      : null;

  return {
    annualAnchorCost: input.annualAnchorCost,
    reportingWindowDays,
    allocatedCost90d,
    costPerResolvedCase: safeDivide(allocatedCost90d, input.resolvedCases90d),
    costPerVerifiedCommitment: safeDivide(
      allocatedCost90d,
      input.verifiedCommitments90d,
    ),
    costPerObservedAdditionalAttendedDay:
      input.observedAdditionalAttendedDays > 0
        ? safeDivide(allocatedCost90d, input.observedAdditionalAttendedDays)
        : null,
    breakEvenAttendancePoints,
    breakEvenAda: breakEvenAttendancePoints === null
      ? null
      : input.onePointAda * breakEvenAttendancePoints,
    onePointGrossValue: input.onePointGrossValue,
    onePointAda: input.onePointAda,
    resolvedCases90d: input.resolvedCases90d,
    commitmentsTotal90d: input.commitmentsTotal90d,
    verifiedCommitments90d: input.verifiedCommitments90d,
    observedAdditionalAttendedDays: input.observedAdditionalAttendedDays,
    recoveredVirtualSessions30d: input.recoveredVirtualSessions30d,
  };
}

export type ValueRealizationSnapshot = {
  dashboard: DashboardSnapshot;
  evidence: EvidenceSnapshot;
  value: ValueRealizationMetrics;
};

export async function getValueRealizationSnapshot(
  orgId: string,
): Promise<ValueRealizationSnapshot> {
  const [dashboard, evidence] = await Promise.all([
    getDashboardSnapshot(orgId),
    getEvidenceSnapshot(orgId),
  ]);

  return {
    dashboard,
    evidence,
    value: calculateValueRealization({
      annualAnchorCost: dashboard.annualAnchorCost,
      onePointGrossValue: dashboard.onePointGrossValue,
      onePointAda: dashboard.onePointAda,
      resolvedCases90d: evidence.resolvedCases90d,
      commitmentsTotal90d: evidence.commitmentsTotal90d,
      verifiedCommitments90d: evidence.verifiedCommitments90d,
      observedAdditionalAttendedDays: evidence.observedAdditionalAttendedDays,
      recoveredVirtualSessions30d: evidence.recoveredVirtualSessions30d,
    }),
  };
}
