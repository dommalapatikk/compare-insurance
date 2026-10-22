import { describe, expect, it } from "vitest";

import {
  buildCurrentPremiumMessage,
  compareOfferWithCurrentPremium,
  differenceFromLowest,
  explainSavings,
  filterAndSortMinimums,
} from "./result-view-model";
import type { CategoryMinimum, PremiumOffer } from "./types";

const offer = {
  insurer_id: "632",
  insurer_name: "ÖKK Kranken- und Unfallversicherungen AG",
  product_name: "ÖKK CASAMED HMO",
  deductible_chf: 300,
  insurance_model: "praxis",
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

  it("labels each offer against the premium for the current plan", () => {
    expect(compareOfferWithCurrentPremium(offer, "400")).toEqual({
      annualDifference: "CHF\u00a0356.40",
      label: "Save CHF\u00a029.70/month",
      monthlyDifference: "CHF\u00a029.70",
      relation: "less",
      tone: "positive",
    });
    expect(compareOfferWithCurrentPremium(offer, "350")).toEqual({
      annualDifference: "CHF\u00a0243.60",
      label: "CHF\u00a020.30 more/month",
      monthlyDifference: "CHF\u00a020.30",
      relation: "more",
      tone: "neutral",
    });
  });

  it("compares the current plan without recommending that the user stay", () => {
    expect(buildCurrentPremiumMessage([offer], {
      currentPremium: "400",
      currentInsurerId: "",
      currentInsurerName: "",
      insuranceModel: "Family doctor / HMO",
      deductible: 300,
    })).toEqual({
      tone: "positive",
      heading: "Your current plan compared with the cheapest alternative",
      points: [
        {
          title: "Your current plan",
          detail: "You entered CHF\u00a0400.00/month (CHF\u00a04'800.00/year) from your 2027 renewal notice. We use it only as a comparison starting point — not as a recommendation to stay.",
        },
        {
          title: "Cheapest matching offer",
          detail: "ÖKK CASAMED HMO from ÖKK Kranken- und Unfallversicherungen AG is CHF\u00a0370.30/month. That is CHF\u00a029.70/month (CHF\u00a0356.40/year) less than your current plan. It matches your Family doctor / HMO model and CHF 300 franchise.",
        },
      ],
    });
  });

  it("excludes the selected current insurer when naming the cheapest alternative", () => {
    const cssOffer = {
      ...offer,
      insurer_id: "8",
      insurer_name: "CSS Krankenversicherung AG",
      product_name: "CSS Hausarztversicherung",
      monthly_premium_chf: "380.00",
      reference_comparison: null,
    } as PremiumOffer;
    expect(buildCurrentPremiumMessage([cssOffer, offer], {
      currentPremium: "400",
      currentInsurerId: "8",
      currentInsurerName: "CSS Krankenversicherung AG",
      insuranceModel: "Family doctor / HMO",
      deductible: 300,
    })).toEqual({
      tone: "positive",
      heading: "Your current plan compared with the cheapest alternative",
      points: [
        {
          title: "Your current plan: CSS Krankenversicherung AG",
          detail: "You entered CHF\u00a0400.00/month (CHF\u00a04'800.00/year) from your 2027 renewal notice. We use it only as a comparison starting point — not as a recommendation to stay.",
        },
        {
          title: "Cheapest alternative from another insurer",
          detail: "ÖKK CASAMED HMO from ÖKK Kranken- und Unfallversicherungen AG is CHF\u00a0370.30/month. That is CHF\u00a029.70/month (CHF\u00a0356.40/year) less than your current plan. It matches your Family doctor / HMO model and CHF 300 franchise.",
        },
      ],
    });
  });

  it("states when the cheapest alternative costs more than staying", () => {
    const message = buildCurrentPremiumMessage([offer], {
      currentPremium: "350",
      currentInsurerId: "",
      currentInsurerName: "",
      insuranceModel: "Family doctor / HMO",
      deductible: 300,
    });
    expect(message?.tone).toBe("neutral");
    expect(message?.points[1].detail).toContain("CHF\u00a020.30/month (CHF\u00a0243.60/year) more than your current plan");
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
