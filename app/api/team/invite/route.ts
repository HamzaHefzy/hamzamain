import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";
import { assertSameOrigin } from "@/lib/security";
import { createOpaqueToken } from "@/lib/auth-tokens";
import { canInviteRole } from "@/lib/permissions";

const schema = z.object({
  email: z.string().email(),
  role: z.enum(["owner","admin","attendance","finance","support","viewer"]),
});

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("admin");
    if (auth.response) return auth.response;
    const session = auth.session!;
    const input = schema.parse(await request.json());

    if (!canInviteRole(session.role, input.role)) {
      return NextResponse.json(
        { error: "You cannot invite a user with that role." },
        { status: 403 },
      );
    }

    const sql = db();

    const { token, hash } = createOpaqueToken();
    const [invite] = await sql<{ id: string }[]>`
      insert into invitations (
        org_id, email, role, token_hash, invited_by, expires_at
      )
      values (
        ${session.orgId}, ${input.email.toLowerCase()}, ${input.role},
        ${hash}, ${session.userId}, now() + interval '7 days'
      )
      returning id
    `;

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin).replace(/\/$/, "");
    const inviteUrl = siteUrl + "/invite/" + token;

    if (process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL) {
      await sendNotification({
        orgId: session.orgId,
        channel: "email",
        recipient: input.email,
        templateKey: "team_invite:" + invite.id,
        subject: "You’ve been invited to Anchor",
        body:
          session.name + " invited you to join " + session.orgName +
          " in Anchor as " + input.role + ". Accept your invitation: " + inviteUrl,
      });
    } else if (process.env.NODE_ENV === "production") {
      await sql`delete from invitations where id = ${invite.id}`;
      return NextResponse.json(
        { error: "Email delivery is not configured for production." },
        { status: 503 },
      );
    }

    await audit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "team.invited",
      entityType: "invitation",
      entityId: invite.id,
      metadata: { email: input.email.toLowerCase(), role: input.role },
      request,
    });

    return NextResponse.json({
      ok: true,
      id: invite.id,
      ...(process.env.NODE_ENV !== "production" ? { inviteUrl } : {}),
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to invite team member." },
      { status: 400 },
    );
  }
}
