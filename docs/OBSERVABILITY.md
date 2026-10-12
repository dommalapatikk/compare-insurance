# Observability plan

**Status:** Planned before public beta  
**Principle:** Observe system behaviour without recording unnecessary personal data.

## Scope

The production system will use the three standard observability signals:

- **Structured logs** for discrete operational events and failures.
- **Metrics** for rates, latency, errors, data freshness, and business-flow health.
- **Distributed traces** for a request across Next.js, FastAPI, repository, and
  external model calls.

OpenTelemetry is the preferred vendor-neutral instrumentation standard. The
event schema and application code must not depend directly on one dashboard or
telemetry vendor.

## Privacy boundary

“Log everything” means logging every important system transition—not every
piece of user content. The following are denied by default:

- API keys, authorization headers, cookies, environment values, or secrets;
- raw chat prompts and model responses;
- names, exact street addresses, full dates of birth, health information,
  policy numbers, or payment data;
- complete comparison profiles or raw request/response bodies; and
- stack traces returned to the browser.

Postal codes, municipality IDs, thread IDs, IP addresses, and user agents are
treated as potentially identifying. They must be removed, irreversibly
transformed, sampled, or aggregated before analytics use. Debug content capture
must require an explicit, time-limited incident procedure and separate access.

## Correlation and event fields

Every server request should receive or create a correlation ID. Logs and spans
use a stable schema containing only fields appropriate to the event:

- timestamp, environment, service, version, and event name;
- trace ID, span ID, and correlation ID;
- route template, HTTP method, status class, and duration;
- dependency name, operation, duration, retry count, and outcome;
- dataset year, version/checksum reference, and validation status; and
- error category and safe error code rather than sensitive exception content.

The correlation ID may be returned in an HTTP response header to support
troubleshooting. It must not encode user data.

## Required telemetry

### Web and API

- request rate, error rate, and p50/p95/p99 latency by route template;
- location-resolution ambiguity and no-match rates;
- comparison completion and empty-result rates using aggregate dimensions;
- cache hit rate and downstream dependency health; and
- frontend Web Vitals and unhandled client errors without form values.

### Premium catalogue

- import job ID, source URL identifier, checksum, dataset year, and timestamps;
- downloaded, parsed, accepted, rejected, duplicate, and promoted row counts;
- schema/validation rule outcomes and comparison with the previous version;
- current active dataset version and age; and
- alerts for download, validation, or atomic-promotion failure.

### LangChain guide

- provider/model identifier, latency, status, retry count, and token usage;
- safety/guardrail outcome and tool-call name/status when tools are added; and
- no prompt or response text by default.

## Service objectives and alerts

Initial production objectives from the PRD:

- comparison API availability: 99.9% per calendar month;
- comparison API p95 latency: under 500 ms;
- location lookup p95 latency: under 300 ms; and
- the active premium catalogue remains valid and within its expected release
  window.

Alerts should be actionable. Start with sustained error-rate or latency-budget
breaches, unavailable dependencies, failed catalogue promotion, missing active
data, and unexpected dataset age. Avoid per-error paging and noisy alerts.

## Architecture integration

Observability is an outer concern. Domain entities and services must not import
logging, tracing, or vendor SDKs. Application use cases may publish typed,
content-free operational events through a future port; infrastructure adapters
will translate them into logs, metrics, and spans.

Instrumentation failures must never change ranking, eligibility, or savings
results. Telemetry exporters must use bounded queues, timeouts, and safe
fallbacks.

## Test-driven rollout

1. Before the catalogue pipeline: define event names and add tests for import
   counts, validation failures, and secret/profile redaction.
2. Before API integration: add request correlation and tracing tests across the
   Next.js proxy and FastAPI boundary.
3. Before public beta: add dashboards, SLO burn-rate alerts, retention/access
   controls, and a telemetry failure test.
4. Before enabling any analytics: perform a privacy review of every collected
   field and document its purpose and retention period.

Automated tests must verify that representative secrets, chat text, birth data,
and comparison profiles cannot enter structured log attributes.

