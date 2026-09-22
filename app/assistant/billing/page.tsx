import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import BillingButtons from "@/components/operator/BillingButtons";

export const dynamic = "force-dynamic";

const plans = [
  { id: "assistant" as const, name: "Assistant", price: "$39", description: "Planning, reminders, light execution and personal operations." },
  { id: "operator" as const, name: "Operator", price: "$99", description: "Calls, bookings, action runner, authority wallet and real-world execution." },
  { id: "concierge" as const, name: "Concierge", price: "$249", description: "Higher limits, complex workflows and human exception escalation." },
];

export default async function BillingPage() {
  const session = await requireSession();
  const sql = db();
  const [subscription] = await sql<{
    plan: string;
    status: string;
    current_period_end: string | null;
  }[]>\`
    select plan, status, current_period_end
    from operator_subscriptions
    where org_id = \${session.orgId}
    limit 1
  \`;

  return (
    <div className="operator-page">
      <header className="operator-page-header">
        <div>
          <span className="operator-kicker">Billing</span>
          <h1>Choose how much of life you want to delegate.</h1>
          <p>Subscriptions keep Operator aligned to you—not advertisers or merchants.</p>
        </div>
        <div className="operator-status-pill status-completed">
          {subscription ? \`\${subscription.plan} · \${subscription.status}\` : "trial"}
        </div>
      </header>

      <section className="operator-pricing-grid">
        {plans.map((plan) => (
          <article key={plan.id} className={plan.id === "operator" ? "featured" : ""}>
            <span className="operator-kicker">{plan.name}</span>
            <strong>{plan.price}<small>/month</small></strong>
            <p>{plan.description}</p>
            <BillingButtons plan={plan.id} />
          </article>
        ))}
      </section>
    </div>
  );
}
