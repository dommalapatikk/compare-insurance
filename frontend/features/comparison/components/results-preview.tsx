import type { ComparisonFlow } from "../use-comparison-flow";
import { BeforeSwitching } from "./results/before-switching";
import { ResultSummary } from "./results/result-summary";
import { ResultsExplorer } from "./results/results-explorer";
import { SavingsDisclosure } from "./results/savings-disclosure";

export function ResultsPreview({ flow }: { flow: ComparisonFlow }) {
  if (!flow.results && !flow.searchNotice && !flow.isSearching) return null;

  return (
    <section className="results-preview" ref={flow.resultsRef} tabIndex={-1} aria-labelledby="results-title">
      <div className="results-heading">
        <h2 id="results-title">Your results</h2>
        <span>2027 monthly premiums before subsidies</span>
      </div>

      {flow.isSearching && <div className="result-state">Finding available premiums…</div>}
      {!flow.isSearching && flow.searchNotice && !flow.results?.offers.length && <div className="result-state error" role="alert">{flow.searchNotice}</div>}
      {flow.results && flow.results.offers.length > 0 && <>
        <ResultSummary results={flow.results} location={flow.location} ageLabel={flow.ageLabel} accidentLabel={flow.accidentLabel} />
        <SavingsDisclosure flow={flow} />
        <ResultsExplorer results={flow.results} />
        <BeforeSwitching />
      </>}
    </section>
  );
}
