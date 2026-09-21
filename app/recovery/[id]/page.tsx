import Link from "next/link";
import { notFound } from "next/navigation";
import RecoveryEpisodeControls from "@/components/RecoveryEpisodeControls";
import { requireSession } from "@/lib/auth";
import { getMembers } from "@/lib/data-access";
import { getRecoveryEpisode } from "@/lib/recovery-detail";

type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export default async function RecoveryEpisodePage({ params }: Props) {
  const session = await requireSession();
  const { id } = await params;
  const [episode, members] = await Promise.all([
    getRecoveryEpisode(session.orgId, id),
    getMembers(session.orgId),
  ]);
  if (!episode) notFound();

  const recoveryMembers = members.filter((member) =>
    ["owner","admin","attendance","support"].includes(member.role),
  );
  const activePlan = episode.returnPlans.find((plan) => plan.status === "active");

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">Recovery Episode · {episode.episodeNumber}</div>
          <h1>{episode.studentName}</h1>
          <p className="lede">
            {episode.externalId} · {episode.campusName ?? "No campus"}{episode.grade ? " · Grade " + episode.grade : ""}.
            Recovery remains open until subsequent attendance demonstrates stability.
          </p>
        </div>
        <div className="data-badge">{episode.status.replaceAll("_"," ")} · {episode.tier}</div>
      </header>

      <section className="detail-grid">
        <article className="detail-card">
          <div className="eyebrow">Current trajectory</div>
          <h2>{episode.barrierLabel ?? "Barrier discovery needed"}</h2>
          <dl className="detail-list">
            <div><dt>Owner</dt><dd>{episode.ownerName ?? "Unassigned"}</dd></div>
            <div><dt>Tier</dt><dd>{episode.tier}</dd></div>
            <div><dt>Relapses</dt><dd>{episode.relapseCount}</dd></div>
            <div><dt>Opened</dt><dd>{new Date(episode.openedAt).toLocaleString()}</dd></div>
            <div><dt>Last signal</dt><dd>{new Date(episode.lastSignalAt).toLocaleString()}</dd></div>
            <div><dt>Source</dt><dd>{episode.source.replaceAll("_"," ")}</dd></div>
          </dl>
        </article>

        <article className="detail-card">
          <div className="eyebrow">Stabilization</div>
          <h2>{activePlan ? activePlan.successfulEvents + "/" + activePlan.targetEvents + " attended" : "Return Plan not active"}</h2>
          {activePlan ? (
            <>
              <p>{activePlan.observedEvents} events observed · {activePlan.requiredSuccesses} successful events required.</p>
              <div className="stability-meter" aria-label="Return Plan progress">
                <span style={{ width: Math.min(100, activePlan.observedEvents / activePlan.targetEvents * 100) + "%" }} />
              </div>
            </>
          ) : (
            <p>A case resolution should trigger a Return Plan so Anchor verifies the next instructional events instead of treating contact as recovery.</p>
          )}
          <Link className="secondary-link" href="/recovery">Back to Recovery Desk</Link>
        </article>
      </section>

      <RecoveryEpisodeControls
        episodeId={episode.id}
        status={episode.status}
        tier={episode.tier}
        ownerUserId={episode.ownerUserId}
        members={recoveryMembers}
        hasActivePlan={Boolean(activePlan)}
      />

      <section className="panel">
        <div className="panel-heading"><div><div className="eyebrow">Linked work</div><h2>Cases in this trajectory</h2></div></div>
        <div className="case-stack">
          {episode.cases.length ? episode.cases.map((item) => (
            <article className="case-card" key={item.id}>
              <div className="case-topline"><strong>{item.caseNumber}</strong><span>{item.status}</span></div>
              <h3>{item.barrierLabel}</h3>
              <p>{item.nextAction ?? "No next action"} · {item.ownerName ?? "Unassigned"}</p>
              <Link className="case-action" href={"/cases/" + item.caseNumber}>Open case</Link>
            </article>
          )) : <p className="muted-copy">No linked cases yet.</p>}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><div className="eyebrow">Return Plan history</div><h2>Did attendance actually stabilize?</h2></div></div>
        <div className="case-stack">
          {episode.returnPlans.length ? episode.returnPlans.map((plan) => (
            <article className="case-card" key={plan.id}>
              <div className="case-topline"><strong>{plan.status}</strong><span>{new Date(plan.startedAt).toLocaleString()}</span></div>
              <h3>{plan.successfulEvents}/{plan.targetEvents} successful · {plan.observedEvents} observed</h3>
              <div className="return-observations">
                {plan.observations.map((observation) => (
                  <span key={observation.eventType + observation.sourceId} className={observation.attended ? "observation success" : "observation miss"}>
                    {observation.attended ? "✓" : "×"} {observation.attendanceStatus}
                  </span>
                ))}
              </div>
            </article>
          )) : <p className="muted-copy">No Return Plans yet.</p>}
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading"><div><div className="eyebrow">Episode history</div><h2>Recovery timeline</h2></div></div>
        <div className="case-stack">
          {episode.events.map((event) => (
            <article className="case-card" key={event.id}>
              <div className="case-topline"><strong>{event.eventType.replaceAll("_"," ")}</strong><span>{new Date(event.createdAt).toLocaleString()}</span></div>
              <p>{event.note ?? "No note"}{event.actorName ? " · " + event.actorName : ""}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
