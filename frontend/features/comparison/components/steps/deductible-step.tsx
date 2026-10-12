import { formatDeductible } from "../../formatters";
import type { ComparisonFlow } from "../../use-comparison-flow";
import { QuestionCard, StepActions } from "../primitives";

export function DeductibleStep({ flow }: { flow: ComparisonFlow }) {
  return (
    <QuestionCard
      eyebrow="Deductible (franchise)"
      title="Which deductibles should we compare?"
      description="A higher deductible can lower the premium but can increase what you pay when you need care."
    >
      <fieldset className="choice-fieldset">
        <legend className="sr-only">Choose one or more deductibles</legend>
        <div className="deductible-grid">
          {flow.availableDeductibles.map((value) => (
            <label className="check-card" key={value}>
              <input
                type="checkbox"
                checked={flow.deductibles.includes(value)}
                onChange={() => flow.toggleDeductible(value)}
              />
              <span>{formatDeductible(value)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button
        className="text-action"
        type="button"
        onClick={() => flow.setDeductibles(flow.availableDeductibles)}
      >
        Select all valid deductibles
      </button>
      <StepActions disabled={flow.deductibles.length === 0} onContinue={() => flow.goTo(5)} />
    </QuestionCard>
  );
}

