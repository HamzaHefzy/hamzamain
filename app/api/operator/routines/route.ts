import { NextResponse } from "next/server";
import { z } from "zod";
import { apiSession, errorResponse } from "@/lib/api";
import { createOperatorRoutine, listOperatorRoutines } from "@/lib/operator/routines";

const schema = z.object({
  title: z.string().trim().min(2).max(120),
  request: z.string().trim().min(4).max(4000),
  cadence: z.enum(["daily", "weekly"]),
  firstRunAt: z.string().datetime(),
});

export async function GET() {
  const auth = await apiSession("view");
  if (!auth.session) return auth.response;
  return NextResponse.json({ routines: await listOperatorRoutines(auth.session.orgId) });
}

export async function POST(request: Request) {
  const auth = await apiSession("task_write");
  if (!auth.session) return auth.response;
  try {
    const input = schema.parse(await request.json());
    const routine = await createOperatorRoutine({
      orgId: auth.session.orgId,
      userId: auth.session.userId,
      title: input.title,
      request: input.request,
      cadence: input.cadence,
      firstRunAt: new Date(input.firstRunAt),
    });
    return NextResponse.json({ routine }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Unable to create routine.");
  }
}
