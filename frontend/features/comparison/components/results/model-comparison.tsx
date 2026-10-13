"use client";

import { useMemo, useState } from "react";

import { modelChoices } from "../../config";
import { formatCurrency, formatDeductible } from "../../formatters";
import type { CategoryMinimum } from "../../types";

export function ModelComparison({ offers, defaultDeductible }: { offers: CategoryMinimum[]; defaultDeductible?: number }) {
  const deductibles = useMemo(
    () => [...new Set(offers.map((offer) => offer.deductible_chf))].sort((a, b) => a - b),
    [offers],
  );
  const [deductible, setDeductible] = useState(
    deductibles.includes(defaultDeductible || -1) ? defaultDeductible! : deductibles[deductibles.length - 1] || 0,
  );
  if (!offers.length) return null;
  const order = new Map(modelChoices.map((choice, index) => [choice.value, index]));
  const labels = new Map(modelChoices.map((choice) => [choice.value, choice.label]));
  const ordered = offers.filter((offer) => offer.deductible_chf === deductible).sort(
    (left, right) => (order.get(left.insurance_model) ?? 99) - (order.get(right.insurance_model) ?? 99),
  );

  return (
    <div className="comparison-scroll model-comparison">
      <label className="model-franchise-picker">Compare models at franchise
        <select value={deductible} onChange={(event) => setDeductible(Number(event.target.value))}>
          {deductibles.map((value) => <option key={value} value={value}>{formatDeductible(value)}</option>)}
        </select>
      </label>
      <p className="comparison-context">Models are compared at the same franchise.</p>
      <table className="comparison-table model-table">
        <caption>Lowest-priced matching plan for each selected insurance model</caption>
        <thead><tr><th scope="col">Insurance model</th><th scope="col">Monthly premium</th><th scope="col">Franchise</th><th scope="col">Insurer and plan</th></tr></thead>
        <tbody>{ordered.map((offer) => <tr key={offer.insurance_model}>
          <th scope="row">{labels.get(offer.insurance_model) || offer.insurance_model}</th>
          <td className="money"><strong>{formatCurrency(Number(offer.monthly_premium_chf))}</strong><small>/month</small></td>
          <td>{formatDeductible(offer.deductible_chf)}</td>
          <td><strong>{offer.insurer_name}</strong><small>{offer.product_name}</small></td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}
