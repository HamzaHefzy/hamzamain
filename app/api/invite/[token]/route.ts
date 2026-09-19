import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashOpaqueToken } from "@/lib/auth-tokens";
import { rateLimit } from "@/lib/rate-limit";
import { hashIp, requestIp } from "@/lib/security";

type Context = { params: Promise<{ token: string }> };
const schema = z.object({
  name: z.string().min(2).max(120),
  password: z.string().min(12).max(256),
});

export async function POST(request: Request, context: Context) {
  try {
    const key = hashIp(requestIp(request)) ?? "unknown";
    const limited = await rateLimit("invite-accept:" + key, 10, 3600);
    if (!limited.allowed) {
      return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
    }

    const { token } = await context.params;
    const input = schema.parse(await request.json());
    const passwordHash = await bcrypt.hash(input.password, 12);
    const sql = db();

    const result = await sql.begin(async (tx) => {
      const [invite] = await tx<{
        id: string;
        org_id: string;
        email: string;
        role: "owner" | "admin" | "attendance" | "finance" | "support" | "viewer";
        accepted_at: Date | null;
        expires_at: Date;
      }[]>`
        select id, org_id, email, role, accepted_at, expires_at
        from invitations
        where token_hash = ${hashOpaqueToken(token)}
        for update
      `;

      if (!invite || invite.expires_at < new Date()) {
        throw new Error("This invitation is invalid or expired.");
      }
      if (invite.accepted_at) {
        throw new Error("This invitation has already been accepted.");
      }

      const [existing] = await tx<{ id: string }[]>`
        select id from users where lower(email) = lower(${invite.email}) limit 1
      `;

      let userId: string;
      if (existing) {
        userId = existing.id;
        await tx`
          update users
          set active = true,
              name = case when length(name) = 0 then ${input.name} else name end,
              updated_at = now()
          where id = ${userId}
        `;
      } else {
        const [user] = await tx<{ id: string }[]>`
          insert into users (email, name, password_hash)
          values (${invite.email}, ${input.name}, ${passwordHash})
          returning id
        `;
        userId = user.id;
      }

      await tx`
        insert into memberships (user_id, org_id, role)
        values (${userId}, ${invite.org_id}, ${invite.role})
        on conflict (user_id, org_id) do update set role = excluded.role
      `;

      await tx`
        update invitations set accepted_at = now() where id = ${invite.id}
      `;

      return { email: invite.email, existingUser: Boolean(existing) };
    });

    return NextResponse.json({
      ok: true,
      email: result.email,
      existingUser: result.existingUser,
      message: result.existingUser
        ? "Invitation accepted. Sign in with your existing password."
        : "Invitation accepted. You can now sign in.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to accept invitation." },
      { status: 400 },
    );
  }
}
