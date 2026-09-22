import PublicNav from "@/components/marketing/PublicNav";
import PublicFooter from "@/components/marketing/PublicFooter";

export const metadata = {
  title: "Privacy",
  description: "Yumna privacy principles for a trusted personal execution assistant.",
};

export default function PrivacyPage() {
  return (
    <div className="y-public-site">
      <PublicNav />
      <main className="y-content-page">
        <section className="y-page-hero centered">
          <span className="y-eyebrow">Privacy</span>
          <h1>Your assistant should work for you, not advertise to you.</h1>
          <p>Yumna is designed around explicit delegation, minimum necessary context, bounded authority, and a visible record of outside-world actions.</p>
        </section>
        <section className="trust-grid y-trust-grid">
          <article><h2>User-aligned business model</h2><p>The product is subscription funded. Recommendations do not need hidden merchant placement or behavioral advertising to make the economics work.</p></article>
          <article><h2>Scoped execution context</h2><p>Executors receive the context needed for one step; they do not receive database credentials or unrestricted workspace context.</p></article>
          <article><h2>Memory privacy tiers</h2><p>Durable memory supports normal, private, and restricted sensitivity levels so context can remain local when it should.</p></article>
          <article><h2>Explicit authority</h2><p>Consequential actions are approved for the task or covered by a user-created rule. Unknown amounts do not inherit a spending limit automatically.</p></article>
          <article><h2>Auditable actions</h2><p>Planning, execution, pauses, approvals, external waits, failures, callbacks, cancellations, and completion are persisted as events.</p></article>
          <article><h2>Provider transparency</h2><p>Connections show whether a provider is actually configured. A disconnected integration is never represented as live.</p></article>
        </section>
        <div className="y-legal-note">Commercial launch still requires finalized legal terms, retention policies, vendor DPAs, and jurisdiction-specific privacy review.</div>
      </main>
      <PublicFooter />
    </div>
  );
}
