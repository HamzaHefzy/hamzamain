import { db } from "@/lib/db";
import { createOperatorTask, runOperatorTask } from "@/lib/operator/service";
import { assertRoutineCapacity } from "@/lib/operator/entitlements";

export type OperatorRoutine = {
  id: string;
  org_id: string;
  created_by: string | null;
  title: string;
  request: string;
  cadence: "daily" | "weekly";
  next_run_at: string;
  enabled: boolean;
  last_run_at: string | null;
  last_task_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function listOperatorRoutines(orgId: string) {
  const sql = db();
  return sql<OperatorRoutine[]>`
    select *
    from operator_routines
    where org_id = ${orgId}
    order by enabled desc, next_run_at asc
  `;
}

export async function createOperatorRoutine(input: {
  orgId: string;
  userId: string;
  title: string;
  request: string;
  cadence: "daily" | "weekly";
  firstRunAt: Date;
}) {
  if (!Number.isFinite(input.firstRunAt.getTime())) throw new Error("Invalid first run time.");
  if (input.firstRunAt.getTime() < Date.now() - 60_000) {
    throw new Error("First run time must be in the future.");
  }

  await assertRoutineCapacity(input.orgId);
  const sql = db();
  const [routine] = await sql<OperatorRoutine[]>`
    insert into operator_routines (
      org_id, created_by, title, request, cadence, next_run_at
    )
    values (
      ${input.orgId}, ${input.userId}, ${input.title}, ${input.request},
      ${input.cadence}, ${input.firstRunAt}
    )
    returning *
  `;
  return routine;
}

export async function setOperatorRoutineEnabled(orgId: string, routineId: string, enabled: boolean) {
  const sql = db();
  const [routine] = await sql<OperatorRoutine[]>`
    update operator_routines
    set enabled = ${enabled}, updated_at = now()
    where id = ${routineId} and org_id = ${orgId}
    returning *
  `;
  if (!routine) throw new Error("Routine not found.");
  return routine;
}

export async function deleteOperatorRoutine(orgId: string, routineId: string) {
  const sql = db();
  const result = await sql`
    delete from operator_routines
    where id = ${routineId} and org_id = ${orgId}
  `;
  return result.count > 0;
}

async function claimDueRoutines(limit = 25) {
  const sql = db();
  return sql<OperatorRoutine[]>`
    with due as (
      select id
      from operator_routines
      where enabled = true and next_run_at <= now()
      order by next_run_at
      limit ${limit}
      for update skip locked
    )
    update operator_routines r
    set last_run_at = now(),
        next_run_at = case
          when r.cadence = 'daily' then greatest(r.next_run_at, now()) + interval '1 day'
          else greatest(r.next_run_at, now()) + interval '7 days'
        end,
        updated_at = now()
    from due
    where r.id = due.id
    returning r.*
  `;
}

export async function runDueOperatorRoutines(limit = 25) {
  const claimed = await claimDueRoutines(limit);
  const sql = db();
  const results: Array<{ routineId: string; taskId?: string; status: string; error?: string }> = [];

  for (const routine of claimed) {
    if (!routine.created_by) {
      results.push({ routineId: routine.id, status: "skipped", error: "Routine owner no longer exists." });
      continue;
    }

    try {
      const task = await createOperatorTask({
        orgId: routine.org_id,
        userId: routine.created_by,
        request: routine.request,
        source: "automation",
      });
      await sql`
        update operator_routines
        set last_task_id = ${task.id}, updated_at = now()
        where id = ${routine.id}
      `;
      const finalTask = await runOperatorTask(routine.org_id, task.id);
      results.push({
        routineId: routine.id,
        taskId: task.id,
        status: finalTask?.status ?? "unknown",
      });
    } catch (error) {
      results.push({
        routineId: routine.id,
        status: "failed",
        error: error instanceof Error ? error.message : "Routine execution failed.",
      });
    }
  }

  return results;
}
