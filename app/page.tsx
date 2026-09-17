import Link from "next/link";
import { campuses, cases, network } from "@/lib/data";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export default function ExecutivePage() {
  const openCases = cases.length;
  const stuckCases = cases.filter((item) => item.queue === "Stuck").length;

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <div className="eyebrow">Executive command center</div>
          <h1>Attendance economics, without losing the student</h1>
          <p className="lede">
            This MVP combines aggregate Texas ADA/funding scenarios with an operational queue for resolving the barriers behind absence.
          </p>
        </div>
        <div className="data-badge">Synthetic data · 2026–27</div>
      </header>

      <section className="metric-grid">
        <article className="metric-card">
          <span>Enrollment</span>
          <strong>{number.format(network.enrollment)}</strong>
          <small>Network total</small>
        </article>
        <article className="metric-card">
          <span>Current attendance</span>
          <strong>{(network.attendanceRate * 100).toFixed(1)}%</strong>
          <small>Illustrative current rate</small>
        </article>
        <article className="metric-card">
          <span>ADA</span>
          <strong>{number.format(network.ada)}</strong>
          <small>Enrollment × attendance rate</small>
        </article>
        <article className="metric-card accent">
          <span>Gross value of +1 point</span>
          <strong>{money.format(network.onePointGrossValue)}</strong>
          <small>Basic-Allotment scenario, not guaranteed net aid</small>
        </article>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">Campus view</div>
              <h2>Where attendance is drifting</h2>
            </div>
            <Link href="/funding" className="text-link">Open funding model →</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Campus</th>
                  <th>Enrollment</th>
                  <th>Attendance</th>
                  <th>ADA</th>
                </tr>
              </thead>
              <tbody>
                {campuses.map((campus) => (
                  <tr key={campus.name}>
                    <td>{campus.name}</td>
                    <td>{number.format(campus.enrollment)}</td>
                    <td>{(campus.attendanceRate * 100).toFixed(1)}%</td>
                    <td>{number.format(campus.ada)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel dark-panel">
          <div className="eyebrow">ResolutionOS</div>
          <h2>What can change tomorrow?</h2>
          <div className="resolution-summary">
            <div><strong>{openCases}</strong><span>active demo cases</span></div>
            <div><strong>{stuckCases}</strong><span>stuck handoff</span></div>
            <div><strong>3</strong><span>actions due today</span></div>
          </div>
          <p className="muted-copy">
            Student-level workflows never display a dollar value. Financial impact stays aggregated at the campus or network level.
          </p>
          <Link href="/cases" className="primary-link">Open resolution queue</Link>
        </article>
      </section>

      <section className="disclaimer">
        <strong>Finance-model disclaimer:</strong> gross Basic-Allotment values are planning scenarios only. Actual Texas FSP impact can differ because of weights, recapture, local/state interactions, attendance-accounting rules, and other formula components.
      </section>
    </div>
  );
}
