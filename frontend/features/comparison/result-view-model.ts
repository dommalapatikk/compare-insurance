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

export type CurrentPremiumMessage = {
  tone: "positive" | "neutral";
  title: string;
  detail: string;
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

export function buildCurrentPremiumMessage(
  offer: PremiumOffer,
  currentPremium: string,
  currentInsurerName = "",
): CurrentPremiumMessage | null {
  const explanation = explainSavings(offer, currentPremium);
  if (!explanation) return null;

  const premium = Number(offer.monthly_premium_chf);
  const reference = Number(currentPremium);
  const lowest = `${formatCurrency(premium)}/month`;
  const insurerContext = currentInsurerName ? ` Your current insurer is ${currentInsurerName}.` : "";
  const largeGap = Math.abs(reference - premium) / Math.max(reference, premium) > 0.3;
  const checkInputs = "Please check that your premium, franchise, insurance model and accident cover match your policy — subsidies or a different setup can explain the gap.";

  if (explanation.relation === "more") {
    return {
      tone: "neutral",
      title: `You're paying less than every plan we found for this setup (lowest: ${formatCurrency(premium)}).`,
      detail: `${checkInputs}${insurerContext}`,
    };
  }
  if (explanation.relation === "same") {
    return {
      tone: "neutral",
      title: "You already have the lowest premium for this setup.",
      detail: `The matching premium is ${lowest}.${insurerContext}`,
    };
  }
  return {
    tone: "positive",
    title: `You could save ${explanation.monthlyDifference}/month (${explanation.annualDifference}/year).`,
    detail: largeGap
      ? `${checkInputs} The lowest matching premium is ${lowest}, compared with the ${explanation.baseline} you entered.${insurerContext}`
      : `The lowest matching premium is ${lowest}, compared with the ${explanation.baseline} you entered.${insurerContext}`,
  };
}
