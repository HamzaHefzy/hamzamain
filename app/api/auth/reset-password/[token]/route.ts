import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashOpaqueToken } from "@/lib/auth-tokens";

type Context = { params: Promise<{ token: string }> };
const schema = z.object({ password: z.string().min(12).max(256) });

export async function POST(request: Request, context: Context) {
  try {
    const { token } = await context.params;
    const input = schema.parse(await request.json());
    const passwordHash = await bcrypt.hash(input.password, 12);
    const sql = db();

    await sql.begin(async (tx) => {
      const [row] = await tx<{
        id: string;
        user_id: string;
        expires_at: Date;
        used_at: Date | null;
      }[]>\`
        select id, user_id, expires_at, used_at
        from password_reset_tokens
        where token_hash = \${hashOpaqueToken(token)}
        for update
      \`;

      if (!row || row.expires_at < new Date() || row.used_at) {
        throw new Error("This reset link is invalid or expired.");
      }

      await tx\`
        update users
        set password_hash = \${passwordHash}, updated_at = now()
        where id = \${row.user_id}
      \`;
      await tx\`
        update password_reset_tokens set used_at = now() where id = \${row.id}
      \`;
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to reset password." },
      { status: 400 },
    );
  }
}
