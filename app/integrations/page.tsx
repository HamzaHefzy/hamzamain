import IntegrationForm from "@/components/IntegrationForm";
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
  }[]>\`
    select id, provider, name, status, public_config, last_sync_at, last_error
    from integrations
    where org_id = \${session.orgId}
    order by created_at desc
  \` : [];

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Integrations</div>
          <h1>Connect the systems schools already use.</h1>
          <p className="lede">
            Credentials are encrypted before storage. CSV works immediately; vendor API connections can be configured here as credentials and district approvals become available.
          </p>
        </div>
      </header>

      {!allowed ? (
        <section className="disclaimer">Administrator access is required to manage integrations.</section>
      ) : (
        <section className="two-column">
          <article className="panel">
            <div className="panel-heading"><div><div className="eyebrow">New connection</div><h2>Configure a data source</h2></div></div>
            <IntegrationForm />
          </article>
          <article className="panel">
            <div className="panel-heading"><div><div className="eyebrow">Connections</div><h2>Configured integrations</h2></div></div>
            <div className="case-stack">
              {rows.length ? rows.map((row) => (
                <div className="case-card" key={row.id}>
                  <div className="case-topline"><strong>{row.provider}</strong><span>{row.status}</span></div>
                  <h3>{row.name}</h3>
                  <p>{String(row.public_config?.baseUrl ?? "No public endpoint configured")}</p>
                  {row.last_error ? <small className="form-error">{row.last_error}</small> : null}
                </div>
              )) : <p className="muted-copy">No external integrations are configured yet. CSV imports remain available under Attendance.</p>}
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
