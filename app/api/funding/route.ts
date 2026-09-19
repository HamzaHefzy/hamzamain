import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({
  schoolYear: z.string().min(4).max(20),
  modelType: z.enum(["texas_ada","enrollment","custom"]),
  basicAllotment: z.coerce.number().positive().nullable(),
  budgetedAttendanceRate: z.coerce.number().min(0).max(1).nullable(),
  annualAnchorCost: z.coerce.number().min(0).nullable(),
});

export async function GET() {
  const auth = await apiSession("finance");
  if (auth.response) return auth.response;
  const sql = db();
  const [row] = await sql`
    select * from funding_assumptions
    where org_id = ${auth.session!.orgId}
  `;
  return NextResponse.json({ assumptions: row ?? null });
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("finance");
    if (auth.response) return auth.response;
    const session = auth.session!;
    const input = schema.parse(await request.json());
    const sql = db();

    await sql`
      insert into funding_assumptions (
        org_id, school_year, model_type, basic_allotment, budgeted_attendance_rate,
        annual_anchor_cost
      )
      values (
        ${session.orgId}, ${input.schoolYear}, ${input.modelType},
        ${input.basicAllotment}, ${input.budgetedAttendanceRate}, ${input.annualAnchorCost}
      )
      on conflict (org_id) do update
        set school_year = excluded.school_year,
            model_type = excluded.model_type,
            basic_allotment = excluded.basic_allotment,
            budgeted_attendance_rate = excluded.budgeted_attendance_rate,
            annual_anchor_cost = excluded.annual_anchor_cost,
            updated_at = now()
    `;

    await audit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "funding_assumptions.updated",
      entityType: "organization",
      entityId: session.orgId,
      metadata: input,
      request,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update funding assumptions." },
      { status: 400 },
    );
  }
}
