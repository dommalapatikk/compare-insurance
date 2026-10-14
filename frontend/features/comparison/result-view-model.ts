import { formatCurrency } from "./formatters";
import type { CategoryMinimum, PremiumOffer } from "./types";

export type ResultFilters = {
  deductible: "all" | number;
  model: "all" | string;
};

export function filterAndSortMinimums(
  offers: CategoryMinimum[],
  filters: ResultFilters,
) {
  return offers
    .filter((offer) => filters.deductible === "all" || offer.deductible_chf === filters.deductible)
    .filter((offer) => filters.model === "all" || offer.insurance_model === filters.model)
    .toSorted((left, right) => (
      Number(left.monthly_premium_chf) - Number(right.monthly_premium_chf)
      || left.insurer_name.localeCompare(right.insurer_name)
      || left.product_name.localeCompare(right.product_name)
      || left.deductible_chf - right.deductible_chf
      || left.insurance_model.localeCompare(right.insurance_model)
    ));
}

export function differenceFromLowest(
  offer: CategoryMinimum,
  lowest: CategoryMinimum | undefined,
) {
  if (!lowest) return 0;
  return Number(offer.monthly_premium_chf) - Number(lowest.monthly_premium_chf);
}

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
