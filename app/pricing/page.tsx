import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Pricing",
  description: "Anchor pricing for attendance operations and virtual-school participation recovery.",
};

const plans = [
  {
    name: "Anchor Core",
    price: "From $30K / year",
    detail: "District or network minimum",
    items: [
      "Attendance operations dashboard",
      "ResolutionOS cases and commitments",
      "CSV roster and attendance ingestion",
      "Aggregate funding-impact modeling",
      "Audit log and role-based access",
    ],
  },
  {
    name: "Anchor Virtual",
    price: "$12–$20 / virtual student",
    detail: "$30K annual minimum",
    items: [
      "Everything in Core",
      "Virtual evidence ledger",
      "Policy-aware attendance adjudication",
      "Same-day participation recovery",
      "Virtual exception and day-close automation",
    ],
  },
  {
    name: "Anchor Resolve",
    price: "Custom",
    detail: "Managed attendance operations",
    items: [
      "Technology + human operations",
      "Attendance navigator workflow",
      "Family/student outreach",
      "Case-resolution SLAs",
      "Outcome and workload reporting",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="marketing-site pricing-site">
      <header className="m-header">
        <div className="m-container m-nav-wrap">
          <Link href="/" className="m-brand"><Logo /></Link>
          <nav className="m-nav"><Link href="/">Product</Link><Link href="/virtual">Virtual schools</Link><Link href="/pricing">Pricing</Link></nav>
          <div className="m-nav-actions"><Link href="/login" className="m-nav-secondary">Sign in</Link><Link href="/request-demo" className="m-button dark compact">Request demo</Link></div>
        </div>
      </header>
      <main className="m-container pricing-main">
        <div className="m-section-heading centered pricing-heading">
          <div className="m-kicker">Pricing tied to operating value</div>
          <h1>Start with the attendance problem worth solving.</h1>
          <p>Annual contracts are scoped to enrollment, workflow complexity, integrations, and whether Anchor staff operate part of the recovery queue.</p>
        </div>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className="pricing-card" key={plan.name}>
              <span>{plan.name}</span>
              <h2>{plan.price}</h2>
              <p>{plan.detail}</p>
              <ul>{plan.items.map((item) => <li key={item}>{item}</li>)}</ul>
              <Link href="/request-demo" className="m-button dark">Discuss fit</Link>
            </article>
          ))}
        </div>
        <div className="pricing-note">
          Implementation, custom SIS/LMS integrations, and managed operations are scoped separately. Anchor does not charge based on an individual student’s modeled funding value.
        </div>
      </main>
    </div>
  );
}
