# Compare Insurance

Compare Insurance is an early-stage Swiss compulsory health-insurance comparison project. Its goal is to help residents find and compare the lowest published basic-insurance premiums for their location and personal situation. The implementation follows domain-driven design and a test-driven workflow.

## Project status

The repository contains the product and UX requirements, a guided Next.js frontend, a layered FastAPI/LangChain backend, tested domain comparison rules, and a documented copy of the relevant official Swiss government premium dataset. Live price search and production deployment remain blocked until the ingestion adapter is implemented and validated.

## Planned capabilities

- Search by Swiss place of residence and premium region.
- Account for age category and other premium-relevant inputs.
- Compare deductibles of CHF 300, 500, 1,000, 1,500, 2,000, and 2,500 where eligible.
- Compare standard, family-doctor, HMO, telemedicine, and other published insurance models.
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
.venv/bin/python -m pip install -e '.[dev]'
.venv/bin/python -m pytest -q
.venv/bin/uvicorn compare_insurance_api.main:app --reload
```

The API provides `GET /health` and the LangChain-backed `POST /v1/chat` route.
The premium-search endpoint is deliberately marked `501 Not Implemented` until
the raw BAG data has a tested, reproducible ingestion pipeline.

## Development approach

Business rules live in a framework-free domain layer. Application use cases
depend on ports, while FastAPI, LangChain, and the future BAG repository are
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

The browser calls a same-origin Next.js route, which forwards chat messages to
the FastAPI service configured by `COMPARE_API_URL`. `OPENAI_API_KEY` and
`OPENAI_MODEL` remain server-side. Copy `.env.example` to your local secret
configuration without committing the resulting file.

## Important

This project is an informational comparison tool. It does not provide medical, legal, insurance, or financial advice. Premium results must retain their source year, retrieval date, eligibility assumptions, and accident-coverage status.

## Next milestones

1. Test-drive the BAG normalization and premium-repository adapter.
2. Connect the tested repository to the existing comparison use case.
3. Add API contract and end-to-end comparison tests.
4. Add GitHub Actions quality gates.
5. Connect preview and production deployment after review.
