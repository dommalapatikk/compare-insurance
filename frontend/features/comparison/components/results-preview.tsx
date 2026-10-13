import type { ComparisonFlow } from "../use-comparison-flow";
import { CategoryMatrix } from "./results/category-matrix";
import { BeforeSwitching } from "./results/before-switching";
import { DeductibleLadder } from "./deductible-ladder";
import { RankedPlans } from "./results/ranked-plans";
import { ResultSummary } from "./results/result-summary";
import { ModelComparison } from "./results/model-comparison";

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
          <DeductibleLadder offers={flow.results.cheapest_by_deductible} />
          <ModelComparison offers={flow.results.cheapest_by_model} />
          <RankedPlans offers={flow.results.offers} source={flow.results.source_name} />
          <details className="matrix-disclosure">
            <summary>View every model × franchise combination</summary>
            <CategoryMatrix offers={flow.results.cheapest_by_deductible_and_model} />
          </details>
          <section className="result-refinement" aria-labelledby="result-refinement-title">
            <div>
              <p className="eyebrow">Keep exploring</p>
              <h3 id="result-refinement-title">What would you like to understand next?</h3>
              <p>Ask about the trade-offs, edit an answer, or compare these plans with what you pay now.</p>
            </div>
            <div className="result-refinement-actions">
              <button onClick={() => flow.goToStage("models")} type="button">Change care models</button>
              <button onClick={() => flow.goToStage("deductibles")} type="button">Change franchises</button>
              <button onClick={() => void flow.sendMessage("Explain the trade-offs in my comparison results.")} type="button">Explain these results</button>
            </div>
            <form onSubmit={(event) => { event.preventDefault(); void flow.comparePlans(); }}>
              <label htmlFor="current-premium">What do you pay now each month? <small>Optional</small></label>
              <div><span>CHF</span><input id="current-premium" inputMode="decimal" min="0" step="0.05" type="number" value={flow.currentPremium} onChange={(event) => flow.setCurrentPremium(event.target.value)} placeholder="e.g. 400.00" /><button type="submit">Compare savings</button></div>
            </form>
          </section>
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
