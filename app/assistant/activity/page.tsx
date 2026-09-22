import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const session = await requireSession();
  const sql = db();
  const events = await sql<{
    id: number;
    task_id: string | null;
    event_type: string;
    message: string;
    created_at: string;
    title: string | null;
  }[]>`
    select e.id, e.task_id, e.event_type, e.message, e.created_at, t.title
    from operator_events e
    left join operator_tasks t on t.id = e.task_id
    where e.org_id = ${session.orgId}
    order by e.created_at desc
    limit 100
  `;

  return (
    <div className="operator-page">
      <header className="operator-page-header">
        <div>
          <span className="operator-kicker">Audit trail</span>
          <h1>Everything Wafira did.</h1>
          <p>No invisible autonomy. Actions, pauses, failures, approvals, and completions stay visible.</p>
        </div>
      </header>

      <section className="operator-section">
        <div className="operator-section-heading">
          <div><span className="operator-kicker">Latest</span><h2>Activity</h2></div>
          <span className="operator-count">{events.length}</span>
        </div>
        <div className="operator-activity-list">
          {events.length ? events.map((event) => (
            <article key={event.id}>
              <time>{new Date(event.created_at).toLocaleString()}</time>
              <div>
                <strong>{event.message}</strong>
                <span>{event.event_type.replaceAll("_", " ")}</span>
              </div>
              {event.task_id ? (
                <Link href={`/assistant/tasks/${event.task_id}`}>{event.title ?? "Open task"} →</Link>
              ) : null}
            </article>
          )) : (
            <div className="operator-empty">
              <strong>No activity yet.</strong>
              <span>Once Wafira starts working, the complete audit trail appears here.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
