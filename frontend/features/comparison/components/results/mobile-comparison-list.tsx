import { formatCurrency, formatDeductible } from "../../formatters";

export type MobileComparisonItem = {
  key: string;
  rank?: number;
  eyebrow: string;
  premium: number;
  insurer: string;
  plan: string;
  model: string;
  modelSubtype?: string;
  franchise: number;
  difference?: string;
  insurerUrl?: string | null;
  status?: string;
  best?: boolean;
  currentInsurer?: boolean;
  currentComparison?: {
    label: string;
    tone: "positive" | "neutral";
  };
  highlighted?: boolean;
  insurerId?: string;
  groupNote?: string;
};

export function MobileComparisonList({
  items,
  label,
  showFranchise = true,
}: {
  items: MobileComparisonItem[];
  label: string;
  showFranchise?: boolean;
}) {
  return (
    <ol className="mobile-comparison-list" aria-label={label}>
      {items.map((item) => (
        <li className={[item.best ? "best" : "", item.highlighted ? "highlighted-offer" : ""].filter(Boolean).join(" ")} data-offer-insurer={item.insurerId} tabIndex={-1} key={item.key}>
          <div className="mobile-result-heading">
            <span>{item.rank ? `#${item.rank} · ` : ""}{item.eyebrow}</span>
            {item.status && <em>{item.status}</em>}
          </div>
          <div className="mobile-result-price">
            <strong>{formatCurrency(item.premium)}</strong><small>/month</small>
          </div>
          <strong className="mobile-result-insurer">{item.insurer}{item.currentInsurer && <em className="current-insurer-badge">Your insurer</em>}</strong>
          {item.plan && <span className="mobile-result-plan">{item.plan}</span>}
          {item.modelSubtype && <span className="model-subtype-tag">{item.modelSubtype}</span>}
          {item.groupNote && <span className="duplicate-plan-note">ⓘ {item.groupNote}</span>}
          <div className="mobile-result-meta">
            {showFranchise && <span>{formatDeductible(item.franchise)}</span>}
            {item.difference && <span>{item.difference}</span>}
          </div>
          {item.currentComparison && <span className={`mobile-current-plan-difference ${item.currentComparison.tone}`}>
            Vs your current plan: {item.currentComparison.label}
          </span>}
          {item.insurerUrl && <a
            className="mobile-insurer-link"
            href={item.insurerUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${item.insurer} website`}
          >Visit insurer ↗</a>}
        </li>
      ))}
    </ol>
  );
}
