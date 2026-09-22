import Link from "next/link";
import PublicNav from "@/components/marketing/PublicNav";
import PublicFooter from "@/components/marketing/PublicFooter";

export const metadata = {
  title: "Integrations",
  description: "Google Maps, communications, and thousands of connected apps available to Yumna.",
};

const apps = ["Google Maps","Gmail","Google Calendar","Google Drive","Google Sheets","Google Docs","Slack","Notion","Outlook","OneDrive","Microsoft Teams","Dropbox","GitHub","Airtable","Todoist","Spotify"];

export default function IntegrationsPage() {
  return (
    <div className="y-public-site">
      <PublicNav />
      <main className="y-content-page">
        <section className="y-page-hero">
          <span className="y-eyebrow">Integrations</span>
          <h1>Yumna should work where your life already happens.</h1>
          <p>Critical real-world identity is first-party through Google Maps / Places. The long tail of app connections uses managed per-user authentication so the core product does not become a pile of brittle OAuth code.</p>
        </section>

        <section className="y-integration-feature">
          <div><span className="y-eyebrow">Core connector</span><h2>Google Maps + Places</h2><p>Find real businesses, canonical addresses, ratings, websites, Maps links, and phone numbers before a call or booking. This is a first-class execution provider, not a decorative search box.</p><Link href="/demo" className="y-inline-cta">See it in the demo →</Link></div>
          <div className="y-maps-card"><div className="y-map-grid"/><span className="y-map-pin one">1</span><span className="y-map-pin two">2</span><span className="y-map-pin three">3</span><div className="y-map-result"><strong>Triangle Dental</strong><span>4.8 ★ · 0.9 mi</span><small>Verified phone + website</small></div></div>
        </section>

        <section className="y-app-network">
          <div className="y-section-heading"><span className="y-eyebrow">Managed app network</span><h2>Connect once. Use the app inside real workflows.</h2><p>Yumna exposes only the relevant connected tools to the planner and injects the managed account credential at execution time.</p></div>
          <div className="y-app-grid">{apps.map((app,index) => <article key={app}><span>{app.slice(0,1)}</span><strong>{app}</strong><small>{index < 6 ? "Google" : index < 8 ? "Work" : "Connected app"}</small></article>)}</div>
          <p className="y-integration-note">The current gateway is designed for thousands of APIs and tools. Exact availability depends on the connected provider and account permissions.</p>
        </section>

        <section className="y-integration-three">
          <article><span>☎</span><h3>Voice + SMS</h3><p>Outbound calls, inbound text-to-Yumna, signed webhooks, and scoped callback credentials.</p></article>
          <article><span>✉</span><h3>Email</h3><p>Transactional delivery, notifications, and account verification without exposing provider secrets to the browser.</p></article>
          <article><span>↗</span><h3>Browser / API runner</h3><p>A provider-neutral contract for sites and systems that do not expose the right API directly.</p></article>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
