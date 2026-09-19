import { can, requireSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const session = await requireSession();
  if (!can(session.role, "admin")) {
    return (
      <div className="page-stack">
        <header className="page-header">
          <div className="page-header-copy">
            <div className="eyebrow">Audit</div>
            <h1>Administrative audit ledger</h1>
          </div>
        </header>
        <section className="disclaimer">Administrator access is required to review the audit ledger.</section>
      </div>
    );
  }

  const sql = db();
  const rows = await sql<{
    id: number;
    action: string;
    entity_type: string;
    entity_id: string | null;
    actor_name: string | null;
    actor_email: string | null;
    ip_hash: string | null;
    metadata: Record<string, unknown>;
    created_at: Date;
  }[]>`
    select a.id, a.action, a.entity_type, a.entity_id,
           u.name as actor_name, u.email as actor_email,
           a.ip_hash, a.metadata, a.created_at
    from audit_logs a
    left join users u on u.id = a.actor_user_id
    where a.org_id = ${session.orgId}
    order by a.created_at desc
    limit 250
  `;

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Audit</div>
          <h1>Who changed what, and when.</h1>
          <p className="lede">
            The ledger is organization-scoped and records security-sensitive and operational mutations.
            IP addresses are stored only as salted hashes.
          </p>
        </div>
        <div className="data-badge"><span className="status-dot" aria-hidden="true" />Latest 250 events</div>
      </header>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th></tr>
            </thead>
            <tbody>
              {rows.length ? rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.created_at.toLocaleString()}</td>
                  <td>{row.actor_name ?? "System"}{row.actor_email ? <><br /><small>{row.actor_email}</small></> : null}</td>
                  <td>{row.action}</td>
                  <td>{row.entity_type}{row.entity_id ? <><br /><small>{row.entity_id}</small></> : null}</td>
                  <td><code className="audit-metadata">{JSON.stringify(row.metadata)}</code></td>
                </tr>
              )) : <tr><td colSpan={5}>No audit events recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
