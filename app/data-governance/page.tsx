import DataGovernanceControls from "@/components/DataGovernanceControls";
import { can, requireSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DataGovernancePage() {
  const session = await requireSession();
  if (!can(session.role, "admin")) {
    return (
      <div className="page-stack">
        <header className="page-header">
          <div className="page-header-copy">
            <div className="eyebrow">Data governance</div>
            <h1>Student records and roster status</h1>
          </div>
        </header>
        <section className="disclaimer">Administrator access is required to use data-governance tools.</section>
      </div>
    );
  }

  const sql = db();
  const [counts] = await sql<{
    active_students: string;
    inactive_students: string;
  }[]>`
    select
      count(*) filter (where active = true)::text as active_students,
      count(*) filter (where active = false)::text as inactive_students
    from students
    where org_id = ${session.orgId}
  `;

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Data governance</div>
          <h1>Export records without bypassing the audit trail.</h1>
          <p className="lede">
            Use organization-scoped tools for student record export and reversible roster deactivation.
            Contract-specific deletion and retention requirements should be approved before destructive purge automation is enabled.
          </p>
        </div>
      </header>

      <section className="metric-grid three">
        <article className="metric-card">
          <span>Active students</span>
          <strong>{Number(counts?.active_students ?? 0).toLocaleString()}</strong>
          <small>Included in active roster workflows</small>
        </article>
        <article className="metric-card">
          <span>Inactive students</span>
          <strong>{Number(counts?.inactive_students ?? 0).toLocaleString()}</strong>
          <small>Historical records preserved</small>
        </article>
        <article className="metric-card accent">
          <span>Export access</span>
          <strong>Admin</strong>
          <small>Every student export is written to the audit ledger</small>
        </article>
      </section>

      <DataGovernanceControls />

      <section className="disclaimer">
        <strong>Retention boundary:</strong> deactivation is not deletion. Hard deletion should follow the district’s approved retention schedule and contractual/legal requirements, with preserved evidence of the authorized request.
      </section>
    </div>
  );
}
