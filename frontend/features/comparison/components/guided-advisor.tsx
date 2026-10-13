import { useEffect, useRef } from "react";
import type { FormEvent, ReactNode } from "react";

import { modelChoices } from "../config";
import type { ComparisonFlow } from "../use-comparison-flow";
import { AdvisorComposer } from "./advisor-composer";
import { JourneySummary } from "./journey-summary";

function AssistantPrompt({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="assistant-prompt">
      <span className="assistant-mark" aria-hidden="true">CI</span>
      <div><p className="eyebrow">Your comparison guide</p><h3 tabIndex={-1}>{title}</h3>{children}</div>
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

function BackButton({ onClick }: { onClick: () => void }) {
  return <button className="back-button" onClick={onClick} type="button"><span aria-hidden="true">←</span> Back</button>;
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
          {(Object.values(flow.completedStages).some(Boolean) || flow.messages.length > 0) && (
            <button onClick={flow.restartJourney} type="button">Start over</button>
          )}
        </div>
      </div>

      <JourneySummary flow={flow} />

      <div className="advisor-workspace" ref={workspaceRef}>
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
            <BackButton onClick={() => flow.goToStage("location")} />
            <AssistantPrompt title="What year were you born?">
              <p>This selects the official child, young-adult or adult premium category. Gender does not affect basic-insurance premiums.</p>
            </AssistantPrompt>
            <label className="step-control compact-control">Birth year<input inputMode="numeric" min="1900" max="2027" type="number" value={flow.birthYear} onChange={(event) => flow.setBirthYear(event.target.value)} placeholder="e.g. 1984" /><small>{flow.ageGroup ? `2027 category: ${flow.ageLabel}` : "Enter four digits."}</small></label>
            <ContinueButton disabled={!flow.ageGroup} onClick={() => flow.goToStage("accident")} />
          </div>
        )}

        {flow.journeyStage === "accident" && (
          <div className="journey-step">
            <BackButton onClick={() => flow.goToStage("birth_year")} />
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
            <BackButton onClick={() => flow.goToStage("accident")} />
            <AssistantPrompt title="How would you like to access care?">
              <p>If you’re unsure, compare every model. PRAXIS includes family-doctor and HMO-style plans from 2027.</p>
            </AssistantPrompt>
            <div className="selection-mode" aria-label="Care model selection">
              <button aria-pressed={flow.models.length === flow.allModelCount} onClick={flow.selectAllModels} type="button"><span aria-hidden="true">{flow.models.length === flow.allModelCount ? "✓" : ""}</span><strong>Compare all models</strong><small>Recommended if you are unsure.</small></button>
              <button aria-pressed={flow.models.length !== flow.allModelCount} onClick={flow.chooseSpecificModels} type="button"><span aria-hidden="true">{flow.models.length !== flow.allModelCount ? "✓" : ""}</span><strong>Choose specific models</strong><small>Only show the models you select.</small></button>
            </div>
            {flow.models.length !== flow.allModelCount && (
              <div className="choice-cards models">{modelChoices.map((choice) => <label key={choice.value}><input type="checkbox" checked={flow.models.some((value) => value === choice.value)} onChange={() => flow.toggleModel(choice.value)} /><span><strong>{choice.label}</strong><small>{choice.description}</small></span></label>)}</div>
            )}
            <ContinueButton disabled={!flow.models.length} onClick={() => flow.goToStage("deductibles")} />
          </div>
        )}

        {flow.journeyStage === "deductibles" && (
          <div className="journey-step">
            <BackButton onClick={() => flow.goToStage("models")} />
            <AssistantPrompt title="Which deductible (franchise) should we compare?">
              <p>A higher franchise can lower the premium but increase what you pay when you need care. Compare all if you are unsure.</p>
            </AssistantPrompt>
            <div className="selection-mode" aria-label="Franchise selection">
              <button aria-pressed={flow.deductibles.length === flow.availableDeductibles.length} onClick={flow.selectAllDeductibles} type="button"><span aria-hidden="true">{flow.deductibles.length === flow.availableDeductibles.length ? "✓" : ""}</span><strong>Compare every franchise</strong><small>See the lowest premium at each level.</small></button>
              <button aria-pressed={flow.deductibles.length !== flow.availableDeductibles.length} onClick={flow.chooseSpecificDeductibles} type="button"><span aria-hidden="true">{flow.deductibles.length !== flow.availableDeductibles.length ? "✓" : ""}</span><strong>Choose specific franchises</strong><small>Only compare the levels you select.</small></button>
            </div>
            {flow.deductibles.length !== flow.availableDeductibles.length && (
              <div className="deductible-choices">{flow.availableDeductibles.map((value) => <label key={value}><input type="checkbox" checked={flow.deductibles.includes(value)} onChange={() => flow.toggleDeductible(value)} /><span>CHF {value.toLocaleString("en-CH")}</span></label>)}</div>
            )}
            <ContinueButton disabled={!flow.deductibles.length} onClick={() => flow.goToStage("review")}>Review comparison</ContinueButton>
          </div>
        )}

        {flow.journeyStage === "review" && (
          <form className="journey-step" onSubmit={submit}>
            <BackButton onClick={() => flow.goToStage("deductibles")} />
            <AssistantPrompt title="Everything is ready."><p>Review your answers, then I’ll compare the official premiums and show the lowest option at every franchise.</p></AssistantPrompt>
            <dl className="review-list">
              <div><dt>Location</dt><dd>{flow.location}</dd><button onClick={() => flow.goToStage("location")} type="button">Edit</button></div>
              <div><dt>Age category</dt><dd>{flow.birthYear} · {flow.ageLabel}</dd><button onClick={() => flow.goToStage("birth_year")} type="button">Edit</button></div>
              <div><dt>Accident cover</dt><dd>{flow.accidentLabel}</dd><button onClick={() => flow.goToStage("accident")} type="button">Edit</button></div>
              <div><dt>Care models</dt><dd>{flow.models.length === flow.allModelCount ? "All models" : `${flow.models.length} selected`}</dd><button onClick={() => flow.goToStage("models")} type="button">Edit</button></div>
              <div><dt>Franchises</dt><dd>{flow.deductibles.length === flow.availableDeductibles.length ? "All franchises" : `${flow.deductibles.length} selected`}</dd><button onClick={() => flow.goToStage("deductibles")} type="button">Edit</button></div>
            </dl>
            <p className="review-source"><span aria-hidden="true">✓</span> Prices and rankings come from the official BAG 2027 premium catalogue.</p>
            {flow.formError && <p className="form-error" role="alert">{flow.formError}</p>}
            <button className="continue-button review-submit" disabled={flow.isSearching} type="submit">{flow.isSearching ? "Comparing…" : "Compare 2027 premiums"}<span aria-hidden="true">→</span></button>
          </form>
        )}

        <section className="advisor-help" aria-labelledby="advisor-help-title">
          <div>
            <p className="eyebrow">Need help?</p>
            <h3 id="advisor-help-title">Ask about this choice</h3>
            <p>Get a plain-language explanation or describe what you need.</p>
          </div>
          <AdvisorComposer flow={flow} />
        </section>
      </div>
      {flow.restoredNotice && <p className="restore-notice" role="status">{flow.restoredNotice}</p>}
    </section>
  );
}
