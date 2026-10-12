import type { ComparisonFlow } from "../use-comparison-flow";
import { DeductibleChart } from "./results/deductible-chart";
import { PriceDifferenceChart } from "./results/price-difference-chart";
import { RankedPlans } from "./results/ranked-plans";
import { ResultSummary } from "./results/result-summary";

export function ResultsPreview({ flow }: { flow: ComparisonFlow }) {
  if (!flow.results && !flow.searchNotice && !flow.isSearching) return null;

  return (
    <section
      className="results-preview"
      ref={flow.resultsRef}
      tabIndex={-1}
      aria-labelledby="results-title"
    >
      <div className="results-heading">
        <div>
          <p className="eyebrow">Official premium comparison</p>
          <h2 id="results-title">Your lowest matching premiums.</h2>
        </div>
        <span className="preview-lock">BAG 2027 · gross monthly premiums</span>
      </div>

      {flow.isSearching && <div className="result-state">Querying the premium catalogue…</div>}
      {!flow.isSearching && flow.searchNotice && !flow.results?.offers.length && (
        <div className="result-state error" role="alert">{flow.searchNotice}</div>
      )}
      {flow.results && flow.results.offers.length > 0 && (
        <>
          <ResultSummary
            results={flow.results}
            location={flow.location}
            accidentLabel={flow.accidentLabel}
          />
          <div className="visual-grid">
            <PriceDifferenceChart offers={flow.results.offers} />
            <DeductibleChart offers={flow.results.offers} />
          </div>
          <RankedPlans offers={flow.results.offers} source={flow.results.source_name} />
        </>
      )}
    </section>
  );
}

