import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { modelChoices } from "../config";
import { journeySection } from "../journey-machine";
import type { ComparisonFlow } from "../use-comparison-flow";
import { AdvisorComposer } from "./advisor-composer";

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

export function GuidedAdvisor({ flow }: { flow: ComparisonFlow }) {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const section = journeySection(flow.journeyStage);
  const previousSection = useRef(section);

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

  const showWorkspace = section !== "results";
  const detailsReady = Boolean(flow.selectedLocation && flow.ageGroup && flow.accident);
  if (!showWorkspace) return null;

  return (
    <section className="guided-advisor" id="guided-comparison" aria-label="Premium comparison">
      <div className="advisor-workspace" ref={workspaceRef}>
        {section === "details" && <div className="journey-step details-step">
          <p className="step-kicker">Step 1 of 2</p>
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
              }} placeholder="3110"
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
              <input id="birth-year" aria-describedby="birth-year-hint" inputMode="numeric" min="1900" max="2027" type="number" value={flow.birthYear} onChange={(event) => flow.setBirthYear(event.target.value)} placeholder="1984" />
              <small id="birth-year-hint">{flow.ageGroup ? flow.ageLabel : "Four digits"}</small>
            </label>
            <fieldset className="accident-control form-field">
              <legend>Accident cover</legend>
              <div className="segmented-choice">
                {(["excluded", "included"] as const).map((value) => <label key={value}>
                  <input type="radio" name="accident" checked={flow.accident === value} onChange={() => flow.setAccident(value)} />
                  <span>{value === "excluded" ? "Excluded" : "Included"}</span>
                </label>)}
              </div>
              <small>Choose “Excluded” only if accident insurance is provided through work.</small>
            </fieldset>
            <div className="details-action"><ContinueButton disabled={!detailsReady} onClick={flow.continueFromDetails}>Continue</ContinueButton></div>
          </div>
          {flow.formError && <p className="form-error" role="alert">{flow.formError}</p>}
        </div>}

        {section === "preferences" && <div className="journey-step preferences-step">
          <button className="back-button" onClick={() => flow.goToStage("location")} type="button"><span aria-hidden="true">←</span> Your details</button>
          <p className="step-kicker">Step 2 of 2</p>
          <Question title="Choose what to compare"><p>Keep every option selected for the widest comparison.</p></Question>
          <section className="preference-group" aria-labelledby="model-heading">
            <div className="preference-heading"><div><h4 id="model-heading">Insurance models</h4><p>How you first contact healthcare.</p></div>
              {flow.models.length !== flow.allModelCount && <button onClick={flow.selectAllModels} type="button">Select all</button>}
            </div>
            <div className="choice-cards models">{modelChoices.map((choice) => <label key={choice.value}><input type="checkbox" checked={flow.models.some((value) => value === choice.value)} onChange={() => flow.toggleModel(choice.value)} /><span><strong>{choice.label}</strong><small>{choice.description}</small></span></label>)}</div>
          </section>
          <section className="preference-group" aria-labelledby="franchise-heading">
            <div className="preference-heading"><div><h4 id="franchise-heading">Franchises</h4><p>A higher franchise lowers the premium but increases what you may pay yourself.</p></div>
              {flow.deductibles.length !== flow.availableDeductibles.length && <button onClick={flow.selectAllDeductibles} type="button">Select all</button>}
            </div>
            <div className="deductible-choices">{flow.availableDeductibles.map((value) => <label key={value}><input type="checkbox" checked={flow.deductibles.includes(value)} onChange={() => flow.toggleDeductible(value)} /><span>CHF {value.toLocaleString("en-CH")}</span></label>)}</div>
          </section>
          {flow.formError && <p className="form-error" role="alert">{flow.formError}</p>}
          <div className="step-primary-action"><ContinueButton disabled={!flow.deductibles.length || flow.isSearching} onClick={() => void flow.comparePlans()}>{flow.isSearching ? "Comparing…" : "Show lowest premiums"}</ContinueButton></div>
          <details className="advisor-help-disclosure">
            <summary>Ask a question</summary>
            <AdvisorComposer flow={flow} suggestions={["What does the family-doctor model mean?", "How does the franchise affect my costs?"]} />
          </details>
        </div>}
      </div>
      {flow.restoredNotice && <p className="restore-notice" role="status">{flow.restoredNotice}</p>}
    </section>
  );
}
