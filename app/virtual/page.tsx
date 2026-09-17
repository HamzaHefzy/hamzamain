import Link from "next/link";
import {
  evidenceSources,
  virtualExceptions,
  virtualFunding,
  virtualProgram,
} from "@/lib/virtual";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export default function VirtualPage() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Anchor Virtual</div>
          <h1>Make every virtual attendance record defensible before the day closes.</h1>
          <p className="lede">
            Anchor combines LMS activity, teacher-student interactions, assignment evidence, policy rules, proactive show-up recovery, and ResolutionOS follow-through into one audit-ready virtual attendance workflow.
          </p>
        </div>
        <div className="data-badge">
          <span className="status-dot" aria-hidden="true" />
          Synthetic Chapter 30B program
        </div>
      </header>

      <section className="metric-grid" aria-label="Virtual attendance operating metrics">
        <article className="metric-card">
          <span>Virtual enrollment</span>
          <strong>{number.format(virtualProgram.enrollment)}</strong>
          <small>Illustrative full-time virtual program</small>
        </article>
        <article className="metric-card">
          <span>Current attendance</span>
          <strong>{(virtualProgram.attendanceRate * 100).toFixed(1)}%</strong>
          <small>Daily participation record</small>
        </article>
        <article className="metric-card">
          <span>Audit-ready records</span>
          <strong>{(virtualProgram.auditReadyRate * 100).toFixed(1)}%</strong>
          <small>Attendance records with supporting evidence</small>
        </article>
        <article className="metric-card accent">
          <span>Open evidence exceptions</span>
          <strong>{virtualProgram.evidenceExceptions}</strong>
          <small>{virtualProgram.interventionsDue} require action today</small>
        </article>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">Evidence ledger</div>
              <h2>Why each present record is supportable</h2>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <caption className="sr-only">Virtual attendance evidence sources</caption>
              <thead>
                <tr>
                  <th scope="col">Evidence source</th>
                  <th scope="col">Records today</th>
                  <th scope="col">Share</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {evidenceSources.map((item) => (
                  <tr key={item.source}>
                    <td>{item.source}</td>
                    <td>{number.format(item.records)}</td>
                    <td>{(item.share * 100).toFixed(0)}%</td>
                    <td>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel resolution-panel">
          <div className="eyebrow">From evidence to attendance recovery</div>
          <h2>Do not wait until tomorrow to discover today&apos;s no-show.</h2>
          <p className="muted-copy">
            Anchor first looks for approved evidence. If a student has not participated, the Show-Up Engine removes friction before class, asks what blocked participation after a miss, and escalates repeated disengagement to a named human owner.
          </p>
          <div className="resolution-summary">
            <div><strong>1</strong><span>prevent the miss</span></div>
            <div><strong>2</strong><span>recover today</span></div>
            <div><strong>3</strong><span>human rescue</span></div>
          </div>
          <Link className="primary-link" href="/virtual/show-up">Open Show-Up Engine</Link>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">Exception queue</div>
            <h2>Records that need a human or student intervention</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Virtual attendance exceptions requiring action</caption>
            <thead>
              <tr>
                <th scope="col">Case</th>
                <th scope="col">Issue</th>
                <th scope="col">Last valid signal</th>
                <th scope="col">Next action</th>
                <th scope="col">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {virtualExceptions.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.issue}</td>
                  <td>{item.lastSignal}</td>
                  <td>{item.nextAction}</td>
                  <td>{item.deadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="scenario-grid" aria-label="Virtual product value layers">
        <article className="scenario-card">
          <span>Show-up recovery</span>
          <strong>Same-day</strong>
          <small>Prevent avoidable misses, identify the barrier quickly, and recover instructional participation before the day closes.</small>
        </article>
        <article className="scenario-card">
          <span>Attendance evidence</span>
          <strong>Policy-aware</strong>
          <small>LMS progress, teacher interaction, assignment submission, and approved local evidence.</small>
        </article>
        <article className="scenario-card">
          <span>Audit support</span>
          <strong>Traceable</strong>
          <small>Preserve the evidence, rule applied, override reason, reviewer, and timestamp behind every adjudicated record.</small>
        </article>
        <article className="scenario-card">
          <span>Launch readiness</span>
          <strong>Chapter 30B</strong>
          <small>Track operating requirements, attendance policy, course certifications, authorization artifacts, and implementation milestones.</small>
        </article>
      </section>

      <section className="guardrail-card">
        <div>
          <div className="eyebrow">Funding logic matters</div>
          <h2>Program and campus economics are not the same.</h2>
        </div>
        <p>
          For an illustrative Texas virtual program with {number.format(virtualProgram.enrollment)} students, one attendance point equals about {number.format(virtualFunding.onePointAda)} ADA and {money.format(virtualFunding.onePointGrossProgramValue)} of gross Basic-Allotment scenario value. Full-time virtual campus funding follows a different Chapter 30B formula based on enrolled FTE and the host system&apos;s non-virtual attendance rate, so Anchor must never apply the program formula to a virtual campus.
        </p>
      </section>

      <section className="disclaimer">
        <strong>Virtual attendance disclaimer:</strong> production rules must follow the school system&apos;s approved instructional plan, current Texas law and agency guidance, and the applicable delivery model. Anchor should preserve evidence and explain rule application; it should never invent attendance evidence or convert mere platform presence into attendance unless the approved policy permits it.
      </section>
    </div>
  );
}
