import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { assertSameOrigin } from "@/lib/security";
import type { AnchorRole } from "@/lib/auth";

type Context = { params: Promise<{ userId: string }> };

const schema = z.object({
  role: z.enum(["owner","admin","attendance","finance","support","viewer"]).optional(),
  active: z.boolean().optional(),
}).refine((value) => value.role !== undefined || value.active !== undefined, {
  message: "No membership change was supplied.",
});

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("admin");
    if (auth.response) return auth.response;
    const session = auth.session!;
    const { userId } = await context.params;
    const input = schema.parse(await request.json());
    const sql = db();

    const [current] = await sql<{
      role: AnchorRole;
      active: boolean;
      name: string;
      email: string;
    }[]>`
      select m.role, m.active, u.name, u.email
      from memberships m
      join users u on u.id = m.user_id
      where m.org_id = ${session.orgId}
        and m.user_id = ${userId}
      limit 1
    `;

    if (!current) {
      return NextResponse.json({ error: "Membership not found." }, { status: 404 });
    }

    if (userId === session.userId && (
      input.active === false
      || (input.role !== undefined && input.role !== current.role)
    )) {
      return NextResponse.json(
        { error: "You cannot revoke or change your own role from this screen." },
        { status: 400 },
      );
    }

    if ((current.role === "owner" || input.role === "owner") && session.role !== "owner") {
      return NextResponse.json(
        { error: "Only an owner can modify owner access." },
        { status: 403 },
      );
    }

    const nextRole = input.role ?? current.role;
    const nextActive = input.active ?? current.active;

    if (current.role === "owner" && (nextRole !== "owner" || !nextActive)) {
      const [owners] = await sql<{ count: string }[]>`
        select count(*)::text as count
        from memberships
        where org_id = ${session.orgId}
          and role = 'owner'
          and active = true
      `;

      if (Number(owners?.count ?? 0) <= 1) {
        return NextResponse.json(
          { error: "The organization must retain at least one active owner." },
          { status: 400 },
        );
      }
    }

    await sql`
      update memberships
      set role = ${nextRole},
          active = ${nextActive}
      where org_id = ${session.orgId}
        and user_id = ${userId}
    `;

    await audit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "team.membership_updated",
      entityType: "membership",
      entityId: userId,
      metadata: {
        email: current.email,
        previousRole: current.role,
        role: nextRole,
        previousActive: current.active,
        active: nextActive,
      },
      request,
    });

    return NextResponse.json({ ok: true, role: nextRole, active: nextActive });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update membership." },
      { status: 400 },
    );
  }
}
