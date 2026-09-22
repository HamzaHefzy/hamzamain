import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, hasDatabase } from "@/lib/db";
import { SESSION_COOKIE, signSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { assertSameOrigin, hashIp, requestIp } from "@/lib/security";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(320),
  password: z.string().min(12).max(256),
  workspaceName: z.string().trim().min(2).max(120).optional(),
});

function slugBase(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42) || "workspace";
}

export async function POST(request: Request) {
  if (!hasDatabase()) {
    return NextResponse.json(
      { error: "Operator is not connected to its database yet.", code: "database_unavailable" },
      { status: 503 },
    );
  }

  try {
    assertSameOrigin(request);
    const ipKey = hashIp(requestIp(request)) ?? "unknown";
    const limited = await rateLimit("signup:" + ipKey, 6, 60);
    if (!limited.allowed) {
      return NextResponse.json({ error: "Too many signup attempts. Try again shortly." }, { status: 429 });
    }

    const input = schema.parse(await request.json());
    const sql = db();
    const normalizedEmail = input.email.toLowerCase();
    const [existing] = await sql<{ id: string }[]>\`
      select id from users where lower(email) = lower(\${normalizedEmail}) limit 1
    \`;
    if (existing) {
      return NextResponse.json({ error: "An account already exists for this email." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const workspaceName = input.workspaceName?.trim() || input.name + "'s Operator";
    const slug = slugBase(workspaceName) + "-" + crypto.randomUUID().slice(0, 6);

    const created = await sql.begin(async (tx) => {
      const [org] = await tx<{ id: string; name: string; slug: string }[]>\`
        insert into organizations (name, slug, organization_type, state, status)
        values (\${workspaceName}, \${slug}, 'other', 'NA', 'trial')
        returning id, name, slug
      \`;
      const [user] = await tx<{ id: string; email: string; name: string }[]>\`
        insert into users (email, name, password_hash, last_login_at)
        values (\${normalizedEmail}, \${input.name}, \${passwordHash}, now())
        returning id, email, name
      \`;
      await tx\`
        insert into memberships (user_id, org_id, role)
        values (\${user.id}, \${org.id}, 'owner')
      \`;
      await tx\`
        insert into operator_profiles (org_id, assistant_name, timezone)
        values (\${org.id}, 'Operator', 'America/New_York')
      \`;
      return { org, user };
    });

    const token = await signSession({
      userId: created.user.id,
      orgId: created.org.id,
      email: created.user.email,
      name: created.user.name,
      role: "owner",
      orgName: created.org.name,
      orgSlug: created.org.slug,
    });

    const response = NextResponse.json(
      { ok: true, workspace: { name: created.org.name, slug: created.org.slug } },
      { status: 201 },
    );
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
      { error: error instanceof Error ? error.message : "Signup failed." },
      { status: 400 },
    );
  }
}
