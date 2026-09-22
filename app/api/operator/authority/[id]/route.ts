import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession, errorResponse } from "@/lib/api";
import { db } from "@/lib/db";

const patchSchema = z.object({ enabled: z.boolean() });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await apiSession("admin");
  if (!auth.session) return auth.response;

  try {
    const { id } = await context.params;
    const { enabled } = patchSchema.parse(await request.json());
    const sql = db();
    const [rule] = await sql`
      update operator_authority_rules
      set enabled = ${enabled}, updated_at = now()
      where id = ${id} and org_id = ${auth.session.orgId}
      returning id, domain, action, enabled, policy, updated_at
    `;
    if (!rule) return NextResponse.json({ error: "Authority rule not found." }, { status: 404 });
    return NextResponse.json({ rule });
  } catch (error) {
    return errorResponse(error, "Unable to update authority rule.");
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await apiSession("admin");
  if (!auth.session) return auth.response;

  try {
    const { id } = await context.params;
    const sql = db();
    const result = await sql`
      delete from operator_authority_rules
      where id = ${id} and org_id = ${auth.session.orgId}
    `;
    if (result.count === 0) {
      return NextResponse.json({ error: "Authority rule not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Unable to delete authority rule.");
  }
}
