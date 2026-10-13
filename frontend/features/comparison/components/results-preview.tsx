import type { ComparisonFlow } from "../use-comparison-flow";
import { CategoryMatrix } from "./results/category-matrix";
import { BeforeSwitching } from "./results/before-switching";
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
          <p className="eyebrow">Your results</p>
          <h2 id="results-title">Your lowest premiums</h2>
        </div>
        <span>2027 monthly premiums before subsidies</span>
      </div>

      {flow.isSearching && <div className="result-state">Finding available premiums…</div>}
      {!flow.isSearching && flow.searchNotice && !flow.results?.offers.length && (
        <div className="result-state error" role="alert">{flow.searchNotice}</div>
      )}
      {flow.results && flow.results.offers.length > 0 && (
        <>
          <ResultSummary
            results={flow.results}
            location={flow.location}
            ageLabel={flow.ageLabel}
            accidentLabel={flow.accidentLabel}
          />
          <CategoryMatrix offers={flow.results.cheapest_by_deductible_and_model} />
          <RankedPlans offers={flow.results.offers} source={flow.results.source_name} />
          <BeforeSwitching />
          <details className="source-disclosure">
            <summary>About these premiums</summary>
            <div className="source-bar">
              <div><b>Premium data</b><span>{flow.results.source_name} · {flow.results.source_year}</span></div>
              <div><b>Price order</b><span>Lowest monthly premium first · before subsidies</span></div>
              <a href="https://www.priminfo.admin.ch/" target="_blank" rel="noreferrer">Check on Priminfo ↗</a>
              <p>
                Compare Insurance is an independent comparison tool and is not affiliated
                with FOPH/BAG. Priminfo is the official federal premium calculator.
              </p>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
