import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession, errorResponse } from "@/lib/api";
import { createOperatorTask, listOperatorTasks, runOperatorTask } from "@/lib/operator/service";

const createSchema = z.object({
  request: z.string().trim().min(4).max(4000),
  priority: z.enum(["low","normal","high","urgent"]).optional(),
  budgetLimit: z.number().nonnegative().max(1000000).nullable().optional(),
  runImmediately: z.boolean().optional().default(true),
});

export async function GET() {
  const auth = await apiSession("view");
  if (!auth.session) return auth.response;
  return NextResponse.json({ tasks: await listOperatorTasks(auth.session.orgId) });
}

export async function POST(request: Request) {
  const auth = await apiSession("support_write");
  if (!auth.session) return auth.response;
  try {
    const input = createSchema.parse(await request.json());
    const task = await createOperatorTask({
      orgId: auth.session.orgId,
      userId: auth.session.userId,
      request: input.request,
      priority: input.priority,
      budgetLimit: input.budgetLimit,
    });
    const finalTask = input.runImmediately
      ? await runOperatorTask(auth.session.orgId, task.id)
      : task;
    return NextResponse.json({ task: finalTask }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Unable to create task.");
  }
}
