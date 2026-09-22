import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession, errorResponse } from "@/lib/api";
import { deleteOperatorRoutine, setOperatorRoutineEnabled } from "@/lib/operator/routines";

const schema = z.object({ enabled: z.boolean() });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await apiSession("task_write");
  if (!auth.session) return auth.response;
  try {
    const { id } = await context.params;
    const { enabled } = schema.parse(await request.json());
    return NextResponse.json({
      routine: await setOperatorRoutineEnabled(auth.session.orgId, id, enabled),
    });
  } catch (error) {
    return errorResponse(error, "Unable to update routine.");
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await apiSession("task_write");
  if (!auth.session) return auth.response;
  try {
    const { id } = await context.params;
    const deleted = await deleteOperatorRoutine(auth.session.orgId, id);
    if (!deleted) return NextResponse.json({ error: "Routine not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Unable to delete routine.");
  }
}
