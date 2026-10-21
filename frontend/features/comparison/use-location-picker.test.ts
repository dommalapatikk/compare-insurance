import { describe, expect, it } from "vitest";

import { normalizePostcode, resolveExactPostcode } from "./use-location-picker";
import type { LocationSuggestion } from "./types";

describe("postcode input", () => {
  it("keeps four digits and removes other characters", () => {
    expect(normalizePostcode("31a10 Bern")).toBe("3110");
    expect(normalizePostcode("30112")).toBe("3011");
  });

  it("auto-selects the only exact match and asks when there are several", () => {
    const zurich = { postal_code: "8001", locality: "Zürich" } as LocationSuggestion;
    const bern = { postal_code: "3006", locality: "Bern" } as LocationSuggestion;
    const ostermundigen = { postal_code: "3006", locality: "Ostermundigen" } as LocationSuggestion;

    expect(resolveExactPostcode("8001", [zurich])).toEqual({ kind: "selected", location: zurich });
    expect(resolveExactPostcode("3006", [bern, ostermundigen])).toEqual({ kind: "choose", locations: [bern, ostermundigen] });
    expect(resolveExactPostcode("9999", [])).toEqual({ kind: "not_found" });
  });
});
