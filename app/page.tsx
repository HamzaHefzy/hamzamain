import Link from "next/link";
import Logo from "@/components/Logo";

export default function MarketingHome() {
  return (
    <div className="operator-marketing">
      <header className="operator-public-nav">
        <Link href="/" aria-label="Dexyra home"><Logo /></Link>
        <nav aria-label="Public navigation">
          <a href="#how">How it works</a>
          <a href="#use-cases">Use cases</a>
          <Link href="/pricing">Pricing</Link>
          <Link href="/login">Sign in</Link>
          <Link href="/signup" className="operator-nav-cta">Start delegating</Link>
        </nav>
      </header>

      <main>
        <section className="operator-hero">
          <div>
            <span className="operator-kicker">Your right hand for real life</span>
            <h1>Hand off the things that steal your time.</h1>
            <p>
              Dexyra finds the right place, gets the phone number, makes the call,
              works across your apps, books what you approve, follows up, and keeps
              ownership until the task is actually finished.
            </p>
            <div className="operator-hero-actions">
              <Link href="/signup">Get your Dexyra</Link>
              <a href="#how">See how it works</a>
            </div>
          </div>

          <div className="operator-demo-window" aria-label="Illustrative Dexyra task">
            <div className="operator-demo-top"><i /><i /><i /></div>
            <div className="operator-demo-body">
              <div className="operator-demo-request">
                “Call my dentist. Find the earliest cleaning after 2 PM next week,
                keep it under $200, book it, and put it on my calendar.”
              </div>
              <div className="operator-demo-step"><span>✓</span><div><strong>Found the office on Google Maps</strong><small>Verified the business, address, and phone number</small></div><em>done</em></div>
              <div className="operator-demo-step"><span>✓</span><div><strong>Called and found Tuesday at 3:30 PM</strong><small>$165 estimated out-of-pocket</small></div><em>done</em></div>
              <div className="operator-demo-step wait"><span>!</span><div><strong>Booking requires your approval</strong><small>Within the budget you set for this task</small></div><em>approve</em></div>
              <div className="operator-demo-step"><span>4</span><div><strong>Calendar + confirmation</strong><small>Runs through your connected apps after approval</small></div><em>next</em></div>
            </div>
          </div>
        </section>

        <section className="operator-feature-strip" id="how">
          <article><strong>One request</strong><span>Say the outcome, not the workflow.</span></article>
          <article><strong>Find the real place</strong><span>Google Maps identity and phone resolution before calls.</span></article>
          <article><strong>Works across your apps</strong><span>Managed connections to thousands of services.</span></article>
          <article><strong>Bounded authority</strong><span>You decide what Dexyra can do without another tap.</span></article>
        </section>

        <section className="operator-marketing-section" id="use-cases">
          <span className="operator-kicker">The back office for your life</span>
          <h2>Not another chatbot. A right hand that can actually finish things.</h2>
          <p>
            Dexyra is built for work that crosses apps and the physical world—the
            tasks that are easy to postpone because someone has to search, call,
            coordinate, compare, remember, and chase.
          </p>
          <div className="operator-usecases">
            <article><strong>Appointments</strong><span>Find providers, verify phone numbers, call, compare availability, book, and calendar.</span></article>
            <article><strong>Dining & travel</strong><span>Search places, compare live options, reserve within your rules, and coordinate changes.</span></article>
            <article><strong>Administrative calls</strong><span>Wait on hold, cancel services, collect answers, and follow through.</span></article>
            <article><strong>Connected apps</strong><span>Work across Gmail, Calendar, Drive, Slack, Notion, Microsoft 365, and thousands more.</span></article>
            <article><strong>Returns & refunds</strong><span>Start the process and keep checking until the money actually comes back.</span></article>
            <article><strong>Life coordination</strong><span>Messages, calendar changes, reminders, routines, and the next action in one auditable thread.</span></article>
          </div>
        </section>
      </main>
    </div>
  );
}
