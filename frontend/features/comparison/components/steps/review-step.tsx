import type { ComparisonFlow } from "../../use-comparison-flow";

export function ReviewStep({ flow }: { flow: ComparisonFlow }) {
  return (
    <section className="review-card" aria-labelledby="review-title">
      <p className="card-eyebrow">Ready to review</p>
      <h3 id="review-title">Your comparison profile is complete.</h3>
      <p>
        The price engine is not connected yet. Trying the comparison will show the
        unavailable state and an explicitly illustrative output design.
      </p>
      <button className="primary-action" type="button" onClick={flow.comparePlans}>
        Compare plans <span aria-hidden="true">→</span>
      </button>
      {flow.searchNotice && (
        <div className="search-notice" role="status">
          <strong>Price comparison is not available yet.</strong>
          <span>
            The guide can still explain your choices. The preview below contains no actual
            premiums or offers.
          </span>
        </div>
      )}
    </section>
  );
}

