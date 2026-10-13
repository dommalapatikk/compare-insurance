# Compare Insurance — Product Requirements Document

**Product:** Compare Insurance  
**Market:** Switzerland  
**Insurance scope:** Compulsory health insurance (OKP / Grundversicherung / assurance de base)  
**Status:** Draft for MVP  
**Last updated:** 13 October 2026
**Owner:** Product team

## 1. Product summary

Compare Insurance helps people living in Switzerland identify and compare the lowest-priced compulsory basic health-insurance plans available for their place of residence. A user enters their municipality or postal code, age information, desired deductible ("franchise"), insurance model, and accident-coverage preference. The product returns up to ten eligible plans ranked by approved premium and clearly shows possible monthly and annual premium savings.

The first release is a neutral comparison tool. It does not sell insurance, determine eligibility for premium subsidies, or compare supplementary insurance.

## 2. Problem statement

Swiss basic-insurance premiums vary across insurers, premium regions, age groups, deductibles, insurance models, accident coverage, and insurance years. Official data is available, but the number of combinations and unfamiliar terminology make it difficult for a person to answer a simple question: "What is the cheapest valid option for me, and how much could I save?"

The product should turn official premium data into a fast, understandable comparison without implying that the lowest premium is automatically the best overall financial or care choice.

## 3. Product goals

- Find the cheapest eligible basic-insurance plans for a user's municipality and age category.
- Compare plans at adult deductible levels of CHF 300, 500, 1,000, 1,500, 2,000, and 2,500.
- Compare the official 2027 Priminfo model categories: Standard, FLEX, PRAXIS, TEL-DIG, and PHARM where available.
- Show the ten lowest-premium eligible plan combinations with transparent ranking and savings calculations.
- Use approved, traceable Federal Office of Public Health (FOPH/BAG) data and make the applicable premium year visible.
- Explain the practical trade-offs behind deductibles, restricted-provider models, and accident coverage.

## 4. Non-goals

- Supplementary insurance (VVG/LCA) comparison or underwriting.
- Personalized medical, legal, tax, or financial advice.
- A claim that the lowest monthly premium produces the lowest total annual healthcare cost.
- Premium-subsidy eligibility calculation or application.
- Insurance purchase, policy cancellation, switching, payment, or document signing in the MVP.
- Provider-network completeness, service-quality ratings, customer reviews, or claims-service rankings.
- Employer, cross-border worker, asylum, military, diplomatic, or other exceptional insurance situations.

## 5. Swiss premium rules and product assumptions

### 5.1 Gender

Gender is **not a premium-setting factor for compulsory basic health insurance**. For the same insurer, premium region, age category, insurance model, deductible, accident option, and premium year, the standard premium is independent of sex. Gender can affect supplementary-insurance pricing, but supplementary insurance is outside this product's scope.

Therefore:

- the MVP must not require or use gender for search, ranking, savings, personalization, or analytics;
- if early designs include a gender field because of the original concept, it must be removed or marked "not used for basic-insurance premiums" before implementation; and
- any future supplementary-insurance feature must be separately scoped, reviewed, and labelled.

### 5.2 Age

Age affects the statutory premium category rather than producing a unique premium for every year of age. The comparison engine must use the official category applicable to the selected premium year:

- children;
- young adults; and
- adults.

The calculation must follow the source year's official calendar-year transition rules. The UI requests birth year, displays the derived category, and sends the birth year to the comparison API so the same domain rule is enforced server-side.

### 5.3 Place of residence

The applicable location is the user's official municipality of residence and its FOPH premium region. A postal code is a search aid, not the final authority, because a postal code can be ambiguous. The user must confirm the municipality when a search yields more than one municipality or premium region.

### 5.4 Deductible

For adults, the supported comparison values are CHF 300, 500, 1,000, 1,500, 2,000, and 2,500. The product must display only combinations actually offered in the official dataset. Children have different valid deductible rules; the UI must use the source-defined options for their category rather than presenting the adult list.

### 5.5 Accident coverage

Accident inclusion can change the premium. It is therefore a required comparison input, with a short explanation that people working at least the legally applicable threshold for one employer may often already have occupational/non-occupational accident cover. The tool must not decide whether the user is legally entitled to exclude accident coverage.

### 5.6 Benefits and eligibility

All authorised insurers providing compulsory basic insurance cover the legally defined basic benefits and must accept eligible applicants within their area of activity, subject to the applicable rules. Restricted-provider models can differ materially in how care is accessed, so the result must not imply that model constraints are identical.

## 6. Personas

### Persona A — Price-conscious resident

A working adult who knows their municipality and current monthly premium, wants to reduce recurring costs, and is open to changing insurer or care model.

### Persona B — New or relocating resident

A person choosing Swiss basic insurance for the first time or after a move. They need simple explanations of location matching, deductible, model, and accident coverage.

### Persona C — Annual switcher

An experienced policyholder who compares every year and wants fast filtering, an explicit data year, exact prices, and a concise top-ten table.

## 7. User stories

### US-1 — Find the cheapest plans for my location

As a resident, I want to enter my municipality or postal code and age information so that I can see the cheapest eligible basic-insurance plans in my premium region.

### US-2 — Compare deductibles

As an adult, I want to compare premiums for deductibles of CHF 300, 500, 1,000, 1,500, 2,000, and 2,500 so that I can understand how my monthly and annual premiums change.

### US-3 — Compare insurance models

As a resident, I want to compare the standard model and available alternative models so that I can assess premium differences alongside access restrictions.

### US-4 — See a ranked top ten

As a resident, I want to see the ten cheapest eligible plans for my selected criteria so that I can focus on a manageable shortlist.

### US-5 — Understand potential savings

As a policyholder, I want to select or enter my current plan premium and see the monthly and annual difference so that I can estimate potential premium savings.

### US-6 — Trust the result

As a user, I want to see the official data source, premium year, update date, and assumptions so that I know what the comparison represents.

### US-7 — Ask a conversational guide

As a resident, I want to describe my situation or ask questions in a chat window so that I can understand deductibles, insurance models, accident coverage, and the inputs required for an accurate comparison without learning specialist terminology first.

### US-8 — Understand the comparison visually

As a resident, I want a compact matrix with exact values and a ranked table so that I can identify the cheapest offer by franchise and insurance model without interpreting a dense report.

### US-9 — Understand the insurance provider

As a resident, I want each result to show the provider's official name, BAG insurer number, exact product, plan identifier, and regional availability context so that I can identify and verify the company and offer before making a decision.

### US-10 — Understand the family-doctor model

As a resident, I want a plain-language explanation of how the family-doctor model works, including the first-contact and referral obligation, so that I understand the care-access trade-off before choosing a lower premium.

## 8. Core user experience

1. The landing page states that the tool compares Swiss compulsory basic insurance using official premium data.
2. The user selects the premium year, if more than one year is available; otherwise the current available year is preselected and visible.
3. The user searches by postal code or municipality and confirms the municipality.
4. The user enters age or birth year; the interface shows the derived official age category.
5. The user chooses accident coverage: included or excluded, with explanatory help text.
6. The user selects one deductible, multiple deductibles, or "compare all valid deductibles."
7. The user selects one or more model types, or "all models."
8. Optionally, the user selects their current plan or enters the current monthly premium for a savings comparison.
9. The page presents location, age category, and accident coverage together in one compact form. All valid franchises and models are selected by default and remain editable under one disclosure.
10. The results page shows the lowest matching premium, a franchise-by-model matrix of exact category minima, and the top ten matching plan combinations in a compact table.
11. The user can change a filter without re-entering the other inputs, inspect plan details, and open the insurer's official site or neutral next-step guidance.

## 9. Functional requirements

### FR-1 — Location resolution

- Provide type-ahead search by municipality name and postal code.
- Map the confirmed municipality to the official canton and premium region for the selected year.
- Disambiguate duplicate municipality names and postal codes with canton and municipality labels.
- Keep premium-region resolution behind the scenes; the customer must not be asked to know or select the region code.
- Do not infer the premium region from GPS coordinates alone.
- Show a clear no-results state if the location cannot be resolved.

### FR-2 — Profile inputs

- Accept birth year and derive the official premium age category for the selected year in the domain layer.
- Require an explicit accident-coverage selection.
- Do not require or use gender.
- Validate inputs before requesting comparisons.

### FR-3 — Deductible comparison

- Support the six requested adult deductible values.
- Allow single, multiple, or all-valid deductible selection.
- Hide or label combinations not offered by an insurer.
- For a selected plan/model, show premium-only differences relative to its CHF 300 option when that comparable option exists.

### FR-4 — Model comparison

- Use the official 2027 Priminfo categories without reinterpretation: Standard (`BASE`), FLEX, PRAXIS, TEL-DIG, and PHARM. Retain the insurer's exact product name.
- Explain that alternative models may restrict the first point of contact or provider choice.
- Reject an unknown source category during ingestion rather than silently misclassifying it.

### FR-5 — Results and filters

- Return only plans valid for the selected premium year, municipality/premium region, age category, deductible, model, and accident option.
- Rank matching plan combinations by the rules in Section 10.
- Display up to ten results initially and state when fewer than ten are available.
- For each result, show insurer, product/model, model category, deductible, accident option, monthly premium, annual premium, and calculated savings where a valid reference exists.
- Allow sorting by monthly premium and filtering by insurer, deductible, and model without changing the underlying eligibility rules.
- Show all money values in CHF with two decimals.
- Visualize the difference from the cheapest plan with ranked horizontal bars and show deductible premiums with a focused column comparison.
- Pair every graphical comparison with an equivalent accessible data table and exact numeric labels.
- Do not use quality scores, gauges, or recommendation language unless a future validated quality dataset and ranking policy explicitly support them.

### FR-6 — Savings

- Let the user choose a current plan from the dataset or enter a current monthly premium.
- Show monthly savings and annual savings only when the comparison plan is cheaper than the reference.
- Show "CHF X more" rather than negative savings when the comparison plan is more expensive.
- Distinguish premium savings from total healthcare-cost savings.
- Never combine plans from different premium years in one savings calculation.

### FR-7 — Plan detail and provenance

- Provide a detail view or drawer with the exact source fields used in the comparison.
- Put the official provider name and exact product name first in each result. Keep the BAG insurer number and source plan identifier in an expandable detail view so they remain available without competing with the buying decision.
- Show the dataset publisher, premium year, source update/import date, and a link to the official source.
- State that availability and contractual model rules must be confirmed with the insurer before switching.

### FR-8 — Error and stale-data handling

- Do not display partial or previous-year data as current without a prominent label.
- If an import is incomplete or fails validation, keep the last validated dataset available with its true year and update timestamp.
- Present actionable errors for invalid locations, unavailable combinations, and service failures.

### FR-9 — Suggested read API

The implementation may vary, but the product needs equivalent read capabilities:

- `GET /api/v1/metadata` — available premium years, active dataset version, source, and import timestamp.
- `GET /v1/locations?q=` — matching postcode/locality, canton, stable municipality identifier, and internally resolved premium region.
- `GET /api/v1/options?year=&municipality_id=&age_group=` — valid deductibles, model categories, and accident options.
- `GET /api/v1/plans?year=&municipality_id=&age_group=&accident=&deductible=&model=&limit=10` — eligible ranked plan combinations.
- `GET /api/v1/plans/{plan_id}` — plan detail and provenance.

The public API must reject unknown filter values, cap page size, and never accept gender as a pricing parameter.

### FR-10 — Optional customer help

- Keep the structured comparison form primary and the question-and-answer help secondary and initially collapsed.
- Use static, source-linked CH.CH answers for common questions before invoking a language model.
- Implement the assistant on the server with LangChain; provider credentials must never be sent to browser code. Framework and model names are implementation details and must not appear in customer-facing labels or status messages.
- Keep conversation context within an opaque thread identifier and avoid collecting names, exact street addresses, health history, policy numbers, or payment details.
- Let the help experience explain comparison concepts and summarize the user's selected inputs.
- Give the agent access to premium results only through a validated, deterministic comparison tool once ingestion is complete.
- The agent must not generate SQL, construct database filters, perform premium arithmetic, or receive direct database credentials. It may invoke only typed application tools whose repositories enforce exact filters.
- The structured comparison service, not the language model, remains the source of truth for eligibility, premium values, ordering, and savings calculations.
- Display a concise general-information disclaimer inside the help area and ensure the comparison controls remain usable when the conversational service is unavailable.

## 10. Ranking and calculation definitions

### 10.1 Comparable plan combination

A result row represents one unique combination of:

- premium year;
- insurer and insurer identifier;
- insurer product/model;
- normalized model category;
- canton and premium region;
- official age category;
- deductible;
- accident included/excluded; and
- approved monthly gross premium.

### 10.2 Eligibility

A plan is eligible only if the official dataset contains an applicable premium and the insurer/product is available for every selected dimension. Missing premiums are not zero and must never be ranked.

### 10.3 Cheapest and top ten

For fixed user criteria, sort eligible combinations by:

1. approved monthly gross premium, ascending;
2. annual premium, ascending;
3. insurer display name, ascending; and
4. exact product/model name, ascending.

The first row is "cheapest" for those exact inputs. "Top 10 providers" is implemented as the ten cheapest **plan combinations**. If the product later promises ten distinct insurers, deduplicate by insurer after ranking and label the behavior explicitly.

### 10.4 Annual premium

`annual_premium = monthly_premium × 12`

No subsidy, tax effect, healthcare use, deductible payment, retention fee, or hospital contribution is included.

### 10.5 Savings against a current plan or entered premium

`monthly_savings = reference_monthly_premium − result_monthly_premium`

`annual_savings = monthly_savings × 12`

Use "save" only when the result is positive. The calculation is a gross-premium comparison and must identify the reference. When the user has not supplied a reference, show "CHF X/month above the cheapest" for other rows; do not market that difference as savings.

### 10.6 Deductible premium difference

When comparing deductibles for the same insurer, product/model, premium region, age category, accident option, and year:

`annual_premium_difference = (monthly_premium_at_300 − monthly_premium_at_selected_deductible) × 12`

Label this "annual premium difference," not total savings. A higher deductible can increase out-of-pocket costs, so the product must not recommend one based only on premium.

## 11. Data requirements

### 11.1 Authoritative sources

The primary source is the FOPH/BAG **Health insurance premiums** open dataset listed on opendata.swiss and distributed through the FOPH open-data service. The official premium-region/municipality mapping and explanatory files must be retained alongside the premium data. Priminfo is the official neutral calculator used for spot-checking displayed combinations.

Do not use scraped commercial comparison sites as the source of truth.

### 11.2 Required premium fields

- premium year;
- insurer ID and display name;
- product/model ID and exact source label;
- model category or enough metadata to derive it;
- canton;
- premium region;
- age category;
- deductible;
- accident inclusion flag;
- approved monthly premium;
- availability or territorial restrictions, where supplied; and
- source record identifier, where supplied.

### 11.3 Required location fields

- official municipality identifier;
- official municipality name;
- canton;
- postal code(s) as search aliases;
- premium region;
- validity period or premium year; and
- source record identifier, where supplied.

### 11.4 Provenance and versioning

Each import must record:

- original filename and source URL;
- publisher;
- source release/update timestamp when available;
- download timestamp in UTC;
- file checksum;
- parser/schema version;
- premium year;
- imported row count, rejected row count, and validation status.

Raw source files must remain immutable. Normalized data must be reproducible from a specific raw file and parser version. Different premium years must be stored separately.

### 11.5 Import validation

- Verify required columns and supported value types before promotion.
- Reject non-positive premiums and invalid deductible/accident combinations.
- Treat blank premium cells as unavailable offers.
- Detect duplicate composite plan keys and fail closed unless an explicit source rule resolves them.
- Verify municipality-to-premium-region coverage and flag ambiguous postal codes.
- Compare row counts and value distributions with the previous import to detect abrupt changes.
- Spot-check at least 20 representative combinations across cantons, age groups, models, deductibles, and accident options against Priminfo or the official published overview before production promotion.
- Run an automated production parity query against Priminfo at least weekly, comparing the eligible offer count and ordered top-ten approved premiums for equivalent inputs.
- Store a machine-readable validation report.

### 11.6 Refresh policy

- Check the official dataset on a scheduled basis during the annual premium-release period and at least weekly otherwise.
- Import a new release into staging, validate it, and promote it atomically.
- Display the selected premium year and last successful import date in the UI.
- Never silently replace a premium year's data with another year's data.

## 12. Non-functional requirements

### Accuracy and reliability

- All displayed premiums must be traceable to one validated source record.
- Every displayed category minimum must be computed from the complete eligible result set, never inferred from the top-ten shortlist.
- Any known mismatch with the official verification suite is a release blocker; the target is at least 99.9% agreement across the maintained representative suite.
- Calculation tests must cover rounding, ties, missing offers, age transitions, ambiguous postal codes, and year boundaries.
- The comparison service target availability is 99.9% per calendar month after launch.
- A failed data refresh must not corrupt the active dataset.

### Performance

- Median time for a new user to submit the default comparison flow: 30 seconds or less.
- After submission, the lowest premium and category comparison should be understandable within 30 seconds in moderated usability testing.
- Search/filter API p95 response time: under 500 ms under normal production load.
- Location type-ahead p95 response time: under 300 ms.
- Largest Contentful Paint target: under 2.5 seconds on a typical Swiss 4G connection.
- Cache immutable, versioned datasets and common anonymous queries where safe.

### Accessibility and localization

- Meet WCAG 2.2 AA for keyboard navigation, focus, contrast, forms, errors, and result tables/cards.
- Use plain language and do not rely on colour alone to communicate cheaper/more expensive.
- MVP copy may launch in English, but data structures and layouts must support German, French, and Italian without schema changes.
- Format CHF values and numbers consistently; do not translate official insurer/product names.

### Customer-facing content

- Lead with the user's task, inputs, premiums, and practical next steps rather than implementation architecture.
- Do not expose framework or model names, internal safety policies, database terminology, prototype states, or engineering validation language in customer-facing copy.
- Keep source provenance, methodology, and technical identifiers available through progressive disclosure.
- Use “annual deductible (franchise)” on first use, then “deductible,” and reserve “savings” for comparisons against a reference premium supplied by the user.
- Present service failures as concise, actionable messages and never expose raw upstream error details.

### Privacy and security

- Minimize collection: no name, gender, health history, account, or exact street address is needed for comparison.
- Prefer birth year/derived age category over storing a full date of birth.
- Do not persist a user's inputs by default; disclose any local storage or analytics use.
- Avoid sending raw search profiles to third-party analytics. Aggregate location analytics to a suitable level.
- Follow the Swiss Federal Act on Data Protection and, where applicable, GDPR principles.
- Use HTTPS, input validation, dependency scanning, rate limits, safe error messages, and security headers.

### Observability

- Use structured logs, metrics, and distributed traces with correlation IDs across the frontend proxy, API, premium repository, and external model calls.
- Prefer vendor-neutral OpenTelemetry instrumentation and keep telemetry SDKs outside the domain layer.
- Monitor API latency/error rate, empty-result rate, ambiguous-location rate, dataset age, import validation/promotion failures, dependency health, and aggregate comparison-flow completion.
- Record import lineage including job ID, source checksum/version, row counts, validation outcome, and active dataset version.
- For the LangChain guide, record operational metadata such as latency, status, model identifier, retries, tool-call outcome, and token usage—but not raw prompts or responses by default.
- Alert when the active dataset is missing, invalid, or older than the expected annual release cycle, and when sustained error/latency thresholds breach the service objective.
- Logs must never contain secrets, authorization data, raw chat content, full dates of birth, exact addresses, health information, or complete user comparison profiles.
- Define retention, access control, sampling, redaction, and incident-only debug capture before production telemetry is enabled.
- Follow the detailed rollout and privacy policy in `docs/OBSERVABILITY.md`.

## 13. Compliance, trust, and disclaimers

The following statements must be visible at the appropriate point in the experience, in concise user-friendly wording:

- The tool compares compulsory basic insurance, not supplementary insurance.
- Premiums are based on official published data for the stated year and the inputs selected.
- Basic-insurance premiums do not vary by gender; gender is not used in the comparison.
- All basic-insurance plans cover the legally defined basic benefits, but care-access rules differ by model.
- Premium comparison does not include premium subsidies or healthcare out-of-pocket costs.
- A higher deductible can reduce the premium but increase the amount paid when care is used.
- Eligibility to exclude accident coverage and final plan availability must be confirmed with the insurer.
- Results are informational and are not medical, legal, or financial advice.

Before adding lead generation, affiliate links, commissions, insurer-sponsored placement, or in-product enrolment, obtain a Swiss legal/compliance review and disclose commercial relationships. Paid placement must never alter or masquerade as the neutral price ranking.

## 14. MVP scope

### Included

- Responsive web application.
- Switzerland-wide municipality and premium-region lookup.
- Official age-category handling.
- Accident included/excluded comparison.
- Adult deductible comparison for CHF 300–2,500 at the requested levels; valid source-defined options for other age groups.
- Model filtering and understandable model labels.
- Top-ten cheapest eligible plan combinations.
- Monthly and annual premiums before subsidies.
- Savings against a selected current plan or entered current premium.
- Source, premium year, update date, and calculation explanations.
- Automated official-data ingestion, validation report, and atomic dataset promotion.
- English UI with an architecture ready for DE/FR/IT localization.
- Optional question-and-answer help with short-term thread context and a responsive, accessible interface; LangChain remains a server-side implementation detail.
- Graphical price-difference and deductible comparisons with equivalent accessible tables.

### Deferred

- Expected-total-cost modelling based on anticipated healthcare spending.
- Premium subsidies.
- Accounts, saved comparisons, alerts, and reminders.
- Direct application or switching workflows.
- Insurer quality scores and provider-network search.
- Household or family-bundle comparison.
- Supplementary insurance.
- Native mobile applications.

## 15. Acceptance criteria

1. Given a valid municipality, premium year, adult age category, deductible, model filter, and accident option, the system returns only eligible records matching all inputs.
2. Given a postal code linked to multiple municipalities, the system requires the user to select the municipality before displaying premiums.
3. Given an adult comparison, the UI supports CHF 300, 500, 1,000, 1,500, 2,000, and 2,500 and does not fabricate an offer when a value is absent in source data.
4. Given a child category, the UI does not present the adult deductible list as valid child choices.
5. Given more than ten eligible combinations, exactly the ten lowest monthly premiums are shown initially according to the deterministic tie-break rules.
6. Given fewer than ten eligible combinations, all are shown and the UI explains that no additional matches are available.
7. The cheapest row's monthly and annual premiums equal the approved source value and that value multiplied by 12.
8. Given a current monthly premium of CHF 400 and a result of CHF 350, the UI shows CHF 50 monthly and CHF 600 annual premium savings.
9. Given a result more expensive than the reference, the UI says how much more it costs and does not show negative savings.
10. Without a current-plan reference, non-cheapest rows show their difference from the cheapest and do not call that difference savings.
11. No API response, ranking function, or analytics event uses gender to determine a compulsory basic-insurance premium.
12. Every result exposes insurer, exact model/product, normalized model category, deductible, accident status, premium year, premium region, and source provenance.
13. Changing a filter updates results while retaining the valid location and profile inputs.
14. An invalid or incomplete dataset cannot be promoted to production; the last validated dataset remains available with an accurate label.
15. Automated tests include at least one example from each official age category, every requested adult deductible, accident included/excluded, each normalized model category, a multi-region canton, an ambiguous postal code, and a ranking tie.
16. Keyboard-only and screen-reader users can complete the input flow, understand validation errors, and read or navigate the ranked results.
17. All required pricing inputs are available as native form controls in one compact comparison form, and every answer remains visible and editable before resubmission.
18. Every result chart exposes the same values in a navigable table and never implies plan quality, endorsement, or total healthcare cost.
19. While the comparison endpoint is unavailable, the production product shows no sample, fixture, or plausible price data as a real result and instead presents a concise retry state.
20. The default form requires no more than postcode/municipality, birth year, and accident coverage; all valid franchises and models are preselected and editable.
21. Every franchise/model matrix cell is computed from all eligible source rows for that exact pair, not from the displayed top-ten rows.
22. Each ranked result shows the provider's official name and exact product name; an expandable detail exposes the BAG insurer number and source plan identifier.
23. The language model cannot access the database directly, produce premium values, or determine ordering; disabling it does not prevent a comparison.

## 16. Success metrics

### Product metrics

- At least 70% of users who start the comparison reach a valid results page.
- At least 60% of results-page users interact with a plan detail, deductible, model, or savings control.
- Median time from landing page to a submitted valid comparison is 30 seconds or less.
- Fewer than 2% of valid searches return an unexplained empty result.

### Trust and quality metrics

- 100% of production result rows are traceable to a validated source record.
- Zero known gender-dependent price or ranking behavior for basic insurance.
- Zero silent cross-year comparisons.
- At least 99.9% agreement between the production output and the representative official-source verification suite, with zero known unresolved mismatches at release.
- Data-import failures are detected and alerted before an invalid dataset is promoted.

Business conversion metrics such as outbound insurer visits may be measured later, but they must not compromise ranking neutrality.

## 17. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Source schema or download URL changes | Broken or incomplete annual import | Versioned parser, schema checks, monitoring, immutable raw files, manual promotion gate |
| Municipality/postal-code ambiguity | Incorrect premium region and wrong price | Require municipality confirmation and use official municipality identifiers |
| Model taxonomy changes between premium years | Misleading category comparison | Version the official category mapping by premium year, preserve exact product labels, and fail closed on unknown source codes |
| Users interpret premium savings as total savings | Poor deductible choice | Use precise labels and prominent out-of-pocket-cost warning |
| Accident option chosen incorrectly | Invalid or unsuitable comparison | Require explicit choice, explain the issue, direct user to confirm eligibility |
| Annual data becomes stale | Incorrect purchase decision | Visible year/update date, scheduled checks, stale-data alerts |
| Commercial incentives bias rankings | Loss of trust and possible compliance exposure | Price ranking remains deterministic; separate and label sponsored content |
| Insurer/model availability changes after publication | User cannot complete switch | Show source date and require confirmation with insurer |
| Collection of unnecessary personal data | Privacy and security exposure | No account or exact address; derive age category locally; minimize analytics |

## 18. Open questions

1. Should the MVP launch with the latest currently effective premium year, the newly published next year, or let users switch between both?
2. Is accident coverage a mandatory step for every user, or should the UI provide a clearly labelled default?
3. Should savings use a selected current plan, a manually entered premium, or both?
4. Should the first top-ten view allow multiple deductibles/models, or require one fixed deductible and one model category for the clearest comparison?
5. Should "top 10" mean ten plan combinations or ten distinct insurers? This PRD defaults to plan combinations.
6. Which languages are required at launch: English only or German, French, Italian, and English?
7. Will the product remain neutral and non-commercial, use affiliate referrals, or later support direct enrolment?
8. Who owns the annual source-validation and production-promotion decision?
9. Should children and young adults be fully supported in the MVP or enabled after the adult flow is validated?
10. Is an expected-total-cost calculator desired after MVP, and what assumptions should it use?

## 19. Official references

- [FOPH: Health insurance — key points in brief](https://www.bag.admin.ch/en/health-insurance-key-points-in-brief)
- [FOPH: Premiums and co-payment](https://www.bag.admin.ch/bag/en/home/versicherungen/krankenversicherung/krankenversicherung-versicherte-mit-wohnsitz-in-der-schweiz/praemien-kostenbeteiligung.html)
- [FOPH: Optional deductibles](https://www.bag.admin.ch/en/health-insurance-optional-deductibles)
- [FOPH: Premium regions](https://www.bag.admin.ch/en/health-insurance-premium-regions)
- [FOPH: Risk compensation and standard-premium principle](https://www.bag.admin.ch/bag/en/home/versicherungen/krankenversicherung/krankenversicherung-versicherer-aufsicht/risikoausgleich.html)
- [Priminfo: Official neutral premium calculator](https://www.priminfo.admin.ch/)
- [opendata.swiss: Health insurance premiums](https://opendata.swiss/en/dataset/health-insurance-premiums)

## 20. Definition of done for MVP

The MVP is done when a user can choose a valid Swiss municipality, official age category, accident option, deductible(s), and model(s), then receive an accurate and deterministic top-ten comparison sourced from a validated official premium dataset. The user can understand the premium year, model and deductible trade-offs, and any savings reference without gender being collected or used. The release has automated calculation/import tests, accessibility checks, monitoring, privacy disclosures, and a documented data-refresh runbook.
