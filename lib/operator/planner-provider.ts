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

export async function planOperatorTaskWithProvider(request: string, context?: Record<string, unknown>): Promise<TaskPlan> {
  const url = process.env.OPERATOR_PLANNER_URL;
  if (!url) return planOperatorTask(request);

  try {
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
        context: context ?? {},
        contract: {
          goal: "Create the smallest safe sequence of auditable actions that fully owns this user request.",
          approvalRule: "Consequential communications, account changes, sensitive actions, and spending require explicit approval unless a stored authority rule covers them.",
          escalationOrder: ["api", "browser", "voice", "human"],
          webResearchRule: "For current facts, reviews, news, comparisons, or live web research, use a research step with provider brave-search and request.query set to the user objective. Use freshness pd for today/latest and pw for recent/this week when appropriate. Do not use Google Places for non-geospatial research.",
          connectedAppRule: "When context.connectedAppTools contains tools for the requested app, choose the narrowest matching tool and create an api step with provider pipedream. Set request.app, request.accountId, request.pipedreamActionId, and request.configuredProps using only values supported by the user request/context. Do not invent IDs or remote-option values. Read-only tools need no approval unless sensitive; writes, sends, deletes, purchases, bookings, account changes, or destructive tools require the appropriate approval unless a stored authority rule covers them. If no exact tool can be configured safely, use provider app-agent with request.app instead of guessing.",
        },
      }),
    });

    if (!response.ok) throw new Error("Planner provider returned " + response.status);
    const raw = await response.json() as { plan?: unknown };
    return planSchema.parse(raw.plan ?? raw);
  } catch (error) {
    if (process.env.OPERATOR_REQUIRE_REMOTE_PLANNER === "true") throw error;
    return planOperatorTask(request);
  }
}
