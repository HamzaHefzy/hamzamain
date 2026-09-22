import { db } from "@/lib/db";
import { toJson } from "@/lib/json";
import { listPipedreamAccounts, pipedreamConfigured } from "@/lib/operator/pipedream";

export type OperatorMemory = {
  id: string;
  memory_key: string;
  value: Record<string, unknown>;
  sensitivity: "normal" | "private" | "restricted";
  source: string;
  confidence: string;
  updated_at: string;
};

export async function listOperatorMemories(orgId: string) {
  const sql = db();
  return sql<OperatorMemory[]>`
    select id, memory_key, value, sensitivity, source, confidence, updated_at
    from operator_memories
    where org_id = ${orgId}
    order by memory_key
  `;
}

export async function upsertOperatorMemory(input: {
  orgId: string;
  key: string;
  value: string;
  sensitivity: "normal" | "private" | "restricted";
}) {
  const sql = db();
  const [memory] = await sql<OperatorMemory[]>`
    insert into operator_memories (
      org_id, memory_key, value, sensitivity, source, confidence, last_confirmed_at
    )
    values (
      ${input.orgId}, ${input.key}, ${sql.json(toJson({ text: input.value }))},
      ${input.sensitivity}, 'user', 1, now()
    )
    on conflict (org_id, memory_key) do update set
      value = excluded.value,
      sensitivity = excluded.sensitivity,
      source = 'user',
      confidence = 1,
      last_confirmed_at = now(),
      updated_at = now()
    returning id, memory_key, value, sensitivity, source, confidence, updated_at
  `;
  return memory;
}

export async function deleteOperatorMemory(orgId: string, memoryId: string) {
  const sql = db();
  const result = await sql`
    delete from operator_memories
    where id = ${memoryId} and org_id = ${orgId}
  `;
  return result.count > 0;
}

export async function plannerContext(orgId: string) {
  const sql = db();
  const [profile] = await sql<{
    timezone: string;
    home_base: string | null;
    preferences: Record<string, unknown>;
  }[]>`
    select timezone, home_base, preferences
    from operator_profiles
    where org_id = ${orgId}
    limit 1
  `;

  const allowPrivate = process.env.OPERATOR_PLANNER_ALLOW_PRIVATE_CONTEXT === "true";
  const memories = await sql<{
    memory_key: string;
    value: Record<string, unknown>;
    sensitivity: "normal" | "private" | "restricted";
  }[]>`
    select memory_key, value, sensitivity
    from operator_memories
    where org_id = ${orgId}
      and sensitivity in ('normal', ${allowPrivate ? "private" : "normal"})
    order by updated_at desc
    limit 100
  `;

  const connectedApps = pipedreamConfigured()
    ? await listPipedreamAccounts(orgId).catch(() => [])
    : [];

  return {
    profile: profile ?? null,
    memories: memories.map((memory) => ({
      key: memory.memory_key,
      value: memory.value,
      sensitivity: memory.sensitivity,
    })),
    connectedApps: connectedApps.map((account) => ({
      app: account.app,
      accountId: account.id,
      name: account.name,
    })),
  };
}
