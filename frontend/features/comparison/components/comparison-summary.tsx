import { modelChoices } from "../config";
import type { ComparisonFlow } from "../use-comparison-flow";

export function ComparisonSummary({ flow }: { flow: ComparisonFlow }) {
  return (
    <aside className="summary-panel" aria-labelledby="summary-title">
      <div className="summary-sticky">
        <p className="step-label">YOUR COMPARISON</p>
        <h2 id="summary-title">At a glance</h2>
        <p className="summary-intro">
          Your confirmed answers stay visible while the guide explains each choice.
        </p>
        <dl className="summary-list">
          <SummaryItem number="01" label="Location" value={flow.location || "Not entered"} onEdit={() => flow.goTo(1)} />
          <SummaryItem number="02" label="Age category" value={flow.ageLabel} onEdit={() => flow.goTo(2)} />
          <SummaryItem number="03" label="Accident" value={flow.accidentLabel} onEdit={() => flow.goTo(3)} />
          <SummaryItem
            number="04"
            label="Deductibles"
            value={flow.deductibles.length ? `${flow.deductibles.length} selected` : "None selected"}
            onEdit={() => flow.goTo(4)}
          />
          <SummaryItem
            number="05"
            label="Models"
            value={flow.models.length === modelChoices.length ? "All models" : `${flow.models.length} selected`}
            onEdit={() => flow.goTo(5)}
          />
          <SummaryItem
            number="06"
            label="Current premium"
            value={flow.currentPremium ? `CHF ${flow.currentPremium} / month` : "Optional"}
            onEdit={() => flow.goTo(6)}
          />
        </dl>
        <div className="trust-card">
          <span className="trust-icon" aria-hidden="true">✓</span>
          <div>
            <strong>Pricing guardrail</strong>
            <p>The assistant can explain inputs, but it cannot invent, rank, or change premiums.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SummaryItem({
  number,
  label,
  value,
  onEdit,
}: {
  number: string;
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="summary-item">
      <dt><span>{number}</span><span>{label}</span></dt>
      <dd>{value}</dd>
      <button type="button" onClick={onEdit}>Edit <span className="sr-only">{label}</span></button>
    </div>
  );
}

