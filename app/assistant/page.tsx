import { requireSession } from "@/lib/auth";
import { operatorOverview } from "@/lib/operator/service";
import OperatorConsole from "@/components/operator/OperatorConsole";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const session = await requireSession();
  const overview = await operatorOverview(session.orgId);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="operator-page">
      <header className="operator-page-header">
        <div>
          <span className="operator-kicker">Personal operations</span>
          <h1>{greeting}, {session.name.split(" ")[0]}.</h1>
          <p>Wafira keeps ownership of the work until there is a real reason to involve you.</p>
        </div>
        <div className="operator-trust-badge"><span />Bounded by your authority rules</div>
      </header>
      <section className="operator-metrics" aria-label="Workspace summary">
        <article><span>Active</span><strong>{overview.counts.active}</strong><small>tasks Wafira still owns</small></article>
        <article><span>Needs you</span><strong>{overview.approvals.length}</strong><small>decisions waiting for approval</small></article>
        <article><span>Waiting outside</span><strong>{overview.counts.waiting}</strong><small>calls, providers, or app callbacks</small></article>
        <article><span>Finished this week</span><strong>{overview.counts.completed_week}</strong><small>tasks fully closed</small></article>
      </section>
      <OperatorConsole tasks={overview.recent} approvals={overview.approvals} />
    </div>
  );
}
