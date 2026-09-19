import { db } from "@/lib/db";

type CohortRow = {
  case_number: string;
  barrier_label: string;
  resolved_at: Date;
  pre_days: string;
  pre_attended: string;
  post_days: string;
  post_attended: string;
};

export type EvidenceSnapshot = {
  resolvedCases90d: number;
  averageResolutionHours: number | null;
  commitmentCompletionRate: number | null;
  recoveredVirtualSessions30d: number;
  evaluatedCases: number;
  averageObservedAttendanceChange: number | null;
  observedAdditionalAttendedDays: number;
  barriers: { label: string; count: number }[];
  cohorts: {
    caseNumber: string;
    barrierLabel: string;
    resolvedAt: string;
    preDays: number;
    preRate: number;
    postDays: number;
    postRate: number;
    observedChange: number;
    observedAdditionalDays: number;
  }[];
};

export async function getEvidenceSnapshot(orgId: string): Promise<EvidenceSnapshot> {
  const sql = db();

  const [summary] = await sql<{
    resolved_cases: string;
    average_resolution_hours: string | null;
    commitments_total: string;
    commitments_completed: string;
    virtual_recoveries: string;
  }[]>`
    select
      (
        select count(*)::text
        from cases
        where org_id = ${orgId}
          and resolved_at >= now() - interval '90 days'
      ) as resolved_cases,
      (
        select avg(extract(epoch from (resolved_at - opened_at)) / 3600)::text
        from cases
        where org_id = ${orgId}
          and resolved_at >= now() - interval '90 days'
          and resolved_at >= opened_at
      ) as average_resolution_hours,
      (
        select count(cm.id)::text
        from commitments cm
        join cases c on c.id = cm.case_id
        where cm.org_id = ${orgId}
          and c.opened_at >= now() - interval '90 days'
      ) as commitments_total,
      (
        select count(cm.id)::text
        from commitments cm
        join cases c on c.id = cm.case_id
        where cm.org_id = ${orgId}
          and c.opened_at >= now() - interval '90 days'
          and cm.status = 'completed'
          and cm.verified_at is not null
      ) as commitments_completed,
      (
        select count(*)::text
        from session_participation
        where org_id = ${orgId}
          and status = 'recovered'
          and updated_at >= now() - interval '30 days'
      ) as virtual_recoveries
  `;

  const barrierRows = await sql<{ barrier_label: string; count: string }[]>`
    select barrier_label, count(*)::text as count
    from cases
    where org_id = ${orgId}
      and opened_at >= now() - interval '90 days'
    group by barrier_label
    order by count(*) desc, barrier_label
    limit 12
  `;

  const cohortRows = await sql<CohortRow[]>`
    select
      c.case_number,
      c.barrier_label,
      c.resolved_at,
      count(ad.id) filter (
        where ad.school_date between
          ((c.resolved_at at time zone o.timezone)::date - 14)
          and ((c.resolved_at at time zone o.timezone)::date - 1)
      )::text as pre_days,
      coalesce(sum(
        case ad.status
          when 'present' then 1
          when 'partial' then 0.5
          else 0
        end
      ) filter (
        where ad.school_date between
          ((c.resolved_at at time zone o.timezone)::date - 14)
          and ((c.resolved_at at time zone o.timezone)::date - 1)
      ), 0)::text as pre_attended,
      count(ad.id) filter (
        where ad.school_date between
          ((c.resolved_at at time zone o.timezone)::date + 1)
          and ((c.resolved_at at time zone o.timezone)::date + 14)
      )::text as post_days,
      coalesce(sum(
        case ad.status
          when 'present' then 1
          when 'partial' then 0.5
          else 0
        end
      ) filter (
        where ad.school_date between
          ((c.resolved_at at time zone o.timezone)::date + 1)
          and ((c.resolved_at at time zone o.timezone)::date + 14)
      ), 0)::text as post_attended
    from cases c
    join organizations o on o.id = c.org_id
    left join attendance_daily ad
      on ad.org_id = c.org_id
      and ad.student_id = c.student_id
      and ad.school_date between
        ((c.resolved_at at time zone o.timezone)::date - 14)
        and ((c.resolved_at at time zone o.timezone)::date + 14)
    where c.org_id = ${orgId}
      and c.resolved_at is not null
      and c.resolved_at >= now() - interval '90 days'
    group by c.id, c.case_number, c.barrier_label, c.resolved_at, o.timezone
    order by c.resolved_at desc
    limit 200
  `;

  const cohorts = cohortRows.flatMap((row) => {
    const preDays = Number(row.pre_days);
    const postDays = Number(row.post_days);
    if (preDays < 3 || postDays < 3) return [];

    const preRate = Number(row.pre_attended) / preDays;
    const postRate = Number(row.post_attended) / postDays;
    const observedChange = postRate - preRate;

    return [{
      caseNumber: row.case_number,
      barrierLabel: row.barrier_label,
      resolvedAt: row.resolved_at.toISOString(),
      preDays,
      preRate,
      postDays,
      postRate,
      observedChange,
      observedAdditionalDays: observedChange * postDays,
    }];
  });

  const averageObservedAttendanceChange = cohorts.length
    ? cohorts.reduce((sum, row) => sum + row.observedChange, 0) / cohorts.length
    : null;

  const observedAdditionalAttendedDays = cohorts.reduce(
    (sum, row) => sum + row.observedAdditionalDays,
    0,
  );

  const commitmentsTotal = Number(summary?.commitments_total ?? 0);
  const commitmentsCompleted = Number(summary?.commitments_completed ?? 0);

  return {
    resolvedCases90d: Number(summary?.resolved_cases ?? 0),
    averageResolutionHours: summary?.average_resolution_hours === null
      || summary?.average_resolution_hours === undefined
      ? null
      : Number(summary.average_resolution_hours),
    commitmentCompletionRate: commitmentsTotal > 0
      ? commitmentsCompleted / commitmentsTotal
      : null,
    recoveredVirtualSessions30d: Number(summary?.virtual_recoveries ?? 0),
    evaluatedCases: cohorts.length,
    averageObservedAttendanceChange,
    observedAdditionalAttendedDays,
    barriers: barrierRows.map((row) => ({
      label: row.barrier_label,
      count: Number(row.count),
    })),
    cohorts,
  };
}
