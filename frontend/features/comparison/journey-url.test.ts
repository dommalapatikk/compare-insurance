import { describe, expect, it } from "vitest";

import {
  isJourneyUrlIntent,
  parseJourneyUrl,
  serializeJourneyUrl,
} from "./journey-url";
import type { LocationSuggestion } from "./types";

const zurich: LocationSuggestion = {
  postal_code: "8001",
  locality: "Zürich",
  municipality_id: "261",
  municipality_name: "Zürich",
  canton: "ZH",
  premium_region: "1",
  label: "8001 Zürich, ZH",
};

const journeyId = "0123456789abcdef0123456789abcdef";

describe("shareable journey URLs", () => {
  it("round-trips authoritative lookup keys and omits display data and current premiums", () => {
    const url = serializeJourneyUrl({
      journeyId,
      step: "results",
      intent: "compare_current",
      location: zurich,
      birthYear: 1990,
      accident: "included",
      models: ["standard"],
      deductibles: [1500],
    });

    expect(url).not.toContain("premium");
    expect(url).not.toContain("locality");
    expect(url).not.toContain("municipality=");
    expect(url).not.toContain("canton");
    expect(url).not.toContain("region");
    expect(parseJourneyUrl(new URL(url, "https://example.test"))).toEqual({
      journeyId,
      step: "results",
      intent: "compare_current",
      location: { postal_code: "8001", municipality_id: "261" },
      birthYear: 1990,
      accident: "included",
      models: ["standard"],
      deductibles: [1500],
    });
  });

  it("accepts only the two public journey intents, a safe id and known steps", () => {
    expect(isJourneyUrlIntent("compare_current")).toBe(true);
    expect(isJourneyUrlIntent("explore")).toBe(true);
    expect(isJourneyUrlIntent("new_insurance")).toBe(false);

    const base = `https://example.test/?journeyId=${journeyId}`;
    expect(parseJourneyUrl(new URL(`${base}&journey=new_insurance&step=details`))).toBeNull();
    expect(parseJourneyUrl(new URL(`${base}&journey=explore&step=review`))).toBeNull();
    expect(parseJourneyUrl(new URL("https://example.test/?journeyId=unsafe!&journey=explore&step=details"))).toBeNull();
  });

  it("validates birth year with the product configuration", () => {
    const base = `https://example.test/?journeyId=${journeyId}&journey=explore&step=preferences&postcode=8001&municipalityId=261&accident=included`;

    expect(parseJourneyUrl(new URL(`${base}&birthYear=1906`))).toBeNull();
    expect(parseJourneyUrl(new URL(`${base}&birthYear=2028`))).toBeNull();
    expect(parseJourneyUrl(new URL(`${base}&birthYear=not-a-year`))).toBeNull();
    expect(parseJourneyUrl(new URL(`${base}&birthYear=1907`))?.birthYear).toBe(1907);
  });

  it("rejects the whole URL when any model token is invalid", () => {
    const base = `https://example.test/?journeyId=${journeyId}&journey=explore&step=results&postcode=8001&municipalityId=261&birthYear=1990&accident=excluded&franchises=300`;

    expect(parseJourneyUrl(new URL(`${base}&models=standard,not-a-model`))).toBeNull();
    expect(parseJourneyUrl(new URL(`${base}&models=standard,`))).toBeNull();
    expect(parseJourneyUrl(new URL(`${base}&models=standard,standard`))).toBeNull();
  });

  it("validates franchises against the age category derived from birth year", () => {
    const base = `https://example.test/?journeyId=${journeyId}&journey=explore&step=results&postcode=8001&municipalityId=261&accident=included&models=standard`;

    expect(parseJourneyUrl(new URL(`${base}&birthYear=1990&franchises=0`))).toBeNull();
    expect(parseJourneyUrl(new URL(`${base}&birthYear=2015&franchises=2500`))).toBeNull();
    expect(parseJourneyUrl(new URL(`${base}&birthYear=2015&franchises=0,300,600`))?.deductibles).toEqual([0, 300, 600]);
  });

  it("accepts explore results without explicit filters so restoration can use all options", () => {
    expect(parseJourneyUrl(new URL(`https://example.test/?journeyId=${journeyId}&journey=explore&step=results&postcode=8001&municipalityId=261&birthYear=1990&accident=excluded`)))
      .toMatchObject({ step: "results", models: undefined, deductibles: undefined });
  });

  it("round-trips a complete profile in a details history entry", () => {
    const url = serializeJourneyUrl({
      journeyId,
      step: "details",
      intent: "compare_current",
      location: zurich,
      birthYear: 1990,
      accident: "included",
      models: ["praxis"],
      deductibles: [1500],
    });
    expect(parseJourneyUrl(new URL(url, "https://example.test"))).toMatchObject({
      step: "details",
      location: { postal_code: "8001", municipality_id: "261" },
      models: ["praxis"],
      deductibles: [1500],
    });
  });
});
