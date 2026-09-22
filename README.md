# Yumna

Yumna is a production-shaped personal execution system: the user delegates an outcome and Yumna owns the workflow until it is complete. The application combines durable task state, bounded authority, Google Maps / Places, managed app connections, phone and email execution, billing, proactive routines, and a complete audit trail.

The codebase is intentionally a **modular monolith**, not a monorepo. The core application, authentication, billing, task state, approvals, UI, and persistence ship together. Browser workers, conversational voice providers, and human exception queues remain replaceable external execution contracts only where separate scaling or operational isolation is justified.

## What is implemented

- Google-grade responsive application shell plus real Product, Demo, Use Cases, Integrations, Pricing, Security, and Privacy pages
- Interactive phone demo with live task progression, approval gating, replay, and multiple scenarios
- Self-service signup, login, password recovery, and production email verification
- PostgreSQL-backed multi-tenant workspaces and signed sessions
- Natural-language task delegation with a built-in OpenAI structured planner, deterministic safe fallback, and optional provider override
- Durable task/step state machine that survives external waits
- Atomic step claiming to prevent duplicate calls, bookings, or payments
- Task cancellation, late-callback rejection, and idempotent callback ledger
- Per-step opaque callback credentials, hashed at rest and revoked at terminal state
- Approval queue and default-deny authority wallet
- Spend-cap enforcement for delegated purchasing authority
- First-party Google Places search and business-phone resolution
- Brave-backed live web research with source results attached to tasks
- Private contact directory resolved only at execution time
- Pipedream Connect gateway for managed app authentication and long-tail app actions
- Connected-app tool discovery so the planner can select exact actions without receiving credentials
- Browser/API execution contract
- Built-in Vapi conversational outbound calling with transcript callbacks, plus provider-neutral voice contract and Twilio fallback
- Signed inbound Twilio SMS and voice task intake
- Resend email execution
- Deduplicated email/SMS alerts for approvals, completion, and failures
- Personal memory with normal/private/restricted privacy tiers
- Daily and weekly proactive routines that create governed tasks
- Human exception queue for complex workflows
- Task-level audit history
- Subscription entitlements, usage limits, Stripe Checkout, webhooks, and billing portal
- Workspace data export and owner-controlled deletion safeguards
- Connection-health UI
- Docker/local bootstrap and PostgreSQL-backed GitHub CI
- Safe demo executor for end-to-end product testing without touching outside systems

## Run locally

~~~bash
npm install
npm run setup:local
npm run dev
~~~

Open http://localhost:3000. The setup script creates a local database, applies the standalone Yumna schema, seeds a verified development owner, and prints the login.

Set `OPERATOR_DEMO_MODE=true` to exercise the complete governed task lifecycle locally without placing real calls, purchases, or bookings. The historical `OPERATOR_*` configuration prefix is intentionally retained as an internal compatibility contract; changing it provides no customer value and would add deployment risk.

## Production validation

~~~bash
npm run check:source
npm run check:production
npm run typecheck
npm test
npm run build
~~~

GitHub Actions provisions PostgreSQL, applies the standalone schema, seeds it, runs dependency auditing and source hygiene, executes the integration suite, and performs a production Next.js build.

## Connecting the outside world

Production capability is activated with credentials rather than product rewrites:

- `GOOGLE_MAPS_API_KEY`: Places API (New) for canonical business search, addresses, ratings, websites, Maps links, and phone numbers.
- `PIPEDREAM_PROJECT_ID`, `PIPEDREAM_CLIENT_ID`, `PIPEDREAM_CLIENT_SECRET`: managed per-workspace OAuth and actions across thousands of applications.
- `OPENAI_API_KEY` / `OPENAI_PLANNER_MODEL`: built-in structured arbitrary-task planner using the Responses API. If omitted, Yumna uses the deterministic safe planner.
- `OPERATOR_PLANNER_URL`: optional planner override for teams that want to provide their own planning service.
- `BRAVE_SEARCH_API_KEY`: live web research and current source retrieval.
- `OPERATOR_ACTION_RUNNER_URL`: browser/API worker for web workflows that do not have a direct app/API path.
- `VAPI_API_KEY`, `VAPI_ASSISTANT_ID`, `VAPI_PHONE_NUMBER_ID`, `VAPI_WEBHOOK_SECRET`: preferred conversational outbound calls and end-of-call transcript reports. The saved Vapi assistant should reference the `{{objective}}` variable in its system prompt.
- `OPERATOR_VOICE_AGENT_URL`: optional alternate conversational voice provider. Twilio remains the basic fallback.
- `TWILIO_FROM_NUMBER` + `/api/operator/inbound/sms`: inbound text-to-Yumna.
- `/api/operator/inbound/voice`: disclosed automated call intake.
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL`: transactional email and verification delivery.
- `OPERATOR_HUMAN_QUEUE_URL`: human exception escalation for Concierge.
- Stripe secret, webhook secret, and three price IDs for paid subscriptions.
- `CRON_SECRET`: authenticates the scheduler that invokes `/api/jobs/operator-routines`.

External executors receive only the task/step contract and a one-time callback token for that step. The token is hashed at rest and revoked when the step ends. External systems never receive database credentials or a workspace-wide execution secret.

## Trust model

Consequential actions are not inferred as permission. They are either explicitly approved for the task or covered by an authority rule the user created. Spending rules enforce declared caps; unknown amounts require approval rather than inheriting authority.

Every material transition is persisted. The user can see what Yumna attempted, why it paused, which provider handled a step, what was approved, and whether the workflow finished.

## Standalone repository

This branch is intentionally isolated from the legacy source application. Publish a clean-history repository with:

~~~bash
bash scripts/publish-standalone.sh YOUR_GITHUB_OWNER/yumna private
~~~

See `docs/STANDALONE_REPOSITORY.md` for the handoff and `docs/PRODUCTION_LAUNCH.md` for the release gate.

## Deployment

The included Dockerfile can run anywhere that provides Node.js and PostgreSQL. Use HTTPS for `NEXT_PUBLIC_SITE_URL`, managed PostgreSQL, server-side secrets, Stripe at `/api/billing/webhook`, Twilio inbound routes as documented above, scoped external-executor callbacks at `/api/operator/callback`, and an hourly-or-better routine scheduler.

**Brand note:** Yumna is the current launch candidate. The product-name screen found no comparable AI assistant/software product under the exact name, but commercial launch should still include formal trademark and domain clearance.
