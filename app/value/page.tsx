import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getValueRealizationSnapshot } from "@/lib/value-realization";

export const dynamic = "force-dynamic";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const moneyPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export default async function ValuePage() {
  const session = await requireSession();
  const { dashboard, evidence, value } = await getValueRealizationSnapshot(session.orgId);
  const configured = value.annualAnchorCost !== null;

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Value realization</div>
          <h1>Make the renewal conversation measurable without inventing ROI.</h1>
          <p className="lede">
            Anchor separates operating efficiency, observed attendance movement, and aggregate funding scenarios.
            No student-level dollar value is calculated, and observed attendance change is not treated as caused by Anchor.
          </p>
        </div>
        <Link href="/api/value/export" className="secondary-link">Export renewal CSV</Link>
      </header>

      {!configured ? (
        <section className="disclaimer">
          <strong>Annual contract cost is not configured.</strong>{" "}
          A finance user can enter the customer&apos;s actual annual Anchor contract cost under{" "}
          <Link href="/funding" className="text-link">Funding</Link>. Until then, efficiency and break-even metrics remain blank.
        </section>
      ) : null}

      <section className="metric-grid">
        <article className="metric-card">
          <span>Annual Anchor contract</span>
          <strong>{value.annualAnchorCost === null ? "—" : money.format(value.annualAnchorCost)}</strong>
          <small>Customer-entered finance assumption</small>
        </article>
        <article className="metric-card">
          <span>90-day allocated cost</span>
          <strong>{value.allocatedCost90d === null ? "—" : money.format(value.allocatedCost90d)}</strong>
          <small>Annual cost × 90 / 365</small>
        </article>
        <article className="metric-card">
          <span>Resolved cases · 90 days</span>
          <strong>{value.resolvedCases90d}</strong>
          <small>{value.costPerResolvedCase === null ? "Cost unavailable" : money.format(value.costPerResolvedCase) + " allocated cost / resolved case"}</small>
        </article>
        <article className="metric-card accent">
          <span>Verified commitments · 90 days</span>
          <strong>{value.verifiedCommitments90d}</strong>
          <small>{value.costPerVerifiedCommitment === null ? "Cost unavailable" : money.format(value.costPerVerifiedCommitment) + " allocated cost / verified commitment"}</small>
        </article>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">Operational value</div>
              <h2>What the customer can verify directly</h2>
            </div>
          </div>
          <div className="resolution-summary">
            <div><strong>{evidence.resolvedCases90d}</strong><span>resolved cases · 90d</span></div>
            <div><strong>{evidence.verifiedCommitments90d}</strong><span>verified commitments · 90d</span></div>
            <div><strong>{evidence.recoveredVirtualSessions30d}</strong><span>virtual recoveries · 30d</span></div>
          </div>
          <p className="muted-copy">
            These are execution records from Anchor&apos;s case, commitment, and virtual participation ledgers.
          </p>
          <Link href="/evidence" className="primary-link">Open Evidence</Link>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">Observed attendance movement</div>
              <h2>Useful context, not attributed impact</h2>
            </div>
          </div>
          <div className="resolution-summary">
            <div><strong>{number.format(evidence.observedAdditionalAttendedDays)}</strong><span>observed additional attended days</span></div>
            <div><strong>{evidence.evaluatedCases}</strong><span>cases with enough pre/post data</span></div>
            <div><strong>{value.costPerObservedAdditionalAttendedDay === null ? "—" : moneyPrecise.format(value.costPerObservedAdditionalAttendedDay)}</strong><span>allocated cost / observed additional day</span></div>
          </div>
          <p className="muted-copy">
            The denominator is descriptive before/after movement among evaluated resolved cases. It is not a causal estimate and should not be presented as a return generated by Anchor.
          </p>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">Break-even planning</div>
            <h2>How small an attendance movement equals the annual contract cost in the gross scenario?</h2>
          </div>
        </div>
        <div className="metric-grid three">
          <article className="metric-card">
            <span>Gross value of +1 attendance point</span>
            <strong>{value.onePointGrossValue === null ? "—" : money.format(value.onePointGrossValue)}</strong>
            <small>Aggregate planning scenario from Funding</small>
          </article>
          <article className="metric-card accent">
            <span>Break-even attendance movement</span>
            <strong>{value.breakEvenAttendancePoints === null ? "—" : number.format(value.breakEvenAttendancePoints) + " points"}</strong>
            <small>Annual contract cost ÷ modeled gross value of one point</small>
          </article>
          <article className="metric-card">
            <span>Equivalent ADA in scenario</span>
            <strong>{value.breakEvenAda === null ? "—" : number.format(value.breakEvenAda)}</strong>
            <small>One-point ADA × break-even attendance points</small>
          </article>
        </div>
        <div className="disclaimer">
          <strong>Planning only:</strong> this is not an ROI claim and not a forecast of net state aid.
          Actual funding can differ because of program weights, recapture, local/state interactions, attendance-accounting rules, and delivery model.
          The break-even calculation only asks what aggregate gross formula movement would numerically equal the annual contract cost.
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">Renewal evidence</div>
            <h2>What to put in front of the customer</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Evidence</th><th>Current value</th><th>Interpretation</th></tr></thead>
            <tbody>
              <tr><td>Resolved attendance cases</td><td>{evidence.resolvedCases90d}</td><td>Verified workflow output over the last 90 days</td></tr>
              <tr><td>Verified commitments</td><td>{evidence.verifiedCommitments90d}</td><td>Supports actually marked completed and verified</td></tr>
              <tr><td>Average first action</td><td>{evidence.averageFirstActionHours === null ? "—" : number.format(evidence.averageFirstActionHours) + "h"}</td><td>Operational responsiveness</td></tr>
              <tr><td>Average resolution time</td><td>{evidence.averageResolutionHours === null ? "—" : number.format(evidence.averageResolutionHours) + "h"}</td><td>Case-cycle efficiency</td></tr>
              <tr><td>Virtual recoveries</td><td>{evidence.recoveredVirtualSessions30d}</td><td>Required virtual sessions moved from miss to recovery</td></tr>
              <tr><td>Observed additional attended days</td><td>{number.format(evidence.observedAdditionalAttendedDays)}</td><td>Descriptive before/after movement; not causal</td></tr>
              <tr><td>Annual contract cost</td><td>{value.annualAnchorCost === null ? "—" : money.format(value.annualAnchorCost)}</td><td>Customer-entered commercial assumption</td></tr>
              <tr><td>Break-even attendance movement</td><td>{value.breakEvenAttendancePoints === null ? "—" : number.format(value.breakEvenAttendancePoints) + " points"}</td><td>Aggregate gross planning threshold, not realized revenue</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="disclaimer">
        <strong>Renewal standard:</strong> lead with verified operational outcomes. Use observed attendance movement as descriptive context.
        Use funding only as a transparent planning scenario. Do not claim attributable financial return unless the district has a defensible impact design and finance reconciliation.
      </section>
    </div>
  );
}
