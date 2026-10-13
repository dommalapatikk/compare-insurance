import type { ComparisonFlow } from "../use-comparison-flow";

type SummaryStage = "location" | "birth_year" | "accident" | "models" | "deductibles";

const stages: Array<{ stage: SummaryStage; label: string }> = [
  { stage: "location", label: "Location" },
  { stage: "birth_year", label: "Birth year" },
  { stage: "accident", label: "Accident" },
  { stage: "models", label: "Models" },
  { stage: "deductibles", label: "Franchise" },
];

export function JourneySummary({ flow }: { flow: ComparisonFlow }) {
  const values: Record<SummaryStage, string> = {
    location: flow.location,
    birth_year: flow.birthYear ? `${flow.birthYear} · ${flow.ageLabel}` : "",
    accident: flow.accident ? flow.accidentLabel : "",
    models: flow.models.length === flow.allModelCount ? "All models" : `${flow.models.length} selected`,
    deductibles: flow.deductibles.length === flow.availableDeductibles.length
      ? "All franchises"
      : `${flow.deductibles.length} selected`,
  };

  return (
    <ol className="journey-summary" aria-label="Your comparison answers">
      {stages.map(({ stage, label }, index) => {
        const value = flow.completedStages[stage] ? values[stage] : "";
        const isCurrent = flow.journeyStage === stage;
        return (
          <li className={value ? "complete" : isCurrent ? "current" : ""} key={stage}>
            <button
              disabled={!value && !isCurrent}
              onClick={() => flow.goToStage(stage)}
              type="button"
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <small>{label}</small>
              <strong>{value || (isCurrent ? "Answer now" : "Not answered")}</strong>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
