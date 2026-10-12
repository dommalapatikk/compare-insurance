import { modelLabels } from "../../config";
import { formatCurrency, formatDeductible } from "../../formatters";
import type { PremiumOffer } from "../../types";

function comparisonLabel(offer: PremiumOffer) {
  const reference = offer.reference_comparison;
  if (!reference) {
    const difference = Number(offer.monthly_difference_from_cheapest_chf);
    return difference === 0 ? "Cheapest" : `+ ${formatCurrency(difference)}`;
  }
  if (reference.relation === "cheaper") return `Save ${formatCurrency(Number(reference.monthly_difference_chf))}`;
  if (reference.relation === "more_expensive") return `+ ${formatCurrency(Number(reference.monthly_difference_chf))}`;
  return "Same as current";
}

export function RankedPlans({ offers, source }: { offers: PremiumOffer[]; source: string }) {
  return (
    <section className="ranked-results" aria-labelledby="ranked-title">
      <div className="section-heading">
        <div><p className="eyebrow">Top 10</p><h3 id="ranked-title">Plans in price order</h3></div>
        <span>{offers.length} shown · monthly premium ascending</span>
      </div>
      <div className="plans-scroll">
        <table className="plans-table">
          <caption>Top matching plan combinations from {source}</caption>
          <thead><tr><th>#</th><th>Provider</th><th>Product and model</th><th>Franchise</th><th>Monthly</th><th>Annual</th><th>Difference</th></tr></thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={`${offer.insurer_id}-${offer.plan_id}-${offer.deductible_chf}`}>
                <td>{offer.rank}</td>
                <th><strong>{offer.insurer_name}</strong><small>BAG no. {offer.insurer_id}</small></th>
                <td><strong>{offer.product_name}</strong><small>{modelLabels[offer.insurance_model] || offer.insurance_model} · plan {offer.plan_id || "—"}</small></td>
                <td>{formatDeductible(offer.deductible_chf)}</td>
                <td className="money"><strong>{formatCurrency(Number(offer.monthly_premium_chf))}</strong></td>
                <td className="money">{formatCurrency(Number(offer.annual_premium_chf))}</td>
                <td><span className={offer.rank === 1 ? "difference best" : "difference"}>{comparisonLabel(offer)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
