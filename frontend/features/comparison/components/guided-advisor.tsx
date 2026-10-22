import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { modelChoices } from "../config";
import { currentPremiumError } from "../current-premium-validation";
import { journeySection } from "../journey-machine";
import type { InsuranceModel, JourneyIntent } from "../journey-machine";
import type { ComparisonFlow } from "../use-comparison-flow";
import { officialInsurers } from "../insurer-links";

function Question({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="assistant-prompt"><h3 id="step-question" tabIndex={-1}>{title}</h3>{children}</div>;
}

function ContinueButton({ disabled, onClick, children = "Continue" }: {
  disabled?: boolean;
  onClick: () => void;
  children?: ReactNode;
}) {
  return <button className="continue-button" disabled={disabled} onClick={onClick} type="button">{children}<span aria-hidden="true">→</span></button>;
}

const journeyChoices: Array<{
  intent: JourneyIntent;
  title: string;
  description: string;
}> = [
  {
    intent: "compare_current",
    title: "Compare with my current premium",
    description: "Use your 2027 renewal premium to compare the same franchise and insurance model.",
  },
  {
    intent: "explore",
    title: "Find lower premiums",
    description: "See every franchise and insurance model, then filter the results.",
  },
];

export function GuidedAdvisor({ flow }: { flow: ComparisonFlow }) {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [currentPremiumTouched, setCurrentPremiumTouched] = useState(false);
  const section = journeySection(flow.journeyStage);
  const previousSection = useRef(section);
  const premiumError = flow.journeyIntent === "compare_current"
    ? currentPremiumError(flow.currentPremium)
    : "";
  const showPremiumError = Boolean(premiumError) && (
    currentPremiumTouched || Boolean(flow.currentPremium)
  );

  useEffect(() => {
    if (previousSection.current !== section && section !== "results") {
      const workspace = workspaceRef.current;
      const heading = workspace?.querySelector<HTMLElement>(".journey-step h3");
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";

      heading?.focus({ preventScroll: true });
      workspace?.scrollIntoView({ behavior, block: "start" });
    }
    previousSection.current = section;
  }, [section]);

  useEffect(() => {
    setCurrentPremiumTouched(false);
  }, [flow.journeyIntent]);

  const showWorkspace = section !== "results";
  const detailsReady = Boolean(flow.selectedLocation && flow.ageGroup && flow.accident);
  if (!showWorkspace) return null;

  return (
    <section className="guided-advisor" id="guided-comparison" aria-label="Premium comparison">
      <div className="advisor-workspace" ref={workspaceRef}>
        {section === "intent" && <div className="journey-step intent-step">
          <Question title="What would you like to do?"><p>Choose a starting point. You can change your details later.</p></Question>
          <div className="journey-intent-cards">
            {journeyChoices.map((choice) => <button
              key={choice.intent}
              type="button"
              onClick={() => flow.selectJourneyIntent(choice.intent)}
            >
              <span><strong>{choice.title}</strong><small>{choice.description}</small></span>
              <span aria-hidden="true">→</span>
            </button>)}
          </div>
        </div>}

        {section === "details" && <div className="journey-step details-step">
          <button className="back-button" onClick={flow.restartJourney} type="button"><span aria-hidden="true">←</span> Choose another journey</button>
          <p className="step-kicker">{flow.journeyIntent === "explore" ? "Your profile" : "Step 1 of 2"}</p>
          <Question title="Your details"><p>Three quick answers are enough to find the premiums for you.</p></Question>
          <div className="details-grid">
            <div className="step-control location-combobox form-field">
              <label htmlFor="location-search">Postcode</label>
              <input
              id="location-search" type="text" role="combobox" autoComplete="postal-code" inputMode="numeric" maxLength={4}
              aria-autocomplete="list" aria-controls="location-suggestions" aria-describedby="location-hint"
              aria-expanded={flow.showLocationSuggestions && flow.locationSuggestions.length > 0}
              aria-activedescendant={flow.activeLocationIndex >= 0 ? `location-option-${flow.activeLocationIndex}` : undefined}
              value={flow.locationQuery} onChange={(event) => flow.updateLocationQuery(event.target.value)}
              onFocus={() => flow.setShowLocationSuggestions(true)}
              onBlur={() => window.setTimeout(() => flow.setShowLocationSuggestions(false), 120)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") { event.preventDefault(); flow.moveLocationSelection(1); }
                if (event.key === "ArrowUp") { event.preventDefault(); flow.moveLocationSelection(-1); }
                if (event.key === "Enter" && flow.showLocationSuggestions) { event.preventDefault(); flow.chooseActiveLocation(); }
                if (event.key === "Escape") flow.setShowLocationSuggestions(false);
              }} placeholder="e.g. 8001"
              />
            {flow.showLocationSuggestions && flow.locationSuggestions.length > 0 && <ul id="location-suggestions" className="location-suggestions" role="listbox">
              {flow.locationSuggestions.map((item, index) => <li
                key={`${item.postal_code}-${item.municipality_id}`} id={`location-option-${index}`}
                role="option" aria-selected={flow.activeLocationIndex === index}
                onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => flow.setActiveLocationIndex(index)}
                onClick={() => flow.chooseLocation(item)}
              ><strong>{item.postal_code} {item.locality}</strong><small>{item.municipality_name}, {item.canton}</small></li>)}
            </ul>}
              <small aria-live="polite" id="location-hint">{flow.isLoadingLocations ? "Looking up postcode…" : flow.selectedLocation ? flow.selectedLocation.label : flow.locationNotice || "Enter your 4-digit Swiss postcode."}</small>
            </div>
            <label className="step-control form-field" htmlFor="birth-year">Birth year
              <input id="birth-year" aria-describedby="birth-year-hint" aria-invalid={Boolean(flow.birthYearError)} inputMode="numeric" min="1907" max="2027" type="number" value={flow.birthYear} onBlur={flow.touchBirthYear} onChange={(event) => flow.setBirthYear(event.target.value)} placeholder="e.g. 1984" />
              <small className={flow.birthYearError ? "field-error" : ""} id="birth-year-hint">{flow.birthYearError || (flow.ageGroup ? flow.ageLabel : "Enter four digits")}</small>
            </label>
            <fieldset className="accident-control form-field">
              <legend>Accident cover</legend>
              <div className="segmented-choice">
                {(["excluded", "included"] as const).map((value) => <label key={value}>
                  <input type="radio" name="accident" checked={flow.accident === value} onChange={() => flow.setAccident(value)} />
                  <span>{value === "excluded" ? "Excluded" : "Included"}</span>
                </label>)}
              </div>
              <small>{flow.ageGroup === "child" && flow.accident === "excluded"
                ? "Children are usually not covered through an employer. Check their accident cover before continuing."
                : "Choose “Excluded” only if accident insurance is provided through work."}</small>
            </fieldset>
            <div className="details-action"><ContinueButton disabled={!detailsReady || flow.isSearching} onClick={() => void flow.continueFromDetails()}>{flow.isSearching ? "Finding premiums…" : flow.journeyIntent === "explore" ? "Find premiums" : "Continue"}</ContinueButton></div>
          </div>
          {!detailsReady && <p className="form-guidance" role="status">Add your postcode, birth year and accident cover to continue.</p>}
          {flow.formError && <p className="form-error" role="alert">{flow.formError}</p>}
        </div>}

        {section === "preferences" && <div className="journey-step preferences-step">
          <button className="back-button" onClick={() => flow.goToStage("location")} type="button"><span aria-hidden="true">←</span> Your details</button>
          <p className="step-kicker">Step 2 of 2</p>
          <Question title={flow.journeyIntent === "compare_current" ? "Your current cover" : "Choose what to compare"}>
            <p>{flow.journeyIntent === "compare_current" ? "Enter your premium before subsidies and choose the matching model and franchise." : "Keep every option selected for the widest comparison."}</p>
          </Question>
          {flow.journeyIntent === "compare_current" && <div className="current-cover-fields">
            <label className="current-premium-control" htmlFor="current-premium">
              <span>2027 premium if you stay on your current plan</span>
              <span><b>CHF</b><input
                id="current-premium"
                aria-describedby={`current-premium-hint${showPremiumError ? " current-premium-error" : ""}`}
                aria-invalid={showPremiumError}
                inputMode="decimal"
                min="0.05"
                max="2000"
                required
                step="0.05"
                type="number"
                value={flow.currentPremium}
                onBlur={() => setCurrentPremiumTouched(true)}
                onChange={(event) => flow.setCurrentPremium(event.target.value)}
                placeholder="420"
              /></span>
              <small id="current-premium-hint">Required. Enter the monthly basic-insurance premium from your 2027 renewal notice, before subsidies.</small>
              {showPremiumError && <small className="field-error" id="current-premium-error" role="alert">{premiumError}</small>}
            </label>
            <label className="current-insurer-control" htmlFor="current-insurer">
              <span>Current insurer <small>Optional</small></span>
              <select id="current-insurer" value={flow.currentInsurerId} onChange={(event) => flow.setCurrentInsurerId(event.target.value)}>
                <option value="">Not selected</option>
                {officialInsurers.map(({ id, shortName }) => <option key={id} value={id}>{shortName}</option>)}
              </select>
              <small>Used to mark your insurer in the results.</small>
            </label>
          </div>}
          <fieldset className="preference-group" aria-describedby="model-description">
            <legend>{flow.journeyIntent === "compare_current" ? "Your insurance model" : "Insurance models"}</legend>
            <div className="preference-heading"><p id="model-description">How you first contact healthcare.</p>
              {flow.journeyIntent !== "compare_current" && flow.models.length !== flow.allModelCount && <button onClick={flow.selectAllModels} type="button">Select all</button>}
            </div>
            <div className="choice-cards models">{modelChoices.map((choice) => <label key={choice.value}><input
              type={flow.journeyIntent === "compare_current" ? "radio" : "checkbox"}
              name={flow.journeyIntent === "compare_current" ? "current-model" : undefined}
              checked={flow.models.some((value) => value === choice.value)}
              onChange={() => flow.journeyIntent === "compare_current" ? flow.selectSingleModel(choice.value as InsuranceModel) : flow.toggleModel(choice.value)}
            /><span className={flow.journeyIntent === "compare_current" ? "radio-card" : undefined}><strong>{choice.label}</strong><small>{choice.description}</small></span></label>)}</div>
          </fieldset>
          <fieldset className="preference-group" aria-describedby="franchise-description">
            <legend>{flow.journeyIntent === "compare_current" ? "Your franchise" : "Franchises"}</legend>
            <div className="preference-heading"><p id="franchise-description">A higher franchise lowers the premium but increases what you may pay yourself.</p>
              {flow.journeyIntent !== "compare_current" && flow.deductibles.length !== flow.availableDeductibles.length && <button onClick={flow.selectAllDeductibles} type="button">Select all</button>}
            </div>
            <div className="deductible-choices">{flow.availableDeductibles.map((value) => <label key={value}><input
              type={flow.journeyIntent === "compare_current" ? "radio" : "checkbox"}
              name={flow.journeyIntent === "compare_current" ? "current-franchise" : undefined}
              checked={flow.deductibles.includes(value)}
              onChange={() => flow.journeyIntent === "compare_current" ? flow.selectSingleDeductible(value) : flow.toggleDeductible(value)}
            /><span>CHF {value.toLocaleString("en-CH")}</span></label>)}</div>
          </fieldset>
          {flow.formError && <p className="form-error" role="alert">{flow.formError}</p>}
          <div className="step-primary-action"><ContinueButton disabled={!flow.deductibles.length || !flow.models.length || flow.isSearching || (flow.journeyIntent === "compare_current" && Boolean(premiumError))} onClick={() => void flow.comparePlans()}>{flow.isSearching ? "Comparing…" : flow.journeyIntent === "compare_current" ? "Compare like for like" : "Show matching premiums"}</ContinueButton></div>
        </div>}
      </div>
      {flow.restoredNotice && <p className="restore-notice" role="status">{flow.restoredNotice}</p>}
    </section>
  );
}
