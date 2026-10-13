import { modelLabels } from "../../config";
import { formatCurrency, formatDeductible } from "../../formatters";
import type { PremiumSearchResponse } from "../../types";

export function ResultSummary({
  location,
  ageLabel,
  accidentLabel,
  results,
}: {
  location: string;
  ageLabel: string;
  accidentLabel: string;
  results: PremiumSearchResponse;
}) {
  const cheapest = results.offers[0];
  const reference = cheapest.reference_comparison;
  return (
    <div className="lowest-result">
      <div className="lowest-price">
        <span>Lowest published premium</span>
        <strong>{formatCurrency(Number(cheapest.monthly_premium_chf))}<small>/month</small></strong>
        <p>{formatCurrency(Number(cheapest.annual_premium_chf))} per year</p>
        <small>Lowest for these filters—not necessarily the lowest total healthcare cost.</small>
      </div>
      <div className="lowest-provider">
        <span>Insurer and model</span>
        <strong>{cheapest.insurer_name}</strong>
        <p>
          {cheapest.product_name} · {modelLabels[cheapest.insurance_model] || cheapest.insurance_model}
          {" · "}{formatDeductible(cheapest.deductible_chf)} deductible
        </p>
      </div>
      {reference?.relation === "cheaper" && (
        <div className="saving-block">
          <span>Potential premium savings</span>
          <strong>{formatCurrency(Number(reference.annual_difference_chf))}<small>/year</small></strong>
          <p>{formatCurrency(Number(reference.monthly_difference_chf))} per month</p>
        </div>
      )}
      <div className="query-chips" aria-label="Comparison profile">
        <span>{location}</span><span>{ageLabel}</span><span>Accident {accidentLabel.toLowerCase()}</span>
        <span>{results.total_eligible_offers} premium combinations checked</span>
        <span className="result-provenance">✓ Official BAG data · {results.source_year} · Independent comparison</span>
        <a href="https://www.priminfo.admin.ch/" target="_blank" rel="noreferrer">Verify on Priminfo ↗</a>
      </div>
    </div>
  );
}
