import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Privacy",
  description: "Operator privacy principles for a trusted personal operations assistant.",
};

export default function PrivacyPage() {
  return (
    <div className="marketing-site trust-site">
      <header className="operator-public-nav">
        <Link href="/" aria-label="Operator home"><Logo /></Link>
        <nav><Link href="/pricing">Pricing</Link><Link href="/security">Security</Link><Link href="/signup" className="operator-nav-cta">Start delegating</Link></nav>
      </header>
      <main className="m-container trust-main">
        <div className="m-section-heading centered trust-heading">
          <div className="operator-kicker">Privacy principles</div>
          <h1>Your assistant should work for you, not advertise to you.</h1>
          <p>Operator is designed around explicit delegation, minimum necessary context, bounded authority, and an auditable record of external actions.</p>
        </div>
        <div className="trust-grid">
          <article><h2>User-aligned business model</h2><p>The core product is subscription funded. The product architecture does not require selling personal behavior or inserting paid merchant placement into task decisions.</p></article>
          <article><h2>Task-scoped execution</h2><p>External action, voice, email, and human providers receive the task context needed to execute a step; they do not receive database credentials.</p></article>
          <article><h2>Visible memory</h2><p>Long-lived preferences are stored separately from task execution so the product can distinguish remembered context from one-off instructions.</p></article>
          <article><h2>Explicit authority</h2><p>Consequential actions are either approved for a task or covered by a rule the user has granted. Unknown spending amounts do not inherit a spend cap automatically.</p></article>
          <article><h2>Auditable actions</h2><p>Task creation, execution, pauses, approvals, external waits, failures, and completion are stored as events so automation is not invisible.</p></article>
          <article><h2>Provider transparency</h2><p>The Connections view reports whether an execution provider is actually configured. A disconnected integration is never represented as live.</p></article>
        </div>
        <section className="pricing-note">This page describes the current product design. Commercial launch still requires finalized legal terms, retention policy, vendor DPAs, and jurisdiction-specific privacy review.</section>
      </main>
    </div>
  );
}
