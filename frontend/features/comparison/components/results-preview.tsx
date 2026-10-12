import type { ComparisonFlow } from "../use-comparison-flow";
import { DeductibleChart } from "./results/deductible-chart";
import { PriceDifferenceChart } from "./results/price-difference-chart";
import { RankedPlans } from "./results/ranked-plans";
import { ResultSummary } from "./results/result-summary";

export function ResultsPreview({ flow }: { flow: ComparisonFlow }) {
  if (!flow.showPreview) return null;

  return (
    <section
      className="results-preview"
      ref={flow.resultsRef}
      tabIndex={-1}
      aria-labelledby="preview-title"
    >
      <div className="results-heading">
        <div>
          <p className="eyebrow">Output design preview</p>
          <h2 id="preview-title">See how results will become decisions.</h2>
        </div>
        <span className="preview-lock">Preview only · switching disabled</span>
      </div>

      <ResultSummary location={flow.location} accidentLabel={flow.accidentLabel} />
      <div className="visual-grid">
        <PriceDifferenceChart />
        <DeductibleChart />
      </div>
      <RankedPlans />
    </section>
  );
}

