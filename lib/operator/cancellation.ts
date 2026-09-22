import { db } from "@/lib/db";
import { toJson } from "@/lib/json";
import { getOperatorTask } from "@/lib/operator/service";

export async function cancelOperatorTask(input: {
  orgId: string;
  userId: string;
  taskId: string;
}) {
  const sql = db();
  const [task] = await sql<{ id: string; status: string }[]>`
    select id, status
    from operator_tasks
    where id = ${input.taskId} and org_id = ${input.orgId}
    limit 1
  `;
  if (!task) throw new Error("Task not found.");
  if (task.status === "completed") throw new Error("A completed task cannot be cancelled.");
  if (task.status === "cancelled") return getOperatorTask(input.orgId, input.taskId);

  await sql.begin(async (tx) => {
    await tx`
      update operator_tasks
      set status = 'cancelled',
          updated_at = now(),
          result = ${tx.json(toJson({ message: "Cancelled by user." }))}
      where id = ${input.taskId} and org_id = ${input.orgId}
    `;

    await tx`
      update operator_steps
      set status = 'skipped',
          completed_at = coalesce(completed_at, now()),
          error = case
            when status in ('running','waiting_external')
              then 'Task cancelled while this step was in flight.'
            else error
          end
      where task_id = ${input.taskId}
        and org_id = ${input.orgId}
        and status not in ('completed','failed','skipped')
    `;

    await tx`
      update operator_approvals
      set status = 'expired', resolved_at = now(), resolved_by = ${input.userId}
      where task_id = ${input.taskId}
        and org_id = ${input.orgId}
        and status = 'pending'
    `;

    await tx`
      insert into operator_events (org_id, task_id, event_type, message, metadata)
      values (
        ${input.orgId}, ${input.taskId}, 'task.cancelled',
        'User cancelled the task.',
        ${tx.json(toJson({ actorUserId: input.userId }))}
      )
    `;
  });

  return getOperatorTask(input.orgId, input.taskId);
}
