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
    <section className="model-comparison" aria-labelledby="model-comparison-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Compare care models</p>
          <h3 id="model-comparison-title">Lowest premium in each model</h3>
        </div>
        <p>One lowest-priced option for every selected care model.</p>
      </div>
      <div className="model-rows">
        {ordered.map((offer) => (
          <article key={offer.insurance_model}>
            <div><strong>{labels.get(offer.insurance_model) || offer.insurance_model}</strong><span>{offer.insurer_name} · {offer.product_name}</span></div>
            <span>{formatDeductible(offer.deductible_chf)} franchise</span>
            <strong>{formatCurrency(Number(offer.monthly_premium_chf))}<small>/month</small></strong>
          </article>
        ))}
      </div>
    </section>
  );
}
