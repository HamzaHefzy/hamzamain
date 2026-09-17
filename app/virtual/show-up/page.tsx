import Link from "next/link";
import { interventionLadder, showUpMetrics, showUpQueue } from "@/lib/show-up";

const percent = (value: number) => `${(value * 100).toFixed(0)}%`;

export default function VirtualShowUpPage() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Anchor Virtual · Show-Up Engine</div>
          <h1>Recover the student before the absence becomes a pattern.</h1>
          <p className="lede">
            The Show-Up Engine removes friction before class, responds within minutes after a miss, identifies the actual barrier, and escalates repeated disengagement to one accountable adult. It is designed to recover instructional participation—not maximize notifications.
          </p>
        </div>
        <div className="data-badge">
          <span className="status-dot" aria-hidden="true" />
          Synthetic operating view
        </div>
      </header>

      <section className="metric-grid" aria-label="Virtual show-up recovery metrics">
        <article className="metric-card">
          <span>Live sessions in next 2 hours</span>
          <strong>{showUpMetrics.studentsWithLiveSessionNext2Hours}</strong>
          <small>Students with upcoming live instruction</small>
        </article>
        <article className="metric-card">
          <span>Need pre-session confirmation</span>
          <strong>{showUpMetrics.unconfirmedForNextSession}</strong>
          <small>Friction-removal queue, not a punitive risk list</small>
        </article>
        <article className="metric-card accent">
          <span>Recovered today</span>
          <strong>{showUpMetrics.sameDayRecoveries}</strong>
          <small>Returned to qualifying participation the same day</small>
        </article>
        <article className="metric-card">
          <span>Human outreach due</span>
          <strong>{showUpMetrics.humanOutreachDue}</strong>
          <small>Median synthetic recovery time: {showUpMetrics.medianRecoveryMinutes} min</small>
        </article>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">Intervention ladder</div>
            <h2>Escalate support, not punishment.</h2>
          </div>
          <Link className="text-link" href="/virtual">Back to Anchor Virtual</Link>
        </div>
        <div className="scenario-grid">
          {interventionLadder.map((step) => (
            <article className="scenario-card" key={step.window}>
              <span>{step.window}</span>
              <strong>{step.trigger}</strong>
              <small>{step.action}</small>
              <small><b>Goal:</b> {step.objective}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">Recovery queue</div>
            <h2>Each student gets the smallest intervention that fits the barrier.</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Virtual attendance recovery queue</caption>
            <thead>
              <tr>
                <th scope="col">Student</th>
                <th scope="col">Next session</th>
                <th scope="col">Recent attendance</th>
                <th scope="col">Barrier</th>
                <th scope="col">Routing</th>
                <th scope="col">Owner</th>
                <th scope="col">SLA</th>
              </tr>
            </thead>
            <tbody>
              {showUpQueue.map((item) => (
                <tr key={item.id}>
                  <td>{item.id} · Grade {item.grade}</td>
                  <td>{item.nextSession}</td>
                  <td>{percent(item.weeklyAttendanceRate)}</td>
                  <td>{item.barrier}</td>
                  <td>{item.routingLevel}</td>
                  <td>{item.owner}</td>
                  <td>{item.sla}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="two-column">
        <article className="panel">
          <div className="eyebrow">Why this can work</div>
          <h2>The product reacts to causes, not just absences.</h2>
          <div className="case-stack">
            {showUpQueue.slice(0, 4).map((item) => (
              <div className="case-card" key={`${item.id}-plan`}>
                <div className="case-topline">
                  <strong>{item.id}</strong>
                  <span>{item.routingLevel}</span>
                </div>
                <h3>{item.barrier}</h3>
                <p>{item.nextAction}</p>
                <dl>
                  <div><dt>Owner</dt><dd>{item.owner}</dd></div>
                  <div><dt>Deadline</dt><dd>{item.sla}</dd></div>
                  <div><dt>Fallback</dt><dd>{item.approvedFallback}</dd></div>
                </dl>
              </div>
            ))}
          </div>
        </article>

        <article className="panel resolution-panel">
          <div className="eyebrow">Operating rule</div>
          <h2>One miss should create one useful action.</h2>
          <p className="muted-copy">
            A student who forgot gets a friction fix. A student with broken internet gets technical support. A student who is overwhelmed gets a teacher plan. A student who is working or caring for family gets a schedule intervention. Repeated misses create a named human owner.
          </p>
          <p className="muted-copy">
            The system does not use webcams, keystroke monitoring, protected characteristics, or a black-box score to punish students. Routing is transparent and intended only to determine support intensity.
          </p>
          <Link className="primary-link" href="/cases">Open ResolutionOS</Link>
        </article>
      </section>

      <section className="guardrail-card">
        <div>
          <div className="eyebrow">Measure the intervention</div>
          <h2>Do not assume reminders work.</h2>
        </div>
        <p>
          Production pilots should measure same-day recovery, next-session attendance, seven-day attendance, successful human contact, intervention completion, and student/family opt-out or complaint rates. Hold out comparable students or use randomized rollout where feasible so Anchor can identify which interventions actually change attendance rather than merely correlate with it.
        </p>
      </section>

      <section className="disclaimer">
        <strong>Attendance rule:</strong> missing a synchronous class is not automatically the same as missing school. If the approved instructional plan permits another qualifying participation pathway, Anchor should route the student to that path and preserve the evidence rather than manufacture a synchronous-seat-time requirement.
      </section>
    </div>
  );
}
