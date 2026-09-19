import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { assertSameOrigin } from "@/lib/security";

type Context = { params: Promise<{ id: string }> };

const schema = z.object({
  name: z.string().min(2).max(160).optional(),
  deliveryModel: z.enum(["in_person","virtual_program","virtual_campus","hybrid"]).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("admin");
    if (auth.response) return auth.response;
    const session = auth.session!;
    const { id } = await context.params;
    const input = schema.parse(await request.json());
    const sql = db();

    const [current] = await sql<{
      id: string;
      name: string;
      delivery_model: string;
      active: boolean;
    }[]>`
      select id, name, delivery_model, active
      from campuses
      where id = ${id} and org_id = ${session.orgId}
      limit 1
    `;
    if (!current) return NextResponse.json({ error: "Campus not found." }, { status: 404 });

    await sql`
      update campuses
      set name = ${input.name ?? current.name},
          delivery_model = ${input.deliveryModel ?? current.delivery_model},
          active = ${input.active ?? current.active},
          updated_at = now()
      where id = ${id} and org_id = ${session.orgId}
    `;

    await audit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "campus.updated",
      entityType: "campus",
      entityId: id,
      metadata: input,
      request,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update campus." },
      { status: 400 },
    );
  }
}
