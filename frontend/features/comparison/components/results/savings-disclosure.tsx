import type { FormEvent } from "react";

import { explainSavings } from "../../result-view-model";
import type { ComparisonFlow } from "../../use-comparison-flow";

function summaryText(explanation: NonNullable<ReturnType<typeof explainSavings>>) {
  if (explanation.relation === "same") {
    return "Same monthly premium";
  }
  return explanation.relation === "less"
    ? `You could save ${explanation.monthlyDifference}/month`
    : `This plan costs ${explanation.monthlyDifference}/month more`;
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
    <section className="savings-panel" aria-labelledby="savings-title">
      <h3 id="savings-title">
        {explanation
          ? summaryText(explanation)
          : "Compare with your current premium"}
      </h3>
      <div className="savings-content">
        {explanation ? <p>
          {explanation.relation === "same"
            ? `This matches the ${explanation.baseline} you entered.`
            : `${explanation.annualDifference}/year ${explanation.relation} than the ${explanation.baseline} you entered.`}
          {" "}Premiums only; healthcare costs are not included.
        </p> : null}
        <form onSubmit={submit}>
          <label htmlFor="current-premium">Monthly premium before subsidies</label>
          <div><span>CHF</span><input id="current-premium" inputMode="decimal" min="0" max="5000" step="0.05" type="number" value={flow.currentPremium} onChange={(event) => flow.setCurrentPremium(event.target.value)} placeholder="400.00" /><button disabled={flow.isSearching || !flow.currentPremium} type="submit">Calculate</button></div>
        </form>
      </div>
    </section>
  );
}
