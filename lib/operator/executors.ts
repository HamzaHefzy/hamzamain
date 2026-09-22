import type { ExecutionResult, OperatorStepKind } from "@/lib/operator/types";
import { fetchWithTimeout } from "@/lib/http";

type ExecuteInput = {
  taskId: string;
  stepId: string;
  kind: OperatorStepKind;
  summary: string;
  request: Record<string, unknown>;
};

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function callbackContext(input: ExecuteInput) {
  const token = process.env.OPERATOR_WEBHOOK_SECRET;
  return {
    url: siteUrl() + "/api/operator/callback",
    ...(token ? { token } : {}),
    taskId: input.taskId,
    stepId: input.stepId,
  };
}

async function postExecutor(
  url: string,
  provider: string,
  input: ExecuteInput,
  secret?: string,
): Promise<ExecutionResult> {
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { Authorization: "Bearer " + secret } : {}),
    },
    body: JSON.stringify({ ...input, callback: callbackContext(input) }),
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    return {
      state: "failed",
      provider,
      message: String(payload.error ?? provider + " request failed."),
      data: payload,
    };
  }

  return {
    state: payload.pending ? "waiting_external" : "completed",
    provider,
    message: String(payload.message ?? provider + " accepted the step."),
    data: payload,
  };
}

async function actionRunner(input: ExecuteInput): Promise<ExecutionResult> {
  const url = process.env.OPERATOR_ACTION_RUNNER_URL;
  if (!url) {
    return {
      state: "waiting_external",
      provider: "action-runner",
      message: "Connect a browser/API action runner to execute this step in the outside world.",
      data: { connector: "OPERATOR_ACTION_RUNNER_URL", noDispatch: true },
    };
  }
  return postExecutor(url, "action-runner", input, process.env.OPERATOR_ACTION_RUNNER_SECRET);
}

async function callWithVoiceProvider(input: ExecuteInput): Promise<ExecutionResult> {
  const voiceUrl = process.env.OPERATOR_VOICE_AGENT_URL;
  if (voiceUrl) {
    return postExecutor(
      voiceUrl,
      "voice-agent",
      input,
      process.env.OPERATOR_VOICE_AGENT_SECRET,
    );
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const to = typeof input.request.to === "string" ? input.request.to : null;
  const resolutionError =
    typeof input.request.contactResolutionError === "string"
      ? input.request.contactResolutionError
      : null;
  if (!sid || !token || !from || !to) {
    return {
      state: "waiting_external",
      provider: "voice",
      message: !to
        ? resolutionError ??
          "The call is planned but still needs a destination number from your private contacts or connected voice provider."
        : "Connect a voice provider or Twilio credentials to place outbound calls.",
      data: { connector: "OPERATOR_VOICE_AGENT_URL", missingDestination: !to, noDispatch: true },
    };
  }

  const callback = new URL(siteUrl() + "/api/operator/voice");
  callback.searchParams.set("taskId", input.taskId);
  callback.searchParams.set("stepId", input.stepId);

  const statusCallback = new URL(siteUrl() + "/api/operator/voice/status");
  statusCallback.searchParams.set("taskId", input.taskId);
  statusCallback.searchParams.set("stepId", input.stepId);

  const body = new URLSearchParams({
    To: to,
    From: from,
    Url: callback.toString(),
    Method: "POST",
    StatusCallback: statusCallback.toString(),
    StatusCallbackMethod: "POST",
    StatusCallbackEvent: "completed",
  });

  const response = await fetchWithTimeout(
    "https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Calls.json",
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(sid + ":" + token).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );
  const payload = (await response.json().catch(() => ({}))) as {
    sid?: string;
    message?: string;
  };
  if (!response.ok) {
    return {
      state: "failed",
      provider: "twilio",
      message: payload.message ?? "Twilio call failed.",
    };
  }
  return {
    state: "waiting_external",
    provider: "twilio",
    message: "Outbound call started. Operator is waiting for the call workflow to finish.",
    data: { callSid: payload.sid ?? null },
  };
}

async function sendWithResend(input: ExecuteInput): Promise<ExecutionResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = typeof input.request.to === "string" ? input.request.to : null;
  const resolutionError =
    typeof input.request.contactResolutionError === "string"
      ? input.request.contactResolutionError
      : null;
  if (!key || !from || !to) {
    return {
      state: "waiting_external",
      provider: "resend",
      message: !to
        ? resolutionError ??
          "The message is planned but needs a recipient from your private contacts."
        : "Connect Resend credentials to send email.",
      data: { connector: "resend", missingRecipient: !to, noDispatch: true },
    };
  }

  const subject =
    typeof input.request.subject === "string"
      ? input.request.subject
      : "Message from your personal Operator";
  const body =
    typeof input.request.body === "string" ? input.request.body : input.summary;

  const response = await fetchWithTimeout("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [to], subject, text: body }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
  };
  if (!response.ok) {
    return {
      state: "failed",
      provider: "resend",
      message: payload.message ?? "Email failed.",
    };
  }
  return {
    state: "completed",
    provider: "resend",
    message: "Email sent.",
    data: { messageId: payload.id ?? null },
  };
}

async function sendToHumanQueue(input: ExecuteInput): Promise<ExecutionResult> {
  const url = process.env.OPERATOR_HUMAN_QUEUE_URL;
  if (!url) {
    return {
      state: "waiting_external",
      provider: "human-queue",
      message: "Connect a human-operations queue for exception handling.",
      data: { connector: "OPERATOR_HUMAN_QUEUE_URL", noDispatch: true },
    };
  }
  return postExecutor(url, "human-queue", input, process.env.OPERATOR_HUMAN_QUEUE_SECRET);
}

export async function executeOperatorStep(input: ExecuteInput): Promise<ExecutionResult> {
  if (process.env.OPERATOR_DEMO_MODE === "true") {
    return {
      state: "completed",
      provider: "demo",
      message: "Demo execution completed. Connect production providers to perform this action externally.",
      data: { simulated: true, kind: input.kind },
    };
  }

  if (input.kind === "research") {
    return {
      state: "completed",
      provider: "operator",
      message: "Request normalized and execution path selected.",
      data: {
        objective: input.request.objective ?? input.request.userRequest ?? null,
      },
    };
  }
  if (input.kind === "voice") return callWithVoiceProvider(input);
  if (input.kind === "email") return sendWithResend(input);
  if (input.kind === "human") return sendToHumanQueue(input);
  return actionRunner(input);
}
