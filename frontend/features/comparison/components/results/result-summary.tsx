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
        <span>Lowest monthly premium for your choices</span>
        <strong>{formatCurrency(Number(cheapest.monthly_premium_chf))}<small>/month</small></strong>
        <p>{formatCurrency(Number(cheapest.annual_premium_chf))} per year</p>
      </div>
      <div className="result-plan">
        <strong>{cheapest.insurer_name}</strong>
        <span>{cheapest.product_name}</span>
        <p>{model} care model · {formatDeductible(cheapest.deductible_chf)} franchise · Accident {accidentLabel.toLowerCase()}</p>
      </div>
      <p className="result-profile">{location} · {ageLabel}</p>
    </article>
  );
}
