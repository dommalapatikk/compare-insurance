import { formatCurrency } from "../../formatters";
import type { PremiumOffer } from "../../types";

function comparisonLabel(offer: PremiumOffer) {
  const reference = offer.reference_comparison;
  if (!reference) {
    return Number(offer.monthly_difference_from_cheapest_chf) === 0
      ? "Cheapest baseline"
      : `+ CHF ${Number(offer.monthly_difference_from_cheapest_chf).toFixed(2)} / month`;
  }
  if (reference.relation === "cheaper") {
    return `Save CHF ${Number(reference.monthly_difference_chf).toFixed(2)} / month`;
  }
  if (reference.relation === "more_expensive") {
    return `CHF ${Number(reference.monthly_difference_chf).toFixed(2)} more / month`;
  }
  return "Same as current premium";
}

export function RankedPlans({ offers, source }: { offers: PremiumOffer[]; source: string }) {
  return (
    <section className="ranked-results" aria-labelledby="ranked-title">
      <div className="ranked-heading">
        <div>
          <p className="chart-kicker">Top matching offers</p>
          <h3 id="ranked-title">Plans in price order</h3>
        </div>
        <span>Monthly premium ascending</span>
      </div>
      <div className="plan-list">
        {offers.map((offer) => (
          <article className="plan-row" key={`${offer.insurer_id}-${offer.plan_id}-${offer.deductible_chf}`}>
            <span className="rank">{String(offer.rank).padStart(2, "0")}</span>
            <div className="plan-name">
              <div>
                {offer.insurer_name}
                {offer.rank === 1 && <span className="lowest-badge">Lowest premium</span>}
              </div>
              <p>{offer.product_name} · {offer.insurance_model} · CHF {offer.deductible_chf.toLocaleString("de-CH")}</p>
            </div>
            <div className="plan-difference">
              {comparisonLabel(offer)}
            </div>
            <div className="plan-price">
              <strong>{formatCurrency(Number(offer.monthly_premium_chf))}</strong>
              <span>{formatCurrency(Number(offer.annual_premium_chf))} / year</span>
            </div>
            <span className="source-chip" title={source}>BAG {offer.canton}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

