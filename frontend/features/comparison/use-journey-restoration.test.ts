import { describe, expect, it, vi } from "vitest";

import { tombstoneJourney } from "./journey-history";
import { resolveJourneyUrl } from "./use-journey-restoration";
import type { LocationSearchResponse, LocationSuggestion, PremiumSearchResponse } from "./types";

const journeyId = "0123456789abcdef0123456789abcdef";
const zurich: LocationSuggestion = {
  postal_code: "8001",
  locality: "Zürich",
  municipality_id: "261",
  municipality_name: "Zürich",
  canton: "ZH",
  premium_region: "1",
  label: "8001 Zürich, ZH",
};

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

function locationPayload(locations: LocationSuggestion[]): LocationSearchResponse {
  return { query: "8001", premium_year: 2027, source_name: "BAG", locations };
}

const premiumPayload = { offers: [] } as unknown as PremiumSearchResponse;

describe("URL journey restoration", () => {
  it("resolves display fields from the official location lookup and returns a canonical URL", async () => {
    const searchPremiums = vi.fn().mockResolvedValue(premiumPayload);
    const result = await resolveJourneyUrl(
      new URL(`https://example.test/?region=forged&journey=explore&step=preferences&journeyId=${journeyId}&postcode=8001&municipalityId=261&birthYear=1990&accident=excluded&locality=Forged`),
      {
        storage: new MemoryStorage(),
        searchLocations: vi.fn().mockResolvedValue(locationPayload([zurich])),
        searchPremiums,
        signal: new AbortController().signal,
      },
    );

    expect(result.kind).toBe("preferences");
    if (result.kind !== "preferences") throw new Error("Expected preferences restoration");
    expect(result.location).toEqual(zurich);
    expect(result.canonicalUrl).not.toContain("forged");
    expect(result.canonicalUrl).not.toContain("locality");
    expect(result.canonicalUrl).not.toContain("region");
    expect(searchPremiums).not.toHaveBeenCalled();
  });

  it("recovers at the details step when postcode and municipality do not match", async () => {
    const searchPremiums = vi.fn().mockResolvedValue(premiumPayload);
    const result = await resolveJourneyUrl(
      new URL(`https://example.test/?journey=explore&step=results&journeyId=${journeyId}&postcode=8001&municipalityId=999&birthYear=1990&accident=excluded&models=standard&franchises=300`),
      {
        storage: new MemoryStorage(),
        searchLocations: vi.fn().mockResolvedValue(locationPayload([zurich])),
        searchPremiums,
        signal: new AbortController().signal,
      },
    );

    expect(result).toMatchObject({
      kind: "details",
      journeyId,
      notice: "Some details were missing — please check and continue.",
      invalidPostcode: "8001",
      birthYear: 1990,
      accident: "excluded",
    });
    expect(searchPremiums).not.toHaveBeenCalled();
  });

  it("preserves an unknown shared postcode so the form can explain the error", async () => {
    const result = await resolveJourneyUrl(
      new URL(`https://example.test/?journey=explore&step=results&journeyId=${journeyId}&postcode=9999&municipalityId=999&birthYear=1990&accident=excluded&models=standard&franchises=300`),
      {
        storage: new MemoryStorage(),
        searchLocations: vi.fn().mockResolvedValue(locationPayload([])),
        searchPremiums: vi.fn(),
        signal: new AbortController().signal,
      },
    );

    expect(result).toMatchObject({
      kind: "details",
      invalidPostcode: "9999",
      notice: "Some details were missing — please check and continue.",
    });
  });

  it("fails closed before any lookup or premium request for invalid filters", async () => {
    const searchLocations = vi.fn();
    const searchPremiums = vi.fn();
    const result = await resolveJourneyUrl(
      new URL(`https://example.test/?journey=explore&step=results&journeyId=${journeyId}&postcode=8001&municipalityId=261&birthYear=2015&accident=included&models=standard,bogus&franchises=2500`),
      {
        storage: new MemoryStorage(), searchLocations, searchPremiums,
        signal: new AbortController().signal,
      },
    );

    expect(result).toMatchObject({
      kind: "details",
      journeyId,
      notice: "Some details were missing — please check and continue.",
    });
    expect(searchLocations).not.toHaveBeenCalled();
    expect(searchPremiums).not.toHaveBeenCalled();
  });

  it("does not restore a restarted journey reached with browser Back", async () => {
    const storage = new MemoryStorage();
    tombstoneJourney(storage, journeyId);
    const searchLocations = vi.fn();
    const searchPremiums = vi.fn();
    const result = await resolveJourneyUrl(
      new URL(`https://example.test/?journey=explore&step=results&journeyId=${journeyId}&postcode=8001&municipalityId=261&birthYear=1990&accident=excluded&models=standard&franchises=300`),
      { storage, searchLocations, searchPremiums, signal: new AbortController().signal },
    );

    expect(result).toEqual({ kind: "reset", canonicalUrl: "/" });
    expect(searchLocations).not.toHaveBeenCalled();
    expect(searchPremiums).not.toHaveBeenCalled();
  });

  it("uses the verified location fields for a valid results request", async () => {
    const searchPremiums = vi.fn().mockResolvedValue(premiumPayload);
    const result = await resolveJourneyUrl(
      new URL(`https://example.test/?journey=explore&step=results&journeyId=${journeyId}&postcode=8001&municipalityId=261&birthYear=1990&accident=excluded&models=standard&franchises=300`),
      {
        storage: new MemoryStorage(),
        searchLocations: vi.fn().mockResolvedValue(locationPayload([zurich])),
        searchPremiums,
        signal: new AbortController().signal,
      },
    );

    expect(result.kind).toBe("results");
    expect(searchPremiums).toHaveBeenCalledWith({
      canton: "ZH",
      region: "1",
      birthYear: "1990",
      accidentCoverage: false,
      deductibles: [300],
      models: ["standard"],
      currentPremium: "",
    });
  });

  it("opens a shared explore-results URL without an id or filters using all options", async () => {
    const searchPremiums = vi.fn().mockResolvedValue(premiumPayload);
    const generatedId = "fedcba9876543210fedcba9876543210";
    const result = await resolveJourneyUrl(
      new URL("https://example.test/?journey=explore&step=results&postcode=8001&municipalityId=261&birthYear=1990&accident=excluded"),
      {
        storage: new MemoryStorage(),
        searchLocations: vi.fn().mockResolvedValue(locationPayload([zurich])),
        searchPremiums,
        signal: new AbortController().signal,
        createJourneyId: () => generatedId,
      },
    );

    expect(result).toMatchObject({ kind: "results", journeyId: generatedId });
    expect(searchPremiums).toHaveBeenCalledWith(expect.objectContaining({
      deductibles: [300, 500, 1000, 1500, 2000, 2500],
      models: ["standard", "flex", "praxis", "tel_dig", "pharm"],
    }));
  });

  it("restores profile and preferences encoded in a details history entry", async () => {
    const result = await resolveJourneyUrl(
      new URL(`https://example.test/?journey=compare_current&step=details&journeyId=${journeyId}&postcode=8001&municipalityId=261&birthYear=1990&accident=included&models=praxis&franchises=1500`),
      {
        storage: new MemoryStorage(),
        searchLocations: vi.fn().mockResolvedValue(locationPayload([zurich])),
        searchPremiums: vi.fn(),
        signal: new AbortController().signal,
      },
    );

    expect(result).toMatchObject({
      kind: "details",
      location: zurich,
      birthYear: 1990,
      accident: "included",
      models: ["praxis"],
      deductibles: [1500],
    });
  });
});
