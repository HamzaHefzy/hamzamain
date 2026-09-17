import Link from "next/link";
import { campuses, cases, network } from "@/lib/data";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export default function DashboardPage() {
  const openCases = cases.length;
  const stuckCases = cases.filter((item) => item.queue === "Stuck").length;
  const dueToday = cases.filter((item) => item.due.toLowerCase().includes("today")).length;

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Executive overview</div>
          <h1>Attendance operations, funding impact, and student support in one view.</h1>
          <p className="lede">
            Anchor connects aggregate Texas ADA planning with the operational work required to remove attendance barriers. Finance stays at the campus or network level; student support stays focused on need.
          </p>
        </div>
        <div className="data-badge"><span className="status-dot" aria-hidden="true" />Synthetic data · 2026–27</div>
      </header>

      <section className="metric-grid" aria-label="Network attendance metrics">
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
          <span>Current ADA</span>
          <strong>{number.format(network.ada)}</strong>
          <small>Enrollment × attendance rate</small>
        </article>
        <article className="metric-card accent">
          <span>Gross value of +1 attendance point</span>
          <strong>{money.format(network.onePointGrossValue)}</strong>
          <small>Planning scenario, not guaranteed net state aid</small>
        </article>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">Campus performance</div>
              <h2>Where attendance is drifting</h2>
            </div>
            <Link href="/funding" className="text-link">Review funding model</Link>
          </div>
          <div className="table-wrap">
            <table>
              <caption className="sr-only">Campus enrollment, attendance rate, and ADA</caption>
              <thead>
                <tr>
                  <th scope="col">Campus</th>
                  <th scope="col">Enrollment</th>
                  <th scope="col">Attendance</th>
                  <th scope="col">ADA</th>
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

        <article className="panel resolution-panel">
          <div className="eyebrow">ResolutionOS</div>
          <h2>Work that can change tomorrow&apos;s attendance</h2>
          <div className="resolution-summary" aria-label="Resolution queue summary">
            <div><strong>{openCases}</strong><span>active demo cases</span></div>
            <div><strong>{stuckCases}</strong><span>stuck handoff</span></div>
            <div><strong>{dueToday}</strong><span>actions due today</span></div>
          </div>
          <p className="muted-copy">
            The queue tracks ownership, commitments, verification, and follow-through. It never displays a student-level dollar value.
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
