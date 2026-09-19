import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getCases, getDashboardSnapshot, getVirtualSnapshot } from "@/lib/data-access";

export const dynamic = "force-dynamic";
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (value: number | null) => value === null ? "—" : (value * 100).toFixed(1) + "%";

export default async function VirtualPage() {
  const session = await requireSession();
  const [virtual, dashboard, cases] = await Promise.all([
    getVirtualSnapshot(session.orgId),
    getDashboardSnapshot(session.orgId),
    getCases(session.orgId),
  ]);
  const virtualCases = cases.filter((item) => item.barrierCode.startsWith("virtual_") || ["technology","forgot","behind","caregiving","motivation","health","other"].includes(item.barrierCode)).filter((item) => !["resolved","closed"].includes(item.status));

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Anchor Virtual</div>
          <h1>Know who participated, why the record is supportable, and who needs help now.</h1>
          <p className="lede">Virtual attendance combines approved evidence, session participation, day-close adjudication, and a recovery queue—not passive login tracking or surveillance.</p>
        </div>
        <Link href="/attendance" className="secondary-link">Import virtual data</Link>
      </header>

      <section className="metric-grid">
        <article className="metric-card"><span>Virtual enrollment</span><strong>{number.format(virtual.enrollment)}</strong><small>Active students in virtual/hybrid delivery models</small></article>
        <article className="metric-card"><span>Today’s recorded attendance</span><strong>{pct(virtual.attendanceRate)}</strong><small>Based on today’s adjudicated daily records</small></article>
        <article className="metric-card"><span>Evidence coverage</span><strong>{pct(virtual.auditReadyRate)}</strong><small>Students with qualifying evidence today</small></article>
        <article className="metric-card accent"><span>Evidence exceptions</span><strong>{number.format(virtual.evidenceExceptions)}</strong><small>Potential records requiring follow-up today</small></article>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-heading"><div><div className="eyebrow">Evidence ledger</div><h2>Qualifying evidence today</h2></div></div>
          <div className="table-wrap">
            <table><thead><tr><th>Evidence type</th><th>Events</th><th>Students</th></tr></thead>
              <tbody>{virtual.evidenceSources.length ? virtual.evidenceSources.map((item) => (
                <tr key={item.type}><td>{item.type.replaceAll("_"," ")}</td><td>{item.records}</td><td>{item.students}</td></tr>
              )) : <tr><td colSpan={3}>No qualifying evidence has been loaded today.</td></tr>}</tbody>
            </table>
          </div>
        </article>
        <article className="panel resolution-panel">
          <div className="eyebrow">Show-Up Engine</div>
          <h2>Respond to a missed session before it becomes a pattern.</h2>
          <p className="muted-copy">Scheduled sessions and participation records can trigger reminders, missed-session cases, secure student barrier check-ins, and a named recovery owner.</p>
          <div className="resolution-summary"><div><strong>1</strong><span>detect</span></div><div><strong>2</strong><span>ask why</span></div><div><strong>3</strong><span>recover</span></div></div>
          <Link className="primary-link" href="/virtual/show-up">Open Show-Up Engine</Link>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><div className="eyebrow">Open virtual recovery work</div><h2>Students requiring a real intervention</h2></div></div>
        <div className="table-wrap">
          <table><thead><tr><th>Case</th><th>Student</th><th>Barrier</th><th>Next action</th><th>Due</th></tr></thead>
            <tbody>{virtualCases.length ? virtualCases.slice(0,20).map((item) => (
              <tr key={item.id}><td><Link className="text-link" href={"/cases/" + item.caseNumber}>{item.caseNumber}</Link></td><td>{item.studentName}</td><td>{item.barrierLabel}</td><td>{item.nextAction ?? "Define action"}</td><td>{item.dueAt ? new Date(item.dueAt).toLocaleString() : "—"}</td></tr>
            )) : <tr><td colSpan={5}>No open virtual recovery cases.</td></tr>}</tbody>
          </table>
        </div>
      </section>

      <section className="guardrail-card">
        <div><div className="eyebrow">Funding logic</div><h2>Virtual program and virtual campus economics are not interchangeable.</h2></div>
        <p>{dashboard.onePointGrossValue === null ? "Configure finance assumptions before displaying attendance-linked funding scenarios." : "The current organization-wide +1 point planning scenario is " + money.format(dashboard.onePointGrossValue) + ". Production finance logic must still distinguish the applicable delivery model and state rules."}</p>
      </section>
    </div>
  );
}
