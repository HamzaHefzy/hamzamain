# Production launch checklist

This checklist is deliberately operational: passing it means the application is configured to accept users and money without silently falling back to demo behavior.

## Core application

- PostgreSQL is reachable through `DATABASE_URL`.
- `AUTH_SECRET` is a high-entropy value of at least 32 characters.
- `NEXT_PUBLIC_SITE_URL` is the final HTTPS origin.
- `OPERATOR_DEMO_MODE=false`.
- Resend is configured so production signup can verify email addresses.
- `CRON_SECRET` is configured and the routine scheduler invokes the job endpoint at least hourly.

## Billing

- Stripe secret and webhook secrets are configured.
- Assistant, Yumna, and Concierge price IDs point to recurring prices in the intended Stripe account.
- Stripe posts signed events to `/api/billing/webhook`.
- The billing portal is enabled in Stripe so customers can manage or cancel subscriptions.

## Execution providers

For real-world execution, connect the capabilities you plan to sell:

- Google Maps Platform with Places API (New) enabled for local discovery and phone resolution.
- Pipedream Connect for managed app authentication and connected-app actions.

- Browser/API worker through `OPERATOR_ACTION_RUNNER_URL`.
- Conversational voice service through `OPERATOR_VOICE_AGENT_URL`, or Twilio for the basic phone fallback.
- Human exception queue for Concierge through `OPERATOR_HUMAN_QUEUE_URL`.

Each asynchronous executor receives a per-step callback credential. It must return completion or failure to the callback URL supplied with that step and should send a stable `x-operator-event-id` for retry deduplication.

## Communications

- Link the owner phone from Connections before enabling text-to-Yumna.
- Configure Twilio Messaging to post to `/api/operator/inbound/sms`.
- Configure Twilio Voice intake to post to `/api/operator/inbound/voice`.
- Keep SMS task notifications opt-in.

## Release gate

Run:

~~~bash
npm ci
npm audit --omit=dev --audit-level=moderate
npm run check:source
npm run check:production
npm run typecheck
npm test
npm run build
~~~

A production release should not proceed if any command fails.
