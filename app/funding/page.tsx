import { network, campuses } from "@/lib/data";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export default function FundingPage() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <div className="eyebrow">Funding Impact Engine</div>
          <h1>Turn attendance movement into a finance scenario</h1>
          <p className="lede">
            The first Texas model uses the 2026–27 Basic Allotment of ${network.basicAllotment.toLocaleString()} per ADA as a transparent planning input.
          </p>
        </div>
      </header>

      <section className="metric-grid three">
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
          <span>+1 attendance point</span>
          <strong>{money.format(network.onePointGrossValue)}</strong>
          <small>+{network.onePointAda.toFixed(0)} ADA in this network</small>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">Scenario ladder</div>
            <h2>What different attendance levels imply</h2>
          </div>
        </div>
        <div className="scenario-grid">
          {[0.92, 0.93, 0.94, 0.95].map((rate) => {
            const ada = network.enrollment * rate;
            const value = ada * network.basicAllotment;
            return (
              <div className="scenario-card" key={rate}>
                <span>{(rate * 100).toFixed(0)}% attendance</span>
                <strong>{ada.toLocaleString()} ADA</strong>
                <small>{money.format(value)} gross base-formula scenario</small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">Campus exposure</div>
            <h2>Aggregate finance view only</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Campus</th>
                <th>Attendance</th>
                <th>ADA</th>
                <th>Gross value of +1 point</th>
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
        <strong>Important:</strong> this is an aggregate planning model, not a claim that each incremental ADA produces exactly the displayed net cash amount. Production finance logic must incorporate the organization’s actual Texas FSP circumstances.
      </section>
    </div>
  );
}
