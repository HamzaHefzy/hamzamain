import { db } from "@/lib/db";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/auth-tokens";

export async function issueOperatorStepCallbackToken(input: {
  orgId: string;
  taskId: string;
  stepId: string;
}) {
  const sql = db();
  const { token, hash } = createOpaqueToken();

  const [updated] = await sql<{ id: string }[]>`
    update operator_steps
    set callback_token_hash = ${hash}
    where id = ${input.stepId}
      and task_id = ${input.taskId}
      and org_id = ${input.orgId}
      and status = 'running'
    returning id
  `;
  if (!updated) throw new Error("Execution step is no longer claimable.");
  return token;
}

export async function verifyOperatorStepCallbackToken(input: {
  taskId: string;
  stepId: string;
  token: string;
}) {
  const sql = db();
  const hash = hashOpaqueToken(input.token);
  const [match] = await sql<{ id: string }[]>`
    select id
    from operator_steps
    where id = ${input.stepId}
      and task_id = ${input.taskId}
      and callback_token_hash = ${hash}
      and status in ('running','waiting_external')
    limit 1
  `;
  return Boolean(match);
}

export async function clearOperatorStepCallbackToken(input: {
  orgId: string;
  taskId: string;
  stepId: string;
}) {
  const sql = db();
  await sql`
    update operator_steps
    set callback_token_hash = null
    where id = ${input.stepId}
      and task_id = ${input.taskId}
      and org_id = ${input.orgId}
  `;
}
