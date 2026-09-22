import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Pricing",
  description: "Dexyra plans for connected personal operations and real-world execution.",
};

const plans = [
  {
    id: "assistant",
    name: "Assistant",
    price: "$39",
    detail: "Digital personal operations for planning and connected app work.",
    items: [
      "100 tasks per month",
      "5 active proactive routines",
      "Browser/API, email, and calendar execution",
      "Personal memory and audit history",
    ],
  },
  {
    id: "operator",
    name: "Dexyra",
    price: "$99",
    detail: "The complete real-world personal execution layer.",
    items: [
      "500 tasks per month",
      "20 active proactive routines",
      "Everything in Assistant",
      "Outbound calls, bookings, and authorized payment steps",
    ],
  },
  {
    id: "concierge",
    name: "Concierge",
    price: "$249",
    detail: "For complex workflows that sometimes need a person to finish.",
    items: [
      "2,000 tasks per month",
      "100 active proactive routines",
      "Everything in Dexyra",
      "Human exception escalation and priority operations",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="operator-marketing">
      <header className="operator-public-nav">
        <Link href="/" aria-label="Dexyra home"><Logo /></Link>
        <nav>
          <Link href="/">Product</Link>
          <Link href="/login">Sign in</Link>
          <Link href="/signup" className="operator-nav-cta">Start delegating</Link>
        </nav>
      </header>
      <main className="operator-public-pricing">
        <header>
          <span className="operator-kicker">Subscription pricing</span>
          <h1>Pay your right hand to work for you.</h1>
          <p>Plans control real execution capacity and capabilities—not cosmetic feature flags. Dexyra stays aligned to the user, not advertisers or merchants.</p>
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
