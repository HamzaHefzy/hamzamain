import { NextResponse } from "next/server";
import { apiSession, errorResponse } from "@/lib/api";
import { getOperatorTask } from "@/lib/operator/service";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await apiSession("view");
  if (!auth.session) return auth.response;
  try {
    const { id } = await context.params;
    const task = await getOperatorTask(auth.session.orgId, id);
    if (!task) return NextResponse.json({ error: "Task not found." }, { status: 404 });
    return NextResponse.json({ task });
  } catch (error) {
    return errorResponse(error, "Unable to load task.");
  }
}
