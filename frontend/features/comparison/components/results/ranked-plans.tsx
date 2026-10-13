import { modelLabels } from "../../config";
import { formatCurrency, formatDeductible } from "../../formatters";
import type { PremiumOffer } from "../../types";

function comparisonLabel(offer: PremiumOffer) {
  const difference = Number(offer.monthly_difference_from_cheapest_chf);
  return difference === 0 ? "Lowest price" : `${formatCurrency(difference)} more/month`;
}

export function RankedPlans({ offers, source }: { offers: PremiumOffer[]; source: string }) {
  return (
    <section className="ranked-results" aria-label="10 lowest offers">
      <p className="result-sort">Lowest monthly premium first</p>
      <div className="plans-scroll">
        <table className="comparison-table plans-table">
          <caption>{offers.length} lowest-priced plans from {source}</caption>
          <thead><tr><th>Rank</th><th>Insurer and plan</th><th>Insurance model</th><th>Franchise</th><th>Monthly premium</th><th>Difference</th></tr></thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={`${offer.insurer_id}-${offer.plan_id}-${offer.deductible_chf}`}>
                <td>{offer.rank}</td>
                <th>{offer.insurer_name}<small>{offer.product_name}</small></th>
                <td>{modelLabels[offer.insurance_model] || offer.insurance_model}</td>
                <td>{formatDeductible(offer.deductible_chf)}</td>
                <td className="money"><strong>{formatCurrency(Number(offer.monthly_premium_chf))}</strong></td>
                <td><span className={offer.rank === 1 ? "difference best" : "difference"}>{comparisonLabel(offer)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="plan-cards">
        {offers.map((offer) => (
          <article key={`${offer.insurer_id}-${offer.plan_id}-${offer.deductible_chf}`}>
            <div className="plan-card-heading"><span>#{offer.rank}</span><strong>{formatCurrency(Number(offer.monthly_premium_chf))}<small>/month</small></strong></div>
            <h4>{offer.insurer_name}</h4>
            <p>{offer.product_name}</p>
            <div className="plan-card-meta"><span>{modelLabels[offer.insurance_model] || offer.insurance_model}</span><span>{formatDeductible(offer.deductible_chf)} franchise</span></div>
            <div className="plan-card-footer"><span className={offer.rank === 1 ? "difference best" : "difference"}>{comparisonLabel(offer)}</span></div>
          </article>
        ))}
      </div>
    </section>
  );
}
