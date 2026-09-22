import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, hasDatabase } from "@/lib/db";
import { SESSION_COOKIE, signSession, type OperatorRole } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { rateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, hashIp, requestIp } from "@/lib/security";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(256),
  organization: z.string().max(100).optional(),
});

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json(
      { error: "This Operator workspace is not connected to its database yet.", code: "database_unavailable" },
      { status: 503 },
    );
  }

  try {
    assertSameOrigin(request);
    const ipKey = hashIp(requestIp(request)) ?? "unknown";
    const limited = await rateLimit("login:" + ipKey, 12, 60);
    if (!limited.allowed) {
      return NextResponse.json({ error: "Too many login attempts. Try again shortly." }, { status: 429 });
    }

    const input = schema.parse(await request.json());
    const sql = db();

    const rows = await sql<{
      user_id: string;
      email: string;
      name: string;
      password_hash: string;
      role: OperatorRole;
      org_id: string;
      org_name: string;
      org_slug: string;
      email_verified_at: string | null;
    }[]>`
      select u.id as user_id, u.email, u.name, u.password_hash, u.email_verified_at,
             m.role, o.id as org_id, o.name as org_name, o.slug as org_slug
      from users u
      join memberships m on m.user_id = u.id
      join organizations o on o.id = m.org_id
      where lower(u.email) = lower(${input.email})
        and u.active = true
        and m.active = true
        and o.status in ('active','trial','past_due')
        and (${input.organization ?? null}::text is null or o.slug = ${input.organization ?? null})
      order by o.created_at
      limit 1
    `;

    const row = rows[0];
    if (!row || !(await bcrypt.compare(input.password, row.password_hash))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = await signSession({
      userId: row.user_id,
      orgId: row.org_id,
      email: row.email,
      name: row.name,
      role: row.role,
      orgName: row.org_name,
      orgSlug: row.org_slug,
      emailVerified: Boolean(row.email_verified_at),
    });

    await sql`update users set last_login_at = now() where id = ${row.user_id}`;
    await audit({
      orgId: row.org_id,
      actorUserId: row.user_id,
      action: "auth.login",
      entityType: "user",
      entityId: row.user_id,
      request,
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        name: row.name,
        email: row.email,
        role: row.role,
        emailVerified: Boolean(row.email_verified_at),
      },
      organization: { name: row.org_name, slug: row.org_slug },
    });

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Login failed." },
      { status: 400 },
    );
  }
}
