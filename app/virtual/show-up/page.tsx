import Link from "next/link";
import OperationsPanel from "@/components/OperationsPanel";
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
          <h1>Act while the class is still happening.</h1>
          <p className="lede">Anchor removes pre-class friction, opens a live rescue window when a student has not joined, escalates persistent misses to a human owner, and verifies the student returns.</p>
        </div>
        <Link href="/attendance" className="secondary-link">Import class schedule</Link>
      </header>

      <OperationsPanel />

      <section className="metric-grid">
        <article className="metric-card"><span>Sessions in next 2 hours</span><strong>{data.upcoming}</strong><small>Scheduled students awaiting participation</small></article>
        <article className="metric-card accent"><span>Live rescue now</span><strong>{data.liveRescueNow}</strong><small>Required sessions in progress with an urgent recovery case</small></article>
        <article className="metric-card"><span>Recovered today</span><strong>{data.recoveredToday}</strong><small>Participation restored after a miss</small></article>
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

      <section className="panel">
        <div className="panel-heading">
          <div><div className="eyebrow">Recovery protocol</div><h2>What happens around a live class</h2></div>
        </div>
        <div className="recovery-protocol">
          <div><time>T−30</time><strong>Remove friction</strong><span>Send the class link and a clear reminder before the session begins.</span></div>
          <div><time>T+5</time><strong>Join-now rescue</strong><span>If the student is still marked scheduled, send a direct join-now message and a secure help link.</span></div>
          <div><time>T+10</time><strong>Human escalation</strong><span>Open an urgent case so a navigator or school staff member can make live contact while instruction is still underway.</span></div>
          <div><time>Same day</time><strong>Resolve the barrier</strong><span>Route technology, academic overwhelm, caregiving, health, routine, or belonging issues to a specific next action.</span></div>
          <div><time>Next sessions</time><strong>Verify return</strong><span>Use participation and approved evidence to confirm re-engagement rather than counting outreach as success.</span></div>
        </div>
      </section>

      <section className="disclaimer"><strong>Operating rule:</strong> missing one synchronous session is not automatically equivalent to missing an instructional day. Anchor can route another approved participation pathway when the school’s active policy permits it, while preserving the evidence used for the decision.</section>
    </div>
  );
}
