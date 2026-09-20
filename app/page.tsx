import Link from "next/link";
import Logo from "@/components/Logo";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MiniIcon({ type }: { type: "chart" | "shield" | "people" | "screen" | "check" | "doc" }) {
  if (type === "shield") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 19 6v5c0 4.4-2.7 8.2-7 10-4.3-1.8-7-5.6-7-10V6l7-3Z"/><path d="m9.2 12 1.8 1.8 3.8-4"/></svg>;
  }
  if (type === "people") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3.5 19c.5-4 2.5-6 5.5-6s5 2 5.5 6M14 14c2.9 0 4.7 1.6 5.2 4.5"/></svg>;
  }
  if (type === "screen") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>;
  }
  if (type === "check") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.7L16.5 9"/></svg>;
  }
  if (type === "doc") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>;
}

function ProductPreview() {
  return (
    <div className="m-product-preview" aria-label="Illustrative Anchor product dashboard">
      <div className="m-preview-sidebar">
        <Logo />
        <div className="m-preview-nav">
          <span className="active">Overview</span>
          <span>Students</span>
          <span>Attendance</span>
          <span>Interventions</span>
          <span>Funding</span>
          <span>Reports</span>
        </div>
      </div>
      <div className="m-preview-main">
        <div className="m-preview-topbar">
          <div className="m-preview-search">Search students, schools, or cases…</div>
          <div className="m-preview-user"><span>JD</span><b>Jordan Diaz</b></div>
        </div>
        <div className="m-preview-heading">
          <div><strong>Good morning, Jordan.</strong><span>Here&apos;s what needs attention across the network.</span></div>
          <small>Illustrative product view</small>
        </div>
        <div className="m-preview-recovery">
          <div><span className="m-preview-live-dot" />9:00 AM recovery window</div>
          <strong>3 students need action before instruction is lost.</strong>
          <small>Reminder → live rescue → named adult → verified return</small>
        </div>
        <div className="m-preview-table">
          <div className="m-preview-table-head"><strong>Students needing attention</strong><span>Next action</span></div>
          <div className="m-preview-row"><span className="avatar">TC</span><div><b>Taylor Carter</b><small>Transportation</small></div><span className="count">8 absences</span><span>Family outreach</span><i className="priority high">High</i></div>
          <div className="m-preview-row"><span className="avatar">JM</span><div><b>Jordan Mitchell</b><small>Course disengagement</small></div><span className="count">6 absences</span><span>Teacher plan</span><i className="priority">Medium</i></div>
          <div className="m-preview-row"><span className="avatar">AL</span><div><b>Alex Lee</b><small>Tech access</small></div><span className="count">5 absences</span><span>Support kit</span><i className="priority">Medium</i></div>
        </div>
      </div>
    </div>
  );
}

export default function MarketingHome() {
  return (
    <div className="marketing-site">
      <header className="m-header">
        <div className="m-container m-nav-wrap">
          <Link href="/" className="m-brand" aria-label="Anchor home"><Logo /></Link>
          <nav className="m-nav" aria-label="Public navigation">
            <a href="#product">Product</a>
            <a href="#solutions">Solutions</a>
            <a href="#virtual">Virtual schools</a>
            <Link href="/funding">Funding</Link>
            <a href="#how">How it works</a>
            <Link href="/pricing">Pricing</Link>
          </nav>
          <div className="m-nav-actions">
            <Link href="/login" className="m-nav-secondary">Sign in</Link>
            <Link href="/request-demo" className="m-button dark compact">Request demo <ArrowIcon /></Link>
          </div>
        </div>
      </header>

      <main>
        <section className="m-hero" id="product">
          <div className="m-container m-hero-grid">
            <div className="m-hero-copy">
              <div className="m-kicker">Attendance recovery, not attendance monitoring</div>
              <h1>Get students back<br />into class.</h1>
              <p>
                Anchor works in the moments that decide attendance: before class, when a student does not show, and when a barrier needs a real person to resolve it.
              </p>
              <div className="m-hero-actions">
                <Link href="/request-demo" className="m-button dark">Request demo <ArrowIcon /></Link>
                <Link href="/virtual" className="m-button light">Explore virtual schools</Link>
              </div>
              <div className="m-hero-proof">Before class → live rescue → barrier resolution → verified return</div>
            </div>
            <ProductPreview />
          </div>
        </section>

        <section className="m-value-strip" id="solutions">
          <div className="m-container m-value-grid">
            <article><span className="m-icon"><MiniIcon type="chart" /></span><div><strong>Recover instructional days</strong><small>Turn absence signals into action.</small></div></article>
            <article><span className="m-icon"><MiniIcon type="shield" /></span><div><strong>Protect attendance-linked funding</strong><small>Make financial exposure visible.</small></div></article>
            <article><span className="m-icon"><MiniIcon type="people" /></span><div><strong>Resolve barriers faster</strong><small>Coordinate support, not just tracking.</small></div></article>
            <article><span className="m-icon"><MiniIcon type="screen" /></span><div><strong>Support virtual schools</strong><small>Verify participation and re-engage early.</small></div></article>
          </div>
        </section>

        <section className="m-section" id="how">
          <div className="m-container m-how-grid">
            <div className="m-section-intro">
              <div className="m-kicker">How Anchor works</div>
              <h2>From attendance data to resolved barriers.</h2>
              <p>Anchor connects the information schools already have to the people and actions that can actually change attendance.</p>
            </div>
            <div className="m-steps">
              <article><span>1</span><div><strong>Detect</strong><p>Surface attendance drift, missing virtual participation, and funding exposure early.</p></div></article>
              <article><span>2</span><div><strong>Resolve</strong><p>Route the right intervention to a named owner with a deadline and concrete commitment.</p></div></article>
              <article><span>3</span><div><strong>Verify</strong><p>Confirm the support happened, measure whether attendance improved, and preserve the evidence.</p></div></article>
            </div>
          </div>
        </section>

        <section className="m-recovery-section">
          <div className="m-container m-recovery-layout">
            <div className="m-recovery-intro">
              <div className="m-kicker">The attendance recovery window</div>
              <h2>The product should act before an absence becomes a pattern.</h2>
              <p>
                Anchor combines low-friction reminders with a real escalation path. Automation handles the easy misses. A named adult takes over when the student still does not show.
              </p>
              <Link href="/virtual/show-up" className="m-button dark">See the recovery workflow <ArrowIcon /></Link>
            </div>
            <div className="m-recovery-rail" aria-label="Attendance recovery workflow">
              <div className="m-recovery-row">
                <time>T−30</time>
                <div><strong>Remove friction</strong><span>Personalized reminder, one-click class link, and a simple “I’ll be there / I need help” choice.</span></div>
              </div>
              <div className="m-recovery-row">
                <time>T+5</time>
                <div><strong>Rescue the miss</strong><span>If the student has not joined, Anchor sends a direct join-now prompt and opens a live recovery window.</span></div>
              </div>
              <div className="m-recovery-row">
                <time>T+10</time>
                <div><strong>Put a human on it</strong><span>Persistent misses move to a named attendance navigator or school staff owner instead of another automated message.</span></div>
              </div>
              <div className="m-recovery-row">
                <time>Same day</time>
                <div><strong>Resolve the barrier</strong><span>Technology, academic overwhelm, caregiving, health, anxiety, and routine problems route to different support paths.</span></div>
              </div>
              <div className="m-recovery-row">
                <time>Next 5</time>
                <div><strong>Verify the return</strong><span>Anchor checks the next attendance events so “contact made” is never confused with “student re-engaged.”</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="m-virtual-section" id="virtual">
          <div className="m-container m-virtual-card">
            <div className="m-virtual-copy">
              <div className="m-kicker">Built for virtual schools</div>
              <h2>If they do not join,<br />Anchor does something.</h2>
              <p>
                Virtual schools need more than evidence after the fact. Anchor removes pre-class friction, detects the live miss, escalates to a human, identifies the barrier, and verifies the student returns.
              </p>
              <Link href="/virtual" className="m-button dark">Explore Anchor Virtual <ArrowIcon /></Link>
            </div>
            <div className="m-virtual-visual" aria-label="Illustrative verified participation card">
              <div className="m-laptop">
                <div className="m-laptop-screen">
                  <span className="m-student-dot">A</span>
                  <strong>Engaged today</strong>
                  <div><MiniIcon type="check" /> LMS progress verified</div>
                  <div><MiniIcon type="check" /> Assignment completed</div>
                  <div><MiniIcon type="check" /> Teacher interaction linked</div>
                  <div><MiniIcon type="check" /> Participation supported</div>
                </div>
              </div>
            </div>
            <div className="m-virtual-features">
              <article><span className="m-icon"><MiniIcon type="chart" /></span><div><strong>Evidence-based participation</strong><small>Use meaningful instructional signals, not passive presence.</small></div></article>
              <article><span className="m-icon"><MiniIcon type="doc" /></span><div><strong>Exception resolution</strong><small>Fix unsupported records before day close.</small></div></article>
              <article><span className="m-icon"><MiniIcon type="people" /></span><div><strong>Proactive re-engagement</strong><small>Match the intervention to the actual barrier.</small></div></article>
            </div>
          </div>
        </section>

        <section className="m-metrics-section">
          <div className="m-container m-metrics-row">
            <article><strong>1 dashboard</strong><span>Attendance operations through funding impact.</span></article>
            <article><strong>5-minute rescue trigger</strong><span>Act while the class is still happening.</span></article>
            <article><strong>Same-day intervention</strong><span>Shorten the gap between signal and action.</span></article>
            <article><strong>Verified follow-through</strong><span>Measure support delivered, not messages sent.</span></article>
          </div>
        </section>

        <section className="m-final-cta" id="pilot">
          <div className="m-container m-final-card">
            <div>
              <div className="m-kicker">See the operating model</div>
              <h2>Start with the problem your attendance team already has.</h2>
              <p>See how Anchor moves from a missed class to a real recovery action, then proves whether the student came back.</p>
            </div>
            <div className="m-final-actions">
              <Link href="/login" className="m-button dark">Sign in to workspace <ArrowIcon /></Link>
              <Link href="/virtual/show-up" className="m-button light">See virtual recovery</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="m-footer">
        <div className="m-container m-footer-grid">
          <div><Logo /><p>Attendance today. Better follow-through tomorrow.</p></div>
          <nav aria-label="Footer navigation"><a href="#product">Product</a><a href="#solutions">Solutions</a><Link href="/virtual">Virtual schools</Link><Link href="/funding">Funding</Link><Link href="/security">Security</Link><Link href="/privacy">Privacy</Link></nav>
          <div className="m-footer-note"><span>Student support before surveillance.</span><small>© 2026 Anchor.</small></div>
        </div>
      </footer>
    </div>
  );
}
