import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";

type IntegrationRow = {
  id: string;
  org_id: string;
  provider: string;
  public_config: Record<string, unknown>;
  encrypted_config: string | null;
};

type OneRosterSecrets = {
  clientId?: string;
  clientSecret?: string;
  bearerToken?: string;
};

type OneRosterOrg = {
  sourcedId: string;
  name: string;
  type?: string;
  identifier?: string;
};

type OneRosterUser = {
  sourcedId: string;
  givenName?: string;
  familyName?: string;
  email?: string;
  phone?: string;
  sms?: string;
  identifier?: string;
  grades?: string[];
  orgs?: { sourcedId?: string; href?: string }[];
};

function asString(value: unknown, key: string) {
  const result = typeof value === "string" ? value.trim() : "";
  if (!result) throw new Error("Missing integration setting: " + key);
  return result;
}

function joinUrl(base: string, path: string) {
  return base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
}

async function oneRosterToken(
  config: Record<string, unknown>,
  secrets: OneRosterSecrets,
) {
  if (secrets.bearerToken) return secrets.bearerToken;

  const tokenUrl = asString(config.tokenUrl, "tokenUrl");
  if (!secrets.clientId || !secrets.clientSecret) {
    throw new Error("OneRoster requires bearerToken or clientId/clientSecret.");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: secrets.clientId,
    client_secret: secrets.clientSecret,
  });
  if (typeof config.scope === "string" && config.scope) {
    body.set("scope", config.scope);
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const payload = await response.json() as {
    access_token?: string;
    error_description?: string;
    error?: string;
  };
  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description ??
      payload.error ??
      "OneRoster OAuth token request failed.",
    );
  }
  return payload.access_token;
}

async function fetchOneRosterPages<T>(
  url: string,
  token: string,
  collectionKeys: string[],
) {
  const limit = 500;
  const all: T[] = [];

  for (let page = 0; page < 100; page += 1) {
    const endpoint = new URL(url);
    endpoint.searchParams.set("limit", String(limit));
    endpoint.searchParams.set("offset", String(page * limit));

    const response = await fetch(endpoint, {
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    const payload = await response.json() as Record<string, unknown>;
    if (!response.ok) {
      throw new Error(
        typeof payload.message === "string"
          ? payload.message
          : "OneRoster request failed for " + endpoint.pathname,
      );
    }

    let batch: T[] = [];
    for (const key of collectionKeys) {
      if (Array.isArray(payload[key])) {
        batch = payload[key] as T[];
        break;
      }
    }

    all.push(...batch);
    if (batch.length < limit) break;
  }

  return all;
}

export async function syncOneRoster(integration: IntegrationRow) {
  const sql = db();
  const config = integration.public_config ?? {};
  const baseUrl = asString(config.baseUrl, "baseUrl");
  const secrets = integration.encrypted_config
    ? decryptSecret<OneRosterSecrets>(integration.encrypted_config)
    : {};
  const token = await oneRosterToken(config, secrets);

  const [orgs, students] = await Promise.all([
    fetchOneRosterPages<OneRosterOrg>(
      joinUrl(baseUrl, "orgs"),
      token,
      ["orgs"],
    ),
    fetchOneRosterPages<OneRosterUser>(
      joinUrl(baseUrl, "students"),
      token,
      ["users", "students"],
    ),
  ]);

  const campusBySourcedId = new Map<string, string>();
  let campusesUpserted = 0;
  let studentsUpserted = 0;

  await sql.begin(async (tx) => {
    for (const org of orgs) {
      if (!org.sourcedId || !org.name) continue;
      const code = (org.identifier || org.sourcedId).slice(0, 120);
      const [campus] = await tx<{ id: string }[]>`
        insert into campuses (
          org_id, name, code, delivery_model
        )
        values (
          ${integration.org_id}, ${org.name}, ${code}, 'in_person'
        )
        on conflict (org_id, code) do update
          set name = excluded.name,
              active = true,
              updated_at = now()
        returning id
      `;
      campusBySourcedId.set(org.sourcedId, campus.id);
      campusesUpserted += 1;
    }

    for (const student of students) {
      if (!student.sourcedId) continue;
      const orgRef = student.orgs?.find((item) => item.sourcedId)?.sourcedId;
      const campusId = orgRef ? campusBySourcedId.get(orgRef) ?? null : null;
      const firstName = student.givenName?.trim() || "Student";
      const lastName = student.familyName?.trim() || student.identifier?.trim() || student.sourcedId;
      const grade = student.grades?.[0] ?? null;

      await tx`
        insert into students (
          org_id, campus_id, external_id, first_name, last_name,
          grade, email, phone, metadata
        )
        values (
          ${integration.org_id}, ${campusId}, ${student.sourcedId},
          ${firstName}, ${lastName}, ${grade},
          ${student.email ?? null}, ${student.phone ?? student.sms ?? null},
          ${tx.json({ source: "oneroster", identifier: student.identifier ?? null })}
        )
        on conflict (org_id, external_id) do update
          set campus_id = coalesce(excluded.campus_id, students.campus_id),
              first_name = excluded.first_name,
              last_name = excluded.last_name,
              grade = excluded.grade,
              email = excluded.email,
              phone = excluded.phone,
              active = true,
              metadata = students.metadata || excluded.metadata,
              updated_at = now()
      `;
      studentsUpserted += 1;
    }
  });

  return { campusesUpserted, studentsUpserted };
}

export async function syncIntegration(orgId: string, integrationId: string) {
  const sql = db();
  const [integration] = await sql<IntegrationRow[]>`
    select id, org_id, provider, public_config, encrypted_config
    from integrations
    where id = ${integrationId} and org_id = ${orgId}
    limit 1
  `;
  if (!integration) throw new Error("Integration not found.");

  try {
    let stats: Record<string, unknown>;
    if (integration.provider === "oneroster") {
      stats = await syncOneRoster(integration);
    } else if (integration.provider === "csv") {
      throw new Error("CSV sources sync through the Attendance import workspace.");
    } else {
      throw new Error(
        "This provider is stored securely but does not have an enabled sync adapter yet. Use CSV/OneRoster or deploy a provider-specific adapter.",
      );
    }

    await sql`
      update integrations
      set status = 'active',
          last_sync_at = now(),
          last_error = null,
          updated_at = now()
      where id = ${integrationId} and org_id = ${orgId}
    `;

    return stats;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Integration sync failed.";
    await sql`
      update integrations
      set status = 'error',
          last_error = ${message},
          updated_at = now()
      where id = ${integrationId} and org_id = ${orgId}
    `;
    throw error;
  }
}
