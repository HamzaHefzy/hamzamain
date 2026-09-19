import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { addCommitment } from "@/lib/case-service";
import { db } from "@/lib/db";
import { assertSameOrigin } from "@/lib/security";

type Context = { params: Promise<{ id: string }> };

const schema = z.object({
  description: z.string().min(3).max(1200),
  ownerUserId: z.string().uuid().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
});

export async function POST(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("support_write");
    if (auth.response) return auth.response;
    const session = auth.session!;
    const { id } = await context.params;
    const input = schema.parse(await request.json());
    const sql = db();

    const [caseRow] = await sql<{ id: string }[]>\`
      select id from cases
      where org_id = \${session.orgId}
        and (id::text = \${id} or case_number = \${id})
      limit 1
    \`;
    if (!caseRow) return NextResponse.json({ error: "Case not found." }, { status: 404 });

    const commitment = await addCommitment({
      orgId: session.orgId,
      caseId: caseRow.id,
      actorUserId: session.userId,
      ownerUserId: input.ownerUserId,
      description: input.description,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
    });

    await audit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "commitment.created",
      entityType: "commitment",
      entityId: commitment.id,
      request,
    });

    return NextResponse.json(commitment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to add commitment." },
      { status: 400 },
    );
  }
}
