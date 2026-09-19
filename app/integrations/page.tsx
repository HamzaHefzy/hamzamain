import ApiKeyManager from "@/components/ApiKeyManager";
import IntegrationForm from "@/components/IntegrationForm";
import IntegrationSyncButton from "@/components/IntegrationSyncButton";
import { can, requireSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const session = await requireSession();
  const allowed = can(session.role, "admin");
  const sql = db();

  const [rows, apiKeys] = allowed ? await Promise.all([
    sql<{
      id: string;
      provider: string;
      name: string;
      status: string;
      public_config: Record<string, unknown>;
      last_sync_at: Date | null;
      last_error: string | null;
    }[]>`
      select id, provider, name, status, public_config, last_sync_at, last_error
      from integrations
      where org_id = ${session.orgId}
      order by created_at desc
    `,
    sql<{
      id: string;
      name: string;
      key_prefix: string;
      scopes: string[];
      active: boolean;
      expires_at: Date | null;
      last_used_at: Date | null;
      created_at: Date;
      created_by_name: string | null;
    }[]>`
      select k.id, k.name, k.key_prefix, k.scopes, k.active,
             k.expires_at, k.last_used_at, k.created_at,
             u.name as created_by_name
      from api_keys k
      left join users u on u.id = k.created_by
      where k.org_id = ${session.orgId}
      order by k.active desc, k.created_at desc
    `,
  ]) : [[], []];

  const apiKeyRows = apiKeys.map((key) => ({
    id: key.id,
    name: key.name,
    prefix: key.key_prefix,
    scopes: key.scopes,
    active: key.active,
    expiresAt: key.expires_at?.toISOString() ?? null,
    lastUsedAt: key.last_used_at?.toISOString() ?? null,
    createdAt: key.created_at.toISOString(),
    createdBy: key.created_by_name,
  }));

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Integrations</div>
          <h1>Connect roster data and automate virtual participation evidence.</h1>
          <p className="lede">
            OneRoster synchronizes roster structure. The inbound Virtual Evidence API lets an approved
            LMS or district pipeline submit participation events with a scoped, revocable key. CSV remains
            the reliable fallback for roster, attendance, evidence, and session participation.
          </p>
        </div>
      </header>

      {!allowed ? (
        <section className="disclaimer">Administrator access is required to manage integrations and API credentials.</section>
      ) : (
        <>
          <section className="two-column">
            <article className="panel">
              <div className="panel-heading">
                <div><div className="eyebrow">OneRoster</div><h2>Configure roster sync</h2></div>
              </div>
              <IntegrationForm />
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div><div className="eyebrow">Connections</div><h2>Configured roster sources</h2></div>
              </div>
              <div className="case-stack">
                {rows.length ? rows.map((row) => (
                  <div className="case-card" key={row.id}>
                    <div className="case-topline"><strong>{row.provider}</strong><span>{row.status}</span></div>
                    <h3>{row.name}</h3>
                    <p>{String(row.public_config?.baseUrl ?? "No public endpoint configured")}</p>
                    <p>{row.last_sync_at ? "Last sync: " + row.last_sync_at.toLocaleString() : "Not synced yet"}</p>
                    {row.provider === "oneroster" ? <IntegrationSyncButton id={row.id} provider={row.provider} /> : null}
                    {row.last_error ? <small className="form-error">{row.last_error}</small> : null}
                  </div>
                )) : (
                  <p className="muted-copy">No roster API integrations are configured yet. CSV imports remain available under Attendance.</p>
                )}
              </div>
            </article>
          </section>

          <ApiKeyManager apiKeys={apiKeyRows} />

          <section className="disclaimer">
            <strong>Evidence API rule:</strong> callers submit evidence, not attendance decisions. Anchor
            evaluates each event against the policy effective for that date and will not overwrite an
            official SIS attendance record with API evidence.
          </section>
        </>
      )}
    </div>
  );
}
