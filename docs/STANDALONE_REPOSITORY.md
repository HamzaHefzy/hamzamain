# Standalone repository publication

Operator is developed on the `operator/standalone-staging` branch until it is published into its own repository. The publication process intentionally copies the validated tree into a brand-new Git history so unrelated source-repository history does not follow the product.

## Publish with a clean root commit

From the source repository with GitHub CLI authenticated:

~~~bash
git fetch --all
bash scripts/publish-standalone.sh YOUR_GITHUB_OWNER/operator private
~~~

The script:

1. Archives only the tracked files from `operator/standalone-staging`.
2. Initializes a new repository with `main` as its first branch.
3. Creates one clean initial commit containing only Operator.
4. Creates the requested GitHub repository and pushes `main`.

The source repository is not rewritten or merged by this process.

## Validate the new repository

~~~bash
cd operator
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
docker build -t operator .
~~~

Use a managed PostgreSQL database, HTTPS for `NEXT_PUBLIC_SITE_URL`, Stripe webhooks at `/api/billing/webhook`, Twilio inbound webhooks as documented in the README, and a scheduler that invokes `/api/jobs/operator-routines` with the configured cron credential.

Do not deploy with `OPERATOR_DEMO_MODE=true`.
