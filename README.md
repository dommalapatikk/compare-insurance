# Compare Insurance

Compare Insurance is an early-stage Swiss compulsory health-insurance comparison project. Its goal is to help residents find and compare the lowest published basic-insurance premiums for their location and personal situation. The implementation follows domain-driven design and a test-driven workflow.

## Project status

The repository contains the product and UX requirements, a guided Next.js frontend, a layered FastAPI/LangChain backend, tested deterministic comparison rules, and documented official Swiss government data snapshots. A dedicated Supabase catalogue stores the normalized 2027 premiums. A packaged location catalogue joins official swisstopo postcodes to BAG premium regions, and the same comparison use case powers the HTTP API and the LangChain tool.

## Current capabilities

- Search by Swiss postcode or municipality while resolving the premium region behind the scenes.
- Derive the official child, young-adult, or adult category from birth year; gender is not collected.
- Compare deductibles of CHF 300, 500, 1,000, 1,500, 2,000, and 2,500 where eligible.
- Compare the official 2027 Priminfo categories: Standard, FLEX, PRAXIS, TEL-DIG, and PHARM where offers exist.
- Rank up to ten suitable offers and show savings against a clearly defined comparison baseline.

## Repository layout

```text
backend/          Domain, application, infrastructure, FastAPI, and tests
data/raw/         Unmodified source data from official publishers
data/processed/   Generated normalized data (not committed by default)
docs/             Product, UX, API, and architecture documentation
frontend/         Feature-modular Next.js comparison and LangChain chat UI
```

## Run the API scaffold

```bash
cd backend
python3.12 -m venv .venv
.venv/bin/python -m pip install -e '.[dev,data]'
.venv/bin/python -m pytest -q
.venv/bin/python scripts/ingest_bag_to_supabase.py --validate-only
.venv/bin/python scripts/build_location_catalogue.py --check
.venv/bin/python scripts/check_priminfo_parity.py
.venv/bin/uvicorn compare_insurance_api.main:app --reload
```

The parity command submits one equivalent profile to the official Priminfo
calculator and the production comparison API, then verifies the eligible count
and the ordered top-ten monthly premiums. GitHub Actions repeats this check
weekly for every 2027 category present in the dataset—Standard, FLEX, PRAXIS,
and TEL-DIG—and it can also be run manually through the `Priminfo parity`
workflow. PHARM remains a supported official category but has no row in the
pinned 2027 premium snapshot.

The API provides `GET /health`, official-data-backed `GET /v1/locations`,
data-backed `GET /v1/premiums/search`, and the LangChain-backed `POST /v1/chat`
route.

## Development approach

Business rules live in a framework-free domain layer. Application use cases
depend on ports, while FastAPI, LangChain, and the Supabase BAG repository are
outer adapters. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for bounded
contexts, dependency rules, ubiquitous language, and the required
red–green–refactor workflow. The planned privacy-safe telemetry design is in
[docs/OBSERVABILITY.md](docs/OBSERVABILITY.md).

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

The browser calls same-origin Next.js routes, which forward comparison and chat
requests to the FastAPI service configured by `COMPARE_API_URL`.
`SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, and `OPENAI_MODEL` remain
server-side. Copy the relevant `.env.example` file to local secret
configuration without committing the resulting file.

## Deployment

- Frontend: <https://compare-insurance.vercel.app>
- API health check: <https://compare-insurance-api.vercel.app/health>
- GitHub Actions runs the backend, frontend, and pinned-data integrity gates on
  pushes to `main` and on pull requests.
- A separate scheduled workflow compares an equivalent production query with
  the official Priminfo calculator.

The two applications are separate Vercel projects in this monorepo. The
frontend production environment points to the API project. Premium comparison
does not depend on an LLM. The chat assistant remains safely disabled until
`OPENAI_API_KEY` is added to the API project's Vercel environment.

Automatic Vercel deployments from Git require the Vercel account's GitHub
integration to be authorized for `dommalapatikk/compare-insurance`.

## Important

This project is an informational comparison tool. It does not provide medical, legal, insurance, or financial advice. Premium results must retain their source year, retrieval date, eligibility assumptions, and accident-coverage status.

## Next milestones

1. Add source-version metadata and atomic catalogue promotion.
2. Add deployed end-to-end browser tests.
3. Add privacy-safe OpenTelemetry instrumentation.
