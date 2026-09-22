import { NextResponse } from "next/server";
import { z } from "zod";
import { acceptSafeOperatorCallback, callbackIdFromRaw } from "@/lib/operator/callbacks";
import { verifyOperatorStepCallbackToken } from "@/lib/operator/callback-auth";

const schema = z.object({
  eventId: z.string().min(1).max(200).optional(),
  taskId: z.string().uuid(),
  stepId: z.string().uuid(),
  state: z.enum(["completed", "failed"]),
  message: z.string().min(1).max(2000),
  data: z.record(z.unknown()).optional(),
});

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    const input = schema.parse(JSON.parse(raw));
    const token = bearerToken(request);
    const authorized =
      Boolean(token) &&
      await verifyOperatorStepCallbackToken({
        taskId: input.taskId,
        stepId: input.stepId,
        token,
      });

    if (!authorized) {
      return NextResponse.json({ error: "Invalid or expired callback credentials." }, { status: 401 });
    }

    const callbackId = callbackIdFromRaw(
      raw,
      request.headers.get("x-operator-event-id") ?? input.eventId ?? null,
    );
    const task = await acceptSafeOperatorCallback({
      callbackId,
      taskId: input.taskId,
      stepId: input.stepId,
      state: input.state,
      message: input.message,
      data: input.data,
    });
    return NextResponse.json({ ok: true, callbackId, task });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid callback.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
