const required = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "NEXT_PUBLIC_SITE_URL",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "CRON_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ASSISTANT",
  "STRIPE_PRICE_OPERATOR",
  "STRIPE_PRICE_CONCIERGE",
  "GOOGLE_MAPS_API_KEY",
  "PIPEDREAM_PROJECT_ID",
  "PIPEDREAM_CLIENT_ID",
  "PIPEDREAM_CLIENT_SECRET",
];

const failures = [];

for (const key of required) {
  if (!process.env[key]?.trim()) failures.push(key + " is required.");
}

if ((process.env.AUTH_SECRET ?? "").length < 32) {
  failures.push("AUTH_SECRET must contain at least 32 characters.");
}

try {
  const site = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  if (site.protocol !== "https:") {
    failures.push("NEXT_PUBLIC_SITE_URL must use HTTPS for production.");
  }
} catch {
  failures.push("NEXT_PUBLIC_SITE_URL must be a valid absolute URL.");
}

if (process.env.OPERATOR_DEMO_MODE === "true") {
  failures.push("OPERATOR_DEMO_MODE must not be true in production.");
}

const hasActionRunner = Boolean(process.env.OPERATOR_ACTION_RUNNER_URL?.trim());
const hasVoice =
  Boolean(process.env.OPERATOR_VOICE_AGENT_URL?.trim()) ||
  Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
    process.env.TWILIO_AUTH_TOKEN?.trim() &&
    process.env.TWILIO_FROM_NUMBER?.trim(),
  );

if (!hasActionRunner) {
  failures.push("Connect OPERATOR_ACTION_RUNNER_URL before selling browser/API execution.");
}
if (!hasVoice) {
  failures.push("Connect a voice agent or Twilio before selling phone execution.");
}

if (failures.length) {
  console.error("Production readiness check failed:");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}

console.log("Production readiness check passed.");
