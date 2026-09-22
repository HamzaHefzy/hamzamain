# Anchor

Anchor is an attendance-resolution operating system for school systems. It combines attendance ingestion, ResolutionOS case execution, virtual participation recovery, and aggregate attendance-linked funding planning in one organization-scoped workspace.

## Production-v1 capabilities

- PostgreSQL multi-tenancy
- signed sessions and role-based access
- team invitations and password recovery
- campus and delivery-model configuration
- versioned virtual attendance policies
- roster, attendance, evidence, and virtual-session CSV ingestion
- OneRoster roster synchronization with encrypted OAuth credentials
- persistent ResolutionOS cases, owners, commitments, verification, and history
- virtual evidence adjudication
- scheduled-session Show-Up recovery and secure student barrier check-ins
- Twilio SMS and Resend email adapters
- aggregate funding assumptions and scenarios
- audit logging
- public pricing, persisted sales lead capture, Resend sales alerts, and signed CRM webhooks
- Docker support and PostgreSQL-backed CI

## Product guardrail

Finance views may show aggregate campus/network funding scenarios. Student-level views must never assign or display a dollar value to an individual child, and support prioritization must not depend on funding weight.

## Local development

The supported local setup path is:

~~~bash
npm install
npm run setup:local
npm run dev
~~~

The setup command creates a gitignored `.env.local`, starts the PostgreSQL Docker service, runs every migration, seeds a demo organization, and prints the local admin credentials to the terminal.

Open http://localhost:3000 and sign in with the email/password printed by `npm run setup:local`.

If Docker Desktop is not running, start it and rerun `npm run setup:local`.

## Validation

~~~bash
npm run check:source
npm run typecheck
npm test
npm run build
~~~

GitHub Actions additionally starts PostgreSQL, runs migrations and seed, executes the database smoke test, and performs the production build.

## Customer setup

See:

- docs/DEPLOYMENT.md
- docs/CUSTOMER_ONBOARDING.md
- docs/ATTENDANCE_RECOVERY_STRATEGY.md
- docs/SECURITY.md
- docs/PRODUCT_GUARDRAILS.md
- examples/imports/

## Important finance disclaimer

Texas funding values in Anchor are transparent planning scenarios, not guarantees of net state-aid impact. Production calculations must be reconciled to the customer's actual Foundation School Program circumstances and current attendance-accounting rules.

## Integration truthfulness

CSV import and the OneRoster roster adapter are implemented paths. Other named SIS/LMS vendors should not be represented as live integrations until their provider-specific adapters have been implemented and validated with authorized customer credentials.
