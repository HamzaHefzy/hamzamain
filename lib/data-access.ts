import { db } from "@/lib/db";
import { localDateString } from "@/lib/time";
import type { AnchorRole } from "@/lib/auth";

export type DashboardCampus = {
  id: string;
  name: string;
  code: string;
  deliveryModel: string;
  enrollment: number;
  recordedDays: number;
  attendanceRate: number | null;
};

export type DashboardSnapshot = {
  org: { id: string; name: string; state: string };
  enrollment: number;
  attendanceRate: number | null;
  currentAda: number | null;
  basicAllotment: number | null;
  grossBaseFormulaValue: number | null;
  onePointAda: number;
  onePointGrossValue: number | null;
  schoolYear: string | null;
  budgetedAttendanceRate: number | null;
  annualAnchorCost: number | null;
  openCases: number;
  stuckCases: number;
  dueToday: number;
  campuses: DashboardCampus[];
};

function toNumber(value: unknown) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getDashboardSnapshot(orgId: string): Promise<DashboardSnapshot> {
  const sql = db();

  const [org] = await sql<{
    id: string;
    name: string;
    state: string;
    school_year: string | null;
    basic_allotment: string | null;
    budgeted_attendance_rate: string | null;
    annual_anchor_cost: string | null;
  }[]>`
    select o.id, o.name, o.state,
           f.school_year,
           f.basic_allotment,
           f.budgeted_attendance_rate,
           f.annual_anchor_cost
    from organizations o
    left join funding_assumptions f on f.org_id = o.id
    where o.id = ${orgId}
    limit 1
  `;

  if (!org) throw new Error("Organization not found.");

  const campusesRaw = await sql<{
    id: string;
    name: string;
    code: string;
    delivery_model: string;
    enrollment: string;
    recorded_days: string;
    present_equivalents: string | null;
  }[]>`
    select c.id, c.name, c.code, c.delivery_model,
           count(distinct s.id) filter (where s.active = true)::text as enrollment,
           count(ad.id)::text as recorded_days,
           coalesce(sum(
             case ad.status
               when 'present' then 1
               when 'partial' then 0.5
               when 'excused' then 0
               else 0
             end
           ), 0)::text as present_equivalents
    from campuses c
    left join students s
      on s.campus_id = c.id
      and s.org_id = c.org_id
      and s.active = true
    left join attendance_daily ad
      on ad.student_id = s.id
      and ad.org_id = c.org_id
      and ad.school_date >= current_date - interval '29 days'
    where c.org_id = ${orgId}
      and c.active = true
    group by c.id, c.name, c.code, c.delivery_model
    order by c.name
  `;

  const campuses = campusesRaw.map((row) => {
    const recorded = Number(row.recorded_days);
    const present = Number(row.present_equivalents ?? 0);
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      deliveryModel: row.delivery_model,
      enrollment: Number(row.enrollment),
      recordedDays: recorded,
      attendanceRate: recorded > 0 ? present / recorded : null,
    };
  });

  const enrollment = campuses.reduce((sum, campus) => sum + campus.enrollment, 0);
  const totalRecorded = campuses.reduce((sum, campus) => sum + campus.recordedDays, 0);
  const weightedPresent = campuses.reduce(
    (sum, campus) => sum + (campus.attendanceRate ?? 0) * campus.recordedDays,
    0,
  );
  const attendanceRate = totalRecorded > 0 ? weightedPresent / totalRecorded : null;
  const basicAllotment = toNumber(org.basic_allotment);
  const currentAda = attendanceRate === null ? null : enrollment * attendanceRate;
  const grossBaseFormulaValue =
    currentAda === null || basicAllotment === null ? null : currentAda * basicAllotment;
  const onePointAda = enrollment * 0.01;
  const onePointGrossValue =
    basicAllotment === null ? null : onePointAda * basicAllotment;

  const [caseStats] = await sql<{
    open_cases: string;
    stuck_cases: string;
    due_today: string;
  }[]>`
    select
      count(*) filter (where status not in ('resolved','closed'))::text as open_cases,
      count(*) filter (where queue = 'stuck' and status not in ('resolved','closed'))::text as stuck_cases,
      count(*) filter (
        where due_at::date <= current_date
          and status not in ('resolved','closed')
      )::text as due_today
    from cases
    where org_id = ${orgId}
  `;

  return {
    org: { id: org.id, name: org.name, state: org.state },
    enrollment,
    attendanceRate,
    currentAda,
    basicAllotment,
    grossBaseFormulaValue,
    onePointAda,
    onePointGrossValue,
    schoolYear: org.school_year,
    budgetedAttendanceRate: toNumber(org.budgeted_attendance_rate),
    annualAnchorCost: toNumber(org.annual_anchor_cost),
    openCases: Number(caseStats?.open_cases ?? 0),
    stuckCases: Number(caseStats?.stuck_cases ?? 0),
    dueToday: Number(caseStats?.due_today ?? 0),
    campuses,
  };
}

export type ResolutionCaseRow = {
  id: string;
  caseNumber: string;
  externalStudentId: string;
  studentName: string;
  grade: string | null;
  campusName: string | null;
  barrierCode: string;
  barrierLabel: string;
  status: string;
  queue: string;
  priority: string;
  ownerName: string | null;
  ownerUserId: string | null;
  nextAction: string | null;
  dueAt: string | null;
  openedAt: string;
  resolvedAt: string | null;
};

export async function getCases(orgId: string): Promise<ResolutionCaseRow[]> {
  const sql = db();
  const rows = await sql<{
    id: string;
    case_number: string;
    external_student_id: string;
    student_name: string;
    grade: string | null;
    campus_name: string | null;
    barrier_code: string;
    barrier_label: string;
    status: string;
    queue: string;
    priority: string;
    owner_name: string | null;
    owner_user_id: string | null;
    next_action: string | null;
    due_at: Date | null;
    opened_at: Date;
    resolved_at: Date | null;
  }[]>`
    select c.id, c.case_number,
           s.external_id as external_student_id,
           concat(s.first_name, ' ', s.last_name) as student_name,
           s.grade,
           cp.name as campus_name,
           c.barrier_code, c.barrier_label, c.status, c.queue, c.priority,
           u.name as owner_name, c.owner_user_id,
           c.next_action, c.due_at, c.opened_at, c.resolved_at
    from cases c
    join students s on s.id = c.student_id and s.org_id = c.org_id
    left join campuses cp on cp.id = c.campus_id
    left join users u on u.id = c.owner_user_id
    where c.org_id = ${orgId}
    order by
      case c.priority
        when 'urgent' then 1
        when 'high' then 2
        when 'medium' then 3
        else 4
      end,
      c.due_at nulls last,
      c.opened_at
  `;

  return rows.map((row) => ({
    id: row.id,
    caseNumber: row.case_number,
    externalStudentId: row.external_student_id,
    studentName: row.student_name,
    grade: row.grade,
    campusName: row.campus_name,
    barrierCode: row.barrier_code,
    barrierLabel: row.barrier_label,
    status: row.status,
    queue: row.queue,
    priority: row.priority,
    ownerName: row.owner_name,
    ownerUserId: row.owner_user_id,
    nextAction: row.next_action,
    dueAt: row.due_at?.toISOString() ?? null,
    openedAt: row.opened_at.toISOString(),
    resolvedAt: row.resolved_at?.toISOString() ?? null,
  }));
}

export async function getCase(orgId: string, caseNumber: string) {
  const sql = db();
  const rows = await sql<{
    id: string;
    case_number: string;
    student_id: string;
    external_student_id: string;
    student_name: string;
    grade: string | null;
    campus_name: string | null;
    barrier_code: string;
    barrier_label: string;
    status: string;
    queue: string;
    priority: string;
    owner_name: string | null;
    owner_user_id: string | null;
    next_action: string | null;
    due_at: Date | null;
    opened_at: Date;
    resolved_at: Date | null;
    recovery_episode_id: string | null;
    recovery_episode_number: string | null;
  }[]>`
    select c.id, c.case_number, c.student_id,
           s.external_id as external_student_id,
           concat(s.first_name, ' ', s.last_name) as student_name,
           s.grade, cp.name as campus_name,
           c.barrier_code, c.barrier_label, c.status, c.queue, c.priority,
           u.name as owner_name, c.owner_user_id,
           c.next_action, c.due_at, c.opened_at, c.resolved_at,
           c.recovery_episode_id, re.episode_number as recovery_episode_number
    from cases c
    join students s on s.id = c.student_id and s.org_id = c.org_id
    left join campuses cp on cp.id = c.campus_id
    left join users u on u.id = c.owner_user_id
    left join recovery_episodes re on re.org_id = c.org_id and re.id = c.recovery_episode_id
    where c.org_id = ${orgId} and c.case_number = ${caseNumber}
    limit 1
  `;
  const item = rows[0];
  if (!item) return null;

  const commitments = await sql<{
    id: string;
    description: string;
    status: string;
    due_at: Date | null;
    verified_at: Date | null;
    verification_note: string | null;
    owner_name: string | null;
    created_at: Date;
  }[]>`
    select cm.id, cm.description, cm.status, cm.due_at, cm.verified_at,
           cm.verification_note, u.name as owner_name, cm.created_at
    from commitments cm
    left join users u on u.id = cm.owner_user_id
    where cm.org_id = ${orgId} and cm.case_id = ${item.id}
    order by cm.created_at desc
  `;

  const events = await sql<{
    id: string;
    event_type: string;
    note: string | null;
    from_status: string | null;
    to_status: string | null;
    actor_name: string | null;
    created_at: Date;
  }[]>`
    select ce.id, ce.event_type, ce.note, ce.from_status, ce.to_status,
           u.name as actor_name, ce.created_at
    from case_events ce
    left join users u on u.id = ce.actor_user_id
    where ce.org_id = ${orgId} and ce.case_id = ${item.id}
    order by ce.created_at desc
    limit 100
  `;

  return {
    id: item.id,
    caseNumber: item.case_number,
    studentId: item.student_id,
    externalStudentId: item.external_student_id,
    studentName: item.student_name,
    grade: item.grade,
    campusName: item.campus_name,
    barrierCode: item.barrier_code,
    barrierLabel: item.barrier_label,
    status: item.status,
    queue: item.queue,
    priority: item.priority,
    ownerName: item.owner_name,
    ownerUserId: item.owner_user_id,
    nextAction: item.next_action,
    dueAt: item.due_at?.toISOString() ?? null,
    openedAt: item.opened_at.toISOString(),
    resolvedAt: item.resolved_at?.toISOString() ?? null,
    recoveryEpisodeId: item.recovery_episode_id,
    recoveryEpisodeNumber: item.recovery_episode_number,
    commitments: commitments.map((row) => ({
      ...row,
      due_at: row.due_at?.toISOString() ?? null,
      verified_at: row.verified_at?.toISOString() ?? null,
      created_at: row.created_at.toISOString(),
    })),
    events: events.map((row) => ({
      ...row,
      created_at: row.created_at.toISOString(),
    })),
  };
}

export async function getAttendanceOverview(orgId: string) {
  const sql = db();

  const daily = await sql<{
    school_date: string;
    total: string;
    present_equivalents: string;
    absences: string;
  }[]>`
    select school_date::text,
           count(*)::text as total,
           coalesce(sum(
             case status
               when 'present' then 1
               when 'partial' then 0.5
               when 'excused' then 0
               else 0
             end
           ), 0)::text as present_equivalents,
           count(*) filter (where status = 'absent')::text as absences
    from attendance_daily
    where org_id = ${orgId}
      and school_date >= current_date - interval '29 days'
    group by school_date
    order by school_date desc
  `;

  const imports = await sql<{
    id: string;
    kind: string;
    filename: string;
    status: string;
    rows_total: number;
    rows_succeeded: number;
    rows_failed: number;
    created_at: Date;
  }[]>`
    select id, kind, filename, status, rows_total, rows_succeeded,
           rows_failed, created_at
    from imports
    where org_id = ${orgId}
    order by created_at desc
    limit 15
  `;

  return {
    daily: daily.map((row) => {
      const total = Number(row.total);
      const present = Number(row.present_equivalents);
      return {
        date: row.school_date,
        total,
        absences: Number(row.absences),
        attendanceRate: total > 0 ? present / total : null,
      };
    }),
    imports: imports.map((row) => ({
      ...row,
      created_at: row.created_at.toISOString(),
    })),
  };
}

export async function getVirtualSnapshot(orgId: string) {
  const sql = db();
  const [org] = await sql<{ timezone: string }[]>`select timezone from organizations where id = ${orgId}`;
  if (!org) throw new Error("Organization not found.");
  const schoolDate = localDateString(new Date(), org.timezone);

  const [enrollment] = await sql<{ count: string }[]>`
    select count(s.id)::text as count
    from students s
    join campuses c on c.id = s.campus_id
    where s.org_id = ${orgId}
      and s.active = true
      and c.delivery_model in ('virtual_program','virtual_campus','hybrid')
  `;

  const [today] = await sql<{
    attendance_total: string;
    present_count: string;
    evidence_students: string;
  }[]>`
    select
      count(ad.id)::text as attendance_total,
      count(ad.id) filter (where ad.status in ('present','partial','excused'))::text as present_count,
      (
        select count(distinct vee.student_id)::text
        from virtual_evidence_events vee
        join students s2 on s2.id = vee.student_id
        join campuses c2 on c2.id = s2.campus_id
        where vee.org_id = ${orgId}
          and vee.evidence_date = ${schoolDate}::date
          and vee.qualifies = true
          and c2.delivery_model in ('virtual_program','virtual_campus','hybrid')
      ) as evidence_students
    from attendance_daily ad
    join students s on s.id = ad.student_id
    join campuses c on c.id = s.campus_id
    where ad.org_id = ${orgId}
      and ad.school_date = ${schoolDate}::date
      and c.delivery_model in ('virtual_program','virtual_campus','hybrid')
  `;

  const evidenceSources = await sql<{
    evidence_type: string;
    records: string;
    students: string;
  }[]>`
    select evidence_type,
           count(*)::text as records,
           count(distinct student_id)::text as students
    from virtual_evidence_events
    where org_id = ${orgId}
      and evidence_date = ${schoolDate}::date
      and qualifies = true
    group by evidence_type
    order by count(*) desc
  `;

  const virtualEnrollment = Number(enrollment?.count ?? 0);
  const attendanceTotal = Number(today?.attendance_total ?? 0);
  const presentCount = Number(today?.present_count ?? 0);
  const evidenceStudents = Number(today?.evidence_students ?? 0);

  return {
    enrollment: virtualEnrollment,
    attendanceRate: attendanceTotal > 0 ? presentCount / attendanceTotal : null,
    auditReadyRate: virtualEnrollment > 0 ? evidenceStudents / virtualEnrollment : null,
    evidenceExceptions: Math.max(virtualEnrollment - evidenceStudents, 0),
    evidenceSources: evidenceSources.map((row) => ({
      type: row.evidence_type,
      records: Number(row.records),
      students: Number(row.students),
    })),
  };
}

export async function getMembers(
  orgId: string,
  options: { includeInactive?: boolean } = {},
) {
  const sql = db();
  const rows = await sql<{
    id: string;
    name: string;
    email: string;
    role: AnchorRole;
    active: boolean;
  }[]>`
    select u.id, u.name, u.email, m.role, m.active
    from memberships m
    join users u on u.id = m.user_id
    where m.org_id = ${orgId}
      and u.active = true
      and (${Boolean(options.includeInactive)} or m.active = true)
    order by m.active desc, u.name
  `;
  return rows;
}
