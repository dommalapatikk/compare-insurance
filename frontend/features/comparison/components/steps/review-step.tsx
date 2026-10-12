import type { ComparisonFlow } from "../../use-comparison-flow";

export function ReviewStep({ flow }: { flow: ComparisonFlow }) {
  return (
    <section className="review-card" aria-labelledby="review-title">
      <p className="card-eyebrow">Ready to review</p>
      <h3 id="review-title">Your comparison profile is complete.</h3>
      <p>
        The deterministic engine will filter the official BAG catalogue and rank
        matching premiums from lowest to highest.
      </p>
      <button
        className="primary-action"
        type="button"
        disabled={flow.isSearching}
        onClick={() => void flow.comparePlans()}
      >
        {flow.isSearching ? "Comparing…" : "Compare plans"}
        <span aria-hidden="true">→</span>
      </button>
      {flow.searchNotice && (
        <div className="search-notice" role="status">
          <strong>Comparison status</strong>
          <span>{flow.searchNotice}</span>
        </div>
      )}
    </section>
  );
}

