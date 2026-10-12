import { formatCurrency } from "../../formatters";
import type { PremiumSearchResponse } from "../../types";

export function ResultSummary({
  location,
  accidentLabel,
  results,
}: {
  location: string;
  accidentLabel: string;
  results: PremiumSearchResponse;
}) {
  const cheapest = results.offers[0];
  const reference = cheapest.reference_comparison;
  return (
    <div className="result-summary-card">
      <div className="result-summary-grid">
        <div>
          <span>Lowest matching premium</span>
          <strong>{formatCurrency(Number(cheapest.monthly_premium_chf))}<small>/month</small></strong>
          <p>
            {reference?.relation === "cheaper"
              ? `Save ${formatCurrency(Number(reference.annual_difference_chf))} / year vs current`
              : `${formatCurrency(Number(cheapest.annual_premium_chf))} per year`}
          </p>
        </div>
        <div>
          <span>Plans shown</span>
          <strong>{results.offers.length}<small> of {results.total_eligible_offers}</small></strong>
          <p>Ranked by monthly premium</p>
        </div>
        <div>
          <span>Query</span>
          <strong className="result-query">{location}</strong>
          <p>{results.source_year} · accident {accidentLabel.toLowerCase()}</p>
        </div>
      </div>
    </div>
  );
}

