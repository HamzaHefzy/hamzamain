import { requireSession } from "@/lib/auth";
import { getOperatorProfile } from "@/lib/operator/profile";
import PhoneIdentityForm from "@/components/operator/PhoneIdentityForm";
import IntegrationHub from "@/components/operator/IntegrationHub";
import { listPipedreamAccounts, pipedreamConfigured } from "@/lib/operator/pipedream";

export const dynamic = "force-dynamic";

export default async function ConnectionsPage() {
  const session = await requireSession();
  const profile = await getOperatorProfile(session.orgId);
  const appGatewayConnected = pipedreamConfigured();
  const connectedApps = appGatewayConnected
    ? await listPipedreamAccounts(session.orgId).catch(() => [])
    : [];

  const connections = [
    {
      name: "3,000+ app gateway",
      env: "PIPEDREAM_PROJECT_ID + OAuth credentials",
      connected: appGatewayConnected,
      description: "Managed per-user OAuth and tools for thousands of apps including Gmail, Calendar, Drive, Slack, Notion, Microsoft 365 and more.",
    },
    {
      name: "Google Maps / Places",
      env: "GOOGLE_MAPS_API_KEY",
      connected: Boolean(process.env.GOOGLE_MAPS_API_KEY),
      description: "Search local businesses and resolve canonical addresses, Maps links, websites, ratings and phone numbers before execution.",
    },
    {
      name: "Live web search",
      env: "BRAVE_SEARCH_API_KEY",
      connected: Boolean(process.env.BRAVE_SEARCH_API_KEY),
      description: "Fresh web research and source retrieval through Brave Search for current facts, reviews, comparisons and news.",
    },
    {
      name: "Browser & API runner",
      env: "OPERATOR_ACTION_RUNNER_URL",
      connected: Boolean(process.env.OPERATOR_ACTION_RUNNER_URL),
      description: "Live web research, forms, merchant APIs, calendars, bookings and payment initiation.",
    },
    {
      name: "Conversational voice agent",
      env: "VAPI_* or OPERATOR_VOICE_AGENT_URL",
      connected: Boolean(
        (process.env.VAPI_API_KEY &&
          process.env.VAPI_ASSISTANT_ID &&
          process.env.VAPI_PHONE_NUMBER_ID &&
          process.env.VAPI_WEBHOOK_SECRET) ||
        process.env.OPERATOR_VOICE_AGENT_URL
      ),
      description: "Natural outbound conversations with call reports and transcripts returned into the task. Vapi is the preferred built-in provider.",
    },
    {
      name: "Twilio phone identity",
      env: "TWILIO_AUTH_TOKEN + assistant number",
      connected: Boolean(
        process.env.TWILIO_AUTH_TOKEN &&
        profile?.assistant_phone,
      ),
      description: "Signed inbound SMS and call intake plus the basic outbound-call fallback.",
    },
    {
      name: "Email",
      env: "RESEND_API_KEY",
      connected: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL),
      description: "Transactional messages and account recovery email.",
    },
    {
      name: "Human escalation",
      env: "OPERATOR_HUMAN_QUEUE_URL",
      connected: Boolean(process.env.OPERATOR_HUMAN_QUEUE_URL),
      description: "Exception queue when automation should hand off to a trained operator.",
    },
    {
      name: "Demo executor",
      env: "OPERATOR_DEMO_MODE",
      connected: process.env.OPERATOR_DEMO_MODE === "true",
      description: "Completes workflows locally without making external changes.",
    },
  ];

  const rawNotifications =
    profile?.preferences.notifications &&
    typeof profile.preferences.notifications === "object"
      ? profile.preferences.notifications as Record<string, unknown>
      : {};
  const notifyEmail = rawNotifications.email !== false;
  const notifySms = rawNotifications.sms === true;

  return (
    <div className="operator-page">
      <header className="operator-page-header">
        <div>
          <span className="operator-kicker">Connections</span>
          <h1>Your world, connected.</h1>
          <p>Provider contracts are isolated from the core task engine. Credentials turn capabilities live without changing the product architecture.</p>
        </div>
      </header>

      <section className="operator-section">
        <PhoneIdentityForm
          ownerPhone={profile?.owner_phone ?? null}
          assistantPhone={profile?.assistant_phone ?? process.env.TWILIO_FROM_NUMBER ?? null}
          notifyEmail={notifyEmail}
          notifySms={notifySms}
          homeBase={profile?.home_base ?? null}
        />
      </section>

      {appGatewayConnected ? (
        <section className="operator-section">
          <div className="operator-section-heading">
            <div><span className="operator-kicker">App network</span><h2>Connect the apps your life already runs on.</h2></div>
            <span className="operator-count">{connectedApps.length}</span>
          </div>
          <IntegrationHub connected={connectedApps} />
        </section>
      ) : null}

      <section className="operator-connection-grid">
        {connections.map((connection) => (
          <article key={connection.name}>
            <div className="operator-connection-state">
              <span className={connection.connected ? "connected" : ""} />
              {connection.connected ? "Connected" : "Needs connection"}
            </div>
            <h2>{connection.name}</h2>
            <p>{connection.description}</p>
            <code>{connection.env}</code>
          </article>
        ))}
      </section>

      <section className="operator-section operator-webhook-note">
        <span className="operator-kicker">Twilio webhooks</span>
        <h2>One number, two inbound channels</h2>
        <p><code>/api/operator/inbound/sms</code> turns a signed text into a governed task. <code>/api/operator/inbound/voice</code> answers with automated-assistant disclosure, captures the spoken reason for calling, and creates a follow-up task.</p>
      </section>
    </div>
  );
}
