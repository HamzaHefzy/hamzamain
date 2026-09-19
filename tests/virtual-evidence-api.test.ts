import { afterAll, beforeAll, describe, expect, it } from "vitest";
import postgres from "postgres";
import { ingestVirtualEvidenceEvents } from "@/lib/virtual-evidence-api";

const run = Boolean(process.env.DATABASE_URL);
const source = "evidence-api-ci";
const dateAccepted = "2026-09-18";
const dateOfficial = "2026-09-17";
let sql: ReturnType<typeof postgres>;
let orgId = "";
let studentId = "";

describe.skipIf(!run)("inbound virtual evidence service", () => {
  beforeAll(async () => {
    sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });

    const [org] = await sql<{ id: string }[]>`
      select id from organizations
      where slug = ${process.env.SEED_ORG_SLUG ?? "anchor-ci"}
      limit 1
    `;
    if (!org) throw new Error("Seed organization not found.");
    orgId = org.id;

    const [student] = await sql<{ id: string }[]>`
      select id from students
      where org_id = ${orgId}
        and external_id = 'VIR-2002'
      limit 1
    `;
    if (!student) throw new Error("Seed virtual student not found.");
    studentId = student.id;

    await sql`
      delete from virtual_evidence_events
      where org_id = ${orgId}
        and source = ${source}
    `;
    await sql`
      delete from attendance_daily
      where org_id = ${orgId}
        and student_id = ${studentId}
        and school_date in (${dateAccepted}::date, ${dateOfficial}::date)
    `;
  });

  afterAll(async () => {
    if (!sql) return;
    await sql`
      delete from virtual_evidence_events
      where org_id = ${orgId}
        and source = ${source}
    `;
    await sql`
      delete from attendance_daily
      where org_id = ${orgId}
        and student_id = ${studentId}
        and school_date in (${dateAccepted}::date, ${dateOfficial}::date)
    `;
    await sql.end();
  });

  it("creates virtual-policy attendance from qualifying evidence", async () => {
    const result = await ingestVirtualEvidenceEvents(
      {
        orgId,
        apiKeyId: "00000000-0000-0000-0000-000000000001",
        apiKeyPrefix: "ank_live_test",
      },
      [{
        studentExternalId: "VIR-2002",
        date: dateAccepted,
        evidenceType: "lms_progress",
        occurredAt: "2026-09-18T14:00:00-05:00",
        source,
        sourceRef: "accepted-1",
        minutes: 12,
      }],
    );

    expect(result).toMatchObject({
      total: 1,
      accepted: 1,
      duplicates: 0,
      rejected: 0,
    });
    expect(result.results[0]).toMatchObject({
      status: "accepted",
      qualifies: true,
      attendanceDecision: "present",
    });

    const [daily] = await sql<{ status: string; source: string }[]>`
      select status, source
      from attendance_daily
      where org_id = ${orgId}
        and student_id = ${studentId}
        and school_date = ${dateAccepted}::date
    `;
    expect(daily).toEqual({ status: "present", source: "virtual_policy" });
  });

  it("treats an exact retry as a duplicate but rejects a conflicting retry", async () => {
    const exact = await ingestVirtualEvidenceEvents(
      {
        orgId,
        apiKeyId: "00000000-0000-0000-0000-000000000001",
        apiKeyPrefix: "ank_live_test",
      },
      [{
        studentExternalId: "VIR-2002",
        date: dateAccepted,
        evidenceType: "lms_progress",
        occurredAt: "2026-09-18T14:00:00-05:00",
        source,
        sourceRef: "accepted-1",
        minutes: 12,
      }],
    );
    expect(exact.results[0]).toMatchObject({
      status: "duplicate",
      qualifies: true,
      attendanceDecision: "present",
    });

    const conflict = await ingestVirtualEvidenceEvents(
      {
        orgId,
        apiKeyId: "00000000-0000-0000-0000-000000000001",
        apiKeyPrefix: "ank_live_test",
      },
      [{
        studentExternalId: "VIR-2002",
        date: dateAccepted,
        evidenceType: "lms_progress",
        occurredAt: "2026-09-18T14:00:00-05:00",
        source,
        sourceRef: "accepted-1",
        minutes: 30,
      }],
    );
    expect(conflict.results[0].status).toBe("rejected");
    expect(conflict.results[0].error).toMatch(/already assigned/i);
  });

  it("records qualifying evidence without overwriting official SIS attendance", async () => {
    await sql`
      insert into attendance_daily (
        org_id, student_id, school_date, status, source, decision_reason
      )
      values (
        ${orgId}, ${studentId}, ${dateOfficial}::date,
        'absent', 'sis-test', 'Official SIS attendance'
      )
    `;

    const result = await ingestVirtualEvidenceEvents(
      {
        orgId,
        apiKeyId: "00000000-0000-0000-0000-000000000001",
        apiKeyPrefix: "ank_live_test",
      },
      [{
        studentExternalId: "VIR-2002",
        date: dateOfficial,
        evidenceType: "teacher_interaction",
        occurredAt: "2026-09-17T13:00:00-05:00",
        source,
        sourceRef: "official-preserved-1",
        minutes: 10,
      }],
    );

    expect(result.results[0]).toMatchObject({
      status: "accepted",
      qualifies: true,
      attendanceDecision: "evidence_recorded",
    });

    const [daily] = await sql<{ status: string; source: string }[]>`
      select status, source
      from attendance_daily
      where org_id = ${orgId}
        and student_id = ${studentId}
        and school_date = ${dateOfficial}::date
    `;
    expect(daily).toEqual({ status: "absent", source: "sis-test" });
  });
});
