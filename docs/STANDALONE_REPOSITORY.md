# Standalone repository publication

Yumna is developed on the isolated `operator/standalone-staging` branch only because the connected GitHub capability cannot create a new repository directly. The legacy application's `main` branch remains unchanged by Yumna development.

The publication process copies the validated tree into a brand-new Git history, so unrelated legacy history never follows Yumna.

## Publish with a clean root commit

From the source repository with GitHub CLI authenticated:

~~~bash
git fetch --all
bash scripts/publish-standalone.sh YOUR_GITHUB_OWNER/yumna private
~~~

The script:

1. Archives only tracked files from `operator/standalone-staging`.
2. Initializes a new repository with `main` as its first branch.
3. Creates one clean initial commit containing only Yumna.
4. Creates the requested GitHub repository and pushes `main`.

The source repository is not rewritten or merged by this process.

## Validate the new repository

~~~bash
cd yumna
npm ci
npm run check:source
npm run typecheck
npm test
npm run build
~~~

Database-backed tests require PostgreSQL and are also exercised by the included GitHub Actions workflow.

## Production deployment

Configure the environment described in `.env.example`, then run:

~~~bash
npm run check:production
docker build -t yumna .
~~~

Use managed PostgreSQL, HTTPS for `NEXT_PUBLIC_SITE_URL`, Google Places, the selected app/voice providers, Stripe webhooks, Twilio inbound webhooks, and a scheduler that invokes `/api/jobs/operator-routines`.

Do not deploy with `OPERATOR_DEMO_MODE=true`.
