import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getShowUpSnapshot } from "@/lib/show-up-service";

export const dynamic = "force-dynamic";

export default async function VirtualShowUpPage() {
  const session = await requireSession();
  const data = await getShowUpSnapshot(session.orgId);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Anchor Virtual · Show-Up Engine</div>
          <h1>Recover the student before the missed class becomes a pattern.</h1>
          <p className="lede">This view is driven by scheduled virtual sessions, recorded participation, missed-session automation, student barrier check-ins, and ResolutionOS follow-through.</p>
        </div>
        <Link href="/attendance" className="secondary-link">Import class schedule</Link>
      </header>

      <section className="metric-grid">
        <article className="metric-card"><span>Sessions in next 2 hours</span><strong>{data.upcoming}</strong><small>Scheduled students awaiting participation</small></article>
        <article className="metric-card"><span>Missed today</span><strong>{data.missedToday}</strong><small>Scheduled participation marked missed after session close</small></article>
        <article className="metric-card accent"><span>Recovered today</span><strong>{data.recoveredToday}</strong><small>Participation restored after a miss</small></article>
        <article className="metric-card"><span>Human action overdue</span><strong>{data.humanDue}</strong><small>Virtual recovery cases past their current SLA</small></article>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><div className="eyebrow">Recovery queue</div><h2>The smallest intervention that fits the barrier</h2></div><Link href="/cases" className="text-link">Open full ResolutionOS</Link></div>
        <div className="table-wrap">
          <table><thead><tr><th>Case</th><th>Student</th><th>Barrier</th><th>Priority</th><th>Next action</th><th>Due</th></tr></thead>
            <tbody>{data.queue.length ? data.queue.map((item) => (
              <tr key={item.caseNumber}>
                <td><Link className="text-link" href={"/cases/" + item.caseNumber}>{item.caseNumber}</Link></td>
                <td>{item.studentName} · {item.externalId}</td>
                <td>{item.barrierLabel}</td><td>{item.priority}</td>
                <td>{item.nextAction ?? "Awaiting barrier response"}</td>
                <td>{item.dueAt ? new Date(item.dueAt).toLocaleString() : "—"}</td>
              </tr>
            )) : <tr><td colSpan={6}>No active virtual recovery cases. Load session schedules and participation to begin automation.</td></tr>}</tbody>
          </table>
        </div>
      </section>

      <section className="scenario-grid">
        <article className="scenario-card"><span>Before class</span><strong>Remove friction</strong><small>Use actual scheduled sessions to deliver one useful reminder with the class link when messaging is configured.</small></article>
        <article className="scenario-card"><span>After a miss</span><strong>Ask why</strong><small>Create a case and secure check-in link so the student can name the barrier without exposing records.</small></article>
        <article className="scenario-card"><span>Barrier known</span><strong>Route support</strong><small>Technology, routines, academic overwhelm, caregiving, motivation, and other barriers receive different next actions.</small></article>
        <article className="scenario-card"><span>Outcome</span><strong>Verify return</strong><small>Session participation and qualifying evidence confirm whether the student actually re-engaged.</small></article>
      </section>

      <section className="disclaimer"><strong>Operating rule:</strong> missing one synchronous session is not automatically equivalent to missing an instructional day. Anchor can route another approved participation pathway when the school’s active policy permits it, while preserving the evidence used for the decision.</section>
    </div>
  );
}
