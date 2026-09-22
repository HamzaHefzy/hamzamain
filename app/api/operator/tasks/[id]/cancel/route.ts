import { NextResponse } from "next/server";
import { apiSession, errorResponse } from "@/lib/api";
import { cancelOperatorTask } from "@/lib/operator/cancellation";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await apiSession("task_write");
  if (!auth.session) return auth.response;

  try {
    const { id } = await context.params;
    const task = await cancelOperatorTask({
      orgId: auth.session.orgId,
      userId: auth.session.userId,
      taskId: id,
    });
    return NextResponse.json({ task });
  } catch (error) {
    return errorResponse(error, "Unable to cancel task.");
  }
}
