import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Pricing",
  description: "Wafira plans for connected personal operations and real-world execution.",
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
    name: "Wafira",
    price: "$99",
    detail: "The full real-world execution layer.",
    items: ["500 tasks per month","20 proactive routines","Everything in Assistant","Outbound calls, bookings, and approved payment steps"],
  },
  {
    id: "concierge",
    name: "Concierge",
    price: "$249",
    detail: "For complex workflows that sometimes need a person to finish.",
    items: ["2,000 tasks per month","100 proactive routines","Everything in Wafira","Human exception escalation and priority operations"],
  },
];

export default function PricingPage() {
  return (
    <div className="operator-marketing">
      <header className="operator-public-nav">
        <Link href="/" aria-label="Wafira home"><Logo /></Link>
        <nav><Link href="/">Product</Link><Link href="/login">Sign in</Link><Link href="/signup" className="operator-nav-cta">Start free</Link></nav>
      </header>
      <main className="operator-public-pricing">
        <header>
          <span className="operator-kicker">Simple subscription pricing</span>
          <h1>Pay Wafira to give you time back.</h1>
          <p>Plans control real execution capacity and capabilities. The business model is subscription-funded so Wafira stays aligned to you, not advertisers or merchants.</p>
        </header>
        <section className="operator-pricing-grid">
          {plans.map((plan) => (
            <article key={plan.id} className={plan.id === "operator" ? "featured" : ""}>
              <span className="operator-kicker">{plan.name}</span>
              <strong>{plan.price}<small>/month</small></strong>
              <p>{plan.detail}</p>
              <ul>{plan.items.map((item) => <li key={item}>{item}</li>)}</ul>
              <Link href="/signup">Start free</Link>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
