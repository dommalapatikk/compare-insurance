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

  it("fails closed when postcode and municipality do not match and never requests premiums", async () => {
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

    expect(result).toEqual({ kind: "reset", canonicalUrl: "/" });
    expect(searchPremiums).not.toHaveBeenCalled();
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

    expect(result).toEqual({ kind: "reset", canonicalUrl: "/" });
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
});
