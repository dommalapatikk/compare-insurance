import { describe, expect, it } from "vitest";

import { officialInsurers, officialInsurerWebsite } from "./insurer-links";

describe("official insurer catalogue", () => {
  it("offers unique, alphabetically sorted insurer choices with official websites", () => {
    expect(new Set(officialInsurers.map(({ id }) => id)).size).toBe(officialInsurers.length);
    expect(officialInsurers.map(({ name }) => name)).toEqual(
      officialInsurers.map(({ name }) => name).toSorted((left, right) => left.localeCompare(right)),
    );
    expect(officialInsurers.every(({ id, website }) => officialInsurerWebsite(id) === website)).toBe(true);
  });
});
