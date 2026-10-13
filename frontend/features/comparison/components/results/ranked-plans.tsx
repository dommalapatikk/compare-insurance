import { modelLabels } from "../../config";
import { formatCurrency, formatDeductible } from "../../formatters";
import type { PremiumOffer } from "../../types";

function comparisonLabel(offer: PremiumOffer) {
  const difference = Number(offer.monthly_difference_from_cheapest_chf);
  return difference === 0 ? "Lowest price" : `${formatCurrency(difference)} more/month`;
}

export function RankedPlans({ offers, source }: { offers: PremiumOffer[]; source: string }) {
  return (
    <section className="ranked-results" aria-label="Lowest-priced matching plans">
      <div className="plans-scroll">
        <table className="comparison-table plans-table">
          <caption>{offers.length} lowest-priced matching plans from {source}</caption>
          <thead><tr><th scope="col">Rank</th><th scope="col">Monthly premium</th><th scope="col">Insurer and plan</th><th scope="col">Insurance model</th><th scope="col">Franchise</th><th scope="col">Difference</th></tr></thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={`${offer.insurer_id}-${offer.plan_id}-${offer.deductible_chf}`}>
                <td>{offer.rank}</td>
                <td className="money"><strong>{formatCurrency(Number(offer.monthly_premium_chf))}</strong></td>
                <th scope="row">{offer.insurer_name}<small>{offer.product_name}</small></th>
                <td>{modelLabels[offer.insurance_model] || offer.insurance_model}</td>
                <td>{formatDeductible(offer.deductible_chf)}</td>
                <td><span className={offer.rank === 1 ? "difference best" : "difference"}>{comparisonLabel(offer)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
