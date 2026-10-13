import { modelChoices } from "../../config";
import { formatCurrency, formatDeductible } from "../../formatters";
import type { CategoryMinimum } from "../../types";

export function ModelComparison({ offers }: { offers: CategoryMinimum[] }) {
  if (!offers.length) return null;
  const order = new Map(modelChoices.map((choice, index) => [choice.value, index]));
  const labels = new Map(modelChoices.map((choice) => [choice.value, choice.label]));
  const ordered = [...offers].sort(
    (left, right) => (order.get(left.insurance_model) ?? 99) - (order.get(right.insurance_model) ?? 99),
  );

  return (
    <div className="comparison-scroll">
      <table className="comparison-table model-table">
        <caption>Lowest matching premium in each care model</caption>
        <thead><tr><th>Care model</th><th>Monthly premium</th><th>Franchise</th><th>Insurer and plan</th></tr></thead>
        <tbody>{ordered.map((offer) => <tr key={offer.insurance_model}>
          <th>{labels.get(offer.insurance_model) || offer.insurance_model}</th>
          <td className="money"><strong>{formatCurrency(Number(offer.monthly_premium_chf))}</strong><small>/month</small></td>
          <td>{formatDeductible(offer.deductible_chf)}</td>
          <td><strong>{offer.insurer_name}</strong><small>{offer.product_name}</small></td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}
