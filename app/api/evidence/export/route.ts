import { NextResponse } from "next/server";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { getEvidenceSnapshot } from "@/lib/evidence";

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
  const evidence = await getEvidenceSnapshot(session.orgId);

  const rows: (string | number | null)[][] = [
    ["section","metric","value","notes"],
    ["summary","resolved_cases_90d",evidence.resolvedCases90d,"Cases with recorded resolution"],
    ["summary","average_first_action_hours",evidence.averageFirstActionHours,"Opened to first recorded non-creation action"],
    ["summary","average_resolution_hours",evidence.averageResolutionHours,"Opened to resolved"],
    ["summary","verified_commitment_rate",pct(evidence.commitmentCompletionRate),"Verified completed commitments / non-cancelled commitments"],
    ["summary","on_time_commitment_rate",pct(evidence.commitmentOnTimeRate),"Verified by due time"],
    ["summary","overdue_commitments",evidence.overdueCommitments,"Pending or blocked commitments past due"],
    ["summary","stuck_open_cases",evidence.stuckOpenCases,"Open cases in stuck queue"],
    ["summary","open_cases_past_due",evidence.openCasesPastDue,"Open cases past current due time"],
    ["summary","virtual_recovered_30d",evidence.recoveredVirtualSessions30d,"Session participation currently marked recovered"],
    ["summary","virtual_missed_30d",evidence.missedVirtualSessions30d,"Session participation currently marked missed"],
    ["summary","virtual_recovery_rate",pct(evidence.virtualRecoveryRate),"Recovered / (recovered + missed), descriptive"],
    ["summary","evaluated_before_after_cases",evidence.evaluatedCases,"Cases with >=3 recorded days pre and post"],
    ["summary","average_observed_attendance_change",pct(evidence.averageObservedAttendanceChange),"Descriptive before/after; not causal"],
    ["summary","observed_additional_attended_days",Number(evidence.observedAdditionalAttendedDays.toFixed(2)),"Descriptive before/after; not causal"],
    [],
    ["campus","label","opened","resolution_rate","avg_resolution_hours","verification_rate","overdue_commitments","evaluated_cases","observed_change"],
    ...evidence.campusPerformance.map((row) => [
      "campus",
      row.label,
      row.opened,
      pct(row.resolutionRate),
      row.averageResolutionHours === null ? "" : Number(row.averageResolutionHours.toFixed(2)),
      pct(row.verificationRate),
      row.overdueCommitments,
      row.evaluatedCases,
      pct(row.averageObservedAttendanceChange),
    ]),
    [],
    ["barrier","label","opened","resolution_rate","avg_resolution_hours","verification_rate","overdue_commitments","evaluated_cases","observed_change"],
    ...evidence.barrierPerformance.map((row) => [
      "barrier",
      row.label,
      row.opened,
      pct(row.resolutionRate),
      row.averageResolutionHours === null ? "" : Number(row.averageResolutionHours.toFixed(2)),
      pct(row.verificationRate),
      row.overdueCommitments,
      row.evaluatedCases,
      pct(row.averageObservedAttendanceChange),
    ]),
    [],
    ["case","case_number","campus","barrier","resolved_at","pre_rate","post_rate","observed_change","observed_additional_days"],
    ...evidence.cohorts.map((row) => [
      "case",
      row.caseNumber,
      row.campusName ?? "Unassigned",
      row.barrierLabel,
      row.resolvedAt,
      pct(row.preRate),
      pct(row.postRate),
      pct(row.observedChange),
      Number(row.observedAdditionalDays.toFixed(2)),
    ]),
  ];

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");

  await audit({
    orgId: session.orgId,
    actorUserId: session.userId,
    action: "evidence.exported",
    entityType: "evidence_report",
    metadata: {
      resolvedCases90d: evidence.resolvedCases90d,
      evaluatedCases: evidence.evaluatedCases,
    },
    request,
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="anchor-evidence-executive.csv"',
      "Cache-Control": "no-store",
    },
  });
}
