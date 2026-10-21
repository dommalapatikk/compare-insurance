import type { PremiumOffer, PremiumOfferPageResponse, PremiumSearchResponse, RankedOfferSet } from "./types";

function offerKey(offer: PremiumOffer) {
  return [offer.insurer_id, offer.plan_id ?? offer.product_name, offer.deductible_chf, offer.insurance_model].join(":");
}

function mergeRanking(ranking: RankedOfferSet, page: PremiumOfferPageResponse): RankedOfferSet {
  const unique = new Map(ranking.offers.map((offer) => [offerKey(offer), offer]));
  page.offers.forEach((offer) => unique.set(offerKey(offer), offer));
  return {
    ...ranking,
    total_eligible_offers: page.total_eligible_offers,
    offers: [...unique.values()].sort((left, right) => left.rank - right.rank),
  };
}

export function mergePremiumOfferPage(
  results: PremiumSearchResponse,
  franchise: number,
  model: string,
  page: PremiumOfferPageResponse,
): PremiumSearchResponse {
  return {
    ...results,
    ranked_by_deductible: results.ranked_by_deductible.map((group) => {
      if (group.deductible_chf !== franchise) return group;
      if (model === "all") {
        return { ...group, all_selected_models: mergeRanking(group.all_selected_models, page) };
      }
      return {
        ...group,
        models: group.models.map((entry) => entry.insurance_model === model
          ? { ...entry, ranking: mergeRanking(entry.ranking, page) }
          : entry),
      };
    }),
  };
}
