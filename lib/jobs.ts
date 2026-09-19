import { db } from "@/lib/db";
import { createCase } from "@/lib/case-service";
import {
  adjudicateVirtualEvidence,
  type VirtualEvidenceType,
  type VirtualPolicyConfig,
} from "@/lib/virtual-policy";

export async function runVirtualDayClose(orgId: string) {
  const sql = db();
  const [job] = await sql<{ id: string }[]>`
    insert into job_runs (org_id, job_key, status)
    values (${orgId}, 'virtual_day_close', 'running')
    returning id
  `;

  let adjudicated = 0;
  let unresolved = 0;
  let casesCreated = 0;

  try {
    const [policy] = await sql<{ config: VirtualPolicyConfig }[]>`
      select config
      from attendance_policies
      where org_id = ${orgId}
        and active = true
        and delivery_model in ('virtual_program','hybrid')
        and effective_from <= current_date
        and (effective_to is null or effective_to >= current_date)
      order by version desc
      limit 1
    `;

    if (!policy) throw new Error("No active virtual attendance policy configured.");

    const students = await sql<{
      id: string;
      campus_id: string | null;
      external_id: string;
      first_name: string;
    }[]>`
      select s.id, s.campus_id, s.external_id, s.first_name
      from students s
      join campuses c on c.id = s.campus_id
      where s.org_id = ${orgId}
        and s.active = true
        and c.delivery_model in ('virtual_program','hybrid')
    `;

    for (const student of students) {
      const evidence = await sql<{
        id: string;
        evidence_type: VirtualEvidenceType;
        minutes: number | null;
      }[]>`
        select id, evidence_type, minutes
        from virtual_evidence_events
        where org_id = ${orgId}
          and student_id = ${student.id}
          and evidence_date = current_date
      `;

      const decision = adjudicateVirtualEvidence(
        policy.config,
        evidence.map((row) => ({
          id: row.id,
          evidenceType: row.evidence_type,
          minutes: row.minutes,
        })),
      );

      await sql`
        insert into attendance_daily (
          org_id, student_id, school_date, status, source,
          evidence_refs, decision_reason
        )
        values (
          ${orgId}, ${student.id}, current_date, ${decision.status},
          'virtual_policy', ${sql.json(decision.qualifyingIds)}, ${decision.reason}
        )
        on conflict (org_id, student_id, school_date) do update
          set status = excluded.status,
              source = excluded.source,
              evidence_refs = excluded.evidence_refs,
              decision_reason = excluded.decision_reason,
              decided_at = now(),
              updated_at = now()
      `;

      adjudicated += 1;

      if (decision.status === "unresolved") {
        unresolved += 1;

        const [existing] = await sql<{ id: string }[]>`
          select id
          from cases
          where org_id = ${orgId}
            and student_id = ${student.id}
            and barrier_code = 'virtual_nonparticipation'
            and status not in ('resolved','closed')
          limit 1
        `;

        if (!existing) {
          await createCase({
            orgId,
            studentId: student.id,
            campusId: student.campus_id,
            barrierCode: "virtual_nonparticipation",
            barrierLabel: "Virtual participation missing",
            priority: "high",
            nextAction: "Contact student or family, identify the barrier, and route an approved same-day participation path.",
            dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
            metadata: {
              source: "virtual_day_close",
              schoolDate: new Date().toISOString().slice(0, 10),
            },
          });
          casesCreated += 1;
        }
      }
    }

    const stats = { adjudicated, unresolved, casesCreated };
    await sql`
      update job_runs
      set status = 'completed', stats = ${sql.json(stats)}, completed_at = now()
      where id = ${job.id}
    `;
    return stats;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Virtual day-close failed.";
    await sql`
      update job_runs
      set status = 'failed', error = ${message}, completed_at = now()
      where id = ${job.id}
    `;
    throw error;
  }
}
