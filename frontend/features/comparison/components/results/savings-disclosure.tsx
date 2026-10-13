import type { FormEvent } from "react";

import { explainSavings } from "../../result-view-model";
import type { ComparisonFlow } from "../../use-comparison-flow";

function summaryText(explanation: NonNullable<ReturnType<typeof explainSavings>>) {
  if (explanation.relation === "same") {
    return `Same monthly premium as the ${explanation.baseline} you entered`;
  }
  return `${explanation.monthlyDifference} ${explanation.relation} per month than the ${explanation.baseline} you entered`;
}

export function SavingsDisclosure({ flow }: { flow: ComparisonFlow }) {
  if (!flow.results?.offers.length) return null;
  const appliedPremium = flow.results.query.reference_monthly_premium_chf || "";
  const explanation = explainSavings(flow.results.offers[0], appliedPremium);

  function submit(event: FormEvent) {
    event.preventDefault();
    void flow.comparePlans();
  }

  return (
    <details className="result-disclosure savings-disclosure">
      <summary>
        {explanation
          ? summaryText(explanation)
          : "Compare the lowest premium with what you pay now"}
      </summary>
      <div className="savings-content">
        {explanation && <p>
          That is {explanation.annualDifference} {explanation.relation === "same" ? "difference" : `${explanation.relation} per year`}.
          This compares premiums only, not your total healthcare costs.
        </p>}
        <form onSubmit={submit}>
          <label htmlFor="current-premium">Your current monthly premium</label>
          <div><span>CHF</span><input id="current-premium" inputMode="decimal" min="0" step="0.05" type="number" value={flow.currentPremium} onChange={(event) => flow.setCurrentPremium(event.target.value)} placeholder="e.g. 400.00" /><button disabled={flow.isSearching || !flow.currentPremium} type="submit">Update</button></div>
        </form>
      </div>
    </details>
  );
}
