import { NextResponse } from "next/server";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { getValueRealizationSnapshot } from "@/lib/value-realization";

function csvCell(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
}

function pct(value: number | null) {
  return value === null ? "" : (value * 100).toFixed(2) + "%";
}

export async function GET(request: Request) {
  const auth = await apiSession("view");
  if (auth.response) return auth.response;
  const session = auth.session!;
  const { dashboard, evidence, value } = await getValueRealizationSnapshot(session.orgId);

  const rows: (string | number | null)[][] = [
    ["section","metric","value","interpretation"],
    ["commercial","annual_anchor_contract_cost",value.annualAnchorCost,"Customer-entered annual contract cost"],
    ["commercial","allocated_cost_90d",value.allocatedCost90d,"Annual cost prorated to 90 days"],
    ["operations","resolved_cases_90d",value.resolvedCases90d,"Verified case resolutions"],
    ["operations","verified_commitments_90d",value.verifiedCommitments90d,"Completed commitments with verification"],
    ["operations","cost_per_resolved_case_90d",value.costPerResolvedCase,"Allocated 90-day cost / resolved cases"],
    ["operations","cost_per_verified_commitment_90d",value.costPerVerifiedCommitment,"Allocated 90-day cost / verified commitments"],
    ["operations","virtual_recoveries_30d",value.recoveredVirtualSessions30d,"Sessions currently marked recovered"],
    ["evidence","evaluated_cases",evidence.evaluatedCases,"Resolved cases with enough recorded pre/post attendance"],
    ["evidence","observed_additional_attended_days",Number(evidence.observedAdditionalAttendedDays.toFixed(2)),"Descriptive before/after movement; not causal"],
    ["evidence","cost_per_observed_additional_attended_day",value.costPerObservedAdditionalAttendedDay,"Descriptive efficiency ratio; not attributable ROI"],
    ["funding","gross_value_of_one_attendance_point",value.onePointGrossValue,"Aggregate planning scenario; not guaranteed net aid"],
    ["funding","one_point_ada",value.onePointAda,"Additional ADA associated with one attendance percentage point"],
    ["funding","break_even_attendance_points",value.breakEvenAttendancePoints,"Annual contract cost / gross value of one attendance point"],
    ["funding","break_even_ada",value.breakEvenAda,"Scenario ADA numerically equal to break-even attendance points"],
    ["context","current_attendance_rate",pct(dashboard.attendanceRate),"Recorded attendance proxy from loaded daily records"],
    ["context","enrollment",dashboard.enrollment,"Active enrollment"],
    [],
    ["disclaimer","causality","","Observed attendance change is descriptive and is not attributed to Anchor without a valid comparison design."],
    ["disclaimer","funding","","Funding values are aggregate gross planning scenarios, not guarantees of realized or net state aid."],
  ];

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");

  await audit({
    orgId: session.orgId,
    actorUserId: session.userId,
    action: "value_realization.exported",
    entityType: "value_report",
    metadata: {
      annualAnchorCost: value.annualAnchorCost,
      resolvedCases90d: value.resolvedCases90d,
      verifiedCommitments90d: value.verifiedCommitments90d,
      evaluatedCases: evidence.evaluatedCases,
    },
    request,
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="anchor-value-realization.csv"',
      "Cache-Control": "no-store",
    },
  });
}
