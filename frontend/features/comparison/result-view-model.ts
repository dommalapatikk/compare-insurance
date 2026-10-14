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
  const premium = Number(offer.monthly_premium_chf);
  if (
    !currentPremium
    || !Number.isFinite(baseline)
    || baseline <= 0
    || !Number.isFinite(premium)
  ) {
    return null;
  }

  const difference = Math.abs(baseline - premium);
  const relation = baseline === premium ? "same" : baseline > premium ? "less" : "more";

  return {
    baseline: `${formatCurrency(baseline)}/month`,
    monthlyDifference: formatCurrency(difference),
    annualDifference: formatCurrency(difference * 12),
    relation,
  };
}
