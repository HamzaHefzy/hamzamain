import { z } from "zod";
import { planOperatorTask } from "@/lib/operator/planner";
import type { TaskPlan } from "@/lib/operator/types";
import { fetchWithTimeout } from "@/lib/http";

const stepSchema = z.object({
  kind: z.enum(["research", "api", "browser", "voice", "email", "calendar", "payment", "human"]),
  summary: z.string().min(1).max(500),
  domain: z.string().min(1).max(80),
  action: z.string().min(1).max(80),
  requiresApproval: z.boolean(),
  approvalType: z.enum(["spend", "booking", "communication", "calendar", "account_change", "sensitive", "other"]).optional(),
  provider: z.string().max(120).optional(),
  request: z.record(z.unknown()).optional(),
});

const planSchema = z.object({
  title: z.string().min(1).max(120),
  category: z.string().min(1).max(80),
  rationale: z.string().min(1).max(1000),
  steps: z.array(stepSchema).min(1).max(30),
  assumptions: z.array(z.string().max(500)).max(20),
});

const jsonPlanSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "category", "rationale", "steps", "assumptions"],
  properties: {
    title: { type: "string" },
    category: { type: "string" },
    rationale: { type: "string" },
    assumptions: {
      type: "array",
      items: { type: "string" },
    },
    steps: {
      type: "array",
      minItems: 1,
      maxItems: 30,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["kind", "summary", "domain", "action", "requiresApproval", "approvalType", "provider", "request"],
        properties: {
          kind: {
            type: "string",
            enum: ["research", "api", "browser", "voice", "email", "calendar", "payment", "human"],
          },
          summary: { type: "string" },
          domain: { type: "string" },
          action: { type: "string" },
          requiresApproval: { type: "boolean" },
          approvalType: {
            anyOf: [
              {
                type: "string",
                enum: ["spend", "booking", "communication", "calendar", "account_change", "sensitive", "other"],
              },
              { type: "null" },
            ],
          },
          provider: { anyOf: [{ type: "string" }, { type: "null" }] },
          request: {
            anyOf: [
              { type: "object", additionalProperties: true },
              { type: "null" },
            ],
          },
        },
      },
    },
  },
} as const;

function plannerContract() {
  return {
    goal: "Create the smallest safe sequence of auditable actions that fully owns this user request.",
    approvalRule: "Consequential communications, account changes, sensitive actions, spending, bookings, purchases, and destructive writes require explicit approval unless a stored authority rule covers them.",
    escalationOrder: ["api", "browser", "voice", "human"],
    webResearchRule: "For current facts, reviews, news, comparisons, or live web research, use a research step with provider brave-search and request.query set to the user objective. Use freshness pd for today/latest and pw for recent/this week when appropriate. Do not use Google Places for non-geospatial research.",
    placesRule: "For finding local businesses, addresses, phone numbers, ratings, websites, or nearby providers, use an api step with provider google-places and request.query. Do not make a call unless the user actually asked for a call or the workflow requires calling to complete the requested outcome.",
    connectedAppRule: "When context.connectedAppTools contains tools for the requested app, choose the narrowest matching tool and create an api step with provider pipedream. Set request.app, request.accountId, request.pipedreamActionId, and request.configuredProps using only values supported by the user request/context. Do not invent IDs or remote-option values. Read-only tools need no approval unless sensitive; writes, sends, deletes, purchases, bookings, account changes, or destructive tools require the appropriate approval unless a stored authority rule covers them. If no exact tool can be configured safely, use provider app-agent with request.app instead of guessing.",
    voiceRule: "For outbound calls, use a voice step and include request.objective. Yumna must identify itself as an automated assistant and must never impersonate the user.",
  };
}

function extractResponseText(payload: Record<string, unknown>) {
  if (typeof payload.output_text === "string") return payload.output_text;
  if (!Array.isArray(payload.output)) return null;

  for (const item of payload.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const text = (part as Record<string, unknown>).text;
      if (typeof text === "string") return text;
    }
  }
  return null;
}

async function planWithOpenAI(request: string, context: Record<string, unknown>) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured.");

  const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_PLANNER_MODEL ?? "gpt-5.6",
      instructions:
        "You are Yumna's execution planner. Plan only actions needed to achieve the user's requested outcome. " +
        "Prefer direct APIs over browser automation, preserve user agency, never invent credentials or account data, " +
        "and keep every consequential commitment behind the provided approval rules.",
      input: JSON.stringify({
        request,
        context,
        contract: plannerContract(),
      }),
      text: {
        format: {
          type: "json_schema",
          name: "yumna_task_plan",
          strict: true,
          schema: jsonPlanSchema,
        },
      },
    }),
  });

  const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const error =
      payload.error && typeof payload.error === "object"
        ? (payload.error as Record<string, unknown>).message
        : null;
    throw new Error(typeof error === "string" ? error : "OpenAI planner request failed.");
  }

  const output = extractResponseText(payload);
  if (!output) throw new Error("OpenAI planner returned no structured output.");
  const raw = JSON.parse(output) as Record<string, unknown>;
  if (Array.isArray(raw.steps)) {
    raw.steps = raw.steps.map((item) => {
      if (!item || typeof item !== "object") return item;
      const step = { ...(item as Record<string, unknown>) };
      if (step.approvalType === null) delete step.approvalType;
      if (step.provider === null) delete step.provider;
      if (step.request === null) delete step.request;
      return step;
    });
  }
  return planSchema.parse(raw);
}

async function planWithRemote(request: string, context: Record<string, unknown>) {
  const url = process.env.OPERATOR_PLANNER_URL;
  if (!url) throw new Error("OPERATOR_PLANNER_URL is not configured.");

  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.OPERATOR_PLANNER_SECRET
        ? { Authorization: "Bearer " + process.env.OPERATOR_PLANNER_SECRET }
        : {}),
    },
    body: JSON.stringify({
      request,
      context,
      contract: plannerContract(),
    }),
  });

  if (!response.ok) throw new Error("Planner provider returned " + response.status);
  const raw = await response.json() as { plan?: unknown };
  return planSchema.parse(raw.plan ?? raw);
}

export async function planOperatorTaskWithProvider(
  request: string,
  context: Record<string, unknown> = {},
): Promise<TaskPlan> {
  try {
    if (process.env.OPERATOR_PLANNER_URL) {
      return await planWithRemote(request, context);
    }
    if (process.env.OPENAI_API_KEY) {
      return await planWithOpenAI(request, context);
    }
    return planOperatorTask(request);
  } catch (error) {
    if (process.env.OPERATOR_REQUIRE_REMOTE_PLANNER === "true") throw error;
    return planOperatorTask(request);
  }
}
