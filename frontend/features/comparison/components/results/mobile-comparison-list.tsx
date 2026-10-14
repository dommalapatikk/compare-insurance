import { formatCurrency, formatDeductible } from "../../formatters";

export type MobileComparisonItem = {
  key: string;
  eyebrow: string;
  premium: number;
  insurer: string;
  plan: string;
  model: string;
  franchise: number;
  difference?: string;
  best?: boolean;
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
        <li className={item.best ? "best" : ""} key={item.key}>
          <div className="mobile-result-heading">
            <span>{item.eyebrow}</span>
            {item.best && <em>Lowest</em>}
          </div>
          <div className="mobile-result-price">
            <strong>{formatCurrency(item.premium)}</strong><small>/month</small>
          </div>
          <strong className="mobile-result-insurer">{item.insurer}</strong>
          <span className="mobile-result-plan">{item.plan}</span>
          <div className="mobile-result-meta">
            <span>{item.model}</span>
            <span>{formatDeductible(item.franchise)}</span>
            {item.difference && <span>{item.difference}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}
