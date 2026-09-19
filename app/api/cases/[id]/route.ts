import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { updateCase } from "@/lib/case-service";
import { getCase } from "@/lib/data-access";
import { db } from "@/lib/db";
import { assertSameOrigin } from "@/lib/security";

type Context = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z.enum(["open","in_progress","waiting","resolved","closed"]).optional(),
  queue: z.enum(["do_now","stuck","check_outcome","resolved"]).optional(),
  priority: z.enum(["low","medium","high","urgent"]).optional(),
  ownerUserId: z.string().uuid().nullable().optional(),
  nextAction: z.string().max(1000).nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
});

async function resolveCaseId(orgId: string, value: string) {
  const sql = db();
  const [row] = await sql<{ id: string; case_number: string }[]>`
    select id, case_number
    from cases
    where org_id = ${orgId}
      and (id::text = ${value} or case_number = ${value})
    limit 1
  `;
  return row ?? null;
}

export async function GET(_request: Request, context: Context) {
  const auth = await apiSession("view");
  if (auth.response) return auth.response;
  const { id } = await context.params;
  const resolved = await resolveCaseId(auth.session!.orgId, id);
  if (!resolved) return NextResponse.json({ error: "Case not found." }, { status: 404 });
  const item = await getCase(auth.session!.orgId, resolved.case_number);
  return NextResponse.json({ case: item });
}

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("support_write");
    if (auth.response) return auth.response;
    const session = auth.session!;
    const { id } = await context.params;
    const resolved = await resolveCaseId(session.orgId, id);
    if (!resolved) return NextResponse.json({ error: "Case not found." }, { status: 404 });

    const patch = patchSchema.parse(await request.json());
    const updated = await updateCase({
      orgId: session.orgId,
      caseId: resolved.id,
      actorUserId: session.userId,
      patch,
    });

    await audit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "case.updated",
      entityType: "case",
      entityId: resolved.id,
      metadata: patch,
      request,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update case." },
      { status: 400 },
    );
  }
}
