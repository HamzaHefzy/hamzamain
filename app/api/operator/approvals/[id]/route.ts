import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession, errorResponse } from "@/lib/api";
import { resolveOperatorApproval, runOperatorTask } from "@/lib/operator/service";

const schema = z.object({ decision: z.enum(["approved","rejected"]) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await apiSession("task_write");
  if (!auth.session) return auth.response;
  try {
    const { id } = await context.params;
    const { decision } = schema.parse(await request.json());
    const task = await resolveOperatorApproval({
      orgId: auth.session.orgId,
      userId: auth.session.userId,
      approvalId: id,
      decision,
    });
    const finalTask = decision === "approved" && task?.status === "ready"
      ? await runOperatorTask(auth.session.orgId, task.id)
      : task;
    return NextResponse.json({ task: finalTask });
  } catch (error) {
    return errorResponse(error, "Unable to resolve approval.");
  }
}
