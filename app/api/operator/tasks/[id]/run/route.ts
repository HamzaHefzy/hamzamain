import { NextResponse } from "next/server";
import { apiSession, errorResponse } from "@/lib/api";
import { runOperatorTask } from "@/lib/operator/service";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await apiSession("task_write");
  if (!auth.session) return auth.response;
  try {
    const { id } = await context.params;
    return NextResponse.json({ task: await runOperatorTask(auth.session.orgId, id) });
  } catch (error) {
    return errorResponse(error, "Unable to run task.");
  }
}
