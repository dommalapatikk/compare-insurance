import type { FormEvent, ReactNode } from "react";

import { modelChoices } from "../config";
import type { ComparisonFlow } from "../use-comparison-flow";
import { AdvisorComposer } from "./advisor-composer";
import { JourneySummary } from "./journey-summary";

function AssistantPrompt({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="assistant-prompt">
      <span className="assistant-mark" aria-hidden="true">CI</span>
      <div><p className="eyebrow">Your comparison guide</p><h2>{title}</h2>{children}</div>
    </div>
  );
}

function ContinueButton({ disabled, onClick, children = "Continue" }: {
  disabled?: boolean;
  onClick: () => void;
  children?: ReactNode;
}) {
  return <button className="continue-button" disabled={disabled} onClick={onClick} type="button">{children}<span aria-hidden="true">→</span></button>;
}

export function GuidedAdvisor({ flow }: { flow: ComparisonFlow }) {
  function submit(event: FormEvent) {
    event.preventDefault();
    void flow.comparePlans();
  }

  return (
    <section className="guided-advisor" id="guided-comparison" aria-labelledby="advisor-title">
      <div className="advisor-heading">
        <div><p className="eyebrow">Guided comparison</p><h2 id="advisor-title">Find your lowest published premiums</h2></div>
        <div className="advisor-heading-actions">
          <span>Five short decisions · no sign-up</span>
          {(flow.journeyStage !== "welcome" || flow.messages.length > 0) && (
            <button onClick={flow.restartJourney} type="button">Start over</button>
          )}
        </div>
      </div>

      <JourneySummary flow={flow} />

      <div className="advisor-workspace">
        <AdvisorComposer flow={flow} />
        <div className="guided-divider"><span>or answer one question at a time</span></div>

        {flow.journeyStage === "welcome" && (
          <div className="journey-step">
            <AssistantPrompt title="Ready when you are.">
              <p>I’ll use only the details needed for a Swiss basic-insurance comparison, then show the lowest official 2027 premiums.</p>
            </AssistantPrompt>
            <ContinueButton onClick={flow.startJourney}>Start guided comparison</ContinueButton>
          </div>
        )}

        {flow.journeyStage === "location" && (
          <div className="journey-step">
            <AssistantPrompt title="Where do you live?">
              <p>Enter your postcode or municipality. I’ll resolve the correct premium area behind the scenes.</p>
            </AssistantPrompt>
            <div className="step-control location-combobox">
              <label htmlFor="location-search">Postcode or municipality</label>
              <input
                id="location-search"
                type="search"
                role="combobox"
                autoComplete="off"
                aria-autocomplete="list"
                aria-controls="location-suggestions"
                aria-expanded={flow.showLocationSuggestions && flow.locationSuggestions.length > 0}
                aria-activedescendant={flow.activeLocationIndex >= 0 ? `location-option-${flow.activeLocationIndex}` : undefined}
                value={flow.locationQuery}
                onChange={(event) => flow.updateLocationQuery(event.target.value)}
                onFocus={() => flow.setShowLocationSuggestions(true)}
                onBlur={() => window.setTimeout(() => flow.setShowLocationSuggestions(false), 120)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") { event.preventDefault(); flow.moveLocationSelection(1); }
                  if (event.key === "ArrowUp") { event.preventDefault(); flow.moveLocationSelection(-1); }
                  if (event.key === "Enter" && flow.showLocationSuggestions) { event.preventDefault(); flow.chooseActiveLocation(); }
                  if (event.key === "Escape") flow.setShowLocationSuggestions(false);
                }}
                placeholder="e.g. 3011 Bern"
              />
              {flow.showLocationSuggestions && flow.locationSuggestions.length > 0 && (
                <ul id="location-suggestions" className="location-suggestions" role="listbox">
                  {flow.locationSuggestions.map((item, index) => (
                    <li
                      key={`${item.postal_code}-${item.municipality_id}`}
                      id={`location-option-${index}`}
                      role="option"
                      aria-selected={flow.activeLocationIndex === index}
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => flow.setActiveLocationIndex(index)}
                      onClick={() => flow.chooseLocation(item)}
                    ><strong>{item.postal_code} {item.locality}</strong><small>{item.municipality_name}, {item.canton}</small></li>
                  ))}
                </ul>
              )}
              <small aria-live="polite">{flow.isLoadingLocations ? "Searching…" : flow.selectedLocation ? `Found ${flow.selectedLocation.label}` : flow.locationNotice || "Choose a result to confirm your municipality."}</small>
            </div>
            <ContinueButton disabled={!flow.selectedLocation} onClick={() => flow.goToStage("birth_year")} />
          </div>
        )}

        {flow.journeyStage === "birth_year" && (
          <div className="journey-step">
            <AssistantPrompt title="What year were you born?">
              <p>This selects the official child, young-adult or adult premium category. Gender does not affect basic-insurance premiums.</p>
            </AssistantPrompt>
            <label className="step-control compact-control">Birth year<input inputMode="numeric" min="1900" max="2027" type="number" value={flow.birthYear} onChange={(event) => flow.setBirthYear(event.target.value)} placeholder="e.g. 1984" /><small>{flow.ageGroup ? `2027 category: ${flow.ageLabel}` : "Enter four digits."}</small></label>
            <ContinueButton disabled={!flow.ageGroup} onClick={() => flow.goToStage("accident")} />
          </div>
        )}

        {flow.journeyStage === "accident" && (
          <div className="journey-step">
            <AssistantPrompt title="Should the premium include accident cover?">
              <p>If you work at least eight hours a week for one employer, accident insurance is usually provided through work. Check before excluding it.</p>
            </AssistantPrompt>
            <div className="choice-cards two" role="radiogroup" aria-label="Accident coverage">
              {(["excluded", "included"] as const).map((value) => <label key={value}><input type="radio" name="accident" checked={flow.accident === value} onChange={() => flow.setAccident(value)} /><span><strong>{value === "excluded" ? "Exclude accident cover" : "Include accident cover"}</strong><small>{value === "excluded" ? "Usually for people covered through work." : "Include accidents in this comparison."}</small></span></label>)}
            </div>
            <ContinueButton disabled={!flow.accident} onClick={() => flow.goToStage("models")} />
          </div>
        )}

        {flow.journeyStage === "models" && (
          <div className="journey-step">
            <AssistantPrompt title="How would you like to access care?">
              <p>If you’re unsure, compare every model. PRAXIS includes family-doctor and HMO-style plans from 2027.</p>
            </AssistantPrompt>
            <button className="select-all" onClick={flow.selectAllModels} type="button">Compare all models <span>{flow.models.length === flow.allModelCount ? "✓" : ""}</span></button>
            <div className="choice-cards models">{modelChoices.map((choice) => <label key={choice.value}><input type="checkbox" checked={flow.models.some((value) => value === choice.value)} onChange={() => flow.toggleModel(choice.value)} /><span><strong>{choice.label}</strong><small>{choice.description}</small></span></label>)}</div>
            <ContinueButton disabled={!flow.models.length} onClick={() => flow.goToStage("deductibles")} />
          </div>
        )}

        {flow.journeyStage === "deductibles" && (
          <div className="journey-step">
            <AssistantPrompt title="Which deductible (franchise) should we compare?">
              <p>A higher franchise can lower the premium but increase what you pay when you need care. Compare all if you are unsure.</p>
            </AssistantPrompt>
            <button className="select-all" onClick={flow.selectAllDeductibles} type="button">Compare every franchise <span>{flow.deductibles.length === flow.availableDeductibles.length ? "✓" : ""}</span></button>
            <div className="deductible-choices">{flow.availableDeductibles.map((value) => <label key={value}><input type="checkbox" checked={flow.deductibles.includes(value)} onChange={() => flow.toggleDeductible(value)} /><span>CHF {value.toLocaleString("en-CH")}</span></label>)}</div>
            <ContinueButton disabled={!flow.deductibles.length} onClick={() => flow.goToStage("review")}>Review comparison</ContinueButton>
          </div>
        )}

        {flow.journeyStage === "review" && (
          <form className="journey-step" onSubmit={submit}>
            <AssistantPrompt title="Everything is ready."><p>Review your answers, then I’ll compare the official premiums and show the lowest option at every franchise.</p></AssistantPrompt>
            <div className="review-line"><strong>{flow.location}</strong><span>{flow.ageLabel}</span><span>Accident {flow.accidentLabel.toLowerCase()}</span><span>{flow.models.length === flow.allModelCount ? "All models" : `${flow.models.length} models`}</span><span>{flow.deductibles.length === flow.availableDeductibles.length ? "All franchises" : `${flow.deductibles.length} franchises`}</span></div>
            {flow.formError && <p className="form-error" role="alert">{flow.formError}</p>}
            <ContinueButton disabled={flow.isSearching} onClick={() => void flow.comparePlans()}>{flow.isSearching ? "Comparing…" : "Compare 2027 premiums"}</ContinueButton>
          </form>
        )}
      </div>
      {flow.restoredNotice && <p className="restore-notice" role="status">{flow.restoredNotice}</p>}
    </section>
  );
}
