import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Pricing",
  description: "Operator plans for personal operations, real-world execution, and human escalation.",
};

const plans = [
  {
    name: "Assistant",
    price: "$39",
    detail: "For personal planning and lighter execution.",
    items: ["Task planning and memory", "Reminders and follow-ups", "Calendar coordination", "Light connected actions"],
  },
  {
    name: "Operator",
    price: "$99",
    detail: "The core personal-operations product.",
    items: ["Everything in Assistant", "Outbound calls and hold time", "Bookings and browser actions", "Authority wallet and audit trail"],
  },
  {
    name: "Concierge",
    price: "$249",
    detail: "For complex workflows and higher task volume.",
    items: ["Everything in Operator", "Human exception escalation", "Complex travel and coordination", "Priority operations queue"],
  },
];

export default function PricingPage() {
  return (
    <div className="operator-marketing">
      <header className="operator-public-nav">
        <Link href="/" aria-label="Operator home"><Logo /></Link>
        <nav><Link href="/">Product</Link><Link href="/login">Sign in</Link><Link href="/signup" className="operator-nav-cta">Start delegating</Link></nav>
      </header>
      <main className="operator-public-pricing">
        <header>
          <span className="operator-kicker">Simple subscription pricing</span>
          <h1>Pay Operator to work for you.</h1>
          <p>The subscription is the alignment model. Operator is designed to serve the user rather than optimize for advertisements or merchant placement.</p>
        </header>
        <section className="operator-pricing-grid">
          {plans.map((plan) => (
            <article key={plan.name} className={plan.name === "Operator" ? "featured" : ""}>
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
