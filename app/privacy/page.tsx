import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Privacy",
  description: "Anchor student-data privacy principles.",
};

export default function PrivacyPage() {
  return (
    <div className="marketing-site trust-site">
      <header className="m-header">
        <div className="m-container m-nav-wrap">
          <Link href="/" className="m-brand"><Logo /></Link>
          <nav className="m-nav"><Link href="/pricing">Pricing</Link><Link href="/security">Security</Link></nav>
          <div className="m-nav-actions"><Link href="/login" className="m-nav-secondary">Sign in</Link><Link href="/request-demo" className="m-button dark compact">Request demo</Link></div>
        </div>
      </header>

      <main className="m-container trust-main">
        <div className="m-section-heading centered trust-heading">
          <div className="m-kicker">Privacy principles</div>
          <h1>Use the minimum data needed to resolve attendance barriers.</h1>
          <p>Anchor separates student-support decisions from financial modeling and is designed to preserve evidence without turning students into surveillance targets.</p>
        </div>

        <div className="trust-grid">
          <article><h2>Purpose limitation</h2><p>Student-level data is used for attendance operations, approved participation evidence, support coordination, and outcome measurement. Finance views remain aggregate.</p></article>
          <article><h2>No student price tag</h2><p>Anchor does not display a modeled revenue value for an individual student and does not prioritize support based on funding weight.</p></article>
          <article><h2>Customer-controlled sources</h2><p>Roster, attendance, virtual evidence, messaging, and integration data are loaded from customer-approved sources. Anchor does not invent attendance evidence.</p></article>
          <article><h2>Record access</h2><p>Administrators can create audited exports of the records Anchor holds for a specific student. Roster deactivation is reversible and preserves history.</p></article>
          <article><h2>Retention</h2><p>Hard deletion must follow the district’s approved retention schedule and contractual/legal requirements. The current product deliberately avoids an automatic destructive purge without that authorization.</p></article>
          <article><h2>Student check-ins</h2><p>Recovery check-ins ask for the attendance barrier and an optional note. The product explicitly discourages entering private medical detail when it is not needed for routing support.</p></article>
        </div>

        <section className="pricing-note">
          This page describes product behavior, not a substitute for a district-specific data processing agreement, FERPA analysis, state-law review, or legal privacy notice.
        </section>
      </main>
    </div>
  );
}
