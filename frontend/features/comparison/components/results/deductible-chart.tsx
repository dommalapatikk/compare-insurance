import type { CSSProperties } from "react";

import { previewDeductibles } from "../../config";
import { formatCurrency, formatDeductible } from "../../formatters";
import { PreviewLabel } from "../primitives";

export function DeductibleChart() {
  return (
    <section className="chart-card" aria-labelledby="deductible-title">
      <PreviewLabel />
      <div className="chart-heading">
        <div>
          <p className="chart-kicker">Example trade-off</p>
          <h3 id="deductible-title">Premium by deductible</h3>
        </div>
        <span>CHF / month</span>
      </div>
      <div className="column-chart" aria-hidden="true">
        {previewDeductibles.map((item) => (
          <div className="column-item" key={item.deductible}>
            <span className="column-value">{item.monthly}</span>
            <span
              className="column"
              style={{
                "--column-height": `${((item.monthly - 290) / 82) * 100}%`,
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
          <caption>Example monthly premiums by deductible</caption>
          <thead>
            <tr><th>Deductible</th><th>Monthly premium</th><th>Annual difference vs CHF 300</th></tr>
          </thead>
          <tbody>
            {previewDeductibles.map((item) => (
              <tr key={item.deductible}>
                <th>{formatDeductible(item.deductible)}</th>
                <td>{formatCurrency(item.monthly)}</td>
                <td>− {formatCurrency((372 - item.monthly) * 12)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

