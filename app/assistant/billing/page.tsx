import { requireSession } from "@/lib/auth";
import BillingButtons from "@/components/operator/BillingButtons";
import BillingPortalButton from "@/components/operator/BillingPortalButton";
import { getOperatorEntitlements } from "@/lib/operator/entitlements";

export const dynamic = "force-dynamic";

const plans = [
  {
    id: "assistant" as const,
    name: "Assistant",
    price: "$39",
    description: "Planning, browser/API actions, email and calendar work.",
    detail: "100 tasks/month · 5 active routines",
  },
  {
    id: "operator" as const,
    name: "Operator",
    price: "$99",
    description: "Adds real-world calls, bookings and authorized payment steps.",
    detail: "500 tasks/month · 20 active routines",
  },
  {
    id: "concierge" as const,
    name: "Concierge",
    price: "$249",
    description: "Adds human exception escalation for workflows automation cannot finish safely.",
    detail: "2,000 tasks/month · 100 active routines",
  },
];

export default async function BillingPage() {
  const session = await requireSession();
  const entitlement = await getOperatorEntitlements(session.orgId);

  return (
    <div className="operator-page">
      <header className="operator-page-header">
        <div>
          <span className="operator-kicker">Billing</span>
          <h1>Choose how much of life you want to delegate.</h1>
          <p>Subscriptions keep Operator aligned to you—not advertisers or merchants—and control execution capacity directly.</p>
        </div>
        <div className="operator-billing-header-actions">
          <div className="operator-status-pill status-completed">
            {entitlement.plan + " · " + entitlement.status}
          </div>
          {entitlement.customerId ? <BillingPortalButton /> : null}
        </div>
      </header>

      <section className="operator-metrics">
        <article><span>Tasks this month</span><strong>{entitlement.usage.tasks}</strong><small>{"of " + entitlement.limits.monthlyTasks + " included"}</small></article>
        <article><span>Active routines</span><strong>{entitlement.usage.routines}</strong><small>{"of " + entitlement.limits.routines + " included"}</small></article>
        <article><span>Current plan</span><strong className="operator-plan-name">{entitlement.plan}</strong><small>{entitlement.status}</small></article>
        <article><span>Alignment</span><strong className="operator-plan-name">You</strong><small>No advertising-funded recommendations</small></article>
      </section>

      <section className="operator-pricing-grid">
        {plans.map((plan) => (
          <article key={plan.id} className={plan.id === "operator" ? "featured" : ""}>
            <span className="operator-kicker">{plan.name}</span>
            <strong>{plan.price}<small>/month</small></strong>
            <p>{plan.description}</p>
            <small className="operator-plan-detail">{plan.detail}</small>
            <BillingButtons plan={plan.id} />
          </article>
        ))}
      </section>
    </div>
  );
}
