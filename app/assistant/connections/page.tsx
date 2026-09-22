import { requireSession } from "@/lib/auth";
import { getOperatorProfile } from "@/lib/operator/profile";
import PhoneIdentityForm from "@/components/operator/PhoneIdentityForm";

export const dynamic = "force-dynamic";

export default async function ConnectionsPage() {
  const session = await requireSession();
  const profile = await getOperatorProfile(session.orgId);

  const connections = [
    {
      name: "Browser & API runner",
      env: "OPERATOR_ACTION_RUNNER_URL",
      connected: Boolean(process.env.OPERATOR_ACTION_RUNNER_URL),
      description: "Live web research, forms, merchant APIs, calendars, bookings and payment initiation.",
    },
    {
      name: "Conversational voice agent",
      env: "OPERATOR_VOICE_AGENT_URL",
      connected: Boolean(process.env.OPERATOR_VOICE_AGENT_URL),
      description: "Full outbound conversations, hold time and provider negotiation through a connected voice-agent service.",
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

  return (
    <div className="operator-page">
      <header className="operator-page-header">
        <div>
          <span className="operator-kicker">Connections</span>
          <h1>The outside world, connected.</h1>
          <p>Provider contracts are isolated from the core task engine. Credentials turn capabilities live without changing the product architecture.</p>
        </div>
      </header>

      <section className="operator-section">
        <PhoneIdentityForm
          ownerPhone={profile?.owner_phone ?? null}
          assistantPhone={profile?.assistant_phone ?? process.env.TWILIO_FROM_NUMBER ?? null}
        />
      </section>

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
