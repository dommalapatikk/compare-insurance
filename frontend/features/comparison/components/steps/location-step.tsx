import { cantonChoices } from "../../config";
import type { ComparisonFlow } from "../../use-comparison-flow";
import { QuestionCard, StepActions } from "../primitives";

export function LocationStep({ flow }: { flow: ComparisonFlow }) {
  return (
    <QuestionCard
      eyebrow="First, your location"
      title="Choose your official premium area"
      description="The current MVP uses BAG canton and premium-region codes directly. Municipality lookup comes next."
    >
      <div className="location-grid">
        <label className="input-label" htmlFor="canton">
          Canton
          <select
            id="canton"
            value={flow.canton}
            onChange={(event) => flow.chooseCanton(event.target.value)}
          >
            <option value="">Choose canton</option>
            {cantonChoices.map((canton) => (
              <option key={canton} value={canton}>{canton}</option>
            ))}
          </select>
        </label>
        <label className="input-label" htmlFor="premium-region">
          Premium region
          <select
            id="premium-region"
            value={flow.region}
            disabled={!flow.canton || flow.availableRegions.length === 1}
            onChange={(event) => {
              flow.setRegion(event.target.value);
              flow.setLocationError("");
            }}
          >
            <option value="">Choose region</option>
            {flow.availableRegions.map((region) => (
              <option key={region} value={region}>
                {region === "0" ? "0 · canton has one region" : region}
              </option>
            ))}
          </select>
        </label>
      </div>
      {flow.locationError ? (
        <p className="field-error" id="location-error">{flow.locationError}</p>
      ) : (
        <p className="field-help" id="location-help">
          Use the region from the official BAG premium-region list. No location is saved.
        </p>
      )}
      <StepActions onContinue={flow.continueFromLocation} />
    </QuestionCard>
  );
}

