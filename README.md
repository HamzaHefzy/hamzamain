# Operator

Operator is a production-shaped personal operations system: a user delegates an outcome and the product owns the workflow until it is complete. The execution engine is provider-neutral and follows an API/browser → voice → human escalation model with durable state, approvals, bounded authority, billing, and a complete audit trail.

## What is implemented

- Public product site, pricing, sign-in, and self-service signup
- PostgreSQL-backed multi-tenant workspaces and signed sessions
- Command center for natural-language task delegation
- Deterministic task planner with explicit execution steps
- Durable task/step state machine that survives external waits
- Approval queue and default-deny authority wallet
- Spend-cap enforcement for delegated purchasing authority
- Browser/API executor contract
- Conversational voice-agent contract plus Twilio fallback
- Resend email execution
- Human-operator exception queue contract
- Signed asynchronous provider callbacks and automatic task resume
- Task-level audit/activity history
- Connection-health UI
- Stripe Checkout subscriptions and signed webhook processing
- Docker/local bootstrap and PostgreSQL-backed GitHub CI
- Demo executor for safe end-to-end product testing without external credentials

## Run locally

~~~bash
npm install
npm run setup:local
npm run dev
~~~

Open http://localhost:3000. The setup script creates a local database and prints a development login. You can also create a new workspace through /signup.

Set `OPERATOR_DEMO_MODE=true` to run the complete task lifecycle locally without placing real calls, purchases, or bookings.

## Production validation

~~~bash
npm run check:source
npm run typecheck
npm test
npm run build
~~~

GitHub Actions also provisions PostgreSQL, applies every migration, seeds the database, runs database smoke tests, and performs a production build.

## Connecting the outside world

The application code is intentionally provider-neutral. Production deployment needs credentials/endpoints rather than another product rewrite:

- `OPERATOR_ACTION_RUNNER_URL`: browser/API worker that accepts a step and calls `/api/operator/callback` when asynchronous work finishes.
- `OPERATOR_VOICE_AGENT_URL`: conversational outbound voice service. The existing Twilio variables provide a simpler fallback.
- `OPERATOR_HUMAN_QUEUE_URL`: human exception/escalation service.
- `OPERATOR_WEBHOOK_SECRET`: bearer token required by external executor callbacks.
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL`: outbound email.
- Stripe secret, webhook secret, and three price IDs for paid subscriptions.

Executor requests include the task ID, step ID, requested objective, and a signed callback contract. External systems never receive database credentials.

## Trust model

Consequential actions are not inferred as permission. They are either explicitly approved for the task or covered by a stored authority rule. Spend rules with a maximum amount are enforced against the task's declared budget ceiling; if the amount is unknown, Operator asks.

Every material state transition is persisted. The user can see what Operator attempted, why it paused, what provider handled a step, what was approved, and whether the task finished.

## Deployment

The repository includes a Dockerfile and can run anywhere that provides Node.js plus PostgreSQL. Set `NEXT_PUBLIC_SITE_URL` to the deployed HTTPS origin and keep all secrets server-side. Stripe should post to `/api/billing/webhook`; external action/voice/human workers should post signed completion events to `/api/operator/callback`.

"Operator" is currently a working product name and should receive trademark/domain diligence before commercial launch.
