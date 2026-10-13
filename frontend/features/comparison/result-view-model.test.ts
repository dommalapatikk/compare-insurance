import { describe, expect, it } from "vitest";

import { explainSavings } from "./result-view-model";
import type { PremiumOffer } from "./types";

const offer = {
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

  it("does not show savings without an explicit comparison premium", () => {
    expect(explainSavings(offer, "")).toBeNull();
  });
});
