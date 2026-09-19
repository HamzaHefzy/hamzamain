import { NextResponse } from "next/server";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { assertSameOrigin } from "@/lib/security";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("admin");
    if (auth.response) return auth.response;
    const session = auth.session!;
    const { id } = await context.params;
    const sql = db();

    const [row] = await sql<{
      id: string;
      name: string;
      key_prefix: string;
      active: boolean;
    }[]>`
      update api_keys
      set active = false,
          updated_at = now()
      where id = ${id}
        and org_id = ${session.orgId}
      returning id, name, key_prefix, active
    `;

    if (!row) {
      return NextResponse.json({ error: "API key not found." }, { status: 404 });
    }

    await audit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "api_key.revoked",
      entityType: "api_key",
      entityId: row.id,
      metadata: {
        name: row.name,
        prefix: row.key_prefix,
      },
      request,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to revoke API key." },
      { status: 400 },
    );
  }
}
