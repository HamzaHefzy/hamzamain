import Link from "next/link";
import PublicNav from "@/components/marketing/PublicNav";
import PublicFooter from "@/components/marketing/PublicFooter";
import LivePhoneDemo from "@/components/marketing/LivePhoneDemo";

export default function MarketingHome() {
  return (
    <div className="y-public-site">
      <PublicNav />
      <main>
        <section className="y-home-hero">
          <div className="y-home-copy">
            <span className="y-eyebrow">Your personal execution layer</span>
            <h1>Say what you need done.<br/><em>Yumna handles the rest.</em></h1>
            <p>
              Find the right place. Get the number. Make the call. Work across your apps.
              Book what you approve. Follow up until the task is actually finished.
            </p>
            <div className="y-home-actions">
              <Link href="/signup" className="y-primary-link large">Start free</Link>
              <Link href="/demo" className="y-secondary-link large">Try the live demo <span>→</span></Link>
            </div>
            <div className="y-home-proof">
              <span><i /> Live web + local search</span>
              <span><i /> Natural phone calls</span>
              <span><i /> Thousands of connected apps</span>
              <span><i /> Approval controls</span>
            </div>
          </div>
          <div className="y-home-demo">
            <LivePhoneDemo />
          </div>
        </section>

        <section className="y-logo-cloud">
          <span>Works across the tools you already use</span>
          <div>
            <b>Google Maps</b><b>Gmail</b><b>Calendar</b><b>Drive</b><b>Slack</b><b>Notion</b><b>Microsoft 365</b><b>+ thousands more</b>
          </div>
        </section>

        <section className="y-home-section y-home-product">
          <div className="y-section-heading">
            <span className="y-eyebrow">One assistant, many execution paths</span>
            <h2>Yumna does not just tell you what to do next.</h2>
            <p>It chooses the safest way to complete the work and keeps the entire chain in one auditable task.</p>
          </div>
          <div className="y-path-grid">
            <article><span>01</span><div><strong>Find</strong><p>Resolve businesses through Google Maps, private contacts, memory, and connected data.</p></div></article>
            <article><span>02</span><div><strong>Act</strong><p>Use APIs and apps first, then browser automation, calls, or human escalation when needed.</p></div></article>
            <article><span>03</span><div><strong>Ask only when it matters</strong><p>Purchases, commitments, account changes, and sensitive actions pause for approval unless you granted authority.</p></div></article>
            <article><span>04</span><div><strong>Finish</strong><p>Track callbacks, confirmations, receipts, retries, and follow-up until the outcome is complete.</p></div></article>
          </div>
          <Link href="/product" className="y-inline-cta">Explore the product <span>→</span></Link>
        </section>

        <section className="y-home-section y-home-usecases">
          <div className="y-section-heading split">
            <div>
              <span className="y-eyebrow">Built for annoying real-life work</span>
              <h2>The tasks that eat twenty minutes at a time.</h2>
            </div>
            <Link href="/use-cases" className="y-secondary-link">See every use case →</Link>
          </div>
          <div className="y-usecase-showcase">
            <article><span>☎</span><strong>Appointments</strong><p>Find providers, call, compare availability, book, and calendar.</p></article>
            <article><span>⌁</span><strong>Dining & travel</strong><p>Search live options, coordinate people, reserve, and adapt when plans change.</p></article>
            <article><span>↻</span><strong>Cancellations</strong><p>Handle hold time, retention scripts, confirmation, and follow-up.</p></article>
            <article><span>▦</span><strong>App work</strong><p>Email, calendars, files, messages, tasks, CRM, docs, and thousands of connected tools.</p></article>
          </div>
        </section>

        <section className="y-home-final">
          <div>
            <span className="y-eyebrow">Give your time back to yourself</span>
            <h2>Start with the five things you have been putting off.</h2>
            <p>Yumna is most useful when you give it outcomes, not instructions for every click.</p>
          </div>
          <div className="y-home-actions">
            <Link href="/signup" className="y-primary-link large">Create your Yumna</Link>
            <Link href="/demo" className="y-secondary-link large">Watch it work</Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
