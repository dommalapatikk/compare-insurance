import type { FormEvent } from "react";

import { ageChoices, cantonChoices, modelChoices } from "../config";
import type { AgeGroup } from "../types";
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
          <p className="eyebrow">Your comparison</p>
          <h2 id="profile-title">Three details. About 30 seconds.</h2>
        </div>
        <span>Required fields are marked *</span>
      </div>

      <div className="primary-fields">
        <fieldset className="field-group location-group">
          <legend>1. Where do you live? *</legend>
          <div className="select-row">
            <label>
              <span>Canton</span>
              <select value={flow.canton} onChange={(event) => flow.chooseCanton(event.target.value)}>
                <option value="">Choose</option>
                {cantonChoices.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label>
              <span>Premium region</span>
              <select
                value={flow.region}
                disabled={!flow.canton}
                onChange={(event) => flow.setRegion(event.target.value)}
              >
                <option value="">Choose</option>
                {flow.availableRegions.map((value) => (
                  <option key={value} value={value}>Region {value}</option>
                ))}
              </select>
            </label>
          </div>
          <small>Use the BAG premium region for your official place of residence.</small>
        </fieldset>

        <fieldset className="field-group">
          <legend>2. Age category *</legend>
          <div className="segmented three">
            {ageChoices.map((choice) => (
              <label key={choice.value}>
                <input
                  type="radio"
                  name="age"
                  checked={flow.ageGroup === choice.value}
                  onChange={() => flow.chooseAge(choice.value as AgeGroup)}
                />
                <span><strong>{choice.label}</strong><small>{choice.description}</small></span>
              </label>
            ))}
          </div>
        </fieldset>

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
          <small>Usually exclude only if an employer covers non-occupational accidents.</small>
        </fieldset>
      </div>

      <details className="filters-disclosure">
        <summary>
          <span>Franchises and models</span>
          <small>{flow.deductibles.length} franchises · {flow.models.length} models selected</small>
        </summary>
        <div className="filter-grid">
          <fieldset>
            <legend>Franchise (annual deductible)</legend>
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
        <summary>Add current premium to calculate savings</summary>
        <label>
          <span>Current monthly premium</span>
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
        <p><b>Private by default.</b> No name, account, or health history required.</p>
        <button type="submit" disabled={flow.isSearching}>
          {flow.isSearching ? "Comparing…" : "Compare premiums"}<span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}
