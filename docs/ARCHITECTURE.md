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
      application use cases + workflow
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

Ingests, validates, normalizes, and exposes official BAG records in Supabase.
The PostgREST adapter implements the premium-repository port defined by the
application layer. The checked-in snapshot is validated fully before a remote
write begins.

### Location resolution — supporting domain

Joins the pinned swisstopo postcode/locality directory to the BAG 2027
municipality and premium-region rules by BFS municipality number. The
`SearchLocations` use case depends on a location-repository port; the packaged
CSV adapter provides deterministic type-ahead matches without a live third-party
lookup. Ambiguous postcode/locality matches stay separate until the user chooses
the correct municipality.

### Guided comparison — supporting domain

Collects comparison intent one validated decision at a time, explains concepts,
and coordinates typed application tools. The assistant is the primary customer
interface, but it is not the source of canonical workflow state or factual
results.

The presentation layer owns a framework-free `JourneyState` containing the
current step and confirmed profile values. LangChain is an adapter behind the
`InsuranceGuide` port: it interprets free text and selects tools. Tool results
return optional structured profile and comparison artifacts alongside generated
prose. Native UI controls reach the same location and premium application use
cases through typed HTTP endpoints without requiring a model call.

The agent tool boundary includes:

- location resolution through `SearchLocations`;
- premium comparison through `ComparePremiums`;
- versioned official insurance explanations; and
- versioned premium context and switching deadlines.

The agent never owns eligibility, insurer/product identity, prices, category
minima, ranking, differences, deadlines, or savings. Generated prose and typed
facts remain separate throughout the API and presentation layers.

### Web experience — presentation

The Next.js application presents one agent-led guided journey, accessible native
controls, structured comparisons, and source provenance. The page does not
render a traditional form plus a separate chat. It consumes typed API contracts
and does not duplicate core pricing rules.

The frontend is organized by feature rather than as a single route component:

```text
frontend/
  app/                         Next.js delivery boundary and API proxy
  features/comparison/
    config.ts                  immutable input choices
    types.ts                   feature language
    use-comparison-flow.ts     validated client workflow and actions
    components/
      steps/                   one native control per guided decision
      results/                 structured fact and visualization modules
    styles/                    base, guide, results, and responsive concerns
```

Route files remain thin composition entries. Components own one interaction or
presentation concern, shared feature state stays in one hook, and transport
details remain in `app/api`. The architecture check limits feature files to 250
lines and prevents feature modules from depending on the Next.js delivery layer.

The presentation order is fixed by product semantics rather than generated
prose: lowest overall, lowest by franchise, model comparison, then top ten.
The frontend renders those values from structured response fields and never
extracts a price, rank, insurer, deadline, or calculation from assistant text.

### Browser session persistence — presentation adapter

The anonymous MVP uses browser `sessionStorage` to recover from a refresh in
the same tab. A versioned, bounded record may contain:

- opaque thread/session identifier;
- current guided step;
- confirmed comparison profile;
- bounded, sanitized visible transcript or conversation summary; and
- timestamp/schema version.

It must not contain credentials, hidden prompts, gender, health history, exact
street address, policy number, payment data, or privileged source data. **Start
over** deletes the record and creates a new opaque identifier. Closing the tab,
another tab, another device, and long-term saved
comparisons are outside the MVP contract.

Server-side checkpointer memory is an optimization, not the canonical session.
Every assistant request carries sufficient validated profile and bounded context
to continue when a Vercel serverless process changes or restarts.

## Backend layers

```text
backend/src/compare_insurance_api/
  domain/
    models.py          entities, value objects, invariants
    services.py        pure ranking and comparison rules
  application/
    ports.py           repository and guide interfaces
    use_cases.py       comparison, location, and explanation orchestration
  infrastructure/
    bag_ingestion.py          reproducible source loading and upload
    bag_normalization.py      source-code mappings and validation
    location_catalogue.py     postcode/BFS/premium-region build rules
    location_repository.py    packaged LocationRepository CSV adapter
    supabase_repository.py    PremiumRepository PostgREST adapter
    langchain_tools.py        read-only deterministic comparison tool
    langchain_guide.py        LangChain agent adapter
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
- **Comparison session:** current guided step plus confirmed, validated profile
  values; it is independent of an LLM provider. The MVP represents it as a pure
  frontend journey state and validates pricing criteria again on the server.
- **Assistant guidance:** generated plain-language content that can explain or
  request information but is not a price, ranking, deadline, or calculation.
- **Structured result:** typed source-backed facts produced by application use
  cases and rendered independently from assistant guidance.
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
  -> Next.js agent-led guided comparison
  -> sessionStorage adapter restores same-tab workflow after refresh
  -> same-origin /api/chat, /api/locations, and /api/premiums
  -> FastAPI API controller
  -> ExplainInsuranceChoices -> InsuranceGuide -> LangChain/OpenAI
  -> assistant message + optional profile/comparison/citations artifacts
  -> SearchLocations -> LocationRepository -> packaged official-data catalogue
  -> ComparePremiums -> PremiumRepository -> Supabase

Official swisstopo + BAG raw data
  -> tested postcode/municipality/premium-region build
  -> packaged location catalogue
Official BAG premium data
  -> tested import/validation adapter
  -> normalized Supabase catalogue
  -> pure domain ranking and difference calculations
```

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
  infrastructure/ BAG parsing, repository, and LangChain-tool adapter tests
```

Rules for future work:

- A pricing, eligibility, ranking, or savings rule starts with a domain test.
- A workflow starts with an application test using a fake port.
- A guided-step transition starts with a pure journey-state test proving valid
  transitions, compare-all defaults, dependent resets, and restart behavior.
- An endpoint change includes an API contract test.
- A BAG schema mapping includes representative fixture and rejection tests.
- LLM calls are never required by the default test suite.
- Agent contract tests assert that generated prose and structured factual data
  use separate fields and that price rendering never depends on prose parsing.
- Frontend persistence tests cover refresh rehydration, schema/version rejection,
  bounded transcript retention, and **Start over** clearing `sessionStorage`.
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

The browser owns only the recoverable same-tab presentation snapshot. The chat
request sends a bounded, sanitized history, and the deterministic journey sends
validated pricing criteria to the comparison endpoint. No correctness or
continuity guarantee depends on a specific serverless instance or
`InMemorySaver`. Durable accounts and cross-device history are deferred.

Supabase is server-only: browser code reaches it through FastAPI, row-level
security is enabled, and the service-role key is stored only in deployment and
automation secret stores. The public UI presents returned BAG records rather
than local preview fixtures.

