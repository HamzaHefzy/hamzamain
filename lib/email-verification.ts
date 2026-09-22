import { db } from "@/lib/db";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/auth-tokens";
import { sendEmail } from "@/lib/email";

export function emailVerificationConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function issueEmailVerification(input: {
  userId: string;
  orgId: string;
  email: string;
}) {
  if (!emailVerificationConfigured()) {
    throw new Error("Email verification delivery is not configured.");
  }

  const sql = db();
  const { token, hash } = createOpaqueToken();

  await sql.begin(async (tx) => {
    await tx`
      update email_verification_tokens
      set used_at = now()
      where user_id = ${input.userId}
        and org_id = ${input.orgId}
        and used_at is null
    `;
    await tx`
      insert into email_verification_tokens (
        user_id, org_id, token_hash, expires_at
      )
      values (
        ${input.userId}, ${input.orgId}, ${hash}, now() + interval '24 hours'
      )
    `;
  });

  const verificationUrl = siteUrl() + "/verify-email/" + token;
  await sendEmail({
    to: input.email,
    subject: "Verify your Yumna email",
    body:
      "Verify your email to unlock Yumna execution and workspace changes:\n\n" +
      verificationUrl +
      "\n\nThis link expires in 24 hours.",
  });

  return {
    verificationUrl:
      process.env.NODE_ENV === "production" ? null : verificationUrl,
  };
}

export async function verifyEmailToken(token: string) {
  const tokenHash = hashOpaqueToken(token);
  const sql = db();

  return sql.begin(async (tx) => {
    const [record] = await tx<{ user_id: string; org_id: string }[]>`
      select user_id, org_id
      from email_verification_tokens
      where token_hash = ${tokenHash}
        and used_at is null
        and expires_at > now()
      limit 1
      for update
    `;
    if (!record) return { ok: false as const, reason: "invalid_or_expired" as const };

    await tx`
      update email_verification_tokens
      set used_at = now()
      where token_hash = ${tokenHash}
    `;
    await tx`
      update users
      set email_verified_at = coalesce(email_verified_at, now()),
          updated_at = now()
      where id = ${record.user_id}
    `;
    await tx`
      update email_verification_tokens
      set used_at = coalesce(used_at, now())
      where user_id = ${record.user_id}
        and org_id = ${record.org_id}
        and used_at is null
    `;

    return { ok: true as const, userId: record.user_id, orgId: record.org_id };
  });
}
