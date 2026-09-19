import { db } from "@/lib/db";
import { toJson } from "@/lib/json";
import { hashIp, requestIp } from "@/lib/security";

export async function audit(input: {
  orgId?: string | null;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  request?: Request;
}) {
  const sql = db();
  const ipHash = input.request ? hashIp(requestIp(input.request)) : null;

  await sql`
    insert into audit_logs (org_id, actor_user_id, action, entity_type, entity_id, ip_hash, metadata)
    values (
      ${input.orgId ?? null},
      ${input.actorUserId ?? null},
      ${input.action},
      ${input.entityType},
      ${input.entityId ?? null},
      ${ipHash},
      ${sql.json(toJson(input.metadata ?? {}))}
    )
  `;
}
