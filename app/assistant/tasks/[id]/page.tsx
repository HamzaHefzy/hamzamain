import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getOperatorTask } from "@/lib/operator/service";
import TaskActions from "@/components/operator/TaskActions";

export const dynamic = "force-dynamic";

const pretty = (value: string) => value.replaceAll("_", " ");

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const task = await getOperatorTask(session.orgId, id);
  if (!task) notFound();

  return (
    <div className="operator-page">
      <Link href="/assistant" className="operator-back">← All tasks</Link>

      <header className="operator-task-header">
        <div>
          <span className="operator-kicker">{task.category}</span>
          <h1>{task.title}</h1>
          <p>{task.request}</p>
        </div>
        <div className={`operator-status-pill status-${task.status}`}>
          {pretty(task.status)}
        </div>
      </header>

      <TaskActions taskId={task.id} status={task.status} approvals={task.approvals} />

      <section className="operator-section">
        <div className="operator-section-heading">
          <div>
            <span className="operator-kicker">Execution plan</span>
            <h2>Every action, visible</h2>
          </div>
          <span className="operator-count">{task.steps.length}</span>
        </div>
        <div className="operator-timeline">
          {task.steps.map((step) => (
            <article key={step.id} className={`operator-step status-${step.status}`}>
              <div className="operator-step-index">
                {step.status === "completed" ? "✓" : step.sequence}
              </div>
              <div>
                <div className="operator-step-meta">
                  <span>{step.kind}</span>
                  <span>{pretty(step.status)}</span>
                  {step.provider ? <span>{step.provider}</span> : null}
                </div>
                <strong>{step.summary}</strong>
                {step.error ? <p className="operator-error">{step.error}</p> : null}
                {typeof step.response?.message === "string" ? <p>{step.response.message}</p> : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      {task.approvals.length ? (
        <section className="operator-section">
          <div className="operator-section-heading">
            <div><span className="operator-kicker">Control</span><h2>Approval history</h2></div>
          </div>
          <div className="operator-rule-list">
            {task.approvals.map((approval) => (
              <article key={approval.id}>
                <div>
                  <strong>{approval.summary}</strong>
                  <span>{pretty(approval.approval_type)}</span>
                </div>
                <span className={`operator-status-pill status-${approval.status}`}>{approval.status}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
