import { describe, expect, it } from "vitest";

import { decideCurrentCover } from "./current-cover-decision";

const offers = [
  { insurer_id: "923", insurer_name: "SLKK", monthly_premium_chf: "563.00" },
  { insurer_id: "1509", insurer_name: "Sanitas", monthly_premium_chf: "573.80" },
];

describe("current cover decision", () => {
  it("requires a current premium before comparing", () => {
    expect(decideCurrentCover(offers, "", "")).toEqual({ kind: "needs_premium" });
  });

  it("treats a difference above five percent from the selected insurer as a mismatch", () => {
    expect(decideCurrentCover(offers, "420", "1509")).toMatchObject({
      kind: "premium_mismatch",
      enteredPremium: 420,
      publishedPremium: 573.8,
    });
  });

  it("treats a premium above the selected insurer's published price as a mismatch", () => {
    expect(decideCurrentCover(offers, "700", "1509")).toMatchObject({
      kind: "premium_mismatch",
      enteredPremium: 700,
      publishedPremium: 573.8,
    });
  });

  it("reports real savings when the selected insurer's premium is within five percent", () => {
    expect(decideCurrentCover(offers, "575", "1509")).toMatchObject({
      kind: "savings",
      monthlySavings: 12,
      cheapestOffer: { insurer_id: "923" },
    });
  });

  it("reports real savings when no current insurer was selected", () => {
    expect(decideCurrentCover(offers, "700", "")).toMatchObject({
      kind: "savings",
      monthlySavings: 137,
      cheapestOffer: { insurer_id: "923" },
    });
  });

  it("does not recommend staying when the entered price is already lower", () => {
    expect(decideCurrentCover(offers, "420", "")).toEqual({
      kind: "already_best",
      currentPremium: 420,
      cheapestPremium: 563,
    });
  });
});
