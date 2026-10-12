import { previewPlans } from "../../config";
import { formatCurrency } from "../../formatters";
import { PreviewLabel } from "../primitives";

export function PriceDifferenceChart() {
  return (
    <section className="chart-card" aria-labelledby="difference-title">
      <PreviewLabel />
      <div className="chart-heading">
        <div>
          <p className="chart-kicker">Example price gap</p>
          <h3 id="difference-title">Difference from cheapest</h3>
        </div>
        <span>CHF / month</span>
      </div>
      <div className="delta-chart" aria-hidden="true">
        {previewPlans.map((plan) => (
          <div className="delta-row" key={plan.name}>
            <strong>{plan.name.replace("Example plan ", "Plan ")}</strong>
            <div className="delta-track">
              <span
                className={plan.difference === 0 ? "zero" : ""}
                style={{
                  width: plan.difference === 0 ? "4px" : `${(plan.difference / 29) * 100}%`,
                }}
              />
            </div>
            <b>{plan.difference === 0 ? "CHF 0" : `+ CHF ${plan.difference}`}</b>
          </div>
        ))}
      </div>
      <details className="table-view">
        <summary>View as table</summary>
        <table>
          <caption>Example difference from the cheapest plan</caption>
          <thead><tr><th>Plan</th><th>Monthly premium</th><th>Difference</th></tr></thead>
          <tbody>
            {previewPlans.map((plan) => (
              <tr key={plan.name}>
                <th>{plan.name}</th>
                <td>{formatCurrency(plan.monthly)}</td>
                <td>+ {formatCurrency(plan.difference)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

