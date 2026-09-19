import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { createIntegrationApiKey } from "@/lib/api-key-token";
import { db } from "@/lib/db";
import { assertSameOrigin } from "@/lib/security";

const schema = z.object({
  name: z.string().min(2).max(120),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function GET() {
  const auth = await apiSession("admin");
  if (auth.response) return auth.response;
  const session = auth.session!;
  const sql = db();

  const rows = await sql<{
    id: string;
    name: string;
    key_prefix: string;
    scopes: string[];
    active: boolean;
    expires_at: Date | null;
    last_used_at: Date | null;
    created_at: Date;
    created_by_name: string | null;
  }[]>`
    select k.id, k.name, k.key_prefix, k.scopes, k.active,
           k.expires_at, k.last_used_at, k.created_at,
           u.name as created_by_name
    from api_keys k
    left join users u on u.id = k.created_by
    where k.org_id = ${session.orgId}
    order by k.active desc, k.created_at desc
  `;

  return NextResponse.json({
    apiKeys: rows.map((row) => ({
      id: row.id,
      name: row.name,
      prefix: row.key_prefix,
      scopes: row.scopes,
      active: row.active,
      expiresAt: row.expires_at?.toISOString() ?? null,
      lastUsedAt: row.last_used_at?.toISOString() ?? null,
      createdAt: row.created_at.toISOString(),
      createdBy: row.created_by_name,
    })),
  });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("admin");
    if (auth.response) return auth.response;
    const session = auth.session!;
    const input = schema.parse(await request.json());
    const sql = db();

    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    if (expiresAt && expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Expiration must be in the future." },
        { status: 400 },
      );
    }

    const created = createIntegrationApiKey();
    const [row] = await sql<{ id: string }[]>`
      insert into api_keys (
        org_id, name, key_prefix, key_hash, scopes,
        expires_at, created_by
      )
      values (
        ${session.orgId}, ${input.name}, ${created.prefix}, ${created.hash},
        ARRAY['virtual_evidence:write']::text[],
        ${expiresAt}, ${session.userId}
      )
      returning id
    `;

    await audit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "api_key.created",
      entityType: "api_key",
      entityId: row.id,
      metadata: {
        name: input.name,
        prefix: created.prefix,
        scopes: ["virtual_evidence:write"],
        expiresAt: expiresAt?.toISOString() ?? null,
      },
      request,
    });

    return NextResponse.json({
      id: row.id,
      token: created.token,
      prefix: created.prefix,
      scopes: ["virtual_evidence:write"],
      expiresAt: expiresAt?.toISOString() ?? null,
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create API key." },
      { status: 400 },
    );
  }
}
