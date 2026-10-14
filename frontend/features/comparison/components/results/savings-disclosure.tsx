import { explainSavings } from "../../result-view-model";
import type { ComparisonFlow } from "../../use-comparison-flow";

function summaryText(explanation: NonNullable<ReturnType<typeof explainSavings>>) {
  if (explanation.relation === "same") return "This matches what you pay now";
  return explanation.relation === "less"
    ? `Save ${explanation.monthlyDifference} a month`
    : `${explanation.monthlyDifference} more a month`;
}

export function SavingsDisclosure({ flow }: { flow: ComparisonFlow }) {
  if (!flow.results?.offers.length) return null;
  const explanation = explainSavings(flow.results.offers[0], flow.currentPremium);

  return (
    <details className="savings-panel">
      <summary>{explanation ? summaryText(explanation) : "Compare with what you pay now"}</summary>
      <div className="savings-content">
        <div className="savings-form">
          <label htmlFor="current-premium">Your monthly premium</label>
          <div>
            <span>CHF</span>
            <input
              aria-describedby="current-premium-hint"
              id="current-premium"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              placeholder="400"
              type="text"
              value={flow.currentPremium}
              onChange={(event) => flow.setCurrentPremium(event.target.value.replace(",", "."))}
            />
          </div>
          <small id="current-premium-hint">Before subsidies</small>
        </div>
        {explanation && <p aria-live="polite">
          {explanation.relation === "same"
            ? `This equals the ${explanation.baseline} you entered.`
            : `${explanation.annualDifference}/year ${explanation.relation} than the ${explanation.baseline} you entered.`}
          {" "}Premiums only; healthcare costs are not included.
        </p>}
      </div>
    </details>
  );
}
