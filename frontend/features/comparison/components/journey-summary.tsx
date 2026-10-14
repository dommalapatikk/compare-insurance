import { journeySection } from "../journey-machine";
import type { ComparisonFlow } from "../use-comparison-flow";

function preferenceSummary(flow: ComparisonFlow) {
  const models = flow.models.length === flow.allModelCount
    ? "All models"
    : `${flow.models.length} model${flow.models.length === 1 ? "" : "s"}`;
  const franchises = flow.deductibles.length === flow.availableDeductibles.length
    ? "all franchises"
    : `${flow.deductibles.length} franchise${flow.deductibles.length === 1 ? "" : "s"}`;
  return `${models} · ${franchises}`;
}

export function JourneySummary({ flow }: { flow: ComparisonFlow }) {
  const section = journeySection(flow.journeyStage);
  const detailsReady = Boolean(flow.location && flow.birthYear && flow.accident);
  const details = detailsReady
    ? `${flow.location} · ${flow.birthYear} · Accident ${flow.accidentLabel.toLowerCase()}`
    : "Postcode, birth year and accident cover";
  const preferences = preferenceSummary(flow);

  if (section === "results") {
    return (
      <details className="answer-summary">
        <summary>Your choices</summary>
        <div className="answer-summary-grid">
          <button onClick={() => flow.goToStage("location")} type="button">
            <span>Your details</span><strong>{details}</strong><i>Edit</i>
          </button>
          <button onClick={() => flow.goToStage("models")} type="button">
            <span>Preferences</span><strong>{preferences}</strong><i>Edit</i>
          </button>
        </div>
      </details>
    );
  }

  return (
    <nav className="journey-navigation" aria-label="Comparison sections">
      <button
        aria-current={section === "details" ? "step" : undefined}
        className={section === "details" ? "active" : ""}
        onClick={() => flow.goToStage("location")}
        type="button"
      >
        <span>Your details</span><small>{details}</small>
      </button>
      <span className="journey-arrow" aria-hidden="true">→</span>
      <button
        aria-current={section === "preferences" ? "step" : undefined}
        className={section === "preferences" ? "active" : ""}
        disabled={!detailsReady}
        onClick={section === "details" ? flow.continueFromDetails : undefined}
        type="button"
      >
        <span>Preferences</span><small>Models and franchises</small>
      </button>
    </nav>
  );
}
