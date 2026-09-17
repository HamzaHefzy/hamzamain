# Anchor

Anchor is an attendance-resolution and revenue-assurance platform for school systems. The first product is a Texas charter-network MVP that combines aggregate ADA/funding visibility with a student-support ResolutionOS.

## Product guardrail

Finance views may show aggregate campus/network funding scenarios. Student-level views must never assign or display a dollar value to an individual child.

## Current MVP

The repository now includes:

- `/` — executive ADA + attendance economics dashboard
- `/funding` — transparent Texas Basic-Allotment scenario model
- `/cases` — ResolutionOS queue organized as Do Now / Stuck / Check Outcome
- `lib/finance.ts` — deterministic ADA/funding calculations
- `lib/data.ts` — synthetic charter-network and case data
- `docs/PRODUCT_GUARDRAILS.md` — financial/privacy product constraints
- `.github/workflows/ci.yml` — build verification

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

For a production build:

```bash
npm run build
npm start
```

## Initial stack

- Next.js 16.3.3 (Active LTS)
- React 19.3
- TypeScript
- CSS variables/components
- synthetic data only during the MVP phase

## First milestone

The first runnable version answers four questions every morning:

1. What is our current ADA trajectory?
2. What is the gross funding exposure associated with that trajectory?
3. Which attendance barriers can we act on today?
4. Did completed interventions improve attendance?

## Important finance disclaimer

The MVP's Texas finance numbers are gross Basic-Allotment planning scenarios, not guarantees of net state-aid impact. Production calculations must incorporate the customer's actual Foundation School Program circumstances and current TEA attendance-accounting rules.
