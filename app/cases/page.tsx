import type { Metadata } from "next";
import Link from "next/link";
import { cases } from "@/lib/data";

export const metadata: Metadata = {
  title: "ResolutionOS",
  description: "Operational attendance-resolution queues for active student-support cases.",
};

const queues = ["Do now", "Stuck", "Check outcome"] as const;

export default function CasesPage() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div className="page-header-copy">
          <div className="eyebrow">ResolutionOS</div>
          <h1>Every barrier gets an owner, a commitment, and a follow-up.</h1>
          <p className="lede">
            The operational view prioritizes unresolved commitments and verified follow-through. Student-level work is intentionally separated from the finance model.
          </p>
        </div>
        <div className="data-badge"><span className="status-dot" aria-hidden="true" />Synthetic students only</div>
      </header>

      <section className="queue-grid" aria-label="Attendance resolution queues">
        {queues.map((queue) => {
          const queueCases = cases.filter((item) => item.queue === queue);
          return (
            <article className="queue-column" key={queue}>
              <div className="queue-title">
                <h2>{queue}</h2>
                <span aria-label={`${queueCases.length} cases`}>{queueCases.length}</span>
              </div>
              <div className="case-stack">
                {queueCases.map((item) => (
                  <article className="case-card" key={item.id}>
                    <div className="case-topline">
                      <strong>{item.id}</strong>
                      <span>Grade {item.grade}</span>
                    </div>
                    <h3>{item.barrier}</h3>
                    <p>{item.campus}</p>
                    <dl>
                      <div><dt>Owner</dt><dd>{item.owner}</dd></div>
                      <div><dt>Commitment</dt><dd>{item.commitment}</dd></div>
                      <div><dt>Due</dt><dd>{item.due}</dd></div>
                      <div><dt>Status</dt><dd>{item.status}</dd></div>
                    </dl>
                    <Link className="case-action" href={`/cases/${item.id}`} aria-label={`Open case ${item.id}`}>
                      Review case
                    </Link>
                  </article>
                ))}
              </div>
            </article>
          );
        })}
      </section>

      <section className="guardrail-card">
        <div>
          <div className="eyebrow">Product guardrail</div>
          <h2>No child gets a price tag.</h2>
        </div>
        <p>
          Student-level prioritization is based on need, safety, urgency, actionability, and intervention evidence—not funding weight or modeled revenue.
        </p>
      </section>
    </div>
  );
}
