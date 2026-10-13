import type { FormEvent } from "react";

import { modelChoices } from "../config";
import type { ComparisonFlow } from "../use-comparison-flow";

export function QuickProfileForm({ flow }: { flow: ComparisonFlow }) {
  function submit(event: FormEvent) {
    event.preventDefault();
    void flow.comparePlans();
  }

  return (
    <form className="profile-form" onSubmit={submit} aria-labelledby="profile-title">
      <div className="form-heading">
        <div>
          <p className="eyebrow">Your details</p>
          <h2 id="profile-title">Tell us what to compare</h2>
        </div>
        <span>Takes about 30 seconds</span>
      </div>

      <div className="primary-fields">
        <div className="field-group location-group">
          <label className="field-label" htmlFor="location-search">
            1. Postcode or municipality *
          </label>
          <div className="location-combobox">
            <input
              id="location-search"
              type="search"
              role="combobox"
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls="location-suggestions"
              aria-expanded={flow.showLocationSuggestions && flow.locationSuggestions.length > 0}
              aria-activedescendant={
                flow.activeLocationIndex >= 0
                  ? `location-option-${flow.activeLocationIndex}`
                  : undefined
              }
              value={flow.locationQuery}
              onChange={(event) => flow.updateLocationQuery(event.target.value)}
              onFocus={() => flow.setShowLocationSuggestions(true)}
              onBlur={() => window.setTimeout(() => flow.setShowLocationSuggestions(false), 120)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  flow.moveLocationSelection(1);
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  flow.moveLocationSelection(-1);
                } else if (event.key === "Enter" && flow.showLocationSuggestions) {
                  event.preventDefault();
                  flow.chooseActiveLocation();
                } else if (event.key === "Escape") {
                  flow.setShowLocationSuggestions(false);
                }
              }}
              placeholder="e.g. 3011 Bern"
            />
            <span className="location-state" aria-hidden="true">
              {flow.isLoadingLocations ? "…" : flow.selectedLocation ? "✓" : ""}
            </span>
            {flow.showLocationSuggestions && flow.locationSuggestions.length > 0 && (
              <ul id="location-suggestions" className="location-suggestions" role="listbox">
                {flow.locationSuggestions.map((item, index) => (
                  <li
                    key={`${item.postal_code}-${item.locality}-${item.municipality_id}`}
                    id={`location-option-${index}`}
                    role="option"
                    aria-selected={flow.activeLocationIndex === index}
                    aria-label={item.label}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => flow.setActiveLocationIndex(index)}
                    onClick={() => flow.chooseLocation(item)}
                  >
                    <strong>{item.postal_code} {item.locality}</strong>
                    <small>{item.municipality_name}, {item.canton}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <small aria-live="polite">
            {flow.selectedLocation
              ? `Municipality: ${flow.selectedLocation.municipality_name}, ${flow.selectedLocation.canton}`
              : flow.locationNotice || "We use your municipality to find the correct local premiums."}
          </small>
        </div>

        <label className="field-group birth-year-group">
          <span className="field-label">2. Birth year *</span>
          <input
            inputMode="numeric"
            min="1900"
            max="2027"
            type="number"
            value={flow.birthYear}
            onChange={(event) => flow.setBirthYear(event.target.value)}
            placeholder="e.g. 1984"
          />
          <small>
            {flow.ageGroup
              ? `2027 category: ${flow.ageLabel}`
              : "Used to select the official 2027 age category."}
          </small>
        </label>

        <fieldset className="field-group">
          <legend>3. Accident cover *</legend>
          <div className="segmented">
            {(["excluded", "included"] as const).map((value) => (
              <label key={value}>
                <input
                  type="radio"
                  name="accident"
                  checked={flow.accident === value}
                  onChange={() => flow.setAccident(value)}
                />
                <span><strong>{value === "excluded" ? "Exclude" : "Include"}</strong></span>
              </label>
            ))}
          </div>
          <small>
            Working at least 8 hours a week for one employer? You are usually
            covered through work. Check before excluding it.
          </small>
        </fieldset>
      </div>

      <details className="filters-disclosure">
        <summary>
          <span>More options</span>
          <small>{flow.deductibles.length} deductibles · {flow.models.length} models selected</small>
        </summary>
        <div className="filter-grid">
          <fieldset>
            <legend>Annual deductible (franchise)</legend>
            <div className="chip-grid">
              {flow.availableDeductibles.map((value) => (
                <label key={value}>
                  <input
                    type="checkbox"
                    checked={flow.deductibles.includes(value)}
                    onChange={() => flow.toggleDeductible(value)}
                  />
                  <span>CHF {value.toLocaleString("en-CH")}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Insurance models</legend>
            <div className="chip-grid models">
              {modelChoices.map((choice) => (
                <label key={choice.value}>
                  <input
                    type="checkbox"
                    checked={flow.models.includes(choice.value)}
                    onChange={() => flow.toggleModel(choice.value)}
                  />
                  <span>{choice.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </details>

      <details className="current-premium">
        <summary>Calculate your potential savings</summary>
        <label>
          <span>Current monthly premium (optional)</span>
          <div><b>CHF</b><input
            inputMode="decimal"
            min="0"
            step="0.05"
            type="number"
            value={flow.currentPremium}
            onChange={(event) => flow.setCurrentPremium(event.target.value)}
            placeholder="e.g. 400.00"
          /></div>
        </label>
      </details>

      {flow.formError && <p className="form-error" role="alert">{flow.formError}</p>}
      <div className="form-action">
        <p>No sign-up required.</p>
        <button type="submit" disabled={flow.isSearching}>
          {flow.isSearching ? "Comparing premiums…" : "Show premiums"}<span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}
