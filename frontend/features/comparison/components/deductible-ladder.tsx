import { modelLabels } from "../config";
import { formatCurrency, formatDeductible } from "../formatters";
import type { CategoryMinimum } from "../types";
import { MobileComparisonList } from "./results/mobile-comparison-list";

export function DeductibleLadder({ offers }: { offers: CategoryMinimum[] }) {
  if (!offers.length) return null;
  const ordered = [...offers].sort((a, b) => a.deductible_chf - b.deductible_chf);
  const lowest = Math.min(...ordered.map((offer) => Number(offer.monthly_premium_chf)));
  const mobileItems = ordered.map((offer) => {
    const difference = Number(offer.monthly_premium_chf) - lowest;
    return {
      key: String(offer.deductible_chf),
      eyebrow: formatDeductible(offer.deductible_chf),
      premium: Number(offer.monthly_premium_chf),
      insurer: offer.insurer_name,
      plan: offer.product_name,
      model: modelLabels[offer.insurance_model] || offer.insurance_model,
      franchise: offer.deductible_chf,
      difference: difference ? `${formatCurrency(difference)} more` : undefined,
      best: difference === 0,
    };
  });

  return (
    <div className="comparison-scroll">
      <MobileComparisonList items={mobileItems} label="Lowest plan at each franchise" />
      <table className="comparison-table franchise-table">
        <caption>Lowest-priced matching plan for each franchise</caption>
        <thead><tr><th scope="col">Franchise</th><th scope="col">Monthly premium</th><th scope="col">Insurer and plan</th><th scope="col">Insurance model</th><th scope="col">Difference</th></tr></thead>
        <tbody>{ordered.map((offer) => {
          const difference = Number(offer.monthly_premium_chf) - lowest;
          return <tr className={difference === 0 ? "best-row" : ""} key={offer.deductible_chf}>
            <th scope="row">{formatDeductible(offer.deductible_chf)}</th>
            <td className="money"><strong>{formatCurrency(Number(offer.monthly_premium_chf))}</strong><small>/month</small></td>
            <td><strong>{offer.insurer_name}</strong><small>{offer.product_name}</small></td>
            <td>{modelLabels[offer.insurance_model] || offer.insurance_model}</td>
            <td>{difference === 0 ? <span className="lowest-label">Lowest</span> : `${formatCurrency(difference)} more`}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>
  );
}
