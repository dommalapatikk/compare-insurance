# Compare Insurance — UX specification

**Scope:** MVP web experience for Swiss compulsory basic insurance  
**Status:** Implementation-ready design direction  
**Last updated:** 13 October 2026

## 1. Experience goal

Help a person move from “I do not know which inputs matter” to a trustworthy shortlist in under a minute. A compact form should make the main task immediately clear; optional help may explain unfamiliar terms, but the comparison service must define the query, prices, ranking, and savings.

Success means the user can:

- confirm the correct postcode/locality and municipality while the premium region is resolved behind the scenes;
- understand each choice before committing it;
- compare up to ten eligible plan combinations at a glance;
- distinguish premium savings from possible healthcare costs; and
- verify the data year, source, and assumptions without leaving the result.

Do not request gender. It is not a pricing dimension for compulsory basic insurance.

## 2. Recommended information architecture

Use one task-focused page with four layers:

1. **Compact trust header** — product name, independent-comparison status, and premium year.
2. **Comparison form** — postcode/municipality, birth year, and accident cover are visible together; deductible, model, and current-premium controls use progressive disclosure.
3. **Results workspace** — lowest-price summary, deductible/model comparison, ranked top-ten list, and a before-switching checklist.
4. **Help and provenance** — CH.CH guidance and optional question-and-answer help follow the task; technical identifiers and methodology stay in expandable details.

Keep the introduction short enough that the form begins in the first laptop viewport. Avoid decorative dataset cards, duplicate summaries, side rails, and large empty containers that compete with the primary action.

## 3. Compact structured input flow

The comparison form is the only way to submit pricing inputs. Free text is available later for questions, but cannot silently alter comparison filters. Keep the three required decisions visible together and use native, validated controls.

### Step sequence

1. **Location**
   - Ask for municipality or four-digit postal code.
   - Use one accessible type-ahead combobox showing postcode, locality, municipality, and canton. Do not ask users to know or select a premium region.
   - If a postal code maps to multiple municipalities, require an explicit choice. Never select by proximity or GPS alone.
   - Confirmation example: “3011 Bern, BE.” The premium-region code remains an internal pricing dimension.
2. **Birth year**
   - Ask for the four-digit birth year and derive the official child, young-adult, or adult category for the selected premium year.
   - Show the derived category inline. Do not make the user choose an age category and do not request gender.
3. **Accident coverage**
   - Present “Include” and “Exclude” as radios, with “I’m not sure” opening a short explanation.
   - Do not make the legal decision for the user. Require an explicit include/exclude choice before comparison.
4. **Deductible (franchise)**
   - Default to “Compare all valid deductibles.”
   - Allow multi-select. For adults show CHF 300, 500, 1,000, 1,500, 2,000, and 2,500; for children show only source-valid choices.
   - Pair the control with: “A higher deductible can lower the premium but can increase what you pay when you need care.”
5. **Insurance model**
   - Default to “Compare all models.”
   - Allow multi-select for the official 2027 categories: Standard, FLEX, PRAXIS, TEL-DIG, and PHARM.
   - Explain the first-contact distinction in plain language: PRAXIS uses a designated family doctor or medical practice, TEL-DIG starts by phone or digitally, PHARM uses a partner pharmacy, and FLEX offers several defined options.
   - Explain that the former family-doctor and HMO categories are grouped under PRAXIS from 2027 and that the selected practice normally coordinates treatment and referrals.
   - Each option has a one-sentence care-access description. Preserve the insurer’s exact product name in results.
6. **Current premium (optional)**
   - Ask “What do you pay now each month?” with CHF prefix and “Skip.”
   - Explain that this enables a gross-premium difference only. It is not a total-cost estimate.
7. **Submit**
   - Primary action: **Show premiums**.
   - Keep all selected values visible and editable in place; do not add a duplicate review rail.
   - Move focus to the results heading after a successful comparison.

## 4. Progressive disclosure

- Keep the three required fields visible. Place deductibles, models, and the optional current premium in clearly labelled disclosures.
- Keep explanations to one or two sentences; place legal nuance and model details in the CH.CH help section.
- Hide insurer filters and sorting until results exist.
- Show technical identifiers only in plan details and source methodology in a collapsed disclosure.
- When an upstream input changes, identify dependent answers that were reset. Example: changing from Adult to Child resets invalid deductible selections and announces why.
- Never require a chat exchange to compare premiums.

## 5. Results hierarchy

After a successful search, move focus to a results heading and announce the number of matches. Keep the query summary visible and editable.

### Level 1 — decision summary

Show:

- **Cheapest eligible premium:** CHF X.XX/month and CHF X,XXX.XX/year;
- **Potential savings:** only if a current monthly premium was supplied and the result is cheaper;
- number of eligible combinations and number displayed;
- premium year, confirmed postcode/municipality, derived age category, and accident choice; and
- “Premium data: FOPH/BAG” with import/update date, without implying that this independent product is an official federal calculator.

The main callout is the exact monthly premium, not an AI-written recommendation. Phrase the outcome as “Lowest premium for these filters,” not “Best insurance.”

### Level 2 — graphical comparison

Use two focused visualizations:

1. **Top-plan price comparison:** ranked horizontal delta bars for up to ten results, showing each plan’s exact monthly premium and “CHF X.XX/month above the cheapest.” Use zero as the baseline for the *difference*, clearly title it “Difference from cheapest,” and give the cheapest a zero marker. This avoids visually exaggerating small differences between full premiums.
2. **Deductible comparison:** grouped columns for the selected insurer/product/model across available deductibles. Label the y-axis “Monthly premium (CHF)” and every value on interaction. Add the persistent caption “Premium only—healthcare use and out-of-pocket costs are not included.” Do not interpolate missing deductible offers.

Do not use pie/donut charts, gauges, “AI scores,” or quality rankings without an authoritative quality dataset. Every chart must have a “View as table” equivalent.

### Level 3 — ranked plan list

Display up to ten plan combinations. Each row/card contains:

- rank and insurer;
- exact product name plus normalized model label;
- monthly premium as the strongest number and annual premium beneath it;
- deductible and accident status;
- savings/difference label using the rules below;
- model restriction summary; and
- **View details** action.

Use a distinct but non-promotional “Lowest premium” badge for rank 1. Do not use “recommended,” stars, or “best value” unless future requirements define and validate those claims. Filters for model, deductible, and insurer sit above the list; sorting defaults to monthly premium ascending.

### Level 4 — plan detail

Open an inline expansion on desktop and a full-height sheet on mobile. Include all comparison dimensions, exact source product/model, source year, import timestamp, publisher, official source link, and the reminder to confirm availability and contractual rules with the insurer.

## 6. Savings and deductible semantics

Use the following language consistently:

- With a user-provided reference and a cheaper result: **“Save CHF X.XX/month · CHF Y.YY/year in gross premiums.”** State the reference next to it.
- With a user-provided reference and a more expensive result: **“CHF X.XX/month more.”** Never show negative savings.
- Without a reference: **“CHF X.XX/month above the cheapest.”** Do not call this savings.
- Across deductibles for the same plan/model: **“Annual premium difference vs CHF 300 deductible.”** Do not call it total savings.

Beside deductible comparisons, show both:

- the annual premium difference; and
- the change in deductible exposure (for example, “Deductible is CHF 2,200 higher than CHF 300”).

Add: “Actual annual cost depends on healthcare use, deductible, retention fee, and other applicable contributions.” Do not calculate a break-even point or recommend a deductible until the product has a reviewed total-cost model.

## 7. System states

### Initial/empty

- Begin with the comparison form and all three required inputs visible.
- Default to all source-valid deductibles and models.
- Keep optional help below the comparison task.

### Loading

- Keep confirmed inputs visible and disable only the submitted action.
- For questions, announce that an answer is loading in a polite live region after a short delay.
- For search, show a result-card skeleton plus “Finding available premiums…”; preserve the previous results if filters are being refreshed.
- Never use an indefinite spinner without explanatory text.

### Location ambiguity

- For a location such as “3174 Thörishaus,” render each municipality match with its canton and require an explicit choice.
- Return focus to the choice list and do not proceed until confirmed.

### No matching plans

- State that no eligible combination matches the selected filters—not that no insurance exists.
- Show which filters caused the narrow result and offer one-click actions such as “Compare all models” or “Compare all valid deductibles.”

### Invalid or unavailable combination

- Attach the error to the relevant field, explain it in plain language, and offer only source-valid choices.
- Preserve all unaffected answers.

### Chat failure

- Keep the structured comparison usable.
- Show an inline message: “The guide is temporarily unavailable. Your answers are still here.” Add **Retry explanation**; do not duplicate the user’s message.

### Search unavailable (`503`)

- Do not render sample prices as results.
- For `503`: show the true last validated dataset year/date if safe to query it, label it clearly, and provide **Try again**.
- Never silently substitute stale or partial data.

## 8. Responsive behavior

### Desktop (≥ 960 px)

- Use a single, centred task column for the introduction and comparison form.
- Let results use the full content width, in the order: summary, deductible/model comparison, ranked plans, before-switching checklist, source details, and help.
- Keep controls and result columns aligned to support scanning; do not duplicate selected inputs in a side rail.

### Tablet (600–959 px)

- Use one primary column. Place “Your comparison” in a collapsible card above the current chat step.
- Charts span the available width; the result list remains a table only when all required columns fit without horizontal scrolling.

### Mobile (< 600 px)

- Use a single-column form and result flow without a sticky composer or duplicate summary.
- Render results as cards: insurer and price first, then model/deductible, then difference and details.
- Default charts to the accessible compact/table view if labels would collide. Never require horizontal page scrolling.
- Use full-width bottom sheets for explanations, filter editing, and plan details.
- Keep touch targets at least 44 × 44 CSS px and preserve 16 px minimum input text to prevent mobile zoom.

## 9. Accessibility requirements

- Target WCAG 2.2 AA for contrast, keyboard access, focus visibility, and reflow.
- Implement selectable cards as native radio buttons/checkboxes with visible labels; do not use styling-only buttons as a substitute for form semantics.
- Build location search as an ARIA combobox with keyboard navigation, active-option announcement, and a labelled results list.
- Maintain logical heading order and landmarks for header, comparison form/chat, results, and details.
- On validation failure, show an error summary and move focus to the first invalid field. Associate help/error text with its input.
- Use `aria-live="polite"` for assistant status and result counts. Do not announce decorative typing dots.
- After comparison, move programmatic focus to the results heading, not the first plan or chart.
- Do not encode cheapest/more expensive states by green/red alone; pair colour with text, icons, and signs.
- Charts require a concise accessible summary and the same values in a navigable table. Tooltips must work by keyboard and touch.
- Respect reduced-motion and high-contrast preferences. Do not auto-scroll if the user has scrolled away from the latest chat turn; offer a “New message” control instead.
- Use plain language and define “deductible (franchise)” and restricted models on first use. Do not expose premium-region terminology in the main customer flow.

## 10. Production data policy

- Render insurer names, premiums, rankings, and differences only from the validated comparison response.
- Label every result set with the BAG source and premium year.
- Keep fixture data out of production result routes and analytics.
- Do not say “live” unless source freshness is actively monitored.

## 11. Acceptance criteria

- A user can complete the comparison using one postcode/municipality search, birth year, and accident choice without opening help.
- A user can edit any answer in place and sees which dependent choices were reset.
- Location ambiguity, age-dependent deductibles, and accident coverage require explicit confirmation.
- Results visually and textually identify the lowest premium, exact monthly/annual amounts, and the reference used for any claimed savings.
- Charts expose equivalent tabular data and never imply quality, recommendation, or total healthcare cost.
- The complete flow is usable at 320 CSS px width, with keyboard only, and at 200% zoom.
- If question-and-answer help fails, comparison controls remain functional; if price search is unavailable, no plausible result data is shown.
- The data source, premium year, import date, and calculation scope are visible from every result set.
- No customer-facing label exposes framework names, model names, database terms, internal safety rules, or prototype language.

