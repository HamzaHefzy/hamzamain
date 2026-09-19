import { db } from "@/lib/db";

type CohortRow = {
  case_number: string;
  barrier_label: string;
  campus_name: string | null;
  resolved_at: Date;
  pre_days: string;
  pre_attended: string;
  post_days: string;
  post_attended: string;
};

export type EvidenceBreakdown = {
  label: string;
  opened: number;
  resolved: number;
  resolutionRate: number | null;
  averageResolutionHours: number | null;
  commitments: number;
  verifiedCommitments: number;
  verificationRate: number | null;
  overdueCommitments: number;
  evaluatedCases: number;
  averageObservedAttendanceChange: number | null;
};

export type EvidenceSnapshot = {
  resolvedCases90d: number;
  averageResolutionHours: number | null;
  averageFirstActionHours: number | null;
  commitmentsTotal90d: number;
  verifiedCommitments90d: number;
  commitmentCompletionRate: number | null;
  commitmentOnTimeRate: number | null;
  overdueCommitments: number;
  stuckOpenCases: number;
  openCasesPastDue: number;
  recoveredVirtualSessions30d: number;
  missedVirtualSessions30d: number;
  virtualRecoveryRate: number | null;
  evaluatedCases: number;
  averageObservedAttendanceChange: number | null;
  observedAdditionalAttendedDays: number;
  barriers: { label: string; count: number }[];
  barrierPerformance: EvidenceBreakdown[];
  campusPerformance: EvidenceBreakdown[];
  cohorts: {
    caseNumber: string;
    barrierLabel: string;
    campusName: string | null;
    resolvedAt: string;
    preDays: number;
    preRate: number;
    postDays: number;
    postRate: number;
    observedChange: number;
    observedAdditionalDays: number;
  }[];
};

function rate(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : null;
}

function nullableNumber(value: string | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getEvidenceSnapshot(orgId: string): Promise<EvidenceSnapshot> {
  const sql = db();

  const [summary] = await sql<{
    resolved_cases: string;
    average_resolution_hours: string | null;
    average_first_action_hours: string | null;
    commitments_total: string;
    commitments_completed: string;
    commitments_due: string;
    commitments_on_time: string;
    overdue_commitments: string;
    stuck_open_cases: string;
    open_cases_past_due: string;
    virtual_recoveries: string;
    virtual_misses: string;
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
        select avg(extract(epoch from (first_action_at - opened_at)) / 3600)::text
        from (
          select c.id, c.opened_at, min(ce.created_at) as first_action_at
          from cases c
          join case_events ce
            on ce.org_id = c.org_id
            and ce.case_id = c.id
            and ce.event_type <> 'case_created'
          where c.org_id = ${orgId}
            and c.opened_at >= now() - interval '90 days'
          group by c.id, c.opened_at
        ) first_actions
        where first_action_at >= opened_at
      ) as average_first_action_hours,
      (
        select count(cm.id)::text
        from commitments cm
        join cases c on c.id = cm.case_id and c.org_id = cm.org_id
        where cm.org_id = ${orgId}
          and c.opened_at >= now() - interval '90 days'
          and cm.status <> 'cancelled'
      ) as commitments_total,
      (
        select count(cm.id)::text
        from commitments cm
        join cases c on c.id = cm.case_id and c.org_id = cm.org_id
        where cm.org_id = ${orgId}
          and c.opened_at >= now() - interval '90 days'
          and cm.status = 'completed'
          and cm.verified_at is not null
      ) as commitments_completed,
      (
        select count(cm.id)::text
        from commitments cm
        join cases c on c.id = cm.case_id and c.org_id = cm.org_id
        where cm.org_id = ${orgId}
          and c.opened_at >= now() - interval '90 days'
          and cm.due_at is not null
          and cm.status <> 'cancelled'
      ) as commitments_due,
      (
        select count(cm.id)::text
        from commitments cm
        join cases c on c.id = cm.case_id and c.org_id = cm.org_id
        where cm.org_id = ${orgId}
          and c.opened_at >= now() - interval '90 days'
          and cm.due_at is not null
          and cm.status = 'completed'
          and cm.verified_at is not null
          and cm.verified_at <= cm.due_at
      ) as commitments_on_time,
      (
        select count(*)::text
        from commitments
        where org_id = ${orgId}
          and due_at < now()
          and status in ('pending','blocked')
      ) as overdue_commitments,
      (
        select count(*)::text
        from cases
        where org_id = ${orgId}
          and queue = 'stuck'
          and status not in ('resolved','closed')
      ) as stuck_open_cases,
      (
        select count(*)::text
        from cases
        where org_id = ${orgId}
          and due_at < now()
          and status not in ('resolved','closed')
      ) as open_cases_past_due,
      (
        select count(*)::text
        from session_participation
        where org_id = ${orgId}
          and status = 'recovered'
          and updated_at >= now() - interval '30 days'
      ) as virtual_recoveries,
      (
        select count(*)::text
        from session_participation
        where org_id = ${orgId}
          and status = 'missed'
          and updated_at >= now() - interval '30 days'
      ) as virtual_misses
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
      cp.name as campus_name,
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
    left join campuses cp on cp.id = c.campus_id and cp.org_id = c.org_id
    left join attendance_daily ad
      on ad.org_id = c.org_id
      and ad.student_id = c.student_id
      and ad.school_date between
        ((c.resolved_at at time zone o.timezone)::date - 14)
        and ((c.resolved_at at time zone o.timezone)::date + 14)
    where c.org_id = ${orgId}
      and c.resolved_at is not null
      and c.resolved_at >= now() - interval '90 days'
    group by c.id, c.case_number, c.barrier_label, cp.name, c.resolved_at, o.timezone
    order by c.resolved_at desc
    limit 500
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
      campusName: row.campus_name,
      resolvedAt: row.resolved_at.toISOString(),
      preDays,
      preRate,
      postDays,
      postRate,
      observedChange,
      observedAdditionalDays: observedChange * postDays,
    }];
  });

  const aggregateRows = await sql<{
    dimension: "barrier" | "campus";
    label: string;
    opened: string;
    resolved: string;
    average_resolution_hours: string | null;
    commitments: string;
    verified_commitments: string;
    overdue_commitments: string;
  }[]>`
    with case_base as (
      select c.id, c.org_id, c.barrier_label,
             coalesce(cp.name, 'Unassigned campus') as campus_label,
             c.opened_at, c.resolved_at
      from cases c
      left join campuses cp on cp.id = c.campus_id and cp.org_id = c.org_id
      where c.org_id = ${orgId}
        and c.opened_at >= now() - interval '90 days'
    ),
    expanded as (
      select 'barrier'::text as dimension, barrier_label as label, *
      from case_base
      union all
      select 'campus'::text as dimension, campus_label as label, *
      from case_base
    )
    select
      e.dimension,
      e.label,
      count(distinct e.id)::text as opened,
      count(distinct e.id) filter (where e.resolved_at is not null)::text as resolved,
      avg(extract(epoch from (e.resolved_at - e.opened_at)) / 3600)
        filter (where e.resolved_at is not null and e.resolved_at >= e.opened_at)::text
        as average_resolution_hours,
      count(cm.id) filter (where cm.status <> 'cancelled')::text as commitments,
      count(cm.id) filter (
        where cm.status = 'completed' and cm.verified_at is not null
      )::text as verified_commitments,
      count(cm.id) filter (
        where cm.due_at < now() and cm.status in ('pending','blocked')
      )::text as overdue_commitments
    from expanded e
    left join commitments cm
      on cm.org_id = e.org_id
      and cm.case_id = e.id
    group by e.dimension, e.label
    order by e.dimension, count(distinct e.id) desc, e.label
  `;

  const observedByBarrier = new Map<string, number[]>();
  const observedByCampus = new Map<string, number[]>();

  for (const row of cohorts) {
    const barrier = observedByBarrier.get(row.barrierLabel) ?? [];
    barrier.push(row.observedChange);
    observedByBarrier.set(row.barrierLabel, barrier);

    const campusLabel = row.campusName ?? "Unassigned campus";
    const campus = observedByCampus.get(campusLabel) ?? [];
    campus.push(row.observedChange);
    observedByCampus.set(campusLabel, campus);
  }

  const breakdown = (dimension: "barrier" | "campus") =>
    aggregateRows
      .filter((row) => row.dimension === dimension)
      .map((row): EvidenceBreakdown => {
        const opened = Number(row.opened);
        const resolved = Number(row.resolved);
        const commitments = Number(row.commitments);
        const verifiedCommitments = Number(row.verified_commitments);
        const observed = dimension === "barrier"
          ? observedByBarrier.get(row.label) ?? []
          : observedByCampus.get(row.label) ?? [];

        return {
          label: row.label,
          opened,
          resolved,
          resolutionRate: rate(resolved, opened),
          averageResolutionHours: nullableNumber(row.average_resolution_hours),
          commitments,
          verifiedCommitments,
          verificationRate: rate(verifiedCommitments, commitments),
          overdueCommitments: Number(row.overdue_commitments),
          evaluatedCases: observed.length,
          averageObservedAttendanceChange: observed.length
            ? observed.reduce((sum, value) => sum + value, 0) / observed.length
            : null,
        };
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
  const commitmentsDue = Number(summary?.commitments_due ?? 0);
  const commitmentsOnTime = Number(summary?.commitments_on_time ?? 0);
  const virtualRecoveries = Number(summary?.virtual_recoveries ?? 0);
  const virtualMisses = Number(summary?.virtual_misses ?? 0);

  return {
    resolvedCases90d: Number(summary?.resolved_cases ?? 0),
    averageResolutionHours: nullableNumber(summary?.average_resolution_hours),
    averageFirstActionHours: nullableNumber(summary?.average_first_action_hours),
    commitmentsTotal90d: commitmentsTotal,
    verifiedCommitments90d: commitmentsCompleted,
    commitmentCompletionRate: rate(commitmentsCompleted, commitmentsTotal),
    commitmentOnTimeRate: rate(commitmentsOnTime, commitmentsDue),
    overdueCommitments: Number(summary?.overdue_commitments ?? 0),
    stuckOpenCases: Number(summary?.stuck_open_cases ?? 0),
    openCasesPastDue: Number(summary?.open_cases_past_due ?? 0),
    recoveredVirtualSessions30d: virtualRecoveries,
    missedVirtualSessions30d: virtualMisses,
    virtualRecoveryRate: rate(virtualRecoveries, virtualRecoveries + virtualMisses),
    evaluatedCases: cohorts.length,
    averageObservedAttendanceChange,
    observedAdditionalAttendedDays,
    barriers: barrierRows.map((row) => ({
      label: row.barrier_label,
      count: Number(row.count),
    })),
    barrierPerformance: breakdown("barrier"),
    campusPerformance: breakdown("campus"),
    cohorts,
  };
}
