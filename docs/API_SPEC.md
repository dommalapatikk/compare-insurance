# Compare Insurance API specification

## Scope

The API compares published Swiss mandatory health-insurance premiums. It must
only return offers from an ingested, validated official dataset; it must not
fabricate insurers, products, prices, or coverage.

The implementation exposes a health check, a data-backed search contract, and
a LangChain guide with a read-only comparison tool.

## Endpoints

### `GET /health`

Returns HTTP `200` when the API process is available.

```json
{"status": "ok"}
```

### `POST /v1/chat`

Continues a short-lived LangChain conversation about compulsory basic-insurance
comparison inputs and concepts.

Request:

```json
{
  "message": "How does a CHF 2,500 deductible change my costs?",
  "thread_id": "opaque-client-generated-id"
}
```

Response:

```json
{
  "message": "Assistant response text",
  "thread_id": "opaque-client-generated-id",
  "data_status": "comparison_available_when_catalogue_configured"
}
```

The endpoint uses server-side `OPENAI_API_KEY` and `OPENAI_MODEL` environment
variables. It must never expose those values to a browser response. Conversation
state is currently in-memory and is lost when the API process restarts. The
agent may obtain prices only through the deterministic premium-search tool; it
must not invent prices, rankings, or savings. It cannot generate SQL, access
database credentials, or construct repository queries.

### `GET /v1/premiums/search`

Returns up to 10 cheapest eligible offers, ordered by annual premium ascending.
Ties use insurer name and stable source identifiers for deterministic ordering.

#### Query parameters

| Parameter | Type | Required | Meaning |
| --- | --- | --- | --- |
| `canton` | string | Yes | Two-letter canton code, normalized to uppercase. |
| `region` | string | Yes | Official premium-region code `0`, `1`, `2`, or `3`. |
| `age_category` | string | Yes | `child`, `young_adult`, or `adult`. Ordinary child premiums use BAG subgroup `K1`; optional multi-child discounts are not mixed into results. |
| `deductible` | repeated integer | No | One or more of `300`, `500`, `1000`, `1500`, `2000`, `2500` CHF. Omission searches all six values. |
| `accident_coverage` | boolean | No | Whether accident coverage is included; defaults to `true`. |
| `insurance_model` | repeated string | No | One or more of `standard`, `family_doctor`, `hmo`, `telmed`, or `other`. Omission searches all models. |
| `year` | integer | No | Premium year; defaults to `2027`. |
| `top_n` | integer, 1–10 | No | Maximum returned offers; defaults to `10`. |
| `reference_monthly_premium_chf` | decimal | No | User-supplied current monthly premium used only for an explicitly labelled savings/cost comparison. |

Gender is intentionally not a query parameter because it is not a pricing
dimension for Swiss compulsory basic insurance.

Repeated deductible example:

```text
/v1/premiums/search?canton=ZH&region=1&age_category=adult&deductible=300&deductible=2500&top_n=10
```

#### Successful response

```json
{
  "query": {
    "canton": "ZH",
    "region": "1",
    "age_category": "adult",
    "deductibles": [300, 2500],
    "accident_coverage": true,
    "insurance_models": ["standard", "hmo"],
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
    {"deductible_chf": 2500, "insurance_model": "hmo", "monthly_premium_chf": "000.00"}
  ],
  "cheapest_by_model": [
    {"deductible_chf": 2500, "insurance_model": "hmo", "monthly_premium_chf": "000.00"}
  ],
  "cheapest_by_deductible_and_model": [
    {"deductible_chf": 2500, "insurance_model": "hmo", "monthly_premium_chf": "000.00"}
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
