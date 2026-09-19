import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getEvidenceSnapshot } from "@/lib/evidence";

export const dynamic = "force-dynamic";

const pct = (value: number | null) => value === null ? "—" : (value * 100).toFixed(1) + "%";
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });

export default async function EvidencePage() {
  const session = await requireSession();
  const evidence = await getEvidenceSnapshot(session.orgId);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Anchor Evidence</div>
          <h1>Show whether the attendance operation is actually executing.</h1>
          <p className="lede">
            This view separates operational execution from observed attendance movement.
            Before/after changes are descriptive and are never presented as causal impact without a valid comparison design.
          </p>
        </div>
        <Link href="/api/evidence/export" className="secondary-link">Export executive CSV</Link>
      </header>

      <section className="metric-grid">
        <article className="metric-card">
          <span>Resolved cases · 90 days</span>
          <strong>{evidence.resolvedCases90d}</strong>
          <small>Cases with a recorded resolution timestamp</small>
        </article>
        <article className="metric-card">
          <span>Average first action</span>
          <strong>{evidence.averageFirstActionHours === null ? "—" : number.format(evidence.averageFirstActionHours) + "h"}</strong>
          <small>Case opened → first recorded action</small>
        </article>
        <article className="metric-card">
          <span>Average resolution time</span>
          <strong>{evidence.averageResolutionHours === null ? "—" : number.format(evidence.averageResolutionHours) + "h"}</strong>
          <small>Opened → resolved</small>
        </article>
        <article className="metric-card accent">
          <span>Verified commitment rate</span>
          <strong>{pct(evidence.commitmentCompletionRate)}</strong>
          <small>Verified completed commitments · 90 days</small>
        </article>
      </section>

      <section className="metric-grid">
        <article className="metric-card">
          <span>On-time commitment rate</span>
          <strong>{pct(evidence.commitmentOnTimeRate)}</strong>
          <small>Verified on or before due time</small>
        </article>
        <article className="metric-card">
          <span>Overdue commitments</span>
          <strong>{evidence.overdueCommitments}</strong>
          <small>Pending or blocked past due</small>
        </article>
        <article className="metric-card">
          <span>Stuck / overdue cases</span>
          <strong>{evidence.stuckOpenCases} / {evidence.openCasesPastDue}</strong>
          <small>Queue bottlenecks / cases past current due time</small>
        </article>
        <article className="metric-card accent">
          <span>Virtual recovery conversion · 30 days</span>
          <strong>{pct(evidence.virtualRecoveryRate)}</strong>
          <small>{evidence.recoveredVirtualSessions30d} recovered · {evidence.missedVirtualSessions30d} still missed</small>
        </article>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">Observed attendance movement</div>
              <h2>Before vs. after resolved cases</h2>
            </div>
          </div>
          <div className="resolution-summary">
            <div><strong>{evidence.evaluatedCases}</strong><span>cases with enough data</span></div>
            <div><strong>{pct(evidence.averageObservedAttendanceChange)}</strong><span>average observed rate change</span></div>
            <div><strong>{number.format(evidence.observedAdditionalAttendedDays)}</strong><span>observed additional attended days</span></div>
          </div>
          <p className="muted-copy">
            A case is included only when at least three recorded student-days exist in both the 14-day pre-resolution and 14-day post-resolution windows.
          </p>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">Barrier mix</div>
              <h2>What is driving case volume</h2>
            </div>
          </div>
          <div className="case-stack">
            {evidence.barriers.length ? evidence.barriers.map((barrier) => (
              <div className="case-card" key={barrier.label}>
                <div className="case-topline"><strong>{barrier.label}</strong><span>{barrier.count}</span></div>
              </div>
            )) : <p className="muted-copy">No cases in the last 90 days.</p>}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">Campus operating performance</div>
            <h2>Where execution is getting stuck</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Campus</th><th>Opened</th><th>Resolved</th><th>Avg resolution</th>
                <th>Verified commitments</th><th>Overdue commitments</th><th>Observed change</th>
              </tr>
            </thead>
            <tbody>
              {evidence.campusPerformance.length ? evidence.campusPerformance.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.opened}</td>
                  <td>{pct(row.resolutionRate)}</td>
                  <td>{row.averageResolutionHours === null ? "—" : number.format(row.averageResolutionHours) + "h"}</td>
                  <td>{pct(row.verificationRate)}</td>
                  <td>{row.overdueCommitments}</td>
                  <td>{row.evaluatedCases ? pct(row.averageObservedAttendanceChange) : "—"}</td>
                </tr>
              )) : <tr><td colSpan={7}>No campus case activity in the last 90 days.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">Barrier performance</div>
            <h2>Which barriers resolve cleanly—and which need a better playbook</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Barrier</th><th>Opened</th><th>Resolved</th><th>Avg resolution</th>
                <th>Verified commitments</th><th>Overdue commitments</th><th>Observed change</th>
              </tr>
            </thead>
            <tbody>
              {evidence.barrierPerformance.length ? evidence.barrierPerformance.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.opened}</td>
                  <td>{pct(row.resolutionRate)}</td>
                  <td>{row.averageResolutionHours === null ? "—" : number.format(row.averageResolutionHours) + "h"}</td>
                  <td>{pct(row.verificationRate)}</td>
                  <td>{row.overdueCommitments}</td>
                  <td>{row.evaluatedCases ? pct(row.averageObservedAttendanceChange) : "—"}</td>
                </tr>
              )) : <tr><td colSpan={7}>No barrier activity in the last 90 days.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">Case-level evidence</div>
            <h2>Observed post-resolution attendance</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Case</th><th>Campus</th><th>Barrier</th><th>Resolved</th><th>Pre</th><th>Post</th><th>Observed change</th></tr></thead>
            <tbody>
              {evidence.cohorts.length ? evidence.cohorts.slice(0,50).map((row) => (
                <tr key={row.caseNumber}>
                  <td>{row.caseNumber}</td>
                  <td>{row.campusName ?? "Unassigned"}</td>
                  <td>{row.barrierLabel}</td>
                  <td>{new Date(row.resolvedAt).toLocaleDateString()}</td>
                  <td>{pct(row.preRate)} · {row.preDays} days</td>
                  <td>{pct(row.postRate)} · {row.postDays} days</td>
                  <td>{row.observedChange >= 0 ? "+" : ""}{pct(row.observedChange)}</td>
                </tr>
              )) : <tr><td colSpan={7}>Resolve cases and accumulate post-resolution attendance to populate this analysis.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="disclaimer">
        <strong>Evidence standard:</strong> execution metrics are operational facts. Before/after attendance movement is descriptive, not causal.
        Use matched comparison groups, staggered rollouts, or randomized intervention assignment when a district wants an attributable impact estimate.
      </section>
    </div>
  );
}
