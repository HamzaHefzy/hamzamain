import Link from "next/link";
import Logo from "@/components/Logo";

export default function MarketingHome() {
  return (
    <div className="operator-marketing">
      <header className="operator-public-nav">
        <Link href="/" aria-label="Operator home"><Logo /></Link>
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
            <span className="operator-kicker">A personal operations assistant</span>
            <h1>Give it anything you don&apos;t want to deal with.</h1>
            <p>
              Operator makes the call, handles the hold time, finds the appointment, books the dinner,
              follows up, updates your calendar, and keeps ownership until the work is actually finished.
            </p>
            <div className="operator-hero-actions">
              <Link href="/signup">Start delegating</Link>
              <a href="#how">See how it works</a>
            </div>
          </div>

          <div className="operator-demo-window" aria-label="Illustrative Operator task">
            <div className="operator-demo-top"><i /><i /><i /></div>
            <div className="operator-demo-body">
              <div className="operator-demo-request">
                “Call my dentist. Find the earliest cleaning after 2 PM next week, keep it under $200,
                book it, and put it on my calendar.”
              </div>
              <div className="operator-demo-step"><span>✓</span><div><strong>Found the office and called</strong><small>Operator handled the conversation and availability</small></div><em>done</em></div>
              <div className="operator-demo-step"><span>✓</span><div><strong>Tuesday at 3:30 PM is available</strong><small>$165 estimated out-of-pocket</small></div><em>done</em></div>
              <div className="operator-demo-step wait"><span>!</span><div><strong>Booking requires your approval</strong><small>Within the budget you set for this task</small></div><em>approve</em></div>
              <div className="operator-demo-step"><span>4</span><div><strong>Calendar + confirmation</strong><small>Runs automatically after approval</small></div><em>next</em></div>
            </div>
          </div>
        </section>

        <section className="operator-feature-strip" id="how">
          <article><strong>One command</strong><span>Say the outcome, not the workflow.</span></article>
          <article><strong>Real-world execution</strong><span>API → browser → voice → human escalation.</span></article>
          <article><strong>Bounded authority</strong><span>You decide what can happen without another tap.</span></article>
          <article><strong>Durable ownership</strong><span>Tasks survive callbacks, hold time, and follow-up.</span></article>
        </section>

        <section className="operator-marketing-section" id="use-cases">
          <span className="operator-kicker">Life back office</span>
          <h2>Not another chatbot. The operating layer behind your life.</h2>
          <p>
            Operator is designed for work that crosses apps and the physical world—especially the tasks
            that are easy to postpone because someone has to call, coordinate, compare, remember, and chase.
          </p>
          <div className="operator-usecases">
            <article><strong>Appointments</strong><span>Call providers, compare availability, handle constraints, book, and calendar.</span></article>
            <article><strong>Dining & travel</strong><span>Find live options, reserve within your rules, and coordinate changes.</span></article>
            <article><strong>Administrative calls</strong><span>Wait on hold, cancel services, collect answers, and follow through.</span></article>
            <article><strong>Home services</strong><span>Gather quotes, ask questions, schedule access, and preserve confirmations.</span></article>
            <article><strong>Returns & refunds</strong><span>Start the process and keep checking until the money actually comes back.</span></article>
            <article><strong>Life coordination</strong><span>Messages, calendar changes, reminders, and the next action in one auditable thread.</span></article>
          </div>
        </section>
      </main>
    </div>
  );
}
