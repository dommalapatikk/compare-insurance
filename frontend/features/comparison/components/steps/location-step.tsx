import type { ComparisonFlow } from "../../use-comparison-flow";
import { QuestionCard, StepActions } from "../primitives";

export function LocationStep({ flow }: { flow: ComparisonFlow }) {
  return (
    <QuestionCard
      eyebrow="First, your location"
      title="Where do you live?"
      description="Your municipality determines the official premium region. We’ll confirm it before a real search."
    >
      <label className="input-label" htmlFor="location">Municipality or postal code</label>
      <div className={`text-field ${flow.locationError ? "has-error" : ""}`}>
        <span aria-hidden="true">⌖</span>
        <input
          id="location"
          autoComplete="postal-code"
          value={flow.location}
          onChange={(event) => {
            flow.setLocation(event.target.value);
            flow.setLocationError("");
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") flow.continueFromLocation();
          }}
          aria-describedby={flow.locationError ? "location-error" : "location-help"}
          aria-invalid={Boolean(flow.locationError)}
          placeholder="e.g. Zürich or 8001"
        />
      </div>
      {flow.locationError ? (
        <p className="field-error" id="location-error">{flow.locationError}</p>
      ) : (
        <p className="field-help" id="location-help">No location is saved in your browser.</p>
      )}
      <StepActions onContinue={flow.continueFromLocation} />
    </QuestionCard>
  );
}

