import { db } from "@/lib/db";
import {
  hashApiKey,
  looksLikeIntegrationApiKey,
} from "@/lib/api-key-token";

export type ApiKeyScope = "virtual_evidence:write";

export type IntegrationApiKeySession = {
  keyId: string;
  orgId: string;
  orgName: string;
  orgTimezone: string;
  keyName: string;
  keyPrefix: string;
  scopes: ApiKeyScope[];
};

export async function authenticateIntegrationApiKey(
  request: Request,
  requiredScope: ApiKeyScope,
): Promise<IntegrationApiKeySession | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length).trim();
  if (!looksLikeIntegrationApiKey(token)) return null;

  const sql = db();
  const [row] = await sql<{
    key_id: string;
    org_id: string;
    org_name: string;
    org_timezone: string;
    key_name: string;
    key_prefix: string;
    scopes: ApiKeyScope[];
  }[]>`
    select k.id as key_id,
           k.org_id,
           o.name as org_name,
           o.timezone as org_timezone,
           k.name as key_name,
           k.key_prefix,
           k.scopes
    from api_keys k
    join organizations o on o.id = k.org_id
    where k.key_hash = ${hashApiKey(token)}
      and k.active = true
      and (k.expires_at is null or k.expires_at > now())
      and o.status in ('active','trial')
      and ${requiredScope} = any(k.scopes)
    limit 1
  `;

  if (!row) return null;

  await sql`
    update api_keys
    set last_used_at = now(),
        updated_at = now()
    where id = ${row.key_id}
  `;

  return {
    keyId: row.key_id,
    orgId: row.org_id,
    orgName: row.org_name,
    orgTimezone: row.org_timezone,
    keyName: row.key_name,
    keyPrefix: row.key_prefix,
    scopes: row.scopes,
  };
}
