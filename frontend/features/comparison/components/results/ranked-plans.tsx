import { previewPlans } from "../../config";
import { formatCurrency } from "../../formatters";
import { PreviewLabel } from "../primitives";

export function RankedPlans() {
  return (
    <section className="ranked-results" aria-labelledby="ranked-title">
      <PreviewLabel />
      <div className="ranked-heading">
        <div>
          <p className="chart-kicker">Example shortlist</p>
          <h3 id="ranked-title">Plans in price order</h3>
        </div>
        <span>Monthly premium ascending</span>
      </div>
      <div className="plan-list">
        {previewPlans.map((plan, index) => (
          <article className="plan-row" key={plan.name}>
            <span className="rank">0{index + 1}</span>
            <div className="plan-name">
              <div>
                {plan.name}
                {index === 0 && <span className="lowest-badge">Example lowest premium</span>}
              </div>
              <p>Example product · {plan.model} · CHF 2,500 deductible</p>
            </div>
            <div className="plan-difference">
              {plan.difference === 0
                ? "Example baseline"
                : `Example + CHF ${plan.difference.toFixed(2)} / month`}
            </div>
            <div className="plan-price">
              <strong>{formatCurrency(plan.monthly)}</strong>
              <span>{formatCurrency(plan.monthly * 12)} / year</span>
            </div>
            <button type="button" disabled>View details</button>
          </article>
        ))}
      </div>
    </section>
  );
}

