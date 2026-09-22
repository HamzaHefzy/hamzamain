import Link from "next/link";
import PublicNav from "@/components/marketing/PublicNav";
import PublicFooter from "@/components/marketing/PublicFooter";

export const metadata = {
  title: "Pricing",
  description: "Yumna plans for connected personal operations and real-world execution.",
};

const plans = [
  {
    id: "assistant",
    name: "Assistant",
    price: "$39",
    detail: "Digital life admin, research, and connected app work.",
    items: ["100 tasks per month","5 proactive routines","Browser/API, email, calendar, and Places execution","Personal memory and audit history"],
  },
  {
    id: "operator",
    name: "Yumna",
    price: "$99",
    detail: "The full real-world execution layer.",
    items: ["500 tasks per month","20 proactive routines","Everything in Assistant","Outbound calls, bookings, and approved payment steps"],
  },
  {
    id: "concierge",
    name: "Concierge",
    price: "$249",
    detail: "For complex workflows that sometimes need a person to finish.",
    items: ["2,000 tasks per month","100 proactive routines","Everything in Yumna","Human exception escalation and priority operations"],
  },
];

export default function PricingPage() {
  return (
    <div className="y-public-site">
      <PublicNav />
      <main className="y-content-page">
        <section className="y-page-hero centered">
          <span className="y-eyebrow">Pricing</span>
          <h1>Pay for execution, not another chat window.</h1>
          <p>Plans control actual task capacity and execution capability. Yumna is subscription-funded so the product stays aligned to you rather than advertisers or merchants.</p>
        </section>
        <section className="operator-pricing-grid y-public-pricing-grid">
          {plans.map((plan) => (
            <article key={plan.id} className={plan.id === "operator" ? "featured" : ""}>
              <span className="y-eyebrow">{plan.name}</span>
              <strong>{plan.price}<small>/month</small></strong>
              <p>{plan.detail}</p>
              <ul>{plan.items.map((item) => <li key={item}>{item}</li>)}</ul>
              <Link href="/signup">Start free</Link>
            </article>
          ))}
        </section>
        <div className="y-pricing-footnote">Provider usage, telephony, and external service costs may require separate connected accounts or future usage-based allowances depending on deployment.</div>
      </main>
      <PublicFooter />
    </div>
  );
}
