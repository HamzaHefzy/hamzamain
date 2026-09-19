import IntegrationForm from "@/components/IntegrationForm";
import IntegrationSyncButton from "@/components/IntegrationSyncButton";
import { can, requireSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const session = await requireSession();
  const allowed = can(session.role, "admin");
  const sql = db();
  const rows = allowed ? await sql<{
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
  ` : [];

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Integrations</div>
          <h1>Connect a real roster source without exposing credentials.</h1>
          <p className="lede">
            OneRoster is the enabled API connector. Its OAuth credentials are encrypted before storage. CSV remains the reliable fallback for roster, attendance, virtual evidence, and session participation.
          </p>
        </div>
      </header>

      {!allowed ? (
        <section className="disclaimer">Administrator access is required to manage integrations.</section>
      ) : (
        <section className="two-column">
          <article className="panel">
            <div className="panel-heading"><div><div className="eyebrow">OneRoster</div><h2>Configure roster sync</h2></div></div>
            <IntegrationForm />
          </article>
          <article className="panel">
            <div className="panel-heading"><div><div className="eyebrow">Connections</div><h2>Configured sources</h2></div></div>
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
              )) : <p className="muted-copy">No API integrations are configured yet. CSV imports remain available under Attendance.</p>}
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
