import { acceptSafeOperatorCallback } from "@/lib/operator/callbacks";
import { verifyOperatorStepCallbackToken } from "@/lib/operator/callback-auth";
import { twilioWebhookUrl, verifyTwilioFormRequest } from "@/lib/twilio";

export async function POST(request: Request) {
  const raw = await request.text();
  const params = new URLSearchParams(raw);
  const signature = request.headers.get("x-twilio-signature");
  const publicUrl = twilioWebhookUrl(request);

  if (!verifyTwilioFormRequest({ url: publicUrl, params, signature })) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const taskId = url.searchParams.get("taskId");
  const stepId = url.searchParams.get("stepId");
  const callbackToken = url.searchParams.get("callbackToken");
  const callSid = params.get("CallSid");
  const callStatus = params.get("CallStatus") ?? "unknown";
  if (!taskId || !stepId || !callbackToken || !callSid) {
    return new Response("Missing callback context.", { status: 400 });
  }
  if (!(await verifyOperatorStepCallbackToken({ taskId, stepId, token: callbackToken }))) {
    return new Response("Invalid or expired task callback.", { status: 401 });
  }

  const successful = callStatus === "completed";
  await acceptSafeOperatorCallback({
    callbackId: "twilio:" + callSid + ":" + callStatus,
    taskId,
    stepId,
    state: successful ? "completed" : "failed",
    message: successful
      ? "Twilio outbound call completed."
      : "Twilio outbound call ended with status: " + callStatus + ".",
    data: { callSid, callStatus },
  });

  return new Response("OK", { status: 200 });
}
