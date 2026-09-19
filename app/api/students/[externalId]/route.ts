import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { assertSameOrigin } from "@/lib/security";

type Context = { params: Promise<{ externalId: string }> };
const schema = z.object({ active: z.boolean() });

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("admin");
    if (auth.response) return auth.response;
    const session = auth.session!;
    const { externalId } = await context.params;
    const input = schema.parse(await request.json());
    const sql = db();

    const [student] = await sql<{ id: string; active: boolean }[]>`
      select id, active
      from students
      where org_id = ${session.orgId}
        and external_id = ${externalId}
      limit 1
    `;

    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    await sql`
      update students
      set active = ${input.active},
          updated_at = now()
      where id = ${student.id}
        and org_id = ${session.orgId}
    `;

    await audit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: input.active ? "student.reactivated" : "student.deactivated",
      entityType: "student",
      entityId: student.id,
      metadata: {
        externalId,
        previousActive: student.active,
        active: input.active,
      },
      request,
    });

    return NextResponse.json({ ok: true, active: input.active });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update student status." },
      { status: 400 },
    );
  }
}
