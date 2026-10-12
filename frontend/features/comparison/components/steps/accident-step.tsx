import type { ComparisonFlow } from "../../use-comparison-flow";
import { QuestionCard, RadioCard, StepActions } from "../primitives";

export function AccidentStep({ flow }: { flow: ComparisonFlow }) {
  return (
    <QuestionCard
      eyebrow="Accident coverage"
      title="Should accident coverage be included?"
      description="People working at least eight hours a week for one employer are often covered there. Confirm your own situation."
    >
      <fieldset className="choice-fieldset">
        <legend className="sr-only">Choose accident coverage</legend>
        <div className="choice-grid two-up">
          <RadioCard
            name="accident"
            choice={{
              value: "included",
              label: "Include",
              description: "Include accident risk in the premium.",
            }}
            checked={flow.accident === "included"}
            onChange={() => flow.setAccident("included")}
          />
          <RadioCard
            name="accident"
            choice={{
              value: "excluded",
              label: "Exclude",
              description: "I have qualifying employer coverage.",
            }}
            checked={flow.accident === "excluded"}
            onChange={() => flow.setAccident("excluded")}
          />
        </div>
      </fieldset>
      <button
        className="text-action"
        type="button"
        onClick={() => void flow.sendMessage("How do I know whether to include accident coverage?")}
      >
        I’m not sure — ask the guide
      </button>
      <StepActions disabled={!flow.accident} onContinue={() => flow.goTo(4)} />
    </QuestionCard>
  );
}

