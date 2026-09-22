import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Security",
  description: "Yumna security architecture and trust controls.",
};

export default function SecurityPage() {
  return (
    <div className="marketing-site trust-site">
      <header className="operator-public-nav">
        <Link href="/" aria-label="Yumna home"><Logo /></Link>
        <nav><Link href="/pricing">Pricing</Link><Link href="/privacy">Privacy</Link><Link href="/signup" className="operator-nav-cta">Start delegating</Link></nav>
      </header>
      <main className="m-container trust-main">
        <div className="m-section-heading centered trust-heading">
          <div className="operator-kicker">Security architecture</div>
          <h1>Autonomy needs a small blast radius.</h1>
          <p>Yumna separates identity, authority, execution, and audit so a useful assistant does not require unlimited permission.</p>
        </div>
        <div className="trust-grid">
          <article><h2>Workspace isolation</h2><p>Tasks, steps, approvals, authority rules, memories, connections, events, and subscriptions are scoped to a PostgreSQL workspace.</p></article>
          <article><h2>Signed sessions</h2><p>Authentication uses signed HTTP-only cookies and bcrypt password hashes. Server routes enforce authenticated workspace context and role permissions.</p></article>
          <article><h2>Default-deny authority</h2><p>Spending and other consequential actions pause when authorization is missing. Stored spending rules enforce declared caps.</p></article>
          <article><h2>Signed callbacks</h2><p>Each asynchronous execution step receives its own opaque callback credential. Tokens are hashed at rest, scoped to one step, revoked on terminal state, and callback events are replay-safe. Stripe events use timestamped HMAC verification.</p></article>
          <article><h2>Server-side secrets</h2><p>Provider credentials are read from server environment variables and are not embedded in browser bundles. External executors receive a narrow task contract.</p></article>
          <article><h2>Continuous verification</h2><p>GitHub CI runs dependency auditing, source checks, strict TypeScript, PostgreSQL migrations, tests, and a production Next.js build on proposed changes.</p></article>
        </div>
        <section className="pricing-note">Security architecture is not a certification claim. A commercial deployment still needs production secret management, HTTPS, backups, monitoring, incident response, vendor review, and independent security testing.</section>
      </main>
    </div>
  );
}
