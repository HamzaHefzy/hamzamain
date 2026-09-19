import { NextResponse } from "next/server";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";

type Context = { params: Promise<{ externalId: string }> };

export async function GET(request: Request, context: Context) {
  const auth = await apiSession("admin");
  if (auth.response) return auth.response;
  const session = auth.session!;
  const { externalId } = await context.params;
  const sql = db();

  const [student] = await sql<{
    id: string;
    external_id: string;
    first_name: string;
    last_name: string;
    grade: string | null;
    email: string | null;
    guardian_email: string | null;
    phone: string | null;
    guardian_phone: string | null;
    active: boolean;
    metadata: Record<string, unknown>;
    campus_name: string | null;
    campus_code: string | null;
    created_at: Date;
    updated_at: Date;
  }[]>`
    select s.id, s.external_id, s.first_name, s.last_name, s.grade,
           s.email, s.guardian_email, s.phone, s.guardian_phone,
           s.active, s.metadata, c.name as campus_name, c.code as campus_code,
           s.created_at, s.updated_at
    from students s
    left join campuses c on c.id = s.campus_id
    where s.org_id = ${session.orgId}
      and s.external_id = ${externalId}
    limit 1
  `;

  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const [
    attendanceDaily,
    attendanceEvents,
    virtualEvidence,
    virtualParticipation,
    cases,
    commitments,
    caseEvents,
    checkins,
    notifications,
  ] = await Promise.all([
    sql`
      select school_date, status, minutes, source, evidence_refs,
             decision_reason, decided_at, updated_at
      from attendance_daily
      where org_id = ${session.orgId} and student_id = ${student.id}
      order by school_date
    `,
    sql`
      select event_date, occurred_at, status, source, minutes,
             external_event_id, raw, created_at
      from attendance_events
      where org_id = ${session.orgId} and student_id = ${student.id}
      order by event_date, created_at
    `,
    sql`
      select evidence_date, evidence_type, occurred_at, source,
             source_ref, minutes, qualifies, metadata, created_at
      from virtual_evidence_events
      where org_id = ${session.orgId} and student_id = ${student.id}
      order by evidence_date, occurred_at
    `,
    sql`
      select vs.external_id as session_external_id, vs.title,
             vs.starts_at, vs.ends_at, sp.status, sp.joined_at,
             sp.left_at, sp.minutes, sp.source, sp.updated_at
      from session_participation sp
      join virtual_sessions vs on vs.id = sp.session_id
      where sp.org_id = ${session.orgId} and sp.student_id = ${student.id}
      order by vs.starts_at
    `,
    sql`
      select id, case_number, barrier_code, barrier_label, status, queue,
             priority, owner_user_id, next_action, due_at, opened_at,
             resolved_at, metadata, updated_at
      from cases
      where org_id = ${session.orgId} and student_id = ${student.id}
      order by opened_at
    `,
    sql`
      select cm.id, c.case_number, cm.description, cm.status,
             cm.due_at, cm.verified_at, cm.verification_note,
             cm.created_at, cm.updated_at
      from commitments cm
      join cases c on c.id = cm.case_id
      where cm.org_id = ${session.orgId}
        and c.student_id = ${student.id}
      order by cm.created_at
    `,
    sql`
      select c.case_number, ce.event_type, ce.note, ce.from_status,
             ce.to_status, ce.metadata, ce.created_at
      from case_events ce
      join cases c on c.id = ce.case_id
      where ce.org_id = ${session.orgId}
        and c.student_id = ${student.id}
      order by ce.created_at
    `,
    sql`
      select barrier_code, barrier_label, note, created_at
      from checkin_responses
      where org_id = ${session.orgId} and student_id = ${student.id}
      order by created_at
    `,
    sql`
      select channel, recipient, template_key, provider_message_id,
             status, error, created_at, sent_at
      from notifications
      where org_id = ${session.orgId} and student_id = ${student.id}
      order by created_at
    `,
  ]);

  await audit({
    orgId: session.orgId,
    actorUserId: session.userId,
    action: "student.exported",
    entityType: "student",
    entityId: student.id,
    metadata: { externalId: student.external_id },
    request,
  });

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    organization: {
      id: session.orgId,
      name: session.orgName,
      slug: session.orgSlug,
    },
    student: {
      externalId: student.external_id,
      firstName: student.first_name,
      lastName: student.last_name,
      grade: student.grade,
      email: student.email,
      guardianEmail: student.guardian_email,
      phone: student.phone,
      guardianPhone: student.guardian_phone,
      active: student.active,
      campusName: student.campus_name,
      campusCode: student.campus_code,
      metadata: student.metadata,
      createdAt: student.created_at,
      updatedAt: student.updated_at,
    },
    attendanceDaily,
    attendanceEvents,
    virtualEvidence,
    virtualParticipation,
    cases,
    commitments,
    caseEvents,
    checkins,
    notifications,
  };

  const safeId = student.external_id.replace(/[^A-Za-z0-9._-]/g, "_");

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="anchor-student-' + safeId + '.json"',
      "Cache-Control": "no-store",
    },
  });
}
