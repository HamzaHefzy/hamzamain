# Anchor Production Deployment

Anchor is a Node 22 / Next.js application backed by PostgreSQL 17.

## Required infrastructure

- Node.js 22 runtime
- PostgreSQL 17 database with encrypted storage and backups
- HTTPS on the public application URL
- Scheduled HTTPS job runner
- Transactional email provider for invitations/password resets (Resend adapter included)
- Optional SMS provider for attendance recovery (Twilio adapter included)

## Environment

Copy .env.example into your deployment secret manager. Never commit real values.

Required for a production workspace:

- DATABASE_URL
- AUTH_SECRET — at least 32 random characters
- NEXT_PUBLIC_SITE_URL
- INTEGRATION_ENCRYPTION_KEY — exactly 32 random bytes encoded as base64
- CRON_SECRET

Required for email-based team onboarding:

- RESEND_API_KEY
- RESEND_FROM_EMAIL

Required for SMS:

- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_FROM_NUMBER

Optional commercial lead delivery:

- SALES_ALERT_EMAIL — sends each demo request to this inbox through Resend
- SALES_WEBHOOK_URL — HTTPS CRM/automation endpoint
- SALES_WEBHOOK_SECRET — HMAC secret used to sign the exact webhook body

## Database rollout

Run migrations before starting a new release:

~~~bash
npm install
npm run db:migrate
~~~

For an empty development database, create the synthetic seed workspace:

~~~bash
npm run db:seed
~~~

Production customers should be provisioned with npm run org:create, not the demo seed.

## Provision a customer

Export the following values in the deployment/operator environment:

~~~bash
export NEW_ORG_NAME="Example Charter Network"
export NEW_ORG_SLUG="example-charter"
export NEW_ORG_ADMIN_EMAIL="admin@example.org"
export NEW_ORG_ADMIN_NAME="Example Administrator"
export NEW_ORG_ADMIN_PASSWORD="<temporary strong password>"
export NEW_ORG_STATE="TX"
export NEW_ORG_TIMEZONE="America/Chicago"
export NEW_ORG_TYPE="charter_network"
npm run org:create
~~~

After first sign-in, the administrator should configure campuses/delivery models in Settings, configure a versioned virtual attendance policy if needed, invite team members, load data or configure OneRoster, create scoped inbound evidence API keys for approved server-to-server participation feeds when needed, configure approved messaging, and review Funding assumptions.

## Inbound virtual evidence

For automated virtual participation feeds, create a scoped API key from the Integrations workspace and follow docs/INBOUND_EVIDENCE_API.md. Store the plaintext key only in the upstream system's secret manager. Revoke and rotate it if exposed.

## Scheduled jobs

POST /api/jobs/show-up detects upcoming/missed required virtual sessions, creates recovery cases, and sends configured outreach. Run it every 10–15 minutes during operating hours.

POST /api/jobs/virtual-day-close may be called hourly. Each organization is evaluated using its own timezone and active policy close time; the same school date is closed once unless an authenticated operator explicitly forces a rerun from the workspace.

POST /api/jobs/sales-leads retries failed or previously-undelivered sales lead notifications. Run it every 10–15 minutes if SALES_ALERT_EMAIL or SALES_WEBHOOK_URL is configured.

All scheduled endpoints require an Authorization Bearer header containing CRON_SECRET.

Sales webhook consumers should verify X-Anchor-Signature against the raw request body with SALES_WEBHOOK_SECRET before accepting the event.

## Health check

GET /api/health returns application/database readiness. Production infrastructure should treat HTTP 503 as unhealthy.

## Release gate

GitHub Actions validates generated-source hygiene, TypeScript, PostgreSQL migrations, seed correctness, unit tests, the database smoke test, and the Next.js production build.

Do not promote a release whose CI gate is not green.

## Customer-data boundary

Before loading identifiable student records, complete the customer's security/privacy review, DPA/FERPA terms, retention policy, approved integration credentials, and role mapping. Anchor deliberately does not infer or fabricate those approvals.
