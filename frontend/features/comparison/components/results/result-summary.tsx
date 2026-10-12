import { formatCurrency } from "../../formatters";
import { PreviewLabel } from "../primitives";

export function ResultSummary({
  location,
  accidentLabel,
}: {
  location: string;
  accidentLabel: string;
}) {
  return (
    <div className="result-summary-card">
      <PreviewLabel />
      <div className="result-summary-grid">
        <div>
          <span>Example lowest premium</span>
          <strong>{formatCurrency(318)}<small>/month</small></strong>
          <p>{formatCurrency(3816)} per year</p>
        </div>
        <div>
          <span>Example plans shown</span>
          <strong>3<small> of 10</small></strong>
          <p>Ranked by monthly premium</p>
        </div>
        <div>
          <span>Example query</span>
          <strong className="result-query">{location || "Your municipality"}</strong>
          <p>2027 · {accidentLabel.toLowerCase()} accident</p>
        </div>
      </div>
    </div>
  );
}

