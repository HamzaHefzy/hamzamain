import { createHash } from "node:crypto";
import { db } from "@/lib/db";
import { toJson } from "@/lib/json";
import { acceptOperatorCallback, getOperatorTask } from "@/lib/operator/service";

export function callbackIdFromRaw(raw: string, supplied?: string | null) {
  if (supplied?.trim()) return supplied.trim().slice(0, 200);
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

export async function acceptSafeOperatorCallback(input: {
  callbackId: string;
  taskId: string;
  stepId: string;
  state: "completed" | "failed";
  message: string;
  data?: Record<string, unknown>;
}) {
  const sql = db();
  const [step] = await sql<{ org_id: string; task_status: string; step_status: string }[]>`
    select s.org_id, t.status as task_status, s.status as step_status
    from operator_steps s
    join operator_tasks t on t.id = s.task_id and t.org_id = s.org_id
    where s.id = ${input.stepId} and s.task_id = ${input.taskId}
    limit 1
  `;
  if (!step) throw new Error("Callback step not found.");

  const [fresh] = await sql<{ callback_id: string }[]>`
    insert into operator_callback_events (
      callback_id, org_id, task_id, step_id, state
    )
    values (
      ${input.callbackId}, ${step.org_id}, ${input.taskId}, ${input.stepId}, ${input.state}
    )
    on conflict (callback_id) do nothing
    returning callback_id
  `;

  if (!fresh) return getOperatorTask(step.org_id, input.taskId);

  if (
    ["cancelled", "completed"].includes(step.task_status) ||
    ["completed", "failed", "skipped"].includes(step.step_status)
  ) {
    await sql`
      insert into operator_events (org_id, task_id, step_id, event_type, message, metadata)
      values (
        ${step.org_id}, ${input.taskId}, ${input.stepId},
        'callback.ignored',
        'Ignored a late executor callback for a terminal task or step.',
        ${sql.json(toJson({ callbackId: input.callbackId, state: input.state }))}
      )
    `;
    return getOperatorTask(step.org_id, input.taskId);
  }

  return acceptOperatorCallback({
    taskId: input.taskId,
    stepId: input.stepId,
    state: input.state,
    message: input.message,
    data: input.data,
  });
}
