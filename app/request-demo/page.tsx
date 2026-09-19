import Link from "next/link";
import Logo from "@/components/Logo";
import LeadForm from "@/components/LeadForm";

export const metadata = {
  title: "Request a demo",
  description: "Request an Anchor attendance operations working session.",
};

export default function RequestDemoPage() {
  return (
    <div className="public-form-page">
      <header className="public-form-header">
        <Link href="/" aria-label="Anchor home"><Logo /></Link>
        <Link href="/login" className="m-nav-secondary">Sign in</Link>
      </header>

      <main className="lead-layout">
        <section className="lead-copy">
          <div className="m-kicker">Working session, not a generic demo</div>
          <h1>Bring us the attendance workflow that is breaking.</h1>
          <p>
            We’ll focus the conversation on your actual operating problem: unresolved student barriers,
            virtual participation evidence, attendance-linked funding visibility, or the handoffs between them.
          </p>
          <div className="lead-proof-grid">
            <article><strong>District attendance</strong><span>Signal → barrier → owner → verified outcome.</span></article>
            <article><strong>Virtual schools</strong><span>Evidence adjudication + same-day re-engagement.</span></article>
            <article><strong>Finance</strong><span>Aggregate funding exposure without student-level dollar values.</span></article>
          </div>
        </section>
        <section className="lead-form-card">
          <h2>Tell us what you’re trying to fix.</h2>
          <LeadForm />
        </section>
      </main>
    </div>
  );
}
