import { formatCurrency, formatDeductible } from "./formatters";
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
  heading: string;
  points: Array<{
    title: string;
    detail: string;
  }>;
};

export type CurrentPremiumContext = {
  currentPremium: string;
  currentInsurerId: string;
  currentInsurerName: string;
  insuranceModel: string;
  deductible: number;
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

export function compareOfferWithCurrentPremium(
  offer: PremiumOffer,
  currentPremium: string,
) {
  const explanation = explainSavings(offer, currentPremium);
  if (!explanation) return null;

  const label = explanation.relation === "less"
    ? `Save ${explanation.monthlyDifference}/month`
    : explanation.relation === "more"
      ? `${explanation.monthlyDifference} more/month`
      : "Same price";

  return {
    annualDifference: explanation.annualDifference,
    label,
    monthlyDifference: explanation.monthlyDifference,
    relation: explanation.relation,
    tone: explanation.relation === "less" ? "positive" as const : "neutral" as const,
  };
}

export function buildCurrentPremiumMessage(
  offers: PremiumOffer[],
  context: CurrentPremiumContext,
): CurrentPremiumMessage | null {
  const renewalPremium = Number(context.currentPremium);
  if (!offers.length || !Number.isFinite(renewalPremium) || renewalPremium <= 0) return null;

  const otherInsurer = context.currentInsurerId
    ? offers.find((offer) => offer.insurer_id !== context.currentInsurerId)
    : offers[0];
  const alternative = otherInsurer ?? offers[0];
  const comparison = compareOfferWithCurrentPremium(alternative, context.currentPremium);
  if (!comparison) return null;

  const currentPlanTitle = context.currentInsurerName
    ? `Your current plan: ${context.currentInsurerName}`
    : "Your current plan";
  const alternativeTitle = context.currentInsurerId && otherInsurer
    ? "Cheapest alternative from another insurer"
    : "Cheapest matching offer";
  const comparisonSentence = comparison.relation === "less"
    ? `That is ${comparison.monthlyDifference}/month (${comparison.annualDifference}/year) less than your current plan.`
    : comparison.relation === "more"
      ? `That is ${comparison.monthlyDifference}/month (${comparison.annualDifference}/year) more than your current plan.`
      : "That is the same monthly price as your current plan.";

  return {
    tone: comparison.tone,
    heading: "Your current plan compared with the cheapest alternative",
    points: [
      {
        title: currentPlanTitle,
        detail: `You entered ${formatCurrency(renewalPremium)}/month (${formatCurrency(renewalPremium * 12)}/year) from your 2027 renewal notice. We use it only as a comparison starting point — not as a recommendation to stay.`,
      },
      {
        title: alternativeTitle,
        detail: `${alternative.product_name} from ${alternative.insurer_name} is ${formatCurrency(Number(alternative.monthly_premium_chf))}/month. ${comparisonSentence} It matches your ${context.insuranceModel} model and ${formatDeductible(context.deductible)} franchise.`,
      },
    ],
  };
}
