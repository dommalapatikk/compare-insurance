import { describe, expect, it } from "vitest";

import { normalizePostcode } from "./use-location-picker";

describe("postcode input", () => {
  it("keeps four digits and removes other characters", () => {
    expect(normalizePostcode("31a10 Bern")).toBe("3110");
    expect(normalizePostcode("30112")).toBe("3011");
  });
});
