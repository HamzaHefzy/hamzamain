import { db } from "@/lib/db";
import { toJson } from "@/lib/json";
import { planOperatorTaskWithProvider } from "@/lib/operator/planner-provider";
import { executeOperatorStep } from "@/lib/operator/executors";
import { plannerContext } from "@/lib/operator/context";
import { assertPlanSupportsSteps, assertTaskCapacity } from "@/lib/operator/entitlements";

type TaskRow = {
  id: string;
  title: string;
  request: string;
  category: string;
  status: string;
  priority: string;
  source: string;
  budget_limit: string | null;
  actual_spend: string;
  currency: string;
  plan: Record<string, unknown>;
  result: Record<string, unknown>;
  error: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type StepRow = {
  id: string;
  task_id: string;
  sequence: number;
  kind: "research" | "api" | "browser" | "voice" | "email" | "calendar" | "payment" | "human";
  status: string;
  summary: string;
  provider: string | null;
  requires_approval: boolean;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  error: string | null;
};

async function event(
  orgId: string,
  taskId: string | null,
  stepId: string | null,
  eventType: string,
  message: string,
  metadata: Record<string, unknown> = {},
) {
  const sql = db();
  await sql`
    insert into operator_events (org_id, task_id, step_id, event_type, message, metadata)
    values (${orgId}, ${taskId}, ${stepId}, ${eventType}, ${message}, ${sql.json(toJson(metadata))})
  `;
}

async function authorityAllows(
  orgId: string,
  domain: string,
  action: string,
  requestedAmount?: number | null,
) {
  const sql = db();
  const [row] = await sql<{ enabled: boolean; policy: Record<string, unknown> }[]>`
    select enabled, policy
    from operator_authority_rules
    where org_id = ${orgId} and domain = ${domain} and action = ${action}
    limit 1
  `;

  if (!row?.enabled || row.policy?.mode !== "allow") return false;

  const configuredCap = row.policy?.maxSpend;
  if (typeof configuredCap === "number") {
    return typeof requestedAmount === "number" && requestedAmount <= configuredCap;
  }

  return true;
}

export async function createOperatorTask(input: {
  orgId: string;
  userId: string;
  request: string;
  priority?: "low" | "normal" | "high" | "urgent";
  budgetLimit?: number | null;
  source?: "web" | "sms" | "email" | "voice" | "automation" | "api";
}) {
  const entitlement = await assertTaskCapacity(input.orgId);
  const context = await plannerContext(input.orgId);
  const plan = await planOperatorTaskWithProvider(input.request, context);
  assertPlanSupportsSteps(entitlement, plan.steps);
  const sql = db();

  const [task] = await sql<TaskRow[]>`
    insert into operator_tasks (
      org_id, created_by, title, request, category, status,
      priority, source, budget_limit, plan
    )
    values (
      ${input.orgId}, ${input.userId}, ${plan.title}, ${input.request},
      ${plan.category}, 'ready', ${input.priority ?? "normal"},
      ${input.source ?? "web"}, ${input.budgetLimit ?? null}, ${sql.json(toJson(plan))}
    )
    returning *
  `;

  let awaitingApproval = false;
  for (let index = 0; index < plan.steps.length; index += 1) {
    const planned = plan.steps[index];
    const covered = planned.requiresApproval
      ? await authorityAllows(
          input.orgId,
          planned.domain,
          planned.action,
          planned.action === "spend" ? input.budgetLimit : null,
        )
      : false;
    const requiresApproval = planned.requiresApproval && !covered;

    const [createdStep] = await sql<{ id: string }[]>`
      insert into operator_steps (
        org_id, task_id, sequence, kind, status, summary,
        provider, requires_approval, request
      )
      values (
        ${input.orgId}, ${task.id}, ${index + 1}, ${planned.kind},
        ${requiresApproval ? "awaiting_approval" : "pending"},
        ${planned.summary}, ${planned.provider ?? null}, ${requiresApproval},
        ${sql.json(toJson({ ...planned.request, domain: planned.domain, action: planned.action }))}
      )
      returning id
    `;

    if (requiresApproval) {
      awaitingApproval = true;
      await sql`
        insert into operator_approvals (
          org_id, task_id, step_id, approval_type, summary, amount, currency
        )
        values (
          ${input.orgId}, ${task.id}, ${createdStep.id},
          ${planned.approvalType ?? "other"},
          ${planned.summary}, ${input.budgetLimit ?? null}, 'USD'
        )
      `;
    }
  }

  if (awaitingApproval) {
    await sql`
      update operator_tasks
      set status = 'awaiting_approval', updated_at = now()
      where id = ${task.id}
    `;
    task.status = "awaiting_approval";
  }

  await event(input.orgId, task.id, null, "task.created", "Operator accepted the task.", {
    category: plan.category,
    steps: plan.steps.length,
  });

  return task;
}

export async function listOperatorTasks(orgId: string, limit = 50) {
  const sql = db();
  return sql<TaskRow[]>`
    select *
    from operator_tasks
    where org_id = ${orgId}
    order by
      case status
        when 'awaiting_approval' then 0
        when 'in_progress' then 1
        when 'waiting_external' then 2
        when 'ready' then 3
        else 4
      end,
      created_at desc
    limit ${limit}
  `;
}

export async function getOperatorTask(orgId: string, taskId: string) {
  const sql = db();
  const [task] = await sql<TaskRow[]>`
    select * from operator_tasks where id = ${taskId} and org_id = ${orgId} limit 1
  `;
  if (!task) return null;

  const steps = await sql<StepRow[]>`
    select * from operator_steps
    where task_id = ${taskId} and org_id = ${orgId}
    order by sequence
  `;
  const approvals = await sql<{
    id: string;
    step_id: string | null;
    approval_type: string;
    summary: string;
    amount: string | null;
    currency: string;
    status: string;
    requested_at: string;
  }[]>`
    select id, step_id, approval_type, summary, amount, currency, status, requested_at
    from operator_approvals
    where task_id = ${taskId} and org_id = ${orgId}
    order by requested_at
  `;
  return { ...task, steps, approvals };
}

export async function runOperatorTask(orgId: string, taskId: string) {
  const sql = db();
  let announcedStart = false;

  for (let guard = 0; guard < 100; guard += 1) {
    const task = await getOperatorTask(orgId, taskId);
    if (!task) throw new Error("Task not found.");
    if (["completed", "cancelled"].includes(task.status)) return task;

    const step = task.steps.find((candidate) =>
      !["completed", "skipped"].includes(candidate.status),
    );

    if (!step) {
      const [completed] = await sql<{ id: string }[]>`
        update operator_tasks
        set status = 'completed',
            completed_at = coalesce(completed_at, now()),
            updated_at = now(),
            error = null,
            result = ${sql.json(toJson({ message: "Task completed." }))}
        where id = ${taskId}
          and org_id = ${orgId}
          and status not in ('completed','cancelled')
        returning id
      `;
      if (completed) {
        await event(orgId, taskId, null, "task.completed", "Operator completed the task.");
      }
      return getOperatorTask(orgId, taskId);
    }

    if (step.status === "awaiting_approval") {
      await sql`
        update operator_tasks set status = 'awaiting_approval', updated_at = now()
        where id = ${taskId} and org_id = ${orgId}
          and status not in ('completed','cancelled')
      `;
      return getOperatorTask(orgId, taskId);
    }

    if (step.status === "waiting_external" && step.response?.noDispatch !== true) {
      await sql`
        update operator_tasks set status = 'waiting_external', updated_at = now()
        where id = ${taskId} and org_id = ${orgId}
          and status not in ('completed','cancelled')
      `;
      return getOperatorTask(orgId, taskId);
    }

    if (step.status === "running") {
      return task;
    }

    const [claimed] = await sql<{ id: string }[]>`
      update operator_steps
      set status = 'running',
          started_at = coalesce(started_at, now()),
          error = null
      where id = ${step.id}
        and org_id = ${orgId}
        and task_id = ${taskId}
        and (
          status in ('pending','failed')
          or (
            status = 'waiting_external'
            and response ->> 'noDispatch' = 'true'
          )
        )
      returning id
    `;

    if (!claimed) {
      const refreshed = await getOperatorTask(orgId, taskId);
      if (!refreshed) throw new Error("Task not found.");
      return refreshed;
    }

    await sql`
      update operator_tasks
      set status = 'in_progress',
          started_at = coalesce(started_at, now()),
          updated_at = now(),
          error = null
      where id = ${taskId}
        and org_id = ${orgId}
        and status not in ('completed','cancelled')
    `;

    if (!announcedStart) {
      announcedStart = true;
      await event(orgId, taskId, null, "task.started", "Operator started or resumed the task.");
    }

    let result;
    try {
      result = await executeOperatorStep({
        taskId,
        stepId: step.id,
        kind: step.kind,
        summary: step.summary,
        request: step.request ?? {},
      });
    } catch (error) {
      result = {
        state: "failed" as const,
        provider: step.provider ?? step.kind,
        message: error instanceof Error ? error.message : "Executor failed unexpectedly.",
        data: { unexpectedExecutorError: true },
      };
    }

    if (result.state === "completed") {
      const [updated] = await sql<{ id: string }[]>`
        update operator_steps
        set status = 'completed',
            provider = ${result.provider},
            response = ${sql.json(toJson({ message: result.message, ...(result.data ?? {}) }))},
            completed_at = now(),
            error = null
        where id = ${step.id}
          and org_id = ${orgId}
          and status = 'running'
        returning id
      `;
      if (!updated) return getOperatorTask(orgId, taskId);
      await event(orgId, taskId, step.id, "step.completed", result.message, result.data ?? {});
      continue;
    }

    if (result.state === "waiting_external") {
      const [updated] = await sql<{ id: string }[]>`
        update operator_steps
        set status = 'waiting_external',
            provider = ${result.provider},
            response = ${sql.json(toJson({ message: result.message, ...(result.data ?? {}) }))}
        where id = ${step.id}
          and org_id = ${orgId}
          and status = 'running'
        returning id
      `;
      if (!updated) return getOperatorTask(orgId, taskId);
      await sql`
        update operator_tasks
        set status = 'waiting_external',
            updated_at = now(),
            result = ${sql.json(toJson({ message: result.message, waitingOn: result.provider }))}
        where id = ${taskId}
          and org_id = ${orgId}
          and status not in ('completed','cancelled')
      `;
      await event(orgId, taskId, step.id, "step.waiting_external", result.message, result.data ?? {});
      return getOperatorTask(orgId, taskId);
    }

    const [failed] = await sql<{ id: string }[]>`
      update operator_steps
      set status = 'failed',
          provider = ${result.provider},
          error = ${result.message},
          response = ${sql.json(toJson(result.data ?? {}))},
          completed_at = now()
      where id = ${step.id}
        and org_id = ${orgId}
        and status = 'running'
      returning id
    `;
    if (!failed) return getOperatorTask(orgId, taskId);
    await sql`
      update operator_tasks
      set status = 'failed', error = ${result.message}, updated_at = now()
      where id = ${taskId}
        and org_id = ${orgId}
        and status not in ('completed','cancelled')
    `;
    await event(orgId, taskId, step.id, "step.failed", result.message, result.data ?? {});
    return getOperatorTask(orgId, taskId);
  }

  throw new Error("Task exceeded the maximum number of execution steps.");
}

export async function listPendingApprovals(orgId: string) {
  const sql = db();
  return sql<{
    id: string;
    task_id: string;
    step_id: string | null;
    approval_type: string;
    summary: string;
    amount: string | null;
    currency: string;
    status: string;
    requested_at: string;
    task_title: string;
  }[]>`
    select a.*, t.title as task_title
    from operator_approvals a
    join operator_tasks t on t.id = a.task_id
    where a.org_id = ${orgId} and a.status = 'pending'
    order by a.requested_at desc
  `;
}

export async function resolveOperatorApproval(input: {
  orgId: string;
  userId: string;
  approvalId: string;
  decision: "approved" | "rejected";
}) {
  const sql = db();
  const [approval] = await sql<{ task_id: string; step_id: string | null; summary: string }[]>`
    update operator_approvals
    set status = ${input.decision}, resolved_at = now(), resolved_by = ${input.userId}
    where id = ${input.approvalId} and org_id = ${input.orgId} and status = 'pending'
    returning task_id, step_id, summary
  `;
  if (!approval) throw new Error("Approval not found or already resolved.");

  if (approval.step_id) {
    await sql`
      update operator_steps
      set status = ${input.decision === "approved" ? "pending" : "skipped"}
      where id = ${approval.step_id} and org_id = ${input.orgId}
    `;
  }

  if (input.decision === "rejected") {
    await sql`
      update operator_tasks
      set status = 'cancelled',
          updated_at = now(),
          result = ${sql.json(toJson({ message: "Cancelled after approval was declined." }))}
      where id = ${approval.task_id} and org_id = ${input.orgId}
    `;
    await event(input.orgId, approval.task_id, approval.step_id, "approval.rejected", approval.summary);
    return getOperatorTask(input.orgId, approval.task_id);
  }

  const [remaining] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from operator_approvals
    where task_id = ${approval.task_id}
      and org_id = ${input.orgId}
      and status = 'pending'
  `;
  if ((remaining?.count ?? 0) === 0) {
    await sql`
      update operator_tasks set status = 'ready', updated_at = now()
      where id = ${approval.task_id}
    `;
  }
  await event(input.orgId, approval.task_id, approval.step_id, "approval.approved", approval.summary);
  return getOperatorTask(input.orgId, approval.task_id);
}

export async function acceptOperatorCallback(input: {
  taskId: string;
  stepId: string;
  state: "completed" | "failed";
  message: string;
  data?: Record<string, unknown>;
}) {
  const sql = db();
  const [step] = await sql<{ org_id: string; task_id: string }[]>`
    select org_id, task_id
    from operator_steps
    where id = ${input.stepId} and task_id = ${input.taskId}
    limit 1
  `;
  if (!step) throw new Error("Callback step not found.");

  if (input.state === "failed") {
    await sql`
      update operator_steps
      set status = 'failed',
          error = ${input.message},
          response = ${sql.json(toJson(input.data ?? {}))},
          completed_at = now()
      where id = ${input.stepId}
    `;
    await sql`
      update operator_tasks
      set status = 'failed', error = ${input.message}, updated_at = now()
      where id = ${input.taskId}
    `;
    await event(step.org_id, input.taskId, input.stepId, "step.failed", input.message, input.data ?? {});
    return getOperatorTask(step.org_id, input.taskId);
  }

  await sql`
    update operator_steps
    set status = 'completed',
        response = ${sql.json(toJson({ message: input.message, ...(input.data ?? {}) }))},
        completed_at = now(),
        error = null
    where id = ${input.stepId}
  `;
  await sql`
    update operator_tasks
    set status = 'ready', updated_at = now(), error = null
    where id = ${input.taskId}
  `;
  await event(step.org_id, input.taskId, input.stepId, "step.completed", input.message, input.data ?? {});
  return runOperatorTask(step.org_id, input.taskId);
}

export async function operatorOverview(orgId: string) {
  const sql = db();
  const [counts] = await sql<{
    active: number;
    approvals: number;
    completed_week: number;
    waiting: number;
  }[]>`
    select
      count(*) filter (where status in ('ready','in_progress','awaiting_approval','waiting_external'))::int as active,
      count(*) filter (where status = 'awaiting_approval')::int as approvals,
      count(*) filter (where status = 'completed' and completed_at >= now() - interval '7 days')::int as completed_week,
      count(*) filter (where status = 'waiting_external')::int as waiting
    from operator_tasks
    where org_id = ${orgId}
  `;
  const recent = await listOperatorTasks(orgId, 8);
  const approvals = await listPendingApprovals(orgId);
  return {
    counts: counts ?? { active: 0, approvals: 0, completed_week: 0, waiting: 0 },
    recent,
    approvals,
  };
}
