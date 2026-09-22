import PublicNav from "@/components/marketing/PublicNav";
import PublicFooter from "@/components/marketing/PublicFooter";

export const metadata = {
  title: "Security",
  description: "Yumna security architecture and trust controls.",
};

export default function SecurityPage() {
  return (
    <div className="y-public-site">
      <PublicNav />
      <main className="y-content-page">
        <section className="y-page-hero centered">
          <span className="y-eyebrow">Security</span>
          <h1>Useful autonomy needs a small blast radius.</h1>
          <p>Yumna separates identity, authority, execution, and audit so completing more work does not require silently handing over unlimited permission.</p>
        </section>
        <section className="trust-grid y-trust-grid">
          <article><h2>Workspace isolation</h2><p>Tasks, steps, approvals, authority rules, memories, contacts, connections, events, and subscriptions are workspace scoped.</p></article>
          <article><h2>Scoped callback credentials</h2><p>External execution steps receive one opaque callback token, hashed at rest and revoked as soon as the step reaches a terminal state.</p></article>
          <article><h2>Default-deny authority</h2><p>Spending and consequential commitments pause when authorization is missing. Stored rules can grant only the narrow authority you choose.</p></article>
          <article><h2>Private contact resolution</h2><p>Your address book stays in the core application. The planner receives the resolved destination only when execution requires it.</p></article>
          <article><h2>Server-side secrets</h2><p>Provider credentials stay server-side. Managed app authentication is injected during execution rather than exposed to browser or planning prompts.</p></article>
          <article><h2>Continuous verification</h2><p>CI audits dependencies, source boundaries, strict TypeScript, fresh PostgreSQL migrations, integration tests, and the production build.</p></article>
        </section>
        <div className="y-legal-note">This architecture is not a security certification. A commercial launch still requires production secret management, HTTPS, backups, monitoring, vendor review, incident response, and independent security testing.</div>
      </main>
      <PublicFooter />
    </div>
  );
}
