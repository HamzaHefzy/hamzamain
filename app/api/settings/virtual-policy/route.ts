import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { assertSameOrigin } from "@/lib/security";

const evidenceTypes = [
  "lms_progress",
  "teacher_interaction",
  "assignment_submission",
  "live_session",
  "approved_offline_work",
  "other",
] as const;

const schema = z.object({
  name: z.string().min(2).max(160).default("Virtual participation policy"),
  qualifyingEvidence: z.array(z.enum(evidenceTypes)).min(1),
  minimumMinutes: z.coerce.number().int().min(0).max(1440).default(0),
  allowAnyQualifyingEvidence: z.boolean().default(true),
  dayCloseLocalTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).default("23:59"),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET() {
  const auth = await apiSession("view");
  if (auth.response) return auth.response;
  const sql = db();
  const [row] = await sql<{
    id: string;
    name: string;
    version: number;
    effective_from: string;
    config: Record<string, unknown>;
  }[]>`
    select id, name, version, effective_from::text, config
    from attendance_policies
    where org_id = ${auth.session!.orgId}
      and active = true
      and delivery_model = 'virtual_program'
    order by version desc
    limit 1
  `;
  return NextResponse.json({ policy: row ?? null });
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("admin");
    if (auth.response) return auth.response;
    const session = auth.session!;
    const input = schema.parse(await request.json());
    const sql = db();

    const created = await sql.begin(async (tx) => {
      const [versionRow] = await tx<{ next_version: number }[]>`
        select coalesce(max(version), 0)::int + 1 as next_version
        from attendance_policies
        where org_id = ${session.orgId}
          and delivery_model = 'virtual_program'
      `;

      await tx`
        update attendance_policies
        set active = false,
            effective_to = greatest(${input.effectiveFrom}::date - 1, effective_from)
        where org_id = ${session.orgId}
          and delivery_model = 'virtual_program'
          and active = true
      `;

      const [row] = await tx<{ id: string; version: number }[]>`
        insert into attendance_policies (
          org_id, name, delivery_model, version, effective_from, config, active
        )
        values (
          ${session.orgId}, ${input.name}, 'virtual_program',
          ${versionRow.next_version}, ${input.effectiveFrom},
          ${tx.json({
            qualifyingEvidence: input.qualifyingEvidence,
            minimumMinutes: input.minimumMinutes,
            allowAnyQualifyingEvidence: input.allowAnyQualifyingEvidence,
            dayCloseLocalTime: input.dayCloseLocalTime,
          })},
          true
        )
        returning id, version
      `;

      return row;
    });

    await audit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "virtual_policy.version_created",
      entityType: "attendance_policy",
      entityId: created.id,
      metadata: { version: created.version, ...input },
      request,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update virtual policy." },
      { status: 400 },
    );
  }
}
