import type { Metadata } from "next";
import { network, campuses } from "@/lib/data";

export const metadata: Metadata = {
  title: "Funding Impact",
  description: "Texas ADA and Basic-Allotment planning scenarios for Anchor.",
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function FundingPage() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Funding impact</div>
          <h1>Make the attendance-to-funding relationship explicit.</h1>
          <p className="lede">
            The Texas MVP uses the 2026–27 Basic Allotment of ${network.basicAllotment.toLocaleString()} per ADA as a transparent planning input. It is a scenario model, not a promise of net state aid.
          </p>
        </div>
        <div className="data-badge"><span className="status-dot" aria-hidden="true" />Aggregate finance view</div>
      </header>

      <section className="metric-grid three" aria-label="Funding metrics">
        <article className="metric-card">
          <span>Current ADA</span>
          <strong>{network.ada.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong>
          <small>Illustrative network ADA</small>
        </article>
        <article className="metric-card">
          <span>Gross base-formula scenario</span>
          <strong>{money.format(network.grossBaseFormulaValue)}</strong>
          <small>ADA × Basic Allotment</small>
        </article>
        <article className="metric-card accent">
          <span>Value of +1 attendance point</span>
          <strong>{money.format(network.onePointGrossValue)}</strong>
          <small>+{network.onePointAda.toFixed(0)} ADA in this network</small>
        </article>
      </section>

      <section className="formula-strip" aria-label="Funding formula">
        <strong>Planning formula</strong>
        <code>ADA = enrollment × attendance rate</code>
        <span>then</span>
        <code>gross base-formula value = ADA × Basic Allotment</code>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">Scenario ladder</div>
            <h2>How attendance movement changes the planning model</h2>
          </div>
        </div>
        <div className="scenario-grid">
          {[0.92, 0.93, 0.94, 0.95].map((rate) => {
            const ada = network.enrollment * rate;
            const value = ada * network.basicAllotment;
            return (
              <article className="scenario-card" key={rate}>
                <span>{(rate * 100).toFixed(0)}% attendance</span>
                <strong>{ada.toLocaleString()} ADA</strong>
                <small>{money.format(value)} gross base-formula scenario</small>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">Campus exposure</div>
            <h2>Compare aggregate attendance economics by campus</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Campus attendance and aggregate gross formula scenarios</caption>
            <thead>
              <tr>
                <th scope="col">Campus</th>
                <th scope="col">Attendance</th>
                <th scope="col">ADA</th>
                <th scope="col">Gross value of +1 point</th>
              </tr>
            </thead>
            <tbody>
              {campuses.map((campus) => (
                <tr key={campus.name}>
                  <td>{campus.name}</td>
                  <td>{(campus.attendanceRate * 100).toFixed(1)}%</td>
                  <td>{campus.ada.toFixed(0)}</td>
                  <td>{money.format(campus.enrollment * 0.01 * network.basicAllotment)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="disclaimer">
        <strong>Important:</strong> this is an aggregate planning model, not a claim that each incremental ADA produces exactly the displayed net cash amount. Production finance logic must incorporate the organization&apos;s actual Texas FSP circumstances.
      </section>
    </div>
  );
}
