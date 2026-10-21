import { describe, expect, it } from "vitest";

import { buildPremiumOfferPageParams, buildPremiumSearchParams } from "./comparison-api";

const input = {
  canton: "ZH",
  region: "1",
  birthYear: "1990",
  accidentCoverage: true,
  deductibles: [300, 2500],
  models: ["standard", "praxis"],
  currentPremium: "420",
};

describe("premium search request", () => {
  it("requests ten ranked offers by default", () => {
    expect(buildPremiumSearchParams(input).get("top_n")).toBe("10");
    expect(buildPremiumSearchParams(input).has("all_offers")).toBe(false);
  });

  it("builds a bounded page request for one franchise and the active models", () => {
    const params = buildPremiumOfferPageParams({
      ...input,
      deductible: 300,
      models: ["praxis"],
      offset: 10,
      limit: 10,
    });

    expect(params.getAll("deductible")).toEqual(["300"]);
    expect(params.getAll("insurance_model")).toEqual(["praxis"]);
    expect(params.get("offset")).toBe("10");
    expect(params.get("limit")).toBe("10");
    expect(params.has("all_offers")).toBe(false);
  });
});
