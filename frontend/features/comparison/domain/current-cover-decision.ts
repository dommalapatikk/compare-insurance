export type ComparableOffer = {
  insurer_id: string;
  insurer_name: string;
  monthly_premium_chf: string;
};

export type CurrentCoverDecision<TOffer extends ComparableOffer> =
  | { kind: "needs_premium" }
  | { kind: "no_offers" }
  | {
      kind: "premium_mismatch";
      enteredPremium: number;
      publishedPremium: number;
      publishedOffer: TOffer;
    }
  | {
      kind: "already_best";
      currentPremium: number;
      cheapestPremium: number;
    }
  | {
      kind: "savings";
      currentPremium: number;
      cheapestPremium: number;
      monthlySavings: number;
      cheapestOffer: TOffer;
    };

const PREMIUM_MISMATCH_TOLERANCE = 0.05;

export function decideCurrentCover<TOffer extends ComparableOffer>(
  offers: readonly TOffer[],
  currentPremium: string,
  currentInsurerId: string,
): CurrentCoverDecision<TOffer> {
  const enteredPremium = Number(currentPremium);
  if (!Number.isFinite(enteredPremium) || enteredPremium <= 0) {
    return { kind: "needs_premium" };
  }

  const sortedOffers = offers.toSorted(
    (left, right) => Number(left.monthly_premium_chf) - Number(right.monthly_premium_chf),
  );
  const cheapestOffer = sortedOffers[0];
  if (!cheapestOffer) return { kind: "no_offers" };

  const publishedOffer = currentInsurerId
    ? sortedOffers.find((offer) => offer.insurer_id === currentInsurerId)
    : undefined;
  if (publishedOffer) {
    const publishedPremium = Number(publishedOffer.monthly_premium_chf);
    // The catalogue result is the insurer's cheapest matching plan. A material gap in
    // either direction means the entered policy likely has different comparison inputs.
    const differenceRatio = Math.abs(publishedPremium - enteredPremium) / publishedPremium;
    if (Number.isFinite(differenceRatio) && differenceRatio > PREMIUM_MISMATCH_TOLERANCE) {
      return { kind: "premium_mismatch", enteredPremium, publishedPremium, publishedOffer };
    }
  }

  const cheapestPremium = Number(cheapestOffer.monthly_premium_chf);
  if (enteredPremium <= cheapestPremium) {
    return { kind: "already_best", currentPremium: enteredPremium, cheapestPremium };
  }
  return {
    kind: "savings",
    currentPremium: enteredPremium,
    cheapestPremium,
    monthlySavings: enteredPremium - cheapestPremium,
    cheapestOffer,
  };
}
