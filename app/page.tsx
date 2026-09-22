import Link from "next/link";
import Logo from "@/components/Logo";

export default function MarketingHome() {
  return (
    <div className="operator-marketing">
      <header className="operator-public-nav">
        <Link href="/" aria-label="Yumna home"><Logo /></Link>
        <nav aria-label="Public navigation">
          <a href="#how">How it works</a>
          <a href="#use-cases">Use cases</a>
          <Link href="/pricing">Pricing</Link>
          <Link href="/login">Sign in</Link>
          <Link href="/signup" className="operator-nav-cta">Start free</Link>
        </nav>
      </header>

      <main>
        <section className="operator-hero">
          <div>
            <span className="operator-kicker">More time for your actual life</span>
            <h1>Give Yumna the work you don&apos;t want to carry.</h1>
            <p>
              Yumna finds the right business, gets the number, makes the call,
              works across your apps, books what you approve, follows up, and
              keeps ownership until the task is truly finished.
            </p>
            <div className="operator-hero-actions">
              <Link href="/signup">Start with Yumna</Link>
              <a href="#how">See how it works</a>
            </div>
          </div>

          <div className="operator-demo-window" aria-label="Illustrative Yumna task">
            <div className="operator-demo-top"><i /><i /><i /></div>
            <div className="operator-demo-body">
              <div className="operator-demo-request">
                “Call my dentist. Find the earliest cleaning after 2 PM next week,
                keep it under $200, book it, and put it on my calendar.”
              </div>
              <div className="operator-demo-step"><span>✓</span><div><strong>Found the office on Google Maps</strong><small>Verified business, address, website, and phone number</small></div><em>done</em></div>
              <div className="operator-demo-step"><span>✓</span><div><strong>Called and found Tuesday at 3:30 PM</strong><small>$165 estimated out-of-pocket</small></div><em>done</em></div>
              <div className="operator-demo-step wait"><span>!</span><div><strong>Booking needs your approval</strong><small>Inside the budget ceiling you set</small></div><em>approve</em></div>
              <div className="operator-demo-step"><span>4</span><div><strong>Calendar + confirmation</strong><small>Runs through your connected apps after approval</small></div><em>next</em></div>
            </div>
          </div>
        </section>

        <section className="operator-feature-strip" id="how">
          <article><strong>Ask once</strong><span>Describe the outcome instead of managing the workflow.</span></article>
          <article><strong>Find the real place</strong><span>Google Maps identity and phone resolution before calls.</span></article>
          <article><strong>Use your apps</strong><span>Managed connections to the services your life already runs on.</span></article>
          <article><strong>Stay in control</strong><span>You decide what Yumna may do without another tap.</span></article>
        </section>

        <section className="operator-marketing-section" id="use-cases">
          <span className="operator-kicker">A back office for everyday life</span>
          <h2>Not another chatbot. An execution layer for the things you keep putting off.</h2>
          <p>
            Yumna is built for work that crosses apps and the physical world—the
            tasks that are annoying because someone has to search, call, coordinate,
            compare, remember, and chase.
          </p>
          <div className="operator-usecases">
            <article><strong>Appointments</strong><span>Find providers, verify phone numbers, call, compare availability, book, and calendar.</span></article>
            <article><strong>Dining & travel</strong><span>Search places, compare live options, reserve inside your rules, and coordinate changes.</span></article>
            <article><strong>Administrative calls</strong><span>Wait on hold, cancel services, collect answers, and follow through.</span></article>
            <article><strong>Connected apps</strong><span>Work across Gmail, Calendar, Drive, Slack, Notion, Microsoft 365, and thousands more.</span></article>
            <article><strong>Returns & refunds</strong><span>Start the process and keep checking until the money actually comes back.</span></article>
            <article><strong>Recurring life admin</strong><span>Set routines once and let Yumna create governed tasks automatically.</span></article>
          </div>
        </section>
      </main>
    </div>
  );
}
