import { parse } from "csv-parse/sync";
import { z } from "zod";
import { db } from "@/lib/db";
import { localDateString } from "@/lib/time";
import { evidenceQualifies, type VirtualPolicyConfig } from "@/lib/virtual-policy";

const schema = z.object({
  student_external_id: z.string().min(1),
  session_external_id: z.string().min(1),
  title: z.string().min(1),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  source: z.string().min(1),
  live_url: z.string().optional().default(""),
  required: z.string().optional().default("true"),
  participation_status: z.enum(["scheduled","joined","missed","recovered","excused"]).optional().default("scheduled"),
  joined_at: z.string().optional().default(""),
  left_at: z.string().optional().default(""),
  minutes: z.string().optional().default(""),
});

export async function importVirtualSessionsCsv(input: {
  orgId: string;
  userId: string;
  filename: string;
  csv: string;
}) {
  const sql = db();
  const rows = parse(input.csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[];

  const [org] = await sql<{ timezone: string }[]>`
    select timezone from organizations where id = ${input.orgId}
  `;
  if (!org) throw new Error("Organization not found.");

  const [importRow] = await sql<{ id: string }[]>`
    insert into imports (org_id, uploaded_by, kind, filename, rows_total)
    values (${input.orgId}, ${input.userId}, 'virtual_sessions', ${input.filename}, ${rows.length})
    returning id
  `;

  const [policy] = await sql<{ config: VirtualPolicyConfig }[]>`
    select config
    from attendance_policies
    where org_id = ${input.orgId}
      and active = true
      and delivery_model in ('virtual_program','hybrid')
      and effective_from <= current_date
      and (effective_to is null or effective_to >= current_date)
    order by version desc
    limit 1
  `;

  const errors: { row: number; message: string }[] = [];
  let succeeded = 0;

  for (let index = 0; index < rows.length; index += 1) {
    try {
      const item = schema.parse(rows[index]);
      const startsAt = new Date(item.starts_at);
      const endsAt = new Date(item.ends_at);
      if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
        throw new Error("Invalid session time range.");
      }

      const [student] = await sql<{ id: string; campus_id: string | null }[]>`
        select s.id, s.campus_id
        from students s
        join campuses c on c.id = s.campus_id
        where s.org_id = ${input.orgId}
          and s.external_id = ${item.student_external_id}
          and s.active = true
          and c.delivery_model in ('virtual_program','virtual_campus','hybrid')
        limit 1
      `;
      if (!student) throw new Error("Unknown virtual student_external_id.");

      const minutes = item.minutes ? Number(item.minutes) : null;
      if (minutes !== null && (!Number.isFinite(minutes) || minutes < 0)) {
        throw new Error("minutes must be a non-negative number.");
      }

      await sql.begin(async (tx) => {
        const [session] = await tx<{ id: string }[]>`
          insert into virtual_sessions (
            org_id, campus_id, external_id, title, starts_at, ends_at,
            required, live_url, source
          )
          values (
            ${input.orgId}, ${student.campus_id}, ${item.session_external_id},
            ${item.title}, ${startsAt}, ${endsAt},
            ${item.required.toLowerCase() !== "false"},
            ${item.live_url || null}, ${item.source}
          )
          on conflict (org_id, source, external_id) do update
            set title = excluded.title,
                starts_at = excluded.starts_at,
                ends_at = excluded.ends_at,
                required = excluded.required,
                live_url = excluded.live_url,
                updated_at = now()
          returning id
        `;

        await tx`
          insert into session_participation (
            org_id, session_id, student_id, status,
            joined_at, left_at, minutes, source
          )
          values (
            ${input.orgId}, ${session.id}, ${student.id},
            ${item.participation_status},
            ${item.joined_at ? new Date(item.joined_at) : null},
            ${item.left_at ? new Date(item.left_at) : null},
            ${minutes}, ${item.source}
          )
          on conflict (session_id, student_id) do update
            set status = excluded.status,
                joined_at = excluded.joined_at,
                left_at = excluded.left_at,
                minutes = excluded.minutes,
                source = excluded.source,
                updated_at = now()
        `;

        if ((item.participation_status === "joined" || item.participation_status === "recovered") && policy) {
          const qualifies = evidenceQualifies(policy.config, {
            evidenceType: "live_session",
            minutes,
          });
          const date = localDateString(startsAt, org.timezone);

          const [evidence] = await tx<{ id: string }[]>`
            insert into virtual_evidence_events (
              org_id, student_id, evidence_date, evidence_type,
              occurred_at, source, source_ref, minutes, qualifies
            )
            values (
              ${input.orgId}, ${student.id}, ${date}, 'live_session',
              ${item.joined_at ? new Date(item.joined_at) : startsAt},
              ${item.source}, ${item.source + ":" + item.session_external_id + ":" + item.student_external_id},
              ${minutes}, ${qualifies}
            )
            on conflict do nothing
            returning id
          `;

          if (qualifies) {
            await tx`
              insert into attendance_daily (
                org_id, student_id, school_date, status, minutes,
                source, evidence_refs, decision_reason, decided_by
              )
              values (
                ${input.orgId}, ${student.id}, ${date}, 'present',
                ${minutes}, 'virtual_policy',
                ${tx.json(evidence ? [evidence.id] : [])},
                'Required live-session participation satisfied the active virtual policy',
                ${input.userId}
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
                where attendance_daily.source = 'virtual_policy'
                   or attendance_daily.status = 'unresolved'
            `;
          }
        }
      });

      succeeded += 1;
    } catch (error) {
      errors.push({
        row: index + 2,
        message: error instanceof Error ? error.message : "Invalid session row.",
      });
    }
  }

  await sql`
    update imports
    set status = ${errors.length > 0 && succeeded === 0 ? "failed" : "completed"},
        rows_succeeded = ${succeeded},
        rows_failed = ${errors.length},
        error_report = ${sql.json(errors.slice(0, 250))},
        completed_at = now()
    where id = ${importRow.id}
  `;

  return {
    importId: importRow.id,
    rowsTotal: rows.length,
    rowsSucceeded: succeeded,
    rowsFailed: errors.length,
    errors,
  };
}
