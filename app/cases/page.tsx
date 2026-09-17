import { cases } from "@/lib/data";

const queues = ["Do now", "Stuck", "Check outcome"] as const;

export default function CasesPage() {
  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <div className="eyebrow">ResolutionOS</div>
          <h1>Every barrier gets an owner</h1>
          <p className="lede">
            The operational view prioritizes unresolved commitments and follow-through. It intentionally contains no student-level financial values.
          </p>
        </div>
        <div className="data-badge">Synthetic students only</div>
      </header>

      <section className="queue-grid">
        {queues.map((queue) => {
          const queueCases = cases.filter((item) => item.queue === queue);
          return (
            <article className="queue-column" key={queue}>
              <div className="queue-title">
                <h2>{queue}</h2>
                <span>{queueCases.length}</span>
              </div>
              <div className="case-stack">
                {queueCases.map((item) => (
                  <div className="case-card" key={item.id}>
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
                    <button type="button">Open case</button>
                  </div>
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
          Student-level prioritization must be based on need, safety, urgency, actionability, and intervention evidence—not funding weight or modeled revenue.
        </p>
      </section>
    </div>
  );
}
