# Compare Insurance API specification

## Scope

The API compares published Swiss mandatory health-insurance premiums. It must
only return offers from an ingested, validated official dataset; it must not
fabricate insurers, products, prices, or coverage.

The initial implementation exposes a health check and reserves the search
contract. Premium search returns HTTP `501 Not Implemented` until ingestion and
validation are complete.

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
  "data_status": "comparison_search_not_implemented"
}
```

The endpoint uses server-side `OPENAI_API_KEY` and `OPENAI_MODEL` environment
variables. It must never expose those values to a browser response. Conversation
state is currently in-memory and is lost when the API process restarts. The
agent is explanatory only until a validated deterministic premium-search tool
is attached; it must not invent prices, rankings, or savings.

### `GET /v1/premiums/search`

Returns up to 10 cheapest eligible offers, ordered by annual premium ascending.
Ties use insurer name and stable source identifiers for deterministic ordering.

#### Query parameters

| Parameter | Type | Required | Meaning |
| --- | --- | --- | --- |
| `municipality_id` | string | One location field | Preferred stable BFS municipality identifier selected after location lookup. |
| `canton` | string | One location field | Two-letter canton code, normalized to uppercase; only sufficient where the canton has no regional subdivision. |
| `region` | string | One location field | Official premium-region identifier combined with the applicable canton. |
| `postal_code` | four digits | One location field | Swiss postal code; ambiguous matches require municipality confirmation before comparison. |
| `birth_date` | ISO date | One age field | Used to derive the source-defined tariff age for the requested premium year. |
| `age` | integer, 0–120 | One age field | Age already expressed according to the source dataset's tariff rules. |
| `deductible` | repeated integer | No | One or more of `300`, `500`, `1000`, `1500`, `2000`, `2500` CHF. Omission searches all six values. |
| `accident_coverage` | boolean | No | Whether accident coverage is included; defaults to `true`. |
| `insurance_model` | string | No | Official model identifier or normalized model name (for example, a model value present in the ingested source). Omission searches all models. |
| `year` | integer | No | Premium year. Omission selects the latest successfully ingested and validated year. |
| `top_n` | integer, 1–10 | No | Maximum returned offers; defaults to `10`. |
| `reference_monthly_premium_chf` | decimal | No | User-supplied current monthly premium used only for an explicitly labelled savings/cost comparison. |

Exactly one of `municipality_id`, `canton`, `region`, or `postal_code` must be supplied. Exactly
one of `birth_date` or `age` must be supplied. These cross-field rules become
active with the data-backed search; while the endpoint is a placeholder, valid
individual parameter formats are still enforced.

Gender is intentionally not a query parameter because it is not a pricing
dimension for Swiss compulsory basic insurance.

Repeated deductible example:

```text
/v1/premiums/search?postal_code=8001&age=35&deductible=300&deductible=2500&top_n=10
```

#### Successful response

```json
{
  "query": {
    "canton": null,
    "region": null,
    "postal_code": "8001",
    "birth_date": null,
    "age": 35,
    "deductibles": [300, 2500],
    "accident_coverage": true,
    "insurance_model": null,
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
      "canton": "ZH",
      "region": "source-region-id",
      "postal_code": "8001",
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
  ]
}
```

The example values above describe the schema only and are not insurer or price
data.

## Eligibility, ranking, and savings

1. Resolve the requested place to the official premium region for the selected
   year.
2. Apply age/tariff group, deductible, accident-coverage, and insurance-model
   filters.
3. Exclude rows that cannot be matched unambiguously or that fail ingestion
   validation.
4. Compute `annual_premium_chf` as `monthly_premium_chf × 12`, using decimal
   arithmetic and rounding to CHF 0.01 only after multiplication.
5. Rank all eligible offers by annual premium ascending, then return `top_n`.

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
- `501 Not Implemented`: official data has not yet been ingested and validated.
- `503 Service Unavailable`: a previously enabled search cannot safely query its
  validated dataset.

Error details must explain the rejected field without leaking internal paths or
credentials.
