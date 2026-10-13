import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { modelChoices } from "../config";
import type { ComparisonFlow } from "../use-comparison-flow";
import { AdvisorComposer } from "./advisor-composer";
import { JourneySummary } from "./journey-summary";

function Question({ title, children }: { title: string; children?: ReactNode }) {
  return <div className="assistant-prompt"><h3 tabIndex={-1}>{title}</h3>{children}</div>;
}

function ContinueButton({ disabled, onClick, children = "Continue" }: {
  disabled?: boolean;
  onClick: () => void;
  children?: ReactNode;
}) {
  return <button className="continue-button" disabled={disabled} onClick={onClick} type="button">{children}<span aria-hidden="true">→</span></button>;
}

function BackButton({ onClick }: { onClick: () => void }) {
  return <button className="back-button" onClick={onClick} type="button"><span aria-hidden="true">←</span> Back</button>;
}

function suggestionsFor(stage: ComparisonFlow["journeyStage"]) {
  if (stage === "accident") return ["Am I covered for accidents through work?"];
  if (stage === "models") return ["What does the family-doctor model mean?"];
  if (stage === "deductibles") return ["How does the franchise affect my costs?"];
  return [];
}

export function GuidedAdvisor({ flow }: { flow: ComparisonFlow }) {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const previousStage = useRef(flow.journeyStage);

  useEffect(() => {
    if (previousStage.current !== flow.journeyStage) {
      workspaceRef.current?.querySelector<HTMLElement>(".journey-step h3")?.focus();
      previousStage.current = flow.journeyStage;
    }
  }, [flow.journeyStage]);

  const showWorkspace = flow.journeyStage !== "results";
  const showContextualHelp = (["accident", "models", "deductibles"] as string[])
    .includes(flow.journeyStage);
  return (
    <section className="guided-advisor" id="guided-comparison" aria-label="Premium comparison">
      {Object.values(flow.completedStages).some(Boolean) && <div className="journey-topline">
        <button onClick={flow.restartJourney} type="button">Start over</button>
      </div>}
      <JourneySummary flow={flow} />

      {showWorkspace && <div className="advisor-workspace" ref={workspaceRef}>
        {flow.journeyStage === "location" && <div className="journey-step">
          <Question title="Where do you live?" />
          <div className="location-actions">
            <div className="step-control location-combobox">
              <label htmlFor="location-search">Postcode</label>
              <input
              id="location-search" type="text" role="combobox" autoComplete="postal-code" inputMode="numeric" maxLength={4}
              aria-autocomplete="list" aria-controls="location-suggestions"
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
              }} placeholder="3011"
              />
            {flow.showLocationSuggestions && flow.locationSuggestions.length > 0 && <ul id="location-suggestions" className="location-suggestions" role="listbox">
              {flow.locationSuggestions.map((item, index) => <li
                key={`${item.postal_code}-${item.municipality_id}`} id={`location-option-${index}`}
                role="option" aria-selected={flow.activeLocationIndex === index}
                onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => flow.setActiveLocationIndex(index)}
                onClick={() => flow.chooseLocation(item)}
              ><strong>{item.postal_code} {item.locality}</strong><small>{item.municipality_name}, {item.canton}</small></li>)}
            </ul>}
              <small aria-live="polite">{flow.isLoadingLocations ? "Searching postcodes…" : flow.selectedLocation ? `Selected: ${flow.selectedLocation.label}` : flow.locationNotice || "Enter a 4-digit Swiss postcode."}</small>
            </div>
            <ContinueButton disabled={!flow.selectedLocation} onClick={() => flow.goToStage("birth_year")} />
          </div>
        </div>}

        {flow.journeyStage === "birth_year" && <div className="journey-step">
          <BackButton onClick={() => flow.goToStage("location")} />
          <Question title="What year were you born?"><p>We use this only to select the official premium age category.</p></Question>
          <label className="step-control compact-control">Birth year<input inputMode="numeric" min="1900" max="2027" type="number" value={flow.birthYear} onChange={(event) => flow.setBirthYear(event.target.value)} placeholder="e.g. 1984" /><small>{flow.ageGroup ? `2027 category: ${flow.ageLabel}` : "Enter four digits."}</small></label>
          <ContinueButton disabled={!flow.ageGroup} onClick={() => flow.goToStage("accident")} />
        </div>}

        {flow.journeyStage === "accident" && <div className="journey-step">
          <BackButton onClick={() => flow.goToStage("birth_year")} />
          <Question title="Include accident cover?"><p>If you work at least eight hours a week for one employer, you are usually covered through work.</p></Question>
          <div className="choice-cards two" role="radiogroup" aria-label="Accident coverage">
            {(["excluded", "included"] as const).map((value) => <label key={value}><input type="radio" name="accident" checked={flow.accident === value} onChange={() => flow.setAccident(value)} /><span><strong>{value === "excluded" ? "Exclude accident cover" : "Include accident cover"}</strong><small>{value === "excluded" ? "Usually for people covered through work." : "Include accidents in this comparison."}</small></span></label>)}
          </div>
          <ContinueButton disabled={!flow.accident} onClick={() => flow.goToStage("models")} />
        </div>}

        {flow.journeyStage === "models" && <div className="journey-step">
          <BackButton onClick={() => flow.goToStage("accident")} />
          <Question title="Which insurance models would you consider?"><p>Compare only models you would be comfortable using.</p></Question>
          <div className="selection-mode" aria-label="Insurance model selection">
            <button aria-pressed={flow.models.length === flow.allModelCount} onClick={flow.selectAllModels} type="button"><span aria-hidden="true">{flow.models.length === flow.allModelCount ? "✓" : ""}</span><strong>Compare all models</strong><small>Include every available model.</small></button>
            <button aria-pressed={flow.models.length !== flow.allModelCount} onClick={flow.chooseSpecificModels} type="button"><span aria-hidden="true">{flow.models.length !== flow.allModelCount ? "✓" : ""}</span><strong>Choose models</strong><small>Only include models you would use.</small></button>
          </div>
          {flow.models.length !== flow.allModelCount && <div className="choice-cards models">{modelChoices.map((choice) => <label key={choice.value}><input type="checkbox" checked={flow.models.some((value) => value === choice.value)} onChange={() => flow.toggleModel(choice.value)} /><span><strong>{choice.label}</strong><small>{choice.description}</small></span></label>)}</div>}
          <ContinueButton disabled={!flow.models.length} onClick={() => flow.goToStage("deductibles")} />
        </div>}

        {flow.journeyStage === "deductibles" && <div className="journey-step">
          <BackButton onClick={() => flow.goToStage("models")} />
          <Question title="Which franchises should we compare?"><p>Compare all to see the lowest premium at every level.</p></Question>
          <div className="selection-mode" aria-label="Franchise selection">
            <button aria-pressed={flow.deductibles.length === flow.availableDeductibles.length} onClick={flow.selectAllDeductibles} type="button"><span aria-hidden="true">{flow.deductibles.length === flow.availableDeductibles.length ? "✓" : ""}</span><strong>Compare all franchises</strong><small>See every available level.</small></button>
            <button aria-pressed={flow.deductibles.length !== flow.availableDeductibles.length} onClick={flow.chooseSpecificDeductibles} type="button"><span aria-hidden="true">{flow.deductibles.length !== flow.availableDeductibles.length ? "✓" : ""}</span><strong>Choose franchises</strong><small>Limit the comparison.</small></button>
          </div>
          {flow.deductibles.length !== flow.availableDeductibles.length && <div className="deductible-choices">{flow.availableDeductibles.map((value) => <label key={value}><input type="checkbox" checked={flow.deductibles.includes(value)} onChange={() => flow.toggleDeductible(value)} /><span>CHF {value.toLocaleString("en-CH")}</span></label>)}</div>}
          {flow.formError && <p className="form-error" role="alert">{flow.formError}</p>}
          <ContinueButton disabled={!flow.deductibles.length || flow.isSearching} onClick={() => void flow.comparePlans()}>{flow.isSearching ? "Comparing…" : "Show lowest premiums"}</ContinueButton>
        </div>}

        {flow.journeyStage === "review" && <div className="journey-step comparison-loading" role="status">Comparing premiums…</div>}

        {showContextualHelp && <details className="advisor-help-disclosure">
          <summary>Need help with this choice?</summary>
          <AdvisorComposer flow={flow} suggestions={suggestionsFor(flow.journeyStage)} />
        </details>}
      </div>}
      {flow.restoredNotice && <p className="restore-notice" role="status">{flow.restoredNotice}</p>}
    </section>
  );
}
