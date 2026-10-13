import { modelLabels } from "../../config";
import { formatCurrency, formatDeductible } from "../../formatters";
import type { PremiumOffer } from "../../types";

function comparisonLabel(offer: PremiumOffer) {
  const reference = offer.reference_comparison;
  if (!reference) {
    const difference = Number(offer.monthly_difference_from_cheapest_chf);
    return difference === 0 ? "Lowest price" : `${formatCurrency(difference)} more/month`;
  }
  if (reference.relation === "cheaper") {
    return `Save ${formatCurrency(Number(reference.monthly_difference_chf))}/month`;
  }
  if (reference.relation === "more_expensive") {
    return `${formatCurrency(Number(reference.monthly_difference_chf))} more/month`;
  }
  return "Same monthly premium";
}

function PlanDetails({ offer }: { offer: PremiumOffer }) {
  return (
    <details className="plan-details">
      <summary>Details</summary>
      <div>
        <span>Provider number: {offer.insurer_id}</span>
        {offer.plan_id && <span>Plan reference: {offer.plan_id}</span>}
        <span>Accident cover: {offer.accident_coverage ? "included" : "excluded"}</span>
        <span>{offer.canton} · premium region {offer.region}</span>
      </div>
    </details>
  );
}

export function RankedPlans({ offers, source }: { offers: PremiumOffer[]; source: string }) {
  const hasReference = offers.some((offer) => offer.reference_comparison !== null);
  return (
    <section className="ranked-results" aria-labelledby="ranked-title">
      <div className="section-heading">
        <div><p className="eyebrow">Compare insurers</p><h3 id="ranked-title">{offers.length} lowest-priced plans</h3></div>
        <span>Lowest monthly premium first</span>
      </div>
      <div className="plans-scroll">
        <table className="plans-table">
          <caption>Lowest-priced plans from {source}</caption>
          <thead><tr><th>Rank</th><th>Insurer</th><th>Plan and model</th><th>Deductible</th><th>Monthly premium</th><th>Annual premium</th><th>{hasReference ? "Compared with current" : "Compared with lowest"}</th><th>Plan details</th></tr></thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={`${offer.insurer_id}-${offer.plan_id}-${offer.deductible_chf}`}>
                <td>{offer.rank}</td>
                <th>{offer.insurer_name}</th>
                <td><strong>{offer.product_name}</strong><small>{modelLabels[offer.insurance_model] || offer.insurance_model}</small></td>
                <td>{formatDeductible(offer.deductible_chf)}</td>
                <td className="money"><strong>{formatCurrency(Number(offer.monthly_premium_chf))}</strong></td>
                <td className="money">{formatCurrency(Number(offer.annual_premium_chf))}</td>
                <td><span className={offer.rank === 1 ? "difference best" : "difference"}>{comparisonLabel(offer)}</span></td>
                <td><PlanDetails offer={offer} /></td>
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
            <div className="plan-card-meta"><span>{modelLabels[offer.insurance_model] || offer.insurance_model}</span><span>{formatDeductible(offer.deductible_chf)} deductible</span></div>
            <div className="plan-card-footer"><span className={offer.rank === 1 ? "difference best" : "difference"}>{comparisonLabel(offer)}</span><PlanDetails offer={offer} /></div>
          </article>
        ))}
      </div>
    </section>
  );
}
