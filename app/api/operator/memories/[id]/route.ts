import { NextResponse } from "next/server";
import { apiSession, errorResponse } from "@/lib/api";
import { deleteOperatorMemory } from "@/lib/operator/context";

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await apiSession("task_write");
  if (!auth.session) return auth.response;
  try {
    const { id } = await context.params;
    const deleted = await deleteOperatorMemory(auth.session.orgId, id);
    if (!deleted) return NextResponse.json({ error: "Memory not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Unable to delete memory.");
  }
}
