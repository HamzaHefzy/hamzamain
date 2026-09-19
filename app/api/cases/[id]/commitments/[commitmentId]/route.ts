import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { verifyCommitment } from "@/lib/case-service";
import { db } from "@/lib/db";
import { assertSameOrigin } from "@/lib/security";

type Context = { params: Promise<{ id: string; commitmentId: string }> };
const schema = z.object({ verificationNote: z.string().min(2).max(2000) });

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("support_write");
    if (auth.response) return auth.response;
    const session = auth.session!;
    const { id, commitmentId } = await context.params;
    const input = schema.parse(await request.json());
    const sql = db();

    const [caseRow] = await sql<{ id: string }[]>`
      select id from cases
      where org_id = ${session.orgId}
        and (id::text = ${id} or case_number = ${id})
      limit 1
    `;
    if (!caseRow) return NextResponse.json({ error: "Case not found." }, { status: 404 });

    await verifyCommitment({
      orgId: session.orgId,
      caseId: caseRow.id,
      commitmentId,
      actorUserId: session.userId,
      verificationNote: input.verificationNote,
    });

    await audit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "commitment.verified",
      entityType: "commitment",
      entityId: commitmentId,
      request,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to verify commitment." },
      { status: 400 },
    );
  }
}
