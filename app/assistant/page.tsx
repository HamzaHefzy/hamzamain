import { requireSession } from "@/lib/auth";
import { operatorOverview } from "@/lib/operator/service";
import OperatorConsole from "@/components/operator/OperatorConsole";

export const dynamic = "force-dynamic";
export default async function AssistantPage() {
  const session = await requireSession(); const overview = await operatorOverview(session.orgId);
  return <div className="operator-page">
    <header className="operator-page-header"><div><span className="operator-kicker">Personal operations</span><h1>Good evening, {session.name.split(" ")[0]}.</h1><p>Dexyra owns the work until there is a real reason to involve you.</p></div><div className="operator-trust-badge"><span />Authority is bounded by your rules</div></header>
    <section className="operator-metrics"><article><span>Active</span><strong>{overview.counts.active}</strong><small>tasks Dexyra still owns</small></article><article><span>Waiting on you</span><strong>{overview.approvals.length}</strong><small>decisions requiring approval</small></article><article><span>Waiting outside</span><strong>{overview.counts.waiting}</strong><small>provider or connector callbacks</small></article><article><span>Finished this week</span><strong>{overview.counts.completed_week}</strong><small>tasks fully closed</small></article></section>
    <OperatorConsole tasks={overview.recent} approvals={overview.approvals} />
  </div>;
}
