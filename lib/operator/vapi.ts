import { fetchWithTimeout } from "@/lib/http";

export function vapiConfigured() {
  return Boolean(
    process.env.VAPI_API_KEY &&
    process.env.VAPI_ASSISTANT_ID &&
    process.env.VAPI_PHONE_NUMBER_ID &&
    process.env.VAPI_WEBHOOK_SECRET,
  );
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function startVapiCall(input: {
  taskId: string;
  stepId: string;
  to: string;
  objective: string;
  contactName?: string | null;
  callbackToken: string;
}) {
  const apiKey = process.env.VAPI_API_KEY;
  const assistantId = process.env.VAPI_ASSISTANT_ID;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
  const webhookSecret = process.env.VAPI_WEBHOOK_SECRET;
  if (!apiKey || !assistantId || !phoneNumberId || !webhookSecret) {
    throw new Error("Vapi is not configured.");
  }

  const server = new URL(siteUrl() + "/api/operator/vapi");
  server.searchParams.set("taskId", input.taskId);
  server.searchParams.set("stepId", input.stepId);
  server.searchParams.set("callbackToken", input.callbackToken);

  const response = await fetchWithTimeout("https://api.vapi.ai/call", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assistantId,
      phoneNumberId,
      customer: {
        number: input.to,
        ...(input.contactName ? { name: input.contactName } : {}),
      },
      name: "Yumna task " + input.taskId.slice(0, 8),
      assistantOverrides: {
        variableValues: {
          objective: input.objective,
          taskId: input.taskId,
          stepId: input.stepId,
          contactName: input.contactName ?? "",
        },
        firstMessage:
          "Hello. I’m Yumna, an automated assistant calling on behalf of my user. " +
          "I’m calling to help with " + input.objective + ".",
        server: {
          url: server.toString(),
          headers: {
            Authorization: "Bearer " + webhookSecret,
          },
          timeoutSeconds: 20,
        },
        serverMessages: [
          "status-update",
          "end-of-call-report",
          "transcript",
        ],
        maxDurationSeconds: 900,
        endCallPhrases: [
          "Thank you, that is everything I needed. Goodbye.",
          "Thank you for your help. Goodbye.",
        ],
      },
    }),
  });

  const payload = await response.json().catch(() => ({})) as {
    id?: string;
    status?: string;
    message?: string;
    error?: string;
  };
  if (!response.ok || !payload.id) {
    throw new Error(payload.message ?? payload.error ?? "Vapi call creation failed.");
  }
  return {
    id: payload.id,
    status: payload.status ?? "queued",
  };
}
