import { describe, expect, it } from "vitest";

import {
  buildCurrentPremiumMessage,
  differenceFromLowest,
  explainSavings,
  filterAndSortMinimums,
} from "./result-view-model";
import type { CategoryMinimum, PremiumOffer } from "./types";

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

  it("explains when the current premium is below every matching plan", () => {
    expect(buildCurrentPremiumMessage(offer, "250")).toEqual({
      tone: "neutral",
      title: "You're paying less than every plan we found for this setup (lowest: CHF\u00a0370.30).",
      detail: "Please check that your premium, franchise, insurance model and accident cover match your policy — subsidies or a different setup can explain the gap.",
    });
  });

  it("states savings when the matching plan costs less", () => {
    expect(buildCurrentPremiumMessage(offer, "400")).toEqual({
      tone: "positive",
      title: "You could save CHF\u00a029.70/month (CHF\u00a0356.40/year).",
      detail: "The lowest matching premium is CHF\u00a0370.30/month, compared with the CHF\u00a0400.00/month you entered.",
    });
  });

  it("names the optional current insurer in the comparison summary", () => {
    expect(buildCurrentPremiumMessage(offer, "400", "CSS Krankenversicherung AG")).toEqual({
      tone: "positive",
      title: "You could save CHF\u00a029.70/month (CHF\u00a0356.40/year).",
      detail: "The lowest matching premium is CHF\u00a0370.30/month, compared with the CHF\u00a0400.00/month you entered. Your current insurer is CSS Krankenversicherung AG.",
    });
  });

  it("recognises an equal current premium", () => {
    expect(buildCurrentPremiumMessage(offer, "370.30")).toEqual({
      tone: "neutral",
      title: "You already have the lowest premium for this setup.",
      detail: "The matching premium is CHF\u00a0370.30/month.",
    });
  });

  it("filters category minimums and sorts them by monthly premium", () => {
    const minimums = [
      { insurer_name: "B", product_name: "B", deductible_chf: 300, insurance_model: "standard", monthly_premium_chf: "500.00" },
      { insurer_name: "A", product_name: "A", deductible_chf: 300, insurance_model: "praxis", monthly_premium_chf: "410.00" },
      { insurer_name: "C", product_name: "C", deductible_chf: 2500, insurance_model: "praxis", monthly_premium_chf: "370.00" },
    ] as CategoryMinimum[];

    expect(filterAndSortMinimums(minimums, { deductible: 300, model: "all" }).map((item) => item.insurer_name)).toEqual(["A", "B"]);
    expect(filterAndSortMinimums(minimums, { deductible: "all", model: "praxis" }).map((item) => item.insurer_name)).toEqual(["C", "A"]);
  });

  it("calculates the difference from the filtered lowest offer", () => {
    const lowest = { monthly_premium_chf: "410.00" } as CategoryMinimum;
    expect(differenceFromLowest({ monthly_premium_chf: "415.00" } as CategoryMinimum, lowest)).toBe(5);
  });
});
