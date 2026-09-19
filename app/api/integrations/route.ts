import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { encryptSecret } from "@/lib/crypto";
import { db } from "@/lib/db";
import { assertSameOrigin } from "@/lib/security";
import { toJson } from "@/lib/json";

const schema = z.object({
  provider: z.literal("oneroster"),
  name: z.string().min(2).max(120),
  publicConfig: z.record(z.unknown()).default({}),
  secrets: z.record(z.unknown()).optional(),
});

export async function GET() {
  const auth = await apiSession("admin");
  if (auth.response) return auth.response;
  const sql = db();
  const rows = await sql`
    select id, provider, name, status, public_config, last_sync_at, last_error, created_at
    from integrations
    where org_id = ${auth.session!.orgId}
    order by created_at desc
  `;
  return NextResponse.json({ integrations: rows });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("admin");
    if (auth.response) return auth.response;
    const session = auth.session!;
    const input = schema.parse(await request.json());
    const sql = db();

    const encrypted = input.secrets && Object.keys(input.secrets).length > 0
      ? encryptSecret(input.secrets)
      : null;

    const [row] = await sql<{ id: string }[]>`
      insert into integrations (
        org_id, provider, name, public_config, encrypted_config, status
      )
      values (
        ${session.orgId}, ${input.provider}, ${input.name},
        ${sql.json(toJson(input.publicConfig))}, ${encrypted}, 'configured'
      )
      on conflict (org_id, provider, name) do update
        set public_config = excluded.public_config,
            encrypted_config = coalesce(excluded.encrypted_config, integrations.encrypted_config),
            status = 'configured',
            updated_at = now()
      returning id
    `;

    await audit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "integration.configured",
      entityType: "integration",
      entityId: row.id,
      metadata: { provider: input.provider, name: input.name },
      request,
    });

    return NextResponse.json({ id: row.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to configure integration." },
      { status: 400 },
    );
  }
}
