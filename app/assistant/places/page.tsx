import { requireSession } from "@/lib/auth";
import { getOperatorProfile } from "@/lib/operator/profile";
import PlacesSearch from "@/components/operator/PlacesSearch";

export const dynamic = "force-dynamic";

export default async function PlacesPage() {
  const session = await requireSession();
  const profile = await getOperatorProfile(session.orgId);
  const connected = Boolean(process.env.GOOGLE_MAPS_API_KEY);
  return (
    <div className="operator-page">
      <header className="operator-page-header">
        <div>
          <span className="operator-kicker">Google Maps intelligence</span>
          <h1>Find the real place, then act.</h1>
          <p>Wafira uses Google Places for canonical business identities, addresses, ratings, websites, and phone numbers before it calls or books.</p>
        </div>
        <div className={"operator-status-pill " + (connected ? "status-completed" : "status-cancelled")}>{connected ? "Places connected" : "API key required"}</div>
      </header>
      <section className="operator-section">
        <div className="operator-section-heading"><div><span className="operator-kicker">Search</span><h2>{profile?.home_base ? "Local results around " + profile.home_base : "Add a home base in Connections for better local results"}</h2></div></div>
        {connected ? <PlacesSearch /> : <div className="operator-empty"><strong>Connect Google Maps Platform.</strong><span>Set GOOGLE_MAPS_API_KEY with Places API (New) enabled.</span></div>}
      </section>
    </div>
  );
}
