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
  const model = modelLabels[cheapest.insurance_model] || cheapest.insurance_model;
  return (
    <article className="result-overview" aria-label="Lowest monthly premium for your choices">
      <div className="result-price">
        <span>Lowest monthly premium</span>
        <strong>{formatCurrency(Number(cheapest.monthly_premium_chf))}<small>/month</small></strong>
        <p>{formatCurrency(Number(cheapest.annual_premium_chf))} per year</p>
      </div>
      <div className="result-plan">
        <span className="result-label">Insurer and plan</span>
        <strong>{cheapest.insurer_name}</strong>
        <span>{cheapest.product_name}</span>
      </div>
      <dl className="result-facts">
        <div><dt>Insurance model</dt><dd>{model}</dd></div>
        <div><dt>Franchise</dt><dd>{formatDeductible(cheapest.deductible_chf)}</dd></div>
        <div><dt>Accident cover</dt><dd>{accidentLabel}</dd></div>
      </dl>
      <p className="result-profile"><strong>Your profile:</strong> {location} · {ageLabel}</p>
    </article>
  );
}
