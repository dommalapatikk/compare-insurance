import { modelChoices } from "../config";
import { formatDeductible } from "../formatters";
import type { ComparisonFlow } from "../use-comparison-flow";
import { AnswerChip } from "./primitives";

export function AnswerHistory({ flow }: { flow: ComparisonFlow }) {
  return (
    <>
      {flow.step > 1 && (
        <AnswerChip label="Location" value={flow.location} onEdit={() => flow.goTo(1)} />
      )}
      {flow.step > 2 && (
        <AnswerChip label="Age category" value={flow.ageLabel} onEdit={() => flow.goTo(2)} />
      )}
      {flow.step > 3 && (
        <AnswerChip label="Accident coverage" value={flow.accidentLabel} onEdit={() => flow.goTo(3)} />
      )}
      {flow.step > 4 && (
        <AnswerChip
          label="Deductibles"
          value={flow.deductibles.map(formatDeductible).join(", ")}
          onEdit={() => flow.goTo(4)}
        />
      )}
      {flow.step > 5 && (
        <AnswerChip
          label="Models"
          value={
            flow.models.length === modelChoices.length
              ? "All models"
              : flow.selectedModelLabels.join(", ")
          }
          onEdit={() => flow.goTo(5)}
        />
      )}
      {flow.step > 6 && (
        <AnswerChip
          label="Current monthly premium"
          value={flow.currentPremium ? `CHF ${flow.currentPremium}` : "Skipped"}
          onEdit={() => flow.goTo(6)}
        />
      )}
      {flow.resetNotice && (
        <p className="reset-notice" role="status">{flow.resetNotice}</p>
      )}
    </>
  );
}

