import { parse } from "csv-parse/sync";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  evidenceQualifies,
  type VirtualEvidenceType,
  type VirtualPolicyConfig,
} from "@/lib/virtual-policy";

type ImportKind = "students" | "attendance" | "virtual_evidence";

type ImportResult = {
  importId: string;
  rowsTotal: number;
  rowsSucceeded: number;
  rowsFailed: number;
  errors: { row: number; message: string }[];
};

function rowsFromCsv(csv: string) {
  return parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[];
}

async function startImport(
  orgId: string,
  userId: string,
  kind: ImportKind,
  filename: string,
  total: number,
) {
  const sql = db();
  const [row] = await sql<{ id: string }[]>\`
    insert into imports (org_id, uploaded_by, kind, filename, rows_total)
    values (\${orgId}, \${userId}, \${kind}, \${filename}, \${total})
    returning id
  \`;
  return row.id;
}

async function finishImport(
  importId: string,
  succeeded: number,
  failed: number,
  errors: { row: number; message: string }[],
) {
  const sql = db();
  await sql\`
    update imports
    set status = \${failed > 0 && succeeded === 0 ? "failed" : "completed"},
        rows_succeeded = \${succeeded},
        rows_failed = \${failed},
        error_report = \${sql.json(errors.slice(0, 250))},
        completed_at = now()
    where id = \${importId}
  \`;
}

const studentSchema = z.object({
  external_id: z.string().min(1),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  grade: z.string().optional().default(""),
  campus_code: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  guardian_email: z.string().email().optional().or(z.literal("")),
});

export async function importStudentsCsv(input: {
  orgId: string;
  userId: string;
  filename: string;
  csv: string;
}): Promise<ImportResult> {
  const sql = db();
  const rows = rowsFromCsv(input.csv);
  const importId = await startImport(input.orgId, input.userId, "students", input.filename, rows.length);
  const errors: { row: number; message: string }[] = [];
  let succeeded = 0;

  for (let index = 0; index < rows.length; index += 1) {
    try {
      const item = studentSchema.parse(rows[index]);
      const [campus] = await sql<{ id: string }[]>\`
        select id from campuses
        where org_id = \${input.orgId} and code = \${item.campus_code} and active = true
        limit 1
      \`;
      if (!campus) throw new Error("Unknown campus_code.");

      await sql\`
        insert into students (
          org_id, campus_id, external_id, first_name, last_name, grade,
          email, guardian_email
        )
        values (
          \${input.orgId}, \${campus.id}, \${item.external_id},
          \${item.first_name}, \${item.last_name}, \${item.grade || null},
          \${item.email || null}, \${item.guardian_email || null}
        )
        on conflict (org_id, external_id) do update
          set campus_id = excluded.campus_id,
              first_name = excluded.first_name,
              last_name = excluded.last_name,
              grade = excluded.grade,
              email = excluded.email,
              guardian_email = excluded.guardian_email,
              active = true,
              updated_at = now()
      \`;
      succeeded += 1;
    } catch (error) {
      errors.push({
        row: index + 2,
        message: error instanceof Error ? error.message : "Invalid student row.",
      });
    }
  }

  await finishImport(importId, succeeded, errors.length, errors);
  return {
    importId,
    rowsTotal: rows.length,
    rowsSucceeded: succeeded,
    rowsFailed: errors.length,
    errors,
  };
}

const attendanceSchema = z.object({
  student_external_id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["present", "absent", "excused", "partial", "unresolved"]),
  source: z.string().min(1),
  occurred_at: z.string().optional().default(""),
  minutes: z.string().optional().default(""),
  external_event_id: z.string().optional().default(""),
});

export async function importAttendanceCsv(input: {
  orgId: string;
  userId: string;
  filename: string;
  csv: string;
}): Promise<ImportResult> {
  const sql = db();
  const rows = rowsFromCsv(input.csv);
  const importId = await startImport(input.orgId, input.userId, "attendance", input.filename, rows.length);
  const errors: { row: number; message: string }[] = [];
  let succeeded = 0;

  for (let index = 0; index < rows.length; index += 1) {
    try {
      const item = attendanceSchema.parse(rows[index]);
      const [student] = await sql<{ id: string }[]>\`
        select id from students
        where org_id = \${input.orgId} and external_id = \${item.student_external_id}
        limit 1
      \`;
      if (!student) throw new Error("Unknown student_external_id.");

      const minutes = item.minutes ? Number(item.minutes) : null;
      if (minutes !== null && (!Number.isFinite(minutes) || minutes < 0)) {
        throw new Error("minutes must be a non-negative number.");
      }

      await sql.begin(async (tx) => {
        await tx\`
          insert into attendance_events (
            org_id, student_id, event_date, occurred_at, status,
            source, minutes, external_event_id
          )
          values (
            \${input.orgId}, \${student.id}, \${item.date},
            \${item.occurred_at ? new Date(item.occurred_at) : null},
            \${item.status}, \${item.source}, \${minutes},
            \${item.external_event_id || null}
          )
          on conflict do nothing
        \`;

        await tx\`
          insert into attendance_daily (
            org_id, student_id, school_date, status, minutes,
            source, decision_reason, decided_by
          )
          values (
            \${input.orgId}, \${student.id}, \${item.date}, \${item.status},
            \${minutes}, \${item.source}, 'Imported official attendance record',
            \${input.userId}
          )
          on conflict (org_id, student_id, school_date) do update
            set status = excluded.status,
                minutes = excluded.minutes,
                source = excluded.source,
                decision_reason = excluded.decision_reason,
                decided_by = excluded.decided_by,
                decided_at = now(),
                updated_at = now()
        \`;
      });

      succeeded += 1;
    } catch (error) {
      errors.push({
        row: index + 2,
        message: error instanceof Error ? error.message : "Invalid attendance row.",
      });
    }
  }

  await finishImport(importId, succeeded, errors.length, errors);
  return {
    importId,
    rowsTotal: rows.length,
    rowsSucceeded: succeeded,
    rowsFailed: errors.length,
    errors,
  };
}

const evidenceTypes = [
  "lms_progress",
  "teacher_interaction",
  "assignment_submission",
  "live_session",
  "approved_offline_work",
  "other",
] as const;

const evidenceSchema = z.object({
  student_external_id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  evidence_type: z.enum(evidenceTypes),
  occurred_at: z.string().min(1),
  source: z.string().min(1),
  source_ref: z.string().optional().default(""),
  minutes: z.string().optional().default(""),
});

export async function importVirtualEvidenceCsv(input: {
  orgId: string;
  userId: string;
  filename: string;
  csv: string;
}): Promise<ImportResult> {
  const sql = db();
  const rows = rowsFromCsv(input.csv);
  const importId = await startImport(input.orgId, input.userId, "virtual_evidence", input.filename, rows.length);
  const errors: { row: number; message: string }[] = [];
  let succeeded = 0;

  const [policyRow] = await sql<{ config: VirtualPolicyConfig }[]>\`
    select config
    from attendance_policies
    where org_id = \${input.orgId}
      and active = true
      and delivery_model in ('virtual_program','hybrid')
      and effective_from <= current_date
      and (effective_to is null or effective_to >= current_date)
    order by version desc
    limit 1
  \`;

  if (!policyRow) {
    await finishImport(importId, 0, rows.length, [
      { row: 1, message: "No active virtual attendance policy is configured." },
    ]);
    return {
      importId,
      rowsTotal: rows.length,
      rowsSucceeded: 0,
      rowsFailed: rows.length,
      errors: [{ row: 1, message: "No active virtual attendance policy is configured." }],
    };
  }

  for (let index = 0; index < rows.length; index += 1) {
    try {
      const item = evidenceSchema.parse(rows[index]);
      const [student] = await sql<{ id: string }[]>\`
        select s.id
        from students s
        join campuses c on c.id = s.campus_id
        where s.org_id = \${input.orgId}
          and s.external_id = \${item.student_external_id}
          and c.delivery_model in ('virtual_program','virtual_campus','hybrid')
        limit 1
      \`;
      if (!student) throw new Error("Unknown virtual student_external_id.");

      const minutes = item.minutes ? Number(item.minutes) : null;
      if (minutes !== null && (!Number.isFinite(minutes) || minutes < 0)) {
        throw new Error("minutes must be a non-negative number.");
      }

      const qualifies = evidenceQualifies(policyRow.config, {
        evidenceType: item.evidence_type as VirtualEvidenceType,
        minutes,
      });

      await sql.begin(async (tx) => {
        const [evidence] = await tx<{ id: string }[]>\`
          insert into virtual_evidence_events (
            org_id, student_id, evidence_date, evidence_type,
            occurred_at, source, source_ref, minutes, qualifies
          )
          values (
            \${input.orgId}, \${student.id}, \${item.date},
            \${item.evidence_type}, \${new Date(item.occurred_at)},
            \${item.source}, \${item.source_ref || null}, \${minutes}, \${qualifies}
          )
          on conflict do nothing
          returning id
        \`;

        if (qualifies) {
          const evidenceRef = evidence?.id ?? item.source_ref;
          await tx\`
            insert into attendance_daily (
              org_id, student_id, school_date, status, minutes, source,
              evidence_refs, decision_reason, decided_by
            )
            values (
              \${input.orgId}, \${student.id}, \${item.date}, 'present',
              \${minutes}, 'virtual_policy',
              \${tx.json(evidenceRef ? [evidenceRef] : [])},
              'Approved virtual participation evidence satisfied the active policy',
              \${input.userId}
            )
            on conflict (org_id, student_id, school_date) do update
              set status = 'present',
                  minutes = greatest(coalesce(attendance_daily.minutes, 0), coalesce(excluded.minutes, 0)),
                  source = 'virtual_policy',
                  evidence_refs = attendance_daily.evidence_refs || excluded.evidence_refs,
                  decision_reason = excluded.decision_reason,
                  decided_by = excluded.decided_by,
                  decided_at = now(),
                  updated_at = now()
          \`;
        }
      });

      succeeded += 1;
    } catch (error) {
      errors.push({
        row: index + 2,
        message: error instanceof Error ? error.message : "Invalid evidence row.",
      });
    }
  }

  await finishImport(importId, succeeded, errors.length, errors);
  return {
    importId,
    rowsTotal: rows.length,
    rowsSucceeded: succeeded,
    rowsFailed: errors.length,
    errors,
  };
}
