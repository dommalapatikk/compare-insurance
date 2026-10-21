import { describe, expect, it } from "vitest";

import { mergePremiumOfferPage } from "./premium-page-merge";
import type { PremiumOffer, PremiumSearchResponse } from "./types";

function offer(rank: number, model = "praxis"): PremiumOffer {
  return {
    rank,
    insurer_id: `insurer-${rank}`,
    insurer_name: `Insurer ${rank}`,
    plan_id: `plan-${rank}`,
    product_name: `Plan ${rank}`,
    canton: "BE",
    region: "1",
    deductible_chf: 300,
    accident_coverage: false,
    insurance_model: model,
    monthly_premium_chf: String(400 + rank),
    annual_premium_chf: String((400 + rank) * 12),
    monthly_difference_from_cheapest_chf: String(rank - 1),
    annual_difference_from_cheapest_chf: String((rank - 1) * 12),
    reference_comparison: null,
  };
}

function results(): PremiumSearchResponse {
  const first = offer(1);
  return {
    query: {
      canton: "BE", region: "1", age_category: "adult", birth_year: 1980,
      deductibles: [300], accident_coverage: false, insurance_models: ["praxis"],
      year: 2027, top_n: 10, reference_monthly_premium_chf: null,
    },
    source_year: 2027,
    source_name: "BAG",
    total_eligible_offers: 3,
    offers: [first],
    cheapest_by_deductible: [], cheapest_by_model: [], cheapest_by_deductible_and_model: [],
    ranked_by_deductible: [{
      deductible_chf: 300,
      all_selected_models: { total_eligible_offers: 3, within_five_offer_count: 3, within_five_insurer_count: 3, offers: [first] },
      models: [{ insurance_model: "praxis", ranking: { total_eligible_offers: 3, within_five_offer_count: 3, within_five_insurer_count: 3, offers: [first] } }],
    }],
  };
}

describe("mergePremiumOfferPage", () => {
  it("appends only to the requested franchise and model without replacing results", () => {
    const original = results();
    const merged = mergePremiumOfferPage(original, 300, "praxis", {
      total_eligible_offers: 3, offset: 1, limit: 10, has_more: false, offers: [offer(2), offer(3)],
    });

    expect(merged).not.toBe(original);
    expect(merged.ranked_by_deductible[0].models[0].ranking.offers.map(({ rank }) => rank)).toEqual([1, 2, 3]);
    expect(merged.ranked_by_deductible[0].all_selected_models.offers).toHaveLength(1);
    expect(merged.offers).toEqual(original.offers);
  });

  it("deduplicates a repeated page and updates the all-model group", () => {
    const merged = mergePremiumOfferPage(results(), 300, "all", {
      total_eligible_offers: 2, offset: 1, limit: 10, has_more: false, offers: [offer(1), offer(2)],
    });

    expect(merged.ranked_by_deductible[0].all_selected_models.offers.map(({ rank }) => rank)).toEqual([1, 2]);
  });
});
