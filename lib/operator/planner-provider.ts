import { z } from "zod";
import { planOperatorTask } from "@/lib/operator/planner";
import type { TaskPlan } from "@/lib/operator/types";

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

export async function planOperatorTaskWithProvider(request: string): Promise<TaskPlan> {
  const url = process.env.OPERATOR_PLANNER_URL;
  if (!url) return planOperatorTask(request);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.OPERATOR_PLANNER_SECRET
          ? { Authorization: "Bearer " + process.env.OPERATOR_PLANNER_SECRET }
          : {}),
      },
      body: JSON.stringify({
        request,
        contract: {
          goal: "Create the smallest safe sequence of auditable actions that fully owns this user request.",
          approvalRule: "Consequential communications, account changes, sensitive actions, and spending require explicit approval unless a stored authority rule covers them.",
          escalationOrder: ["api", "browser", "voice", "human"],
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
