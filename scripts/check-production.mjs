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
  "BRAVE_SEARCH_API_KEY",
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

const hasPlanner =
  Boolean(process.env.OPERATOR_PLANNER_URL?.trim()) ||
  Boolean(process.env.OPENAI_API_KEY?.trim());

const hasActionRunner = Boolean(process.env.OPERATOR_ACTION_RUNNER_URL?.trim());
const hasVapi =
  Boolean(process.env.VAPI_API_KEY?.trim()) &&
  Boolean(process.env.VAPI_ASSISTANT_ID?.trim()) &&
  Boolean(process.env.VAPI_PHONE_NUMBER_ID?.trim()) &&
  Boolean(process.env.VAPI_WEBHOOK_SECRET?.trim());

const hasConversationalVoice =
  hasVapi || Boolean(process.env.OPERATOR_VOICE_AGENT_URL?.trim());

if (!hasPlanner) {
  failures.push("Connect OPENAI_API_KEY or OPERATOR_PLANNER_URL before selling arbitrary-task planning.");
}
if (!hasActionRunner) {
  failures.push("Connect OPERATOR_ACTION_RUNNER_URL before selling browser/API execution.");
}
if (!hasConversationalVoice) {
  failures.push("Connect Vapi or OPERATOR_VOICE_AGENT_URL before selling conversational phone execution.");
}

if (failures.length) {
  console.error("Production readiness check failed:");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}

console.log("Production readiness check passed.");
