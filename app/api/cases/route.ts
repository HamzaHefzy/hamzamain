import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { createCase } from "@/lib/case-service";
import { getCases } from "@/lib/data-access";
import { db } from "@/lib/db";
import { assertSameOrigin } from "@/lib/security";

const createSchema = z.object({
  studentExternalId: z.string().min(1),
  barrierCode: z.string().min(2).max(80),
  barrierLabel: z.string().min(2).max(160),
  priority: z.enum(["low","medium","high","urgent"]).default("medium"),
  ownerUserId: z.string().uuid().nullable().optional(),
  nextAction: z.string().max(1000).nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
});

export async function GET() {
  const auth = await apiSession("view");
  if (auth.response) return auth.response;
  const cases = await getCases(auth.session!.orgId);
  return NextResponse.json({ cases });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("support_write");
    if (auth.response) return auth.response;
    const session = auth.session!;
    const input = createSchema.parse(await request.json());
    const sql = db();

    const [student] = await sql<{ id: string; campus_id: string | null }[]>\`
      select id, campus_id from students
      where org_id = \${session.orgId}
        and external_id = \${input.studentExternalId}
        and active = true
      limit 1
    \`;
    if (!student) {
      return NextResponse.json({ error: "Student not found." }, { status: 404 });
    }

    const created = await createCase({
      orgId: session.orgId,
      studentId: student.id,
      campusId: student.campus_id,
      barrierCode: input.barrierCode,
      barrierLabel: input.barrierLabel,
      priority: input.priority,
      ownerUserId: input.ownerUserId,
      nextAction: input.nextAction,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      actorUserId: session.userId,
    });

    await audit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "case.created",
      entityType: "case",
      entityId: created.id,
      request,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create case." },
      { status: 400 },
    );
  }
}
