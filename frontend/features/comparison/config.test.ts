import { describe, expect, it } from "vitest";

import { birthYearError } from "./config";

describe("birth year validation", () => {
  it("accepts a plausible four-digit birth year", () => {
    expect(birthYearError("1984")).toBe("");
  });

  it("rejects future, incomplete and implausibly old years", () => {
    expect(birthYearError("2031")).toBe("Birth year cannot be in the future.");
    expect(birthYearError("84")).toBe("Enter a 4-digit birth year.");
    expect(birthYearError("1800")).toBe("Enter a birth year from 1907 onwards.");
  });
});
