import { formatCurrency } from "./formatters";
import type { PremiumOffer } from "./types";

export type SavingsExplanation = {
  baseline: string;
  monthlyDifference: string;
  annualDifference: string;
  relation: "less" | "more" | "same";
};

export function explainSavings(
  offer: PremiumOffer,
  currentPremium: string,
): SavingsExplanation | null {
  const baseline = Number(currentPremium);
  const comparison = offer.reference_comparison;
  if (!currentPremium || !Number.isFinite(baseline) || baseline <= 0 || !comparison) {
    return null;
  }

  return {
    baseline: `${formatCurrency(baseline)}/month`,
    monthlyDifference: formatCurrency(Number(comparison.monthly_difference_chf)),
    annualDifference: formatCurrency(Number(comparison.annual_difference_chf)),
    relation: comparison.relation === "cheaper"
      ? "less"
      : comparison.relation === "more_expensive" ? "more" : "same",
  };
}
