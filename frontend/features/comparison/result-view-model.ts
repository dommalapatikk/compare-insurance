import { decideCurrentCover } from "./domain/current-cover-decision";
import { formatCurrency, formatWholeCurrency } from "./formatters";
import { officialInsurerShortName } from "./insurer-links";
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
  kind: "needs_premium" | "premium_mismatch" | "already_best" | "savings";
  tone: "positive" | "neutral" | "warning";
  heading: string;
  detail: string;
  action?: {
    label: string;
    offerInsurerId?: string;
  };
};

export type CurrentPremiumContext = {
  currentPremium: string;
  currentInsurerId: string;
  currentInsurerName: string;
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
): CurrentPremiumMessage {
  const decision = decideCurrentCover(offers, context.currentPremium, context.currentInsurerId);
  if (decision.kind === "needs_premium") {
    return {
      kind: "needs_premium",
      tone: "neutral",
      heading: "Add your current premium to see how much you could save",
      detail: "Use the monthly amount on your 2027 renewal notice.",
    };
  }

  if (decision.kind === "no_offers") {
    return {
      kind: "already_best",
      tone: "neutral",
      heading: "No matching offers found",
      detail: "Change your comparison details and try again.",
      action: { label: "Edit details" },
    };
  }

  if (decision.kind === "premium_mismatch") {
    const insurer = officialInsurerShortName(
      context.currentInsurerId,
      context.currentInsurerName || decision.publishedOffer.insurer_name,
    );
    return {
      kind: "premium_mismatch",
      tone: "warning",
      heading: "Please check your premium",
      detail: `${insurer} costs ${formatCurrency(decision.publishedPremium)}/month for this setup, but you entered ${formatCurrency(decision.enteredPremium)}.`,
      action: { label: "Edit details" },
    };
  }

  if (decision.kind === "already_best") {
    return {
      kind: "already_best",
      tone: "neutral",
      heading: "You already have a great price",
      detail: `No plan with your setup is cheaper than your ${formatCurrency(decision.currentPremium)}/month.`,
    };
  }

  const alternativeName = officialInsurerShortName(decision.cheapestOffer.insurer_id, decision.cheapestOffer.insurer_name);
  const currentName = context.currentInsurerId
    ? officialInsurerShortName(context.currentInsurerId, context.currentInsurerName)
    : "you";

  return {
    kind: "savings",
    tone: "positive",
    heading: `You could save ${formatWholeCurrency(decision.monthlySavings)}/month`,
    detail: `That’s ${formatCurrency(decision.monthlySavings * 12)} a year. ${alternativeName} costs ${formatCurrency(decision.cheapestPremium)}, and ${currentName === "you" ? "you pay" : `you pay ${currentName}`} ${formatCurrency(decision.currentPremium)}.`,
    action: { label: `See ${alternativeName}`, offerInsurerId: decision.cheapestOffer.insurer_id },
  };
}

export function shouldShowCurrentPlanDifferenceColumn(
  offers: PremiumOffer[],
  currentPremium: string,
) {
  const premium = Number(currentPremium);
  return Number.isFinite(premium)
    && premium > 0
    && offers.some((offer) => Number(offer.monthly_premium_chf) < premium);
}

export function nearbyOfferSentence(offerCount: number, insurerCount: number) {
  const offerVerb = offerCount === 1 ? "is" : "are";
  return `${offerCount} offer${offerCount === 1 ? "" : "s"} from ${insurerCount} insurer${insurerCount === 1 ? "" : "s"} ${offerVerb} within CHF 5/month of the lowest in this franchise.`;
}
