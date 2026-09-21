import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { assertSameOrigin } from "@/lib/security";
import { startReturnPlan } from "@/lib/recovery-service";

type Context = { params: Promise<{ id: string }> };

const schema = z.object({
  targetEvents: z.coerce.number().int().min(3).max(20).optional(),
  requiredSuccesses: z.coerce.number().int().min(1).max(20).optional(),
  studentCommitment: z.string().max(1000).optional(),
  schoolCommitment: z.string().max(1000).optional(),
  nextEvent: z.string().max(500).optional(),
});

export async function POST(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("attendance_write");
    if (auth.response) return auth.response;
    const session = auth.session!;
    const { id } = await context.params;
    const input = schema.parse(await request.json());

    if (
      input.targetEvents !== undefined &&
      input.requiredSuccesses !== undefined &&
      input.requiredSuccesses > input.targetEvents
    ) {
      return NextResponse.json(
        { error: "Required successes cannot exceed target events." },
        { status: 400 },
      );
    }

    const plan = await startReturnPlan({
      orgId: session.orgId,
      episodeId: id,
      actorUserId: session.userId,
      targetEvents: input.targetEvents,
      requiredSuccesses: input.requiredSuccesses,
      plan: {
        studentCommitment: input.studentCommitment ?? null,
        schoolCommitment: input.schoolCommitment ?? null,
        nextEvent: input.nextEvent ?? null,
      },
    });

    await audit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "return_plan.started",
      entityType: "recovery_episode",
      entityId: id,
      metadata: input,
      request,
    });

    return NextResponse.json({ ok: true, plan }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to start return plan." },
      { status: 400 },
    );
  }
}
