import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getDashboardSnapshot } from "@/lib/data-access";

export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const pct = (value: number | null) => value === null ? "—" : (value * 100).toFixed(1) + "%";

export default async function DashboardPage() {
  const session = await requireSession();
  const snapshot = await getDashboardSnapshot(session.orgId);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Executive overview</div>
          <h1>Good to see you, {session.name.split(" ")[0]}.</h1>
          <p className="lede">
            {session.orgName} now has one operating view for attendance, unresolved barriers,
            virtual participation, and aggregate funding impact.
          </p>
        </div>
        <div className="data-badge"><span className="status-dot" aria-hidden="true" />Live organization workspace</div>
      </header>

      <section className="metric-grid" aria-label="Organization attendance metrics">
        <article className="metric-card"><span>Active enrollment</span><strong>{number.format(snapshot.enrollment)}</strong><small>Across active campuses</small></article>
        <article className="metric-card"><span>Recorded attendance</span><strong>{pct(snapshot.attendanceRate)}</strong><small>Last 30 calendar days of loaded daily records</small></article>
        <article className="metric-card"><span>Current ADA scenario</span><strong>{snapshot.currentAda === null ? "—" : number.format(snapshot.currentAda)}</strong><small>Enrollment × recorded attendance</small></article>
        <article className="metric-card accent"><span>Gross value of +1 attendance point</span><strong>{snapshot.onePointGrossValue === null ? "—" : money.format(snapshot.onePointGrossValue)}</strong><small>Aggregate planning scenario only</small></article>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <div><div className="eyebrow">Campus performance</div><h2>Where attendance needs attention</h2></div>
            <Link href="/attendance" className="text-link">Manage attendance data</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Campus</th><th>Model</th><th>Enrollment</th><th>Recorded attendance</th></tr></thead>
              <tbody>
                {snapshot.campuses.length ? snapshot.campuses.map((campus) => (
                  <tr key={campus.id}>
                    <td>{campus.name}</td><td>{campus.deliveryModel.replaceAll("_"," ")}</td>
                    <td>{number.format(campus.enrollment)}</td><td>{pct(campus.attendanceRate)}</td>
                  </tr>
                )) : <tr><td colSpan={4}>No campuses are configured yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel resolution-panel">
          <div className="eyebrow">ResolutionOS</div>
          <h2>Attendance only improves when the next action happens.</h2>
          <div className="resolution-summary">
            <div><strong>{snapshot.openCases}</strong><span>open cases</span></div>
            <div><strong>{snapshot.stuckCases}</strong><span>stuck handoffs</span></div>
            <div><strong>{snapshot.dueToday}</strong><span>due or overdue</span></div>
          </div>
          <p className="muted-copy">Student-level work stays separate from financial valuation. Cases are prioritized by need, urgency, and actionability.</p>
          <Link href="/cases" className="primary-link">Open ResolutionOS</Link>
        </article>
      </section>

      <section className="scenario-grid">
        <Link className="scenario-card" href="/attendance"><span>Data operations</span><strong>Attendance</strong><small>Roster, daily attendance, and participation imports.</small></Link>
        <Link className="scenario-card" href="/virtual"><span>Virtual schools</span><strong>Evidence</strong><small>Policy-aware participation and exception resolution.</small></Link>
        <Link className="scenario-card" href="/virtual/show-up"><span>Recovery operations</span><strong>Show-Up</strong><small>Miss detection, check-ins, and same-day intervention.</small></Link>
        <Link className="scenario-card" href="/funding"><span>Finance</span><strong>Funding impact</strong><small>Aggregate scenario modeling and assumptions.</small></Link>
      </section>
    </div>
  );
}
