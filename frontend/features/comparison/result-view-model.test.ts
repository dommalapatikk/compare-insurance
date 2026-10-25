import { describe, expect, it } from "vitest";

import {
  buildCurrentPremiumMessage,
  compareOfferWithCurrentPremium,
  differenceFromLowest,
  explainSavings,
  filterAndSortMinimums,
  nearbyOfferSentence,
  shouldShowCurrentPlanDifferenceColumn,
} from "./result-view-model";
import type { CategoryMinimum, PremiumOffer } from "./types";

const offer = {
  insurer_id: "455",
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

  it("presents one clear savings decision instead of numbered comparison instructions", () => {
    expect(buildCurrentPremiumMessage([offer], {
      currentPremium: "400",
      currentInsurerId: "",
      currentInsurerName: "",
    })).toMatchObject({
      kind: "savings",
      tone: "positive",
      heading: "You could save CHF\u00a030/month",
      detail: "That’s CHF\u00a0356.40 a year. ÖKK costs CHF\u00a0370.30, and you pay CHF\u00a0400.00.",
      action: { label: "See ÖKK", offerInsurerId: "455" },
    });
  });

  it("rounds only the headline saving while preserving exact comparison amounts", () => {
    const message = buildCurrentPremiumMessage([
      { ...offer, monthly_premium_chf: "563.00" } as PremiumOffer,
    ], {
      currentPremium: "700",
      currentInsurerId: "",
      currentInsurerName: "",
    });

    expect(message.heading).toBe("You could save CHF\u00a0137/month");
    expect(message.detail).toContain("CHF\u00a0563.00");
    expect(message.detail).toContain("CHF\u00a0700.00");
  });

  it("warns when the entered premium differs from the selected insurer's published price by more than five percent", () => {
    const cssOffer = {
      ...offer,
      insurer_id: "8",
      insurer_name: "CSS Krankenversicherung AG",
      product_name: "CSS Hausarztversicherung",
      monthly_premium_chf: "573.80",
      reference_comparison: null,
    } as PremiumOffer;
    expect(buildCurrentPremiumMessage([offer, cssOffer], {
      currentPremium: "420",
      currentInsurerId: "8",
      currentInsurerName: "CSS Krankenversicherung AG",
    })).toMatchObject({
      kind: "premium_mismatch",
      tone: "warning",
      heading: "Please check your premium",
      detail: "CSS costs CHF\u00a0573.80/month for this setup, but you entered CHF\u00a0420.00.",
      action: { label: "Edit details" },
    });
  });

  it("reassures without telling the user to stay when no matching plan is cheaper", () => {
    const message = buildCurrentPremiumMessage([offer], {
      currentPremium: "350",
      currentInsurerId: "",
      currentInsurerName: "",
    });
    expect(message?.kind).toBe("already_best");
    expect(message?.tone).toBe("neutral");
    expect(message?.heading).toBe("You already have a great price");
    expect(message?.detail).toBe("No plan with your setup is cheaper than your CHF\u00a0350.00/month.");
    expect(message?.action).toBeUndefined();
  });

  it("asks for the current premium when a shared comparison has none", () => {
    expect(buildCurrentPremiumMessage([offer], {
      currentPremium: "",
      currentInsurerId: "",
      currentInsurerName: "",
    })).toMatchObject({
      kind: "needs_premium",
      heading: "Add your current premium to see how much you could save",
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

  it("hides the current-plan column when none of the visible offers is cheaper", () => {
    expect(shouldShowCurrentPlanDifferenceColumn([offer], "350")).toBe(false);
    expect(shouldShowCurrentPlanDifferenceColumn([offer], "400")).toBe(true);
  });

  it("uses singular grammar for one nearby offer", () => {
    expect(nearbyOfferSentence(1, 1)).toBe(
      "1 offer from 1 insurer is within CHF 5/month of the lowest in this franchise.",
    );
  });
});
