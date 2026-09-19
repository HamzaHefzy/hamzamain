import FundingSettingsForm from "@/components/FundingSettingsForm";
import { can, requireSession } from "@/lib/auth";
import { getDashboardSnapshot } from "@/lib/data-access";

export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const pct = (value: number | null) => value === null ? "—" : (value * 100).toFixed(1) + "%";

export default async function FundingPage() {
  const session = await requireSession();
  const snapshot = await getDashboardSnapshot(session.orgId);
  const editable = can(session.role, "finance");
  const allotment = snapshot.basicAllotment;

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Funding impact</div>
          <h1>Make attendance-linked financial exposure understandable.</h1>
          <p className="lede">This view is aggregate. It shows planning scenarios for {session.orgName}; it never assigns a revenue value to an individual child.</p>
        </div>
        <div className="data-badge"><span className="status-dot" aria-hidden="true" />{snapshot.schoolYear ?? "School year not configured"}</div>
      </header>

      <section className="metric-grid three">
        <article className="metric-card"><span>Current ADA scenario</span><strong>{snapshot.currentAda === null ? "—" : number.format(snapshot.currentAda)}</strong><small>Based on loaded attendance records</small></article>
        <article className="metric-card"><span>Gross base-formula scenario</span><strong>{snapshot.grossBaseFormulaValue === null ? "—" : money.format(snapshot.grossBaseFormulaValue)}</strong><small>ADA × configured Basic Allotment</small></article>
        <article className="metric-card accent"><span>+1 attendance point</span><strong>{snapshot.onePointGrossValue === null ? "—" : money.format(snapshot.onePointGrossValue)}</strong><small>≈ {number.format(snapshot.onePointAda)} additional ADA</small></article>
      </section>

      {editable ? (
        <section className="panel">
          <div className="panel-heading"><div><div className="eyebrow">Finance assumptions</div><h2>Control the scenario inputs</h2></div></div>
          <FundingSettingsForm schoolYear={snapshot.schoolYear ?? "2026-27"} basicAllotment={snapshot.basicAllotment} budgetedAttendanceRate={snapshot.budgetedAttendanceRate} />
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-heading"><div><div className="eyebrow">Scenario ladder</div><h2>Attendance movement under the configured formula</h2></div></div>
        <div className="scenario-grid">
          {[0.92,0.93,0.94,0.95].map((rate) => {
            const ada = snapshot.enrollment * rate;
            const value = allotment === null ? null : ada * allotment;
            return <article className="scenario-card" key={rate}><span>{(rate*100).toFixed(0)}% attendance</span><strong>{number.format(ada)} ADA</strong><small>{value === null ? "Set a Basic Allotment to calculate value." : money.format(value) + " gross base-formula scenario"}</small></article>;
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><div className="eyebrow">Campus view</div><h2>Aggregate attendance economics by campus</h2></div></div>
        <div className="table-wrap">
          <table><thead><tr><th>Campus</th><th>Enrollment</th><th>Attendance</th><th>Gross value of +1 point</th></tr></thead>
            <tbody>{snapshot.campuses.map((campus) => (
              <tr key={campus.id}><td>{campus.name}</td><td>{number.format(campus.enrollment)}</td><td>{pct(campus.attendanceRate)}</td><td>{allotment === null ? "—" : money.format(campus.enrollment * .01 * allotment)}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="disclaimer"><strong>Planning model:</strong> actual state aid can differ because of weights, recapture, local/state interactions, attendance-accounting rules, and program type. Anchor should be reconciled to the organization’s actual state funding circumstances before financial decisions are made.</section>
    </div>
  );
}
