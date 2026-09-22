import type { ExecutionResult, OperatorStepKind } from "@/lib/operator/types";

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

async function actionRunner(input: ExecuteInput): Promise<ExecutionResult> {
  const url = process.env.OPERATOR_ACTION_RUNNER_URL;
  if (!url) {
    return {
      state: "waiting_external",
      provider: "action-runner",
      message: "Connect a browser/API action runner to execute this step in the outside world.",
      data: { connector: "OPERATOR_ACTION_RUNNER_URL" },
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.OPERATOR_ACTION_RUNNER_SECRET
        ? { Authorization: "Bearer " + process.env.OPERATOR_ACTION_RUNNER_SECRET }
        : {}),
    },
    body: JSON.stringify(input),
  });
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    return { state: "failed", provider: "action-runner", message: String(payload.error ?? "Action runner failed."), data: payload };
  }

  return {
    state: payload.pending ? "waiting_external" : "completed",
    provider: "action-runner",
    message: String(payload.message ?? "Action runner accepted the step."),
    data: payload,
  };
}

async function callWithTwilio(input: ExecuteInput): Promise<ExecutionResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const to = typeof input.request.to === "string" ? input.request.to : null;
  if (!sid || !token || !from || !to) {
    return {
      state: "waiting_external",
      provider: "twilio",
      message: !to
        ? "The call is planned but still needs a destination number from a connected directory or action runner."
        : "Connect Twilio credentials to place outbound calls.",
      data: { connector: "twilio", missingDestination: !to },
    };
  }

  const secret = process.env.OPERATOR_WEBHOOK_SECRET ?? "";
  const callback = new URL(siteUrl() + "/api/operator/voice");
  callback.searchParams.set("taskId", input.taskId);
  callback.searchParams.set("stepId", input.stepId);
  if (secret) callback.searchParams.set("secret", secret);

  const body = new URLSearchParams({
    To: to,
    From: from,
    Url: callback.toString(),
    Method: "POST",
  });

  const response = await fetch("https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Calls.json", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(sid + ":" + token).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const payload = (await response.json().catch(() => ({}))) as { sid?: string; message?: string };
  if (!response.ok) {
    return { state: "failed", provider: "twilio", message: payload.message ?? "Twilio call failed." };
  }
  return {
    state: "waiting_external",
    provider: "twilio",
    message: "Outbound call started. Operator will resume when the call workflow returns.",
    data: { callSid: payload.sid ?? null },
  };
}

async function sendWithResend(input: ExecuteInput): Promise<ExecutionResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = typeof input.request.to === "string" ? input.request.to : null;
  if (!key || !from || !to) {
    return {
      state: "waiting_external",
      provider: "resend",
      message: !to
        ? "The message is planned but needs a recipient from a connected contact/directory source."
        : "Connect Resend credentials to send email.",
      data: { connector: "resend", missingRecipient: !to },
    };
  }

  const subject = typeof input.request.subject === "string" ? input.request.subject : "Message from your personal Operator";
  const body = typeof input.request.body === "string" ? input.request.body : input.summary;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text: body }),
  });
  const payload = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!response.ok) return { state: "failed", provider: "resend", message: payload.message ?? "Email failed." };
  return { state: "completed", provider: "resend", message: "Email sent.", data: { messageId: payload.id ?? null } };
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
      data: { objective: input.request.objective ?? input.request.userRequest ?? null },
    };
  }
  if (input.kind === "voice") return callWithTwilio(input);
  if (input.kind === "email") return sendWithResend(input);
  if (input.kind === "human") {
    const humanUrl = process.env.OPERATOR_HUMAN_QUEUE_URL;
    if (!humanUrl) {
      return {
        state: "waiting_external",
        provider: "human-queue",
        message: "Connect a human-operations queue for exception handling.",
        data: { connector: "OPERATOR_HUMAN_QUEUE_URL" },
      };
    }
    return actionRunner({ ...input, request: { ...input.request, humanQueueUrl: humanUrl } });
  }
  return actionRunner(input);
}
