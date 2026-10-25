import { describe, expect, it } from "vitest";

import { officialInsurers, officialInsurerShortName, officialInsurerWebsite } from "./insurer-links";

describe("official insurer catalogue", () => {
  it("offers unique insurer choices sorted A–Z by the visible short name", () => {
    expect(new Set(officialInsurers.map(({ id }) => id)).size).toBe(officialInsurers.length);
    const collator = new Intl.Collator("de", { sensitivity: "base" });
    expect(officialInsurers.map(({ shortName }) => shortName)).toEqual(
      officialInsurers.map(({ shortName }) => shortName).toSorted(collator.compare),
    );
    expect(officialInsurers.every(({ shortName }) => !shortName.startsWith("Krankenkasse"))).toBe(true);
    expect(officialInsurerShortName("246")).toBe("Steffisburg");
    expect(officialInsurers.every(({ id, website }) => officialInsurerWebsite(id) === website)).toBe(true);
  });

  it("covers every insurer ID in the pinned BAG 2027 catalogue", () => {
    expect(officialInsurers.map(({ id }) => id).toSorted((a, b) => Number(a) - Number(b))).toEqual([
      "8", "32", "134", "194", "246", "290", "312", "343", "360", "376", "455", "509",
      "780", "820", "881", "923", "941", "966", "1040", "1113", "1318", "1322", "1384",
      "1386", "1401", "1479", "1507", "1509", "1535", "1542", "1555", "1560", "1562", "1568",
    ]);
    expect(officialInsurerShortName("1562")).toBe("Helsana");
    expect(Object.fromEntries(officialInsurers.map(({ id, name }) => [id, name]))).toMatchObject({
      "246": "Genossenschaft Krankenkasse Steffisburg",
      "290": "CONCORDIA Schweiz. Kranken- und Unfallversicherung AG",
      "780": "Genossenschaft Glarner Krankenversicherung",
      "923": "Genossenschaft KRANKENKASSE SLKK",
      "1040": "Verein Krankenkasse Visperterminen",
      "1401": "rhenusana Taggeldkasse bildende KünstlerInnen",
      "1507": "AMB Assurances SA",
      "1542": "AssuraBasis SA",
      "1562": "Helsana Versicherungen AG",
    });
  });
});
