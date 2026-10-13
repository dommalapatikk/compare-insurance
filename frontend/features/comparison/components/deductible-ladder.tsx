import { modelLabels } from "../config";
import { formatCurrency, formatDeductible } from "../formatters";
import type { CategoryMinimum } from "../types";

export function DeductibleLadder({ offers }: { offers: CategoryMinimum[] }) {
  if (!offers.length) return null;
  const ordered = [...offers].sort((a, b) => a.deductible_chf - b.deductible_chf);
  const lowest = Math.min(...ordered.map((offer) => Number(offer.monthly_premium_chf)));
  const highest = Math.max(...ordered.map((offer) => Number(offer.monthly_premium_chf)));
  const largestDifference = Math.max(highest - lowest, 1);

  return (
    <section className="deductible-ladder" aria-labelledby="deductible-ladder-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Compare franchises</p>
          <h3 id="deductible-ladder-title">Lowest premium at each franchise</h3>
        </div>
        <p>Exact monthly premiums from the selected models.</p>
      </div>
      <div className="ladder-rows">
        {ordered.map((offer) => {
          const price = Number(offer.monthly_premium_chf);
          const difference = price - lowest;
          const width = difference === 0 ? 2 : (difference / largestDifference) * 100;
          return (
            <article key={offer.deductible_chf}>
              <div className="ladder-label">
                <strong>{formatDeductible(offer.deductible_chf)}</strong>
                <span>{offer.insurer_name} · {modelLabels[offer.insurance_model] || offer.insurance_model}</span>
              </div>
              <div className="ladder-track" aria-hidden="true">
                <span className={difference === 0 ? "lowest" : "difference-bar"} style={{ width: `${width}%` }} />
              </div>
              <div className="ladder-price">
                <strong>{formatCurrency(price)}</strong>
                <span>{difference === 0 ? "Lowest" : `+ ${formatCurrency(difference)}`}</span>
              </div>
            </article>
          );
        })}
      </div>
      <p className="matrix-note">
        Bars show the monthly amount above the lowest premium. A higher franchise can mean paying more yourself when you need care.
      </p>
    </section>
  );
}
