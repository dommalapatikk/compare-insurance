import { modelChoices } from "../../config";
import type { ComparisonFlow } from "../../use-comparison-flow";
import { QuestionCard, StepActions } from "../primitives";

export function ModelStep({ flow }: { flow: ComparisonFlow }) {
  return (
    <QuestionCard
      eyebrow="Care model"
      title="Which insurance models fit you?"
      description="Compare all models for the broadest view, or narrow the list by how you prefer to access care."
    >
      <fieldset className="choice-fieldset">
        <legend className="sr-only">Choose one or more insurance models</legend>
        <div className="model-grid">
          {modelChoices.map((choice) => (
            <label className="model-card" key={choice.value}>
              <input
                type="checkbox"
                checked={flow.models.includes(choice.value)}
                onChange={() => flow.toggleModel(choice.value)}
              />
              <span><strong>{choice.label}</strong><small>{choice.description}</small></span>
            </label>
          ))}
        </div>
      </fieldset>
      <button
        className="text-action"
        type="button"
        onClick={() => flow.setModels(modelChoices.map(({ value }) => value))}
      >
        Compare all models
      </button>
      <StepActions disabled={flow.models.length === 0} onContinue={() => flow.goTo(6)} />
    </QuestionCard>
  );
}

