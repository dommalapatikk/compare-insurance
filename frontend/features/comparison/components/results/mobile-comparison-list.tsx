import { formatCurrency, formatDeductible } from "../../formatters";

export type MobileComparisonItem = {
  key: string;
  rank?: number;
  eyebrow: string;
  premium: number;
  insurer: string;
  legalInsurer?: string;
  plan: string;
  model: string;
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
};

export function MobileComparisonList({
  items,
  label,
}: {
  items: MobileComparisonItem[];
  label: string;
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
          {item.legalInsurer && <span className="mobile-result-legal-insurer">{item.legalInsurer}</span>}
          <span className="mobile-result-plan">{item.plan}</span>
          <div className="mobile-result-meta">
            <span>{formatDeductible(item.franchise)}</span>
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
          >Visit insurer ↗</a>}
        </li>
      ))}
    </ol>
  );
}
