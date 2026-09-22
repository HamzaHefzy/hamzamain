import { acceptSafeOperatorCallback } from "@/lib/operator/callbacks";

function authorized(request: Request) {
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === "Bearer " + secret;
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const taskId = url.searchParams.get("taskId");
  const stepId = url.searchParams.get("stepId");
  if (!taskId || !stepId) {
    return new Response("Missing task context.", { status: 400 });
  }

  const payload = await request.json().catch(() => null) as unknown;
  const root = object(payload);
  const message = object(root.message);
  const type = typeof message.type === "string" ? message.type : "";
  const call = object(message.call);
  const callId = typeof call.id === "string" ? call.id : "unknown";

  if (type === "end-of-call-report") {
    const artifact = object(message.artifact);
    const transcript =
      typeof artifact.transcript === "string" ? artifact.transcript : null;
    const endedReason =
      typeof message.endedReason === "string" ? message.endedReason : null;

    await acceptSafeOperatorCallback({
      callbackId: "vapi:" + callId + ":end-of-call-report",
      taskId,
      stepId,
      state: "completed",
      message: "Conversational phone call completed.",
      data: {
        callId,
        endedReason,
        transcript,
        recording:
          artifact.recording && typeof artifact.recording === "object"
            ? artifact.recording
            : null,
      },
    });
  }

  return Response.json({ ok: true });
}
