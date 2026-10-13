# Compare Insurance API specification

## Scope

The API compares published Swiss mandatory health-insurance premiums. It must
only return offers from an ingested, validated official dataset; it must not
fabricate insurers, products, prices, or coverage.

The implementation exposes a health check, data-backed search contracts, and
an agent-led guide that coordinates typed application tools. Generated guidance
and verified facts are separate fields: a client must never parse assistant
prose to obtain a profile value, insurer, premium, rank, saving, or deadline.

## Endpoints

### `GET /health`

Returns HTTP `200` when the API process is available.

```json
{"status": "ok"}
```

### `GET /v1/locations`

Searches the pinned official postcode/locality catalogue and resolves every suggestion to its 2027 BAG premium region. The customer searches one field; canton and premium-region codes are returned for the pricing request and are not separate customer inputs.

| Parameter | Type | Required | Meaning |
| --- | --- | --- | --- |
| `q` | string, 2–100 characters | Yes | Postcode, locality, or municipality text. |
| `limit` | integer, 1–20 | No | Maximum suggestions; defaults to 8. |

```json
{
  "query": "3011",
  "premium_year": 2027,
  "source_name": "swisstopo and Swiss Federal Office of Public Health (BAG)",
  "locations": [
    {
      "postal_code": "3011",
      "locality": "Bern",
      "municipality_id": "351",
      "municipality_name": "Bern",
      "canton": "BE",
      "premium_region": "1",
      "label": "3011 Bern, BE"
    }
  ]
}
```

When one postcode/locality intersects more than one municipality, the endpoint returns each municipality separately. The UI must require a selection and must not guess.

### `POST /v1/chat`

Continues the natural-language path through the guided comparison. Native step
controls use the typed location and premium endpoints directly; the assistant
may call those same application capabilities through tools and return their
artifacts separately from generated prose.

Request:

```json
{
  "thread_id": "opaque-client-generated-id",
  "message": "I live in 3011 and was born in 1984",
  "history": [
    {"role": "assistant", "content": "Where do you live?"}
  ]
}
```

`history` contains at most 12 sanitized user/assistant turns. It is supplied by
the browser after a refresh and is never treated as the source of canonical
prices, ranks, deadlines, or profile validation.

Response:

```json
{
  "thread_id": "opaque-client-generated-id",
  "message": "I found 3011 Bern. What accident-cover option should I compare?",
  "data_status": "comparison_available_when_catalogue_configured",
  "profile": {
    "resolved_location": {
      "postal_code": "3011",
      "locality": "Bern",
      "municipality_id": "351",
      "municipality_name": "Bern",
      "canton": "BE",
      "premium_region": "1",
      "label": "3011 Bern, BE"
    }
  },
  "comparison": null,
  "citations": [
    {
      "title": "swisstopo official locality and postcode directory",
      "url": "https://www.swisstopo.admin.ch/en/official-directory-of-towns-and-cities"
    }
  ]
}
```

The endpoint uses server-side `OPENAI_API_KEY` and `OPENAI_MODEL` environment
variables. It must never expose those values to a browser response. Browser
`sessionStorage` keeps the opaque thread ID, deterministic journey state, and
bounded, sanitized visible history so the same tab can recover after a refresh.
The client resends that bounded history; the agent is stateless at the server
boundary and does not rely on in-memory checkpoints for continuity.

When the agent invokes the comparison tool, `comparison` contains the same
structured comparison shape returned by `GET /v1/premiums/search`, including `offers`,
`cheapest_by_deductible`, `cheapest_by_model`, and
`cheapest_by_deductible_and_model`. The UI renders factual values from that
object, not from `message`.

`profile` is an optional, validated projection of trusted location/comparison
tool artifacts. It can be used to prefill the native journey after the user
confirms the values. It is never inferred by parsing `message`. `citations`
contains only allow-listed HTTPS sources returned by trusted tools. The 5.0%,
CHF 412, and 30 November 2026 opening facts are versioned product content backed
by official guidance rather than values extracted from model prose.

The agent may obtain prices only through the deterministic premium-search tool;
it must not invent prices, rankings, savings, deadlines, or model rules. It
cannot generate SQL, access database credentials, or construct repository
queries.

### `GET /v1/premiums/search`

Returns up to 10 cheapest eligible offers, ordered by annual premium ascending.
Ties use insurer name and stable source identifiers for deterministic ordering.

#### Query parameters

| Parameter | Type | Required | Meaning |
| --- | --- | --- | --- |
| `canton` | string | Yes | Two-letter canton code, normalized to uppercase. |
| `region` | string | Yes | Official premium-region code `0`, `1`, `2`, or `3`. |
| `birth_year` | integer | Conditional | Preferred customer input. The API derives `child`, `young_adult`, or `adult` for the premium year. |
| `age_category` | string | Conditional | Backward-compatible direct category input. Required only when `birth_year` is omitted. If both are supplied, they must agree. |
| `deductible` | repeated integer | No | One or more of `300`, `500`, `1000`, `1500`, `2000`, `2500` CHF. Omission searches all six values. |
| `accident_coverage` | boolean | No | Whether accident coverage is included; defaults to `true`. |
| `insurance_model` | repeated string | No | One or more of the official 2027 categories: `standard`, `flex`, `praxis`, `tel_dig`, or `pharm`. Omission searches all models. |
| `year` | integer | No | Premium year; defaults to `2027`. |
| `top_n` | integer, 1–10 | No | Maximum returned offers; defaults to `10`. |
| `reference_monthly_premium_chf` | decimal | No | User-supplied current monthly premium used only for an explicitly labelled savings/cost comparison. |

Gender is intentionally not a query parameter because it is not a pricing
dimension for Swiss compulsory basic insurance.

Repeated deductible example:

```text
/v1/premiums/search?canton=ZH&region=1&birth_year=1984&deductible=300&deductible=2500&top_n=10
```

#### Successful response

```json
{
  "query": {
    "canton": "ZH",
    "region": "1",
    "age_category": "adult",
    "birth_year": 1984,
    "deductibles": [300, 2500],
    "accident_coverage": true,
    "insurance_models": ["standard", "praxis"],
    "year": 2027,
    "top_n": 10,
    "reference_monthly_premium_chf": "400.00"
  },
  "source_year": 2027,
  "source_name": "official-source-identifier",
  "total_eligible_offers": 42,
  "offers": [
    {
      "rank": 1,
      "insurer_id": "source-insurer-id",
      "insurer_name": "Source insurer name",
      "plan_id": "source-plan-id",
      "product_name": "Exact source product name",
      "canton": "ZH",
      "region": "source-region-id",
      "deductible_chf": 2500,
      "accident_coverage": true,
      "insurance_model": "source-model-name",
      "monthly_premium_chf": "000.00",
      "annual_premium_chf": "0000.00",
      "monthly_difference_from_cheapest_chf": "0.00",
      "annual_difference_from_cheapest_chf": "0.00",
      "reference_comparison": {
        "relation": "cheaper",
        "monthly_difference_chf": "50.00",
        "annual_difference_chf": "600.00"
      }
    }
  ],
  "cheapest_by_deductible": [
    {"deductible_chf": 2500, "insurance_model": "praxis", "monthly_premium_chf": "000.00"}
  ],
  "cheapest_by_model": [
    {"deductible_chf": 2500, "insurance_model": "praxis", "monthly_premium_chf": "000.00"}
  ],
  "cheapest_by_deductible_and_model": [
    {"deductible_chf": 2500, "insurance_model": "praxis", "monthly_premium_chf": "000.00"}
  ]
}
```

Each category-minimum item also includes insurer ID and name, plan ID and
product name, canton, region, accident setting, and annual premium. The example
values above describe the schema only and are not insurer or price data.

## Eligibility, ranking, and savings

1. Resolve the requested place to the official premium region for the selected
   year.
2. Apply age/tariff group, deductible, accident-coverage, and insurance-model
   filters.
3. Exclude rows that cannot be matched unambiguously or that fail ingestion
   validation.
4. Compute `annual_premium_chf` as `monthly_premium_chf × 12`, using decimal
   arithmetic and rounding to CHF 0.01 only after multiplication.
5. Compute the true minimum for every selected deductible, model, and
   deductible/model pair from the complete eligible set.
6. Rank all eligible offers by annual premium ascending, then return `top_n`.

Without a reference premium, each offer reports its non-negative premium
difference from the cheapest eligible offer:

```text
monthly_difference_from_cheapest_chf
  = offer monthly premium - cheapest eligible monthly premium

annual_difference_from_cheapest_chf
  = monthly_difference_from_cheapest_chf × 12
```

This is labelled as a price difference, not savings. If the user supplies
`reference_monthly_premium_chf`, `reference_comparison` reports whether an
offer is cheaper, the same price, or more expensive, plus the absolute monthly
and annual difference. The word "savings" may be used by the UI only when the
relation is `cheaper`. These are gross-premium differences and do not estimate
healthcare use or out-of-pocket costs.

## Errors

- `422 Unprocessable Entity`: invalid or conflicting filters, unresolved
  location, unsupported deductible/model dimension, or unavailable year.
- `503 Service Unavailable`: the server-side catalogue connection is not configured.

Error details must explain the rejected field without leaking internal paths or
credentials.
