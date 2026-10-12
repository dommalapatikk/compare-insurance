import type { CSSProperties } from "react";

import { formatCurrency, formatDeductible } from "../../formatters";
import type { PremiumOffer } from "../../types";

export function DeductibleChart({ offers }: { offers: PremiumOffer[] }) {
  const cheapestByDeductible = Array.from(
    offers.reduce((items, offer) => {
      const current = items.get(offer.deductible_chf);
      if (!current || Number(offer.monthly_premium_chf) < current) {
        items.set(offer.deductible_chf, Number(offer.monthly_premium_chf));
      }
      return items;
    }, new Map<number, number>()),
  ).map(([deductible, monthly]) => ({ deductible, monthly }))
    .sort((a, b) => a.deductible - b.deductible);
  const maximum = Math.max(...cheapestByDeductible.map(({ monthly }) => monthly));
  const minimum = Math.min(...cheapestByDeductible.map(({ monthly }) => monthly));
  const range = Math.max(maximum - minimum, 1);
  return (
    <section className="chart-card" aria-labelledby="deductible-title">
      <div className="chart-heading">
        <div>
          <p className="chart-kicker">Premium trade-off</p>
          <h3 id="deductible-title">Premium by deductible</h3>
        </div>
        <span>CHF / month</span>
      </div>
      <div className="column-chart" aria-hidden="true">
        {cheapestByDeductible.map((item) => (
          <div className="column-item" key={item.deductible}>
            <span className="column-value">{item.monthly}</span>
            <span
              className="column"
              style={{
                "--column-height": `${25 + ((item.monthly - minimum) / range) * 75}%`,
              } as CSSProperties}
            />
            <b>{item.deductible}</b>
          </div>
        ))}
      </div>
      <p className="chart-caption">
        Premium only—healthcare use and out-of-pocket costs are not included.
      </p>
      <details className="table-view">
        <summary>View as table</summary>
        <table>
          <caption>Lowest returned monthly premium by deductible</caption>
          <thead>
            <tr><th>Deductible</th><th>Monthly premium</th><th>Annual gap vs highest shown</th></tr>
          </thead>
          <tbody>
            {cheapestByDeductible.map((item) => (
              <tr key={item.deductible}>
                <th>{formatDeductible(item.deductible)}</th>
                <td>{formatCurrency(item.monthly)}</td>
                <td>{formatCurrency((maximum - item.monthly) * 12)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

