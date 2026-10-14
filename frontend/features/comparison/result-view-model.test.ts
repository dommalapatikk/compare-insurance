import { describe, expect, it } from "vitest";

import { explainSavings } from "./result-view-model";
import type { PremiumOffer } from "./types";

const offer = {
  monthly_premium_chf: "370.30",
  reference_comparison: {
    relation: "cheaper",
    monthly_difference_chf: "29.70",
    annual_difference_chf: "356.40",
  },
} as PremiumOffer;

describe("result view model", () => {
  it("states the user-entered premium behind a savings figure", () => {
    expect(explainSavings(offer, "400")).toEqual({
      baseline: "CHF 400.00/month",
      monthlyDifference: "CHF 29.70",
      annualDifference: "CHF 356.40",
      relation: "less",
    });
  });

  it("calculates savings from the displayed premium without another search", () => {
    expect(explainSavings({ ...offer, reference_comparison: null } as PremiumOffer, "500")).toEqual({
      baseline: "CHF\u00a0500.00/month",
      monthlyDifference: "CHF\u00a0129.70",
      annualDifference: "CHF\u00a01'556.40",
      relation: "less",
    });
  });

  it("describes a current premium below the displayed plan without negative amounts", () => {
    expect(explainSavings({ ...offer, reference_comparison: null } as PremiumOffer, "350")).toEqual({
      baseline: "CHF\u00a0350.00/month",
      monthlyDifference: "CHF\u00a020.30",
      annualDifference: "CHF\u00a0243.60",
      relation: "more",
    });
  });

  it("does not show savings without an explicit comparison premium", () => {
    expect(explainSavings(offer, "")).toBeNull();
  });
});
