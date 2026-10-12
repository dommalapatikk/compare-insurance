import { formatCurrency } from "../../formatters";
import type { PremiumOffer } from "../../types";

export function PriceDifferenceChart({ offers }: { offers: PremiumOffer[] }) {
  const chartOffers = offers.slice(0, 5);
  const maximum = Math.max(
    ...chartOffers.map((offer) => Number(offer.monthly_difference_from_cheapest_chf)),
    1,
  );
  return (
    <section className="chart-card" aria-labelledby="difference-title">
      <div className="chart-heading">
        <div>
          <p className="chart-kicker">Price gap</p>
          <h3 id="difference-title">Difference from cheapest</h3>
        </div>
        <span>CHF / month</span>
      </div>
      <div className="delta-chart" aria-hidden="true">
        {chartOffers.map((offer) => {
          const difference = Number(offer.monthly_difference_from_cheapest_chf);
          return <div className="delta-row" key={`${offer.insurer_id}-${offer.plan_id}`}>
            <strong>#{offer.rank}</strong>
            <div className="delta-track">
              <span
                className={difference === 0 ? "zero" : ""}
                style={{
                  width: difference === 0 ? "4px" : `${(difference / maximum) * 100}%`,
                }}
              />
            </div>
            <b>{difference === 0 ? "CHF 0" : `+ CHF ${difference.toFixed(2)}`}</b>
          </div>
        })}
      </div>
      <details className="table-view">
        <summary>View as table</summary>
        <table>
          <caption>Difference from the cheapest matching plan</caption>
          <thead><tr><th>Plan</th><th>Monthly premium</th><th>Difference</th></tr></thead>
          <tbody>
            {chartOffers.map((offer) => (
              <tr key={`${offer.insurer_id}-${offer.plan_id}`}>
                <th>{offer.insurer_name}</th>
                <td>{formatCurrency(Number(offer.monthly_premium_chf))}</td>
                <td>+ {formatCurrency(Number(offer.monthly_difference_from_cheapest_chf))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

