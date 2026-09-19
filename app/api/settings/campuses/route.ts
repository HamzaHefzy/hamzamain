import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({
  name: z.string().min(2).max(160),
  code: z.string().min(1).max(80).regex(/^[A-Za-z0-9._-]+$/),
  deliveryModel: z.enum(["in_person","virtual_program","virtual_campus","hybrid"]),
});

export async function GET() {
  const auth = await apiSession("view");
  if (auth.response) return auth.response;
  const sql = db();
  const rows = await sql<{
    id: string;
    name: string;
    code: string;
    delivery_model: string;
    active: boolean;
  }[]>`
    select id, name, code, delivery_model, active
    from campuses
    where org_id = ${auth.session!.orgId}
    order by active desc, name
  `;
  return NextResponse.json({ campuses: rows });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("admin");
    if (auth.response) return auth.response;
    const session = auth.session!;
    const input = schema.parse(await request.json());
    const sql = db();

    const [row] = await sql<{ id: string }[]>`
      insert into campuses (org_id, name, code, delivery_model)
      values (${session.orgId}, ${input.name}, ${input.code}, ${input.deliveryModel})
      returning id
    `;

    await audit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "campus.created",
      entityType: "campus",
      entityId: row.id,
      metadata: input,
      request,
    });

    return NextResponse.json({ id: row.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create campus." },
      { status: 400 },
    );
  }
}
