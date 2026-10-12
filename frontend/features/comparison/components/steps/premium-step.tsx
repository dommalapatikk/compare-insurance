import type { ComparisonFlow } from "../../use-comparison-flow";
import { QuestionCard, StepActions } from "../primitives";

export function PremiumStep({ flow }: { flow: ComparisonFlow }) {
  return (
    <QuestionCard
      eyebrow="Optional reference"
      title="What do you pay each month now?"
      description="This calculates a gross-premium difference only—not your total healthcare cost."
    >
      <label className="input-label" htmlFor="current-premium">Current monthly premium</label>
      <div className="currency-field">
        <span>CHF</span>
        <input
          id="current-premium"
          type="number"
          min="0"
          step="0.05"
          inputMode="decimal"
          value={flow.currentPremium}
          onChange={(event) => flow.setCurrentPremium(event.target.value)}
          placeholder="Optional"
        />
      </div>
      <StepActions
        continueLabel={flow.currentPremium ? "Save and review" : "Skip and review"}
        onContinue={() => flow.goTo(7)}
      />
    </QuestionCard>
  );
}

