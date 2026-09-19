import { NextResponse } from "next/server";
import { apiSession } from "@/lib/api";
import { audit } from "@/lib/audit";
import { runVirtualDayClose } from "@/lib/jobs";
import { runShowUpAutomation } from "@/lib/show-up-service";
import { assertSameOrigin } from "@/lib/security";

type Context = { params: Promise<{ job: string }> };

export async function POST(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const auth = await apiSession("attendance_write");
    if (auth.response) return auth.response;
    const session = auth.session!;
    const { job } = await context.params;

    let result: unknown;
    if (job === "show-up") {
      result = await runShowUpAutomation(session.orgId);
    } else if (job === "virtual-day-close") {
      result = await runVirtualDayClose(session.orgId, { force: true });
    } else {
      return NextResponse.json({ error: "Unknown operation." }, { status: 404 });
    }

    await audit({
      orgId: session.orgId,
      actorUserId: session.userId,
      action: "operation.ran",
      entityType: "job",
      entityId: job,
      metadata: { result },
      request,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Operation failed." },
      { status: 400 },
    );
  }
}
