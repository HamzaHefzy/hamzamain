import Link from "next/link";
import { notFound } from "next/navigation";
import CaseEditor from "@/components/CaseEditor";
import { requireSession } from "@/lib/auth";
import { getCase, getMembers } from "@/lib/data-access";

type Props = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

export default async function CaseDetailPage({ params }: Props) {
  const session = await requireSession();
  const { id } = await params;
  const [item, members] = await Promise.all([
    getCase(session.orgId, id),
    getMembers(session.orgId),
  ]);
  if (!item) notFound();

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">ResolutionOS · {item.caseNumber}</div>
          <h1>{item.barrierLabel}</h1>
          <p className="lede">{item.studentName} · {item.campusName ?? "No campus"} {item.grade ? "· Grade " + item.grade : ""}. This operational record contains no student-level financial valuation.</p>
        </div>
        <div className="data-badge"><span className="status-dot" aria-hidden="true" />{item.status.replaceAll("_"," ")}</div>
      </header>

      <section className="detail-grid">
        <article className="detail-card">
          <div className="eyebrow">Case details</div><h2>Current state</h2>
          <dl className="detail-list">
            <div><dt>Student ID</dt><dd>{item.externalStudentId}</dd></div>
            <div><dt>Barrier</dt><dd>{item.barrierLabel}</dd></div>
            <div><dt>Priority</dt><dd>{item.priority}</dd></div>
            <div><dt>Owner</dt><dd>{item.ownerName ?? "Unassigned"}</dd></div>
            <div><dt>Due</dt><dd>{item.dueAt ? new Date(item.dueAt).toLocaleString() : "Not set"}</dd></div>
            <div><dt>Recovery Episode</dt><dd>{item.recoveryEpisodeId ? <Link className="text-link" href={"/recovery/" + item.recoveryEpisodeId}>{item.recoveryEpisodeNumber ?? "Open trajectory"}</Link> : "Not linked"}</dd></div>
          </dl>
        </article>
        <article className="detail-card">
          <div className="eyebrow">Current next action</div><h2>What must happen next</h2>
          <p>{item.nextAction ?? "No next action is defined yet."}</p>
          <Link className="secondary-link" href="/cases">Back to queue</Link>
        </article>
      </section>

      <CaseEditor
        caseId={item.id}
        caseNumber={item.caseNumber}
        status={item.status}
        queue={item.queue}
        priority={item.priority}
        ownerUserId={item.ownerUserId}
        nextAction={item.nextAction}
        dueAt={item.dueAt}
        members={members}
        commitments={item.commitments}
      />

      <section className="panel">
        <div className="panel-heading"><div><div className="eyebrow">Audit trail</div><h2>Case activity</h2></div></div>
        <div className="case-stack">
          {item.events.length ? item.events.map((event) => (
            <div className="case-card" key={event.id}>
              <div className="case-topline"><strong>{event.event_type.replaceAll("_"," ")}</strong><span>{new Date(event.created_at).toLocaleString()}</span></div>
              <p>{event.note ?? "No note"} {event.actor_name ? "· " + event.actor_name : ""}</p>
            </div>
          )) : <p className="muted-copy">No events recorded yet.</p>}
        </div>
      </section>
    </div>
  );
}
