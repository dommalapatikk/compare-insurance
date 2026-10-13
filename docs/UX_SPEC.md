# Compare Insurance — UX specification

**Scope:** Agent-led MVP for Swiss compulsory basic insurance
**Status:** Implementation-ready design direction  
**Last updated:** 13 October 2026

## 1. Experience goal

Help a person move from “I do not know which choices matter” to a trustworthy shortlist in under 60 seconds. The guided assistant is the primary interface: it asks one short question at a time, accepts either natural language or native controls, and uses typed tools to resolve the location and compare premiums. It does not invent prices, rankings, deadlines, or plan rules.

Success means the user can:

- understand the 2027 context and applicable switching date without reading a long landing page;
- confirm the correct postcode/locality and municipality while the premium region remains internal;
- complete the default comparison with postcode/municipality, birth year, accident choice, and compare-all defaults;
- see the lowest premium at every selected franchise before exploring models and the top ten;
- distinguish generated explanation from verified structured results; and
- recover the current comparison after refreshing the same browser tab.

Do not request gender. It is not a pricing dimension for compulsory basic insurance.

## 2. Experience principles

1. **Guided, not open-ended.** Never begin with an empty chat box. Provide a clear next question and native control; free text is an alternative path.
2. **Facts before prose.** Exact premiums, insurers, rankings, differences, source dates, and switching deadlines come from structured application responses. AI prose may explain them but is never the rendered source of truth.
3. **Compare broadly by default.** Select every valid franchise and every model unless the user narrows the comparison. This lets a newcomer obtain a useful result without understanding all terminology first.
4. **One decision at a time.** Show the current question, a compact progress cue, and an editable summary of confirmed answers. Do not repeat the whole conversation in large message boxes.
5. **Lowest is not best.** Say “lowest published premium,” not “best insurance” or “recommended plan.” Do not recommend a franchise from premium alone.
6. **Explain at the moment of choice.** Use one or two sentences beside accident, franchise, and model controls; keep deeper official guidance in disclosures.
7. **Recoverable and private by default.** Same-tab refresh recovery uses bounded `sessionStorage`; there is no account or promise of cross-device persistence.

## 3. Information architecture

Use one task-focused page with five layers:

1. **Compact trust header** — product name, independent-comparison status, premium year, and FOPH/BAG source link.
2. **Timely opening** — the 2027 national mean-premium context, switching date, and one primary start action.
3. **Guided comparison** — the assistant message, one native control, an optional text input, progress, and an editable confirmed-answer summary.
4. **Structured results** — lowest overall, lowest by franchise, model comparison, top ten, and neutral next steps.
5. **Sources and help** — official explanations, methodology, data date, and plan-verification reminder.

Keep the opening and first postcode question in the first laptop viewport. Avoid a second chat panel, side-by-side duplicate summaries, decorative dataset cards, large framed boxes, and implementation terminology.

## 4. Opening content

Use this production copy:

> **2027 premiums are here**
> Swiss basic-insurance premiums are rising by **5.0% on average in 2027**. The national mean premium is **CHF 412 per month**. Your own premium and change may be higher or lower.

> Changing insurer or model for 1 January 2027? Your request must reach your current insurer by **30 November 2026**.

Primary action: **Check my 2027 premiums**

Secondary source link: **How the 2027 average is calculated ↗**

The 5.0% and CHF 412 claims come from the FOPH/BAG 2027 premium announcement. The statistic is context, not a prediction for the user. Show the absolute switching date even when a countdown is present. Remove countdown and urgency language after the date has passed.

An optional deadline detail may state:

> A lower franchise or model change must also reach the insurer by 30 November 2026. A higher franchise alone can be requested in writing until 31 December 2026.

## 5. Guided comparison sequence

The assistant opens with:

> Hi—I’ll help you compare approved 2027 basic-insurance premiums. I’ll ask a few short questions, then show the lowest published options for you.

Show progress as **Question 1 of 5**, not a decorative percentage. Each step supports a labelled native control and an optional text field labelled **Or type your answer**. A natural-language answer is proposed back to the user as a confirmed structured value before it affects pricing.

### Step 1 — Location

Assistant:

> **Where do you live?**
> Enter your postcode or municipality.

Field label: **Postcode or municipality**
Placeholder: **e.g. 3011 Bern**

Use an accessible type-ahead combobox showing postcode, locality, municipality, and canton. Do not ask the user to know or select a premium region. Confirmation example:

> I found **3011 Bern, BE**.

If a postcode intersects multiple municipalities:

> This postcode belongs to more than one municipality. Which one is yours?

Require an explicit selection. Never select by proximity or GPS alone.

### Step 2 — Birth year

Assistant:

> **What year were you born?**
> We use this only to select the official premium age category.

After validation:

> For 2027, your premium category is **Adult**.

Ask for a four-digit birth year and derive child, young-adult, or adult using the domain rule for the selected premium year. Do not ask the user to choose a category and do not request or retain gender. If the user supplies gender in free text, respond:

> Gender does not affect Swiss compulsory basic-insurance premiums, so I won’t use or save it.

### Step 3 — Accident cover

Assistant:

> **Should your health-insurance premium include accident cover?**

Native radio choices:

- **Include accident cover**
- **Exclude accident cover**
- **Help me decide**

Help copy:

> If you work at least eight hours a week for one employer, accident insurance is usually provided through work. Check with your employer before excluding it.

The assistant may explain the rule but must require the user to confirm Include or Exclude. It must not make the legal decision.

### Step 4 — Care model

Assistant:

> **How would you like to access care?**
> If you are unsure, compare every model. You can narrow the results later.

Use checkboxes or a multi-select group:

- **Compare all models** — See every available care route. Selected by default.
- **Free choice · Standard** — Choose doctors according to the plan rules.
- **Doctor or practice first · PRAXIS** — Contact a designated doctor, family practice, or medical centre first; it coordinates treatment and referrals.
- **Phone or app first · TEL-DIG** — Start with the plan’s telemedicine service.
- **Pharmacy first · PHARM** — Start with a participating pharmacy.
- **Flexible first contact · FLEX** — Choose from the first-contact routes defined by the plan.

Supporting note:

> From 2027, family-doctor and HMO plans are grouped under PRAXIS. Exact first-contact and referral rules vary by product.

Preserve the insurer’s exact product name in results.

### Step 5 — Annual deductible (franchise)

Assistant:

> **Which deductible (franchise) should we compare?**
> This is what you pay each year before insurance starts sharing most covered costs.

Primary choice: **Compare every valid franchise** — selected by default.
Secondary choice: **Choose specific amounts**

For adults show CHF 300, 500, 1,000, 1,500, 2,000, and 2,500. For children show only source-valid values.

Help copy:

> A higher deductible can lower the monthly premium but increase what you pay when you need care. If you are unsure, compare them all—we’ll show the lowest premium at each amount.

Do not ask about expected healthcare use or recommend a deductible until a separately reviewed total-cost model exists.

### Confirmation

Show one compact editable summary:

> **3011 Bern · Adult · Accident excluded · All models · All franchises**

Actions:

- **Compare premiums**
- **Edit answers**

Do not add a duplicate summary rail. After submission, keep the summary visible above results and move keyboard focus to the result heading.

### Optional current premium

Ask after the first result, not during the required five-step flow:

> **Want to compare this with what you pay now?**

Use a CHF-prefixed monthly amount and **Skip**. Explain that the output is a gross-premium difference, not an estimate of total healthcare cost.

## 6. Results hierarchy

The result must be understandable without reading the assistant’s prose. Announce the eligible count and keep the confirmed profile editable.

### Level 1 — factual answer

Assistant prose:

> We found **{count} eligible 2027 offers** for **{location}**.

Structured result:

> **Lowest published premium**
> **CHF X.XX/month**
> CHF X,XXX.XX/year
> {insurer} · {exact product} · {model} · CHF {franchise} franchise

Persistent qualifier:

> This is the lowest premium for your filters—not necessarily the lowest total annual healthcare cost.

Also show source year, data import/update date, age category, location, and accident choice. AI prose must not be the only place any of these values appear.

### Level 2 — lowest premium by franchise

Title: **Lowest premium at each franchise**

This is the primary visualization. Use an accessible price ladder with one row per selected franchise. Each row contains the exact monthly premium, insurer, model, and non-negative difference from the overall cheapest. The graphical bar represents the difference from the cheapest, not a truncated full-premium axis.

Example structure:

```text
CHF 300      CHF X.XX/month   Insurer · PRAXIS   + CHF X.XX/month
CHF 500      CHF X.XX/month   Insurer · TEL-DIG  + CHF X.XX/month
…
CHF 2,500    CHF X.XX/month   Insurer · PRAXIS   Lowest
```

Caption:

> Premiums only. A higher franchise can mean paying more yourself when you need care.

Offer **View all model × franchise combinations** as a secondary disclosure. Do not make a 30-cell matrix the primary mobile result.

### Level 3 — model comparison

Title: **Compare care models**

Use the same franchise price ladder with filter chips for All, Standard, PRAXIS, TEL-DIG, PHARM, and FLEX. Changing a model filter recomputes the displayed minima from the complete eligible result set; it never derives them from the top-ten subset.

### Level 4 — top ten

Title: **10 lowest-priced plans**

Each row or card contains:

- rank and insurer;
- exact product name and normalized model label;
- monthly premium as the strongest number and annual premium beneath it;
- deductible and accident status;
- difference/savings label using the rules below;
- short model-access reminder; and
- **View details**.

Use a table on desktop and compact cards on mobile. Use a neutral **Lowest premium** badge for rank one. Do not use “best,” “recommended,” ratings, stars, or AI scores.

### Level 5 — guided refinement

After the factual results, ask:

> **What would you like to prioritize?**

Choices:

- Lower monthly premium
- More freedom to choose doctors
- Lower franchise exposure
- Compare with what I pay now
- Explain these results

The choice may filter or explain verified results; it must not create a quality ranking or personalized financial recommendation.

### Plan detail

Open an inline expansion on desktop and a full-height sheet on mobile. Include all comparison dimensions, exact source product/model, insurer identifier, source year, import timestamp, publisher, official source link, and a reminder to confirm availability and contractual rules with the insurer.

## 7. Savings and deductible semantics

Use the following language consistently:

- With a user-provided reference and a cheaper result: **Save CHF X.XX/month · CHF Y.YY/year in gross premiums.** State the reference.
- With a user-provided reference and a more expensive result: **CHF X.XX/month more.** Never show negative savings.
- Without a reference: **CHF X.XX/month above the cheapest.** Do not call this savings.
- Across deductibles for the same product/model: **Annual premium difference vs CHF 300 deductible.** Do not call it total savings.

Add: “Actual annual cost depends on healthcare use, deductible, retention fee, and other applicable contributions.”

## 8. Conversation and refresh persistence

- Store the confirmed profile, current step, opaque thread identifier, and a bounded, sanitized visible transcript in `sessionStorage`.
- On refresh in the same tab, restore the state automatically and show a quiet confirmation that the answers were restored.
- Show **Start over** after the journey begins.
- **Start over** removes the stored state and generates a new opaque thread identifier.
- Do not promise persistence after the tab or browser closes, across tabs, or across devices.
- Treat server memory as optional. Send enough validated profile and bounded context with each assistant request to recover after a serverless process restart.
- Do not persist names, gender, health history, exact street addresses, policy numbers, payment details, credentials, or hidden prompts.

## 9. System states

### Initial

- Show the timely opening, one start action, and the first postcode question.
- Do not render an empty transcript, a large blank chat panel, or a full traditional form beside the conversation.

### Loading assistant guidance

- Keep the current native control usable where safe.
- Announce **Preparing the next question…** in a polite live region after a short delay.
- Never show decorative typing dots to assistive technology.

### Loading premiums

- Keep confirmed inputs visible and disable only the submitted action.
- Show **Finding available premiums…** and a compact result skeleton.
- Preserve previous results while a refinement is loading and label them as being updated.

### Location ambiguity

- Render every municipality match with locality and canton.
- Return focus to the list and do not proceed until the user confirms one.

### No matching plans

- Say that no eligible combination matches every selected filter, not that no insurance exists.
- Offer **Compare all models** and **Compare all valid franchises**.

### Assistant unavailable

- Preserve the confirmed profile.
- Say: **Guided help is temporarily unavailable. You can still complete the comparison below.**
- Render the same native step controls and deterministic submit action without requiring the model.

### Premium search unavailable

- Never render sample or previous prices as current results.
- Show the true last validated dataset year/date when available, **Try again**, and a link to official Priminfo.

## 10. Responsive behavior

### Desktop (≥ 960 px)

- Use a centred guided column for the opening and questions; the confirmed-answer summary sits above the current step, not in a duplicate side rail.
- Let results use the full content width in this order: factual summary, franchise price ladder, model comparison, top ten, next steps, provenance.

### Tablet (600–959 px)

- Use one primary column. Keep confirmed answers in a compact collapsible summary.
- Keep tables only when required columns fit without horizontal scrolling.

### Mobile (< 600 px)

- Use a single-column conversation and result flow. The current control follows the assistant question directly.
- Do not use a permanently sticky composer that obscures controls or results.
- Render the franchise price ladder as stacked rows and the top ten as cards.
- Use full-width bottom sheets for explanations, filters, and plan detail.
- Never require horizontal page scrolling. Touch targets are at least 44 × 44 CSS px and input text is at least 16px.

## 11. Accessibility requirements

- Target WCAG 2.2 AA for contrast, keyboard access, focus visibility, reflow, labels, errors, and live status.
- Render choices as native radio buttons or checkboxes with visible labels. Free-text input is an alternative, not the only path.
- Implement location search as an ARIA combobox with keyboard navigation, active-option announcement, and a labelled results list.
- Maintain logical headings and landmarks for header, guided comparison, results, and source details.
- On validation failure, show an error summary and move focus to the first invalid control.
- Use `aria-live="polite"` for assistant status and result counts.
- After comparison, move focus to the result heading, not a chart or plan.
- Do not encode price differences by colour alone; pair colour with text and signed values.
- Every visualization has an equivalent navigable table or list with the same exact values.
- Respect reduced-motion, high-contrast, 200% zoom, and 320 CSS px reflow.
- Do not expose framework names, model identifiers, premium-region codes, database terms, internal safety rules, or prototype language.

## 12. Production data and content policy

- Render insurers, products, premiums, rankings, category minima, savings, and deadlines only from validated structured responses.
- AI prose may refer to structured results but cannot supply the sole copy of a factual value.
- Label every result set with FOPH/BAG, the premium year, and the data import/update date.
- Keep fixture data out of production result routes and analytics.
- Do not say “live” unless freshness is actively monitored.
- The 2027 opening statistic must link to the official FOPH/BAG announcement and say that individual premiums vary.
- Use the official switching deadline applicable to the action; do not imply that all changes remain possible until the end of December.

## 13. Acceptance criteria

- The assistant is the primary comparison surface and never opens as an empty chat box.
- A user can finish in five short decisions using native controls without typing a conversational sentence.
- Natural-language answers are converted to validated, visible profile values before affecting pricing.
- Postcode ambiguity, derived age category, and accident cover receive explicit confirmation; gender is never requested or stored.
- All valid franchises and models are selected by default, and the user can narrow them without restarting.
- The opening states 5.0%, CHF 412, and 30 November 2026 with official-source context and without implying an individual forecast.
- Results appear as overall lowest, lowest by franchise, model comparison, and top ten.
- The primary franchise view is usable at 320 CSS px without horizontal scrolling.
- Prices and rankings render from structured comparison fields, never by parsing AI prose.
- Assistant failure leaves a complete native-control comparison path available.
- Refreshing the same tab restores the current step, profile, and bounded transcript; **Start over** clears them.
- The complete experience works by keyboard, at 200% zoom, and with a screen reader.
- Every chart has a same-value accessible list or table and never implies quality, endorsement, or total healthcare cost.
- Source, year, import date, and calculation scope are available from every result set.
