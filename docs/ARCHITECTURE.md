# Architecture

## Architectural style

Compare Insurance uses domain-driven design with ports and adapters. Business
rules point inward and do not depend on FastAPI, Pydantic, LangChain, storage,
or a particular deployment platform.

```text
HTTP / Next.js / LangChain / BAG files
                 |
          infrastructure + API
                 |
          application use cases
                 |
              domain
```

Dependencies may point down this diagram, never back up. The domain owns the
meaning of a valid comparison, ranking, and price difference. Frameworks only
transport, persist, or present those decisions.

## Bounded contexts

### Premium comparison — core domain

Owns the language and rules that determine:

- official age category;
- valid deductible choices by age category;
- eligible premium offer;
- cheapest-first ranking and deterministic tie-breaking;
- monthly and annual premium differences; and
- the relationship to a user-provided reference premium.

The core domain never calls an LLM. Its calculations must be deterministic and
fully reproducible from source-backed values.

### Premium catalogue — supporting domain

Will ingest, validate, normalize, version, and expose official BAG records. It
implements the premium-repository port defined by the application layer. A
failed import must not replace the last validated catalogue.

### Conversational guidance — supporting domain

Explains concepts and collects user intent. LangChain is an adapter behind the
`InsuranceGuide` port. It may eventually call a read-only comparison use case,
but it never owns eligibility, prices, ranking, or savings.

### Web experience — presentation

The Next.js application presents guided inputs, accessible comparisons, and
source provenance. It consumes API contracts and does not duplicate core
pricing rules.

The frontend is organized by feature rather than as a single route component:

```text
frontend/
  app/                         Next.js delivery boundary and API proxy
  features/comparison/
    config.ts                  immutable choices and preview fixtures
    types.ts                   feature language
    use-comparison-flow.ts     client-side workflow state and actions
    components/
      steps/                   one component per guided decision
      results/                 one component per visualization/result module
    styles/                    base, guide, results, and responsive concerns
```

Route files remain thin composition entries. Components own one interaction or
presentation concern, shared feature state stays in one hook, and transport
details remain in `app/api`. The architecture check limits feature files to 250
lines and prevents feature modules from depending on the Next.js delivery layer.

## Backend layers

```text
backend/src/compare_insurance_api/
  domain/
    models.py          entities, value objects, invariants
    services.py        pure ranking and comparison rules
  application/
    ports.py           repository and guide interfaces
    use_cases.py       comparison and explanation orchestration
  infrastructure/
    langchain_guide.py LangChain adapter
    # premium_repository.py will be added with ingestion/search
  api/
    schemas.py         HTTP-only Pydantic contracts
    routes.py          thin FastAPI controllers
    dependencies.py    adapter wiring for controllers
  main.py              composition root and process configuration
```

The legacy `agent.py` module is a compatibility facade. New code must depend on
the application `InsuranceGuide` port rather than importing LangChain directly.

## Ubiquitous language

- **Premium offer:** one eligible insurer/product/model combination for a
  specific year, municipality region, age category, deductible, and accident
  choice.
- **Comparison criteria:** confirmed, normalized inputs for a single search.
- **Cheapest:** the lowest approved monthly gross premium for the exact
  criteria—not a quality or total-cost recommendation.
- **Difference from cheapest:** a non-negative price delta for another offer.
- **Reference comparison:** the absolute price difference and explicit
  `cheaper`, `same`, or `more_expensive` relation to the user's current premium.
- **Savings:** wording reserved for an offer that is cheaper than a supplied
  reference premium.

Use these terms in product requirements, code, API contracts, tests, and UI.

## Cross-cutting observability

Observability belongs at the API and infrastructure edges. The domain layer
must remain unaware of logging, tracing, metrics, and telemetry vendors.
Application use cases may later emit typed operational events through a port;
adapters will translate them to OpenTelemetry signals.

Telemetry must be content-minimizing: operational state, timing, outcomes, and
dataset lineage are captured, while secrets, raw chat content, health data, and
complete comparison profiles are denied by default. See
[OBSERVABILITY.md](OBSERVABILITY.md) for the phased rollout, signal schema,
privacy boundary, service objectives, and test requirements.

## Runtime shape

```text
Browser
  -> Next.js guided comparison and chat
  -> same-origin POST /api/chat
  -> FastAPI API controller
  -> ExplainInsuranceChoices use case
  -> InsuranceGuide port
  -> LangChain adapter -> configured OpenAI model

Official BAG raw data
  -> tested import/validation adapter (next milestone)
  -> PremiumRepository port
  -> ComparePremiums use case
  -> pure domain ranking and difference calculations
```

`GET /v1/premiums/search` remains an explicit `501` until a validated catalogue
adapter is implemented. The domain and application comparison foundation is
already isolated and tested, but it must not be presented as a working live
search before official records are mapped and verified.

## Test-driven development policy

Every behavior change follows a visible red–green–refactor cycle:

1. **Red:** add the smallest test that expresses the domain or use-case behavior
   and run it to confirm that it fails for the expected reason.
2. **Green:** implement the smallest production change that makes the test pass.
3. **Refactor:** improve names and boundaries while the full suite remains green.

Tests are organized by architectural layer:

```text
backend/tests/
  domain/       fast tests for invariants and calculations; no frameworks
  application/  use-case tests with in-memory fakes for ports
  api/          HTTP contract, validation, and error-mapping tests
  integration/  future BAG parsing and repository adapter tests
```

Rules for future work:

- A pricing, eligibility, ranking, or savings rule starts with a domain test.
- A workflow starts with an application test using a fake port.
- An endpoint change includes an API contract test.
- A BAG schema mapping includes representative fixture and rejection tests.
- LLM calls are never required by the default test suite.
- Production defects receive a failing regression test before the fix.
- Tests must assert behavior and business language, not framework internals.
- Architecture fitness tests prevent framework and outer-layer imports from
  leaking into the domain or application layers.

Run the backend quality gate with:

```bash
cd backend
.venv/bin/python -m pytest -q
.venv/bin/python -m compileall -q src tests
```

Run the frontend quality gate with:

```bash
cd frontend
npm run check:architecture
npm run typecheck
npm run build
```

## Deployment boundary

The frontend and FastAPI/LangChain runtime are deployed as separate Vercel
projects from the same monorepo. `backend/src/index.py` is the thin Vercel
Python-runtime entry point and only re-exports the existing FastAPI composition
root. The frontend reaches that service through its same-origin proxy route.

This production deployment publishes the guided MVP and API scaffold only.
The premium-search route remains an explicit `501` until the catalogue adapter
and its validation suite are complete, so preview fixtures must not be
presented as live price results.

