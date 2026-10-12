import { ageChoices } from "../../config";
import type { AgeGroup } from "../../types";
import type { ComparisonFlow } from "../../use-comparison-flow";
import { QuestionCard, RadioCard, StepActions } from "../primitives";

export function AgeStep({ flow }: { flow: ComparisonFlow }) {
  return (
    <QuestionCard
      eyebrow="Age category"
      title="Which official age group applies?"
      description="Basic-insurance premiums use age categories, not gender."
    >
      <fieldset className="choice-fieldset">
        <legend className="sr-only">Choose an age category</legend>
        <div className="choice-grid three-up">
          {ageChoices.map((choice) => (
            <RadioCard
              key={choice.value}
              name="age-category"
              choice={choice}
              checked={flow.ageGroup === choice.value}
              onChange={() => flow.chooseAge(choice.value as AgeGroup)}
            />
          ))}
        </div>
      </fieldset>
      <StepActions disabled={!flow.ageGroup} onContinue={() => flow.goTo(3)} />
    </QuestionCard>
  );
}

