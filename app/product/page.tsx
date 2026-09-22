import Link from "next/link";
import PublicNav from "@/components/marketing/PublicNav";
import PublicFooter from "@/components/marketing/PublicFooter";

export const metadata = {
  title: "Product",
  description: "How Yumna turns one request into a governed real-world workflow.",
};

export default function ProductPage() {
  return (
    <div className="y-public-site">
      <PublicNav />
      <main className="y-content-page">
        <section className="y-page-hero">
          <span className="y-eyebrow">Product</span>
          <h1>A personal assistant should own the workflow, not hand you a checklist.</h1>
          <p>Yumna combines local search, connected apps, calls, memory, approvals, recurring work, and audit history into one execution system.</p>
          <div className="y-home-actions"><Link href="/demo" className="y-primary-link large">Try the demo</Link><Link href="/signup" className="y-secondary-link large">Start free</Link></div>
        </section>

        <section className="y-product-stack">
          <article><div className="y-product-icon">⌕</div><div><span>Live web research</span><h2>Current information with sources.</h2><p>When a task depends on the live web, Yumna uses a dedicated search provider instead of pretending a model already knows the answer. Results stay attached to the task.</p></div></article>
          <article><div className="y-product-icon">M</div><div><span>Local intelligence</span><h2>Google Maps before guesswork.</h2><p>Yumna resolves canonical businesses, addresses, Maps links, websites, ratings, and phone numbers before it calls or books. Your home base biases results to the places that actually make sense for you.</p></div></article>
          <article><div className="y-product-icon">▦</div><div><span>Connected apps</span><h2>One request can cross your digital life.</h2><p>Managed per-user connections let Yumna work across Google Workspace, Slack, Notion, Microsoft 365, Dropbox, GitHub, Airtable, Todoist, and thousands of other APIs without handing credentials to the planner.</p></div></article>
          <article><div className="y-product-icon">☎</div><div><span>Voice</span><h2>Real phone calls are part of the workflow.</h2><p>Yumna can resolve a business number, identify itself as your automated assistant, hold a natural conversation, and return the call transcript and outcome to the same task thread.</p></div></article>
          <article><div className="y-product-icon">✓</div><div><span>Authority</span><h2>Autonomy with a small blast radius.</h2><p>You can grant narrow rules—like booking restaurants under a spend ceiling—while everything else pauses at the point of commitment. Every material action is recorded.</p></div></article>
          <article><div className="y-product-icon">∞</div><div><span>Routines</span><h2>Stop remembering to ask.</h2><p>Daily and weekly routines create normal governed tasks automatically, while memory keeps durable preferences separate from one-off instructions.</p></div></article>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
