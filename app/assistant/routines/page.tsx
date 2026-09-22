import { requireSession } from "@/lib/auth";
import { listOperatorRoutines } from "@/lib/operator/routines";
import RoutineEditor, { RoutineActions } from "@/components/operator/RoutineEditor";

export const dynamic = "force-dynamic";

export default async function RoutinesPage() {
  const session = await requireSession();
  const routines = await listOperatorRoutines(session.orgId);

  return (
    <div className="operator-page">
      <header className="operator-page-header">
        <div>
          <span className="operator-kicker">Proactive work</span>
          <h1>Stop remembering to ask.</h1>
          <p>Routines create real Operator tasks automatically. The same authority and approval rules still apply when a scheduled task reaches something consequential.</p>
        </div>
      </header>

      <section className="operator-section">
        <div className="operator-section-heading"><div><span className="operator-kicker">New routine</span><h2>Schedule an outcome</h2></div></div>
        <RoutineEditor />
      </section>

      <section className="operator-section">
        <div className="operator-section-heading"><div><span className="operator-kicker">Active automation</span><h2>Your routines</h2></div></div>
        <div className="operator-routine-list">
          {routines.length ? routines.map((routine) => (
            <article key={routine.id}>
              <div className="operator-routine-copy">
                <div className="operator-step-meta"><span>{routine.cadence}</span><span>{routine.enabled ? "active" : "paused"}</span></div>
                <strong>{routine.title}</strong>
                <p>{routine.request}</p>
                <small>
                  {"Next run: " + new Date(routine.next_run_at).toLocaleString()}
                  {routine.last_run_at ? " · Last run: " + new Date(routine.last_run_at).toLocaleString() : ""}
                </small>
              </div>
              <RoutineActions id={routine.id} enabled={routine.enabled} />
            </article>
          )) : <div className="operator-empty"><strong>No routines yet.</strong><span>Schedule the repetitive parts of your life once.</span></div>}
        </div>
      </section>
    </div>
  );
}
