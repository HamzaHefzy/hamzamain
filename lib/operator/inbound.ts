import { db } from "@/lib/db";

export async function claimInboundEvent(input: {
  provider: string;
  eventId: string;
  orgId: string;
  source: "sms" | "voice" | "email" | "api";
}) {
  const sql = db();
  const [row] = await sql<{ event_id: string }[]>`
    insert into operator_inbound_events (
      provider, event_id, org_id, source
    )
    values (
      ${input.provider}, ${input.eventId}, ${input.orgId}, ${input.source}
    )
    on conflict (provider, event_id) do nothing
    returning event_id
  `;
  return Boolean(row);
}

export async function attachInboundTask(input: {
  provider: string;
  eventId: string;
  taskId: string;
}) {
  const sql = db();
  await sql`
    update operator_inbound_events
    set task_id = ${input.taskId}
    where provider = ${input.provider}
      and event_id = ${input.eventId}
  `;
}

export async function releaseInboundEvent(input: {
  provider: string;
  eventId: string;
}) {
  const sql = db();
  await sql`
    delete from operator_inbound_events
    where provider = ${input.provider}
      and event_id = ${input.eventId}
      and task_id is null
  `;
}
