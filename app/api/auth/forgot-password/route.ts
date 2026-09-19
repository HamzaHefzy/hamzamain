import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";
import { createOpaqueToken } from "@/lib/auth-tokens";
import { rateLimit } from "@/lib/rate-limit";
import { hashIp, requestIp } from "@/lib/security";

const schema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  try {
    const key = hashIp(requestIp(request)) ?? "unknown";
    const limited = await rateLimit("password-reset:" + key, 6, 3600);
    if (!limited.allowed) {
      return NextResponse.json({ ok: true });
    }

    const input = schema.parse(await request.json());
    const sql = db();

    const [user] = await sql<{
      id: string;
      email: string;
      org_id: string;
      org_name: string;
    }[]>`
      select u.id, u.email, m.org_id, o.name as org_name
      from users u
      join memberships m on m.user_id = u.id
      join organizations o on o.id = m.org_id
      where lower(u.email) = lower(${input.email})
        and u.active = true
        and o.status in ('active','trial')
      order by m.created_at
      limit 1
    `;

    if (!user) return NextResponse.json({ ok: true });

    const { token, hash } = createOpaqueToken();
    await sql`
      insert into password_reset_tokens (
        user_id, org_id, token_hash, expires_at
      )
      values (${user.id}, ${user.org_id}, ${hash}, now() + interval '1 hour')
    `;

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin).replace(/\/$/, "");
    const resetUrl = siteUrl + "/reset-password/" + token;

    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
      await sendNotification({
        orgId: user.org_id,
        channel: "email",
        recipient: user.email,
        templateKey: "password_reset",
        subject: "Reset your Anchor password",
        body: "Reset your Anchor password for " + user.org_name + ": " + resetUrl + ". This link expires in one hour.",
      });
    }

    return NextResponse.json({
      ok: true,
      ...(process.env.NODE_ENV !== "production" ? { resetUrl } : {}),
    });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
