import type { ComparisonFlow } from "../use-comparison-flow";
import { BeforeSwitching } from "./results/before-switching";
import { ResultsExplorer } from "./results/results-explorer";

export function ResultsPreview({ flow }: { flow: ComparisonFlow }) {
  if (!flow.results && !flow.searchNotice && !flow.isSearching) return null;

  return (
    <section className="results-preview" ref={flow.resultsRef} tabIndex={-1} aria-labelledby="results-title">
      <div className="results-heading">
        <div>
          <h2 id="results-title">Your results</h2>
          <p className="results-context">{flow.location} · {flow.ageLabel} · Accident {flow.accidentLabel.toLowerCase()}</p>
          <p className="results-trust-line">Official prices. Every insurer. No ads, no sales calls.</p>
        </div>
        <button type="button" onClick={() => flow.goToStage("location")}>Edit comparison</button>
      </div>

      {flow.isSearching && <div className="result-state">Finding available premiums…</div>}
      {!flow.isSearching && flow.searchNotice && !flow.results?.offers.length && <div className="result-state error" role="alert">{flow.searchNotice}</div>}
      {flow.results && flow.results.offers.length > 0 && <>
        <ResultsExplorer
          results={flow.results}
          intent={flow.journeyIntent}
          currentPremium={flow.currentPremium}
          currentInsurerId={flow.currentInsurerId}
          currentInsurerName={flow.currentInsurerName}
          loadingPlansKey={flow.loadingPlansKey}
          onLoadMorePlans={flow.loadMorePlans}
          onEditComparison={() => flow.goToStage("models")}
          onSetCurrentInsurerId={flow.setCurrentInsurerId}
          onSetCurrentPremium={flow.setCurrentPremium}
        />
        <BeforeSwitching />
      </>}
    </section>
  );
}
