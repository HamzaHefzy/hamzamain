import Link from "next/link";
import NewCaseForm from "@/components/NewCaseForm";
import { requireSession } from "@/lib/auth";
import { getCases } from "@/lib/data-access";

export const dynamic = "force-dynamic";

const queues = [
  { key: "do_now", label: "Do now" },
  { key: "stuck", label: "Stuck" },
  { key: "check_outcome", label: "Check outcome" },
] as const;

export default async function CasesPage() {
  const session = await requireSession();
  const cases = await getCases(session.orgId);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">ResolutionOS</div>
          <h1>Every barrier gets an owner, a commitment, and a follow-up.</h1>
          <p className="lede">The queue is operational: who needs action, what must happen, who owns it, and whether the support was actually delivered.</p>
        </div>
        <NewCaseForm />
      </header>

      <section className="queue-grid">
        {queues.map((queue) => {
          const items = cases.filter((item) => item.queue === queue.key && !["resolved","closed"].includes(item.status));
          return (
            <article className="queue-column" key={queue.key}>
              <div className="queue-title"><h2>{queue.label}</h2><span>{items.length}</span></div>
              <div className="case-stack">
                {items.length ? items.map((item) => (
                  <article className="case-card" key={item.id}>
                    <div className="case-topline"><strong>{item.caseNumber}</strong><span>{item.priority}</span></div>
                    <h3>{item.barrierLabel}</h3>
                    <p>{item.studentName} · {item.campusName ?? "No campus"} {item.grade ? "· Grade " + item.grade : ""}</p>
                    <dl>
                      <div><dt>Owner</dt><dd>{item.ownerName ?? "Unassigned"}</dd></div>
                      <div><dt>Next</dt><dd>{item.nextAction ?? "Define next action"}</dd></div>
                      <div><dt>Due</dt><dd>{item.dueAt ? new Date(item.dueAt).toLocaleString() : "Not set"}</dd></div>
                      <div><dt>Status</dt><dd>{item.status.replaceAll("_"," ")}</dd></div>
                    </dl>
                    <Link className="case-action" href={"/cases/" + item.caseNumber}>Open case</Link>
                  </article>
                )) : <p className="muted-copy">No cases in this queue.</p>}
              </div>
            </article>
          );
        })}
      </section>

      <section className="guardrail-card">
        <div><div className="eyebrow">Product guardrail</div><h2>No child gets a price tag.</h2></div>
        <p>Student-level prioritization is based on need, safety, urgency, actionability, and intervention evidence—not funding weight or modeled revenue.</p>
      </section>
    </div>
  );
}
