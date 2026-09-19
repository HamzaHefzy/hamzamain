import { db } from "@/lib/db";
import { toJson } from "@/lib/json";
import {
  evidenceQualifies,
  type VirtualEvidenceType,
  type VirtualPolicyConfig,
} from "@/lib/virtual-policy";

export type InboundEvidenceEvent = {
  studentExternalId: string;
  date: string;
  evidenceType: VirtualEvidenceType;
  occurredAt: string;
  source: string;
  sourceRef: string;
  minutes: number | null;
  metadata?: Record<string, unknown>;
};

export type InboundEvidenceContext = {
  orgId: string;
  apiKeyId: string;
  apiKeyPrefix: string;
};

export type InboundEvidenceResult = {
  index: number;
  sourceRef: string;
  status: "accepted" | "duplicate" | "rejected";
  qualifies?: boolean;
  attendanceDecision?: "present" | "evidence_recorded";
  evidenceId?: string;
  error?: string;
};

export async function ingestVirtualEvidenceEvents(
  context: InboundEvidenceContext,
  events: InboundEvidenceEvent[],
) {
  const sql = db();
  const results: InboundEvidenceResult[] = [];

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];

    try {
      const occurredAt = new Date(event.occurredAt);
      if (Number.isNaN(occurredAt.getTime())) {
        throw new Error("occurredAt must be a valid ISO timestamp.");
      }
      if (occurredAt.getTime() > Date.now() + 15 * 60 * 1000) {
        throw new Error("occurredAt cannot be more than 15 minutes in the future.");
      }

      const [student] = await sql<{
        id: string;
        delivery_model: string;
      }[]>`
        select s.id, c.delivery_model
        from students s
        join campuses c
          on c.id = s.campus_id
         and c.org_id = s.org_id
        where s.org_id = ${context.orgId}
          and s.external_id = ${event.studentExternalId}
          and s.active = true
          and c.active = true
          and c.delivery_model in ('virtual_program','virtual_campus','hybrid')
        limit 1
      `;

      if (!student) {
        throw new Error("Student is not an active virtual/hybrid roster member.");
      }

      const [policy] = await sql<{ config: VirtualPolicyConfig }[]>`
        select config
        from attendance_policies
        where org_id = ${context.orgId}
          and active = true
          and delivery_model in ('virtual_program','virtual_campus','hybrid')
          and effective_from <= ${event.date}::date
          and (effective_to is null or effective_to >= ${event.date}::date)
        order by version desc
        limit 1
      `;

      if (!policy) {
        throw new Error("No active virtual attendance policy covers this evidence date.");
      }

      const qualifies = evidenceQualifies(policy.config, {
        evidenceType: event.evidenceType,
        minutes: event.minutes,
      });

      const outcome = await sql.begin(async (tx) => {
        const [inserted] = await tx<{ id: string }[]>`
          insert into virtual_evidence_events (
            org_id, student_id, evidence_date, evidence_type,
            occurred_at, source, source_ref, minutes, qualifies, metadata
          )
          values (
            ${context.orgId}, ${student.id}, ${event.date}::date,
            ${event.evidenceType}, ${occurredAt}, ${event.source},
            ${event.sourceRef}, ${event.minutes}, ${qualifies},
            ${tx.json(toJson({
              ...(event.metadata ?? {}),
              ingestion: "evidence_api",
              apiKeyId: context.apiKeyId,
              apiKeyPrefix: context.apiKeyPrefix,
            }))}
          )
          on conflict do nothing
          returning id
        `;

        if (!inserted) {
          const [existing] = await tx<{
            id: string;
            student_id: string;
            evidence_date: string;
            evidence_type: string;
          }[]>`
            select id, student_id, evidence_date::text, evidence_type
            from virtual_evidence_events
            where org_id = ${context.orgId}
              and source = ${event.source}
              and source_ref = ${event.sourceRef}
            limit 1
          `;

          if (
            !existing
            || existing.student_id !== student.id
            || existing.evidence_date !== event.date
            || existing.evidence_type !== event.evidenceType
          ) {
            throw new Error("sourceRef is already assigned to a different evidence event.");
          }

          return {
            status: "duplicate" as const,
            id: existing.id,
            qualifies,
            attendanceDecision: qualifies
              ? "present" as const
              : "evidence_recorded" as const,
          };
        }

        if (qualifies) {
          await tx`
            insert into attendance_daily (
              org_id, student_id, school_date, status, minutes,
              source, evidence_refs, decision_reason
            )
            values (
              ${context.orgId}, ${student.id}, ${event.date}::date,
              'present', ${event.minutes}, 'virtual_policy',
              ${tx.json([inserted.id])},
              'Approved inbound virtual participation evidence satisfied the active policy'
            )
            on conflict (org_id, student_id, school_date) do update
              set status = 'present',
                  minutes = greatest(
                    coalesce(attendance_daily.minutes, 0),
                    coalesce(excluded.minutes, 0)
                  ),
                  source = 'virtual_policy',
                  evidence_refs = attendance_daily.evidence_refs || excluded.evidence_refs,
                  decision_reason = excluded.decision_reason,
                  decided_at = now(),
                  updated_at = now()
              where attendance_daily.source = 'virtual_policy'
                 or attendance_daily.status = 'unresolved'
          `;
        }

        return {
          status: "accepted" as const,
          id: inserted.id,
          qualifies,
          attendanceDecision: qualifies
            ? "present" as const
            : "evidence_recorded" as const,
        };
      });

      results.push({
        index,
        sourceRef: event.sourceRef,
        status: outcome.status,
        qualifies: outcome.qualifies,
        attendanceDecision: outcome.attendanceDecision,
        evidenceId: outcome.id,
      });
    } catch (error) {
      results.push({
        index,
        sourceRef: event.sourceRef,
        status: "rejected",
        error: error instanceof Error ? error.message : "Evidence event rejected.",
      });
    }
  }

  return {
    total: events.length,
    accepted: results.filter((result) => result.status === "accepted").length,
    duplicates: results.filter((result) => result.status === "duplicate").length,
    rejected: results.filter((result) => result.status === "rejected").length,
    results,
  };
}
