import { db } from "@/lib/db";
import type { PlannedStep } from "@/lib/operator/types";

export type OperatorPlan = "trial" | "assistant" | "operator" | "concierge" | "private_office";

const planRules: Record<OperatorPlan, {
  monthlyTasks: number;
  routines: number;
  allowedKinds: ReadonlySet<PlannedStep["kind"]>;
}> = {
  trial: {
    monthlyTasks: 10,
    routines: 2,
    allowedKinds: new Set(["research", "api", "browser", "voice", "email", "calendar", "payment"]),
  },
  assistant: {
    monthlyTasks: 100,
    routines: 5,
    allowedKinds: new Set(["research", "api", "browser", "email", "calendar"]),
  },
  operator: {
    monthlyTasks: 500,
    routines: 20,
    allowedKinds: new Set(["research", "api", "browser", "voice", "email", "calendar", "payment"]),
  },
  concierge: {
    monthlyTasks: 2000,
    routines: 100,
    allowedKinds: new Set(["research", "api", "browser", "voice", "email", "calendar", "payment", "human"]),
  },
  private_office: {
    monthlyTasks: 5000,
    routines: 500,
    allowedKinds: new Set(["research", "api", "browser", "voice", "email", "calendar", "payment", "human"]),
  },
};

export async function getOperatorEntitlements(orgId: string) {
  const sql = db();
  const [subscription] = await sql<{
    plan: OperatorPlan;
    status: string;
    customer_id: string | null;
  }[]>`
    select plan, status, customer_id
    from operator_subscriptions
    where org_id = ${orgId}
    limit 1
  `;

  const plan: OperatorPlan = subscription?.plan ?? "trial";
  const status = subscription?.status ?? "trialing";
  const executionEnabled = ["active", "trialing"].includes(status);
  const rules = planRules[plan];

  const [usage] = await sql<{ tasks: number; routines: number }[]>`
    select
      (
        select count(*)::int
        from operator_tasks
        where org_id = ${orgId}
          and created_at >= date_trunc('month', now())
      ) as tasks,
      (
        select count(*)::int
        from operator_routines
        where org_id = ${orgId}
          and enabled = true
      ) as routines
  `;

  return {
    plan,
    status,
    executionEnabled,
    customerId: subscription?.customer_id ?? null,
    limits: {
      monthlyTasks: rules.monthlyTasks,
      routines: rules.routines,
    },
    usage: usage ?? { tasks: 0, routines: 0 },
    allowedKinds: rules.allowedKinds,
  };
}

function assertExecutionEnabled(
  entitlement: Awaited<ReturnType<typeof getOperatorEntitlements>>,
) {
  if (entitlement.executionEnabled) return;
  throw new Error(
    "Operator execution is paused because this workspace subscription is " +
    entitlement.status +
    ". Update billing to resume new tasks and routines.",
  );
}

export async function assertTaskCapacity(orgId: string) {
  const entitlement = await getOperatorEntitlements(orgId);
  assertExecutionEnabled(entitlement);
  if (entitlement.usage.tasks >= entitlement.limits.monthlyTasks) {
    throw new Error(
      "This workspace has reached its monthly task limit for the " +
      entitlement.plan +
      " plan. Upgrade or wait until the next billing month.",
    );
  }
  return entitlement;
}

export function assertPlanSupportsSteps(
  entitlement: Awaited<ReturnType<typeof getOperatorEntitlements>>,
  steps: PlannedStep[],
) {
  const blocked = steps.find((step) => !entitlement.allowedKinds.has(step.kind));
  if (!blocked) return;

  const upgrade = blocked.kind === "human" ? "Concierge" : "Operator";
  throw new Error(
    blocked.kind +
    " execution is not included in the " +
    entitlement.plan +
    " plan. Upgrade to " +
    upgrade +
    " to run this task.",
  );
}

export async function assertRoutineCapacity(orgId: string) {
  const entitlement = await getOperatorEntitlements(orgId);
  assertExecutionEnabled(entitlement);
  if (entitlement.usage.routines >= entitlement.limits.routines) {
    throw new Error(
      "This workspace has reached its active routine limit for the " +
      entitlement.plan +
      " plan.",
    );
  }
  return entitlement;
}
