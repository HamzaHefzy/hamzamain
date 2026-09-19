import Link from "next/link";
import Logo from "@/components/Logo";

export const metadata = {
  title: "Security",
  description: "Anchor security and student-data design principles.",
};

export default function SecurityPage() {
  return (
    <div className="marketing-site trust-site">
      <header className="m-header">
        <div className="m-container m-nav-wrap">
          <Link href="/" className="m-brand"><Logo /></Link>
          <nav className="m-nav"><Link href="/pricing">Pricing</Link><Link href="/privacy">Privacy</Link></nav>
          <div className="m-nav-actions"><Link href="/login" className="m-nav-secondary">Sign in</Link><Link href="/request-demo" className="m-button dark compact">Request demo</Link></div>
        </div>
      </header>

      <main className="m-container trust-main">
        <div className="m-section-heading centered trust-heading">
          <div className="m-kicker">Security by operating design</div>
          <h1>Student support data deserves a narrow blast radius.</h1>
          <p>Anchor is built around organization isolation, least-privilege access, auditability, and explicit evidence rather than surveillance.</p>
        </div>

        <div className="trust-grid">
          <article><h2>Organization isolation</h2><p>Customer records are scoped by organization across users, students, campuses, attendance, cases, imports, integrations, and audit events.</p></article>
          <article><h2>Role-based access</h2><p>Owner, admin, attendance, finance, support, and viewer roles separate operational responsibilities. Membership revocation applies to one organization rather than globally disabling a multi-organization user.</p></article>
          <article><h2>Credential protection</h2><p>Integration secrets are encrypted before database storage. Authentication sessions use signed HTTP-only cookies, and passwords are stored as bcrypt hashes.</p></article>
          <article><h2>Auditability</h2><p>Administrative and operational mutations are written to an organization-scoped audit ledger. Student exports are audited, and source IPs are stored only as salted hashes.</p></article>
          <article><h2>Safer virtual attendance</h2><p>Anchor relies on approved instructional evidence, not webcam monitoring, keystroke logging, facial recognition, GPS tracking, or continuous device surveillance.</p></article>
          <article><h2>Deployment boundary</h2><p>Production customers still require an approved DPA/privacy review, retention terms, authorized SIS/LMS credentials, HTTPS, encrypted database backups, and customer-approved messaging configuration.</p></article>
        </div>

        <section className="pricing-note">
          Security documentation in the repository describes the implementation baseline. Contractual compliance representations must match the customer deployment and completed review; Anchor does not claim certifications that have not been obtained.
        </section>
      </main>
    </div>
  );
}
