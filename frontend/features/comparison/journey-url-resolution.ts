import type { PremiumSearchInput } from "./comparison-api";
import { adultDeductibles, ageGroupForBirthYear, childDeductibles, modelChoices } from "./config";
import { isJourneyRestorable } from "./journey-history";
import type { JourneyHistoryStorage } from "./journey-history";
import { allSelection, createJourneyState, journeyReducer, selectedValues } from "./journey-machine";
import type { InsuranceModel, JourneyState } from "./journey-machine";
import { parseJourneyUrl, serializeJourneyUrl } from "./journey-url";
import type { JourneyUrlState } from "./journey-url";
import type { AccidentChoice, LocationSearchResponse, LocationSuggestion, PremiumSearchResponse } from "./types";

type ResolutionDependencies = {
  storage: JourneyHistoryStorage;
  searchLocations: (query: string, signal: AbortSignal) => Promise<LocationSearchResponse>;
  searchPremiums: (input: PremiumSearchInput) => Promise<PremiumSearchResponse>;
  signal: AbortSignal;
};

type RestoredBase = {
  canonicalUrl: string;
  journeyId: string;
  journey: JourneyState;
};

export type JourneyUrlResolution =
  | { kind: "none" }
  | { kind: "reset"; canonicalUrl: "/" }
  | (RestoredBase & { kind: "details" })
  | (RestoredBase & {
      kind: "preferences";
      location: LocationSuggestion;
      birthYear: number;
      accident: Exclude<AccidentChoice, "">;
      models: InsuranceModel[];
      deductibles: number[];
    })
  | (RestoredBase & {
      kind: "results";
      location: LocationSuggestion;
      birthYear: number;
      accident: Exclude<AccidentChoice, "">;
      models: InsuranceModel[];
      deductibles: number[];
      results: PremiumSearchResponse;
    });

function verifiedLocation(state: JourneyUrlState, payload: LocationSearchResponse) {
  if (!state.location) return null;
  return payload.locations.find((location) => (
    location.postal_code === state.location?.postal_code
    && location.municipality_id === state.location.municipality_id
  )) ?? null;
}

function canonicalUrl(state: JourneyUrlState, location?: LocationSuggestion) {
  return serializeJourneyUrl({ ...state, location: location ?? state.location });
}

export async function resolveJourneyUrl(
  url: URL,
  dependencies: ResolutionDependencies,
): Promise<JourneyUrlResolution> {
  if (!url.search) return { kind: "none" };
  const urlState = parseJourneyUrl(url);
  if (!urlState || !isJourneyRestorable(dependencies.storage, urlState.journeyId)) {
    return { kind: "reset", canonicalUrl: "/" };
  }

  let restored = journeyReducer(createJourneyState(), {
    type: "select_intent",
    intent: urlState.intent,
  });
  if (urlState.step === "details") {
    return {
      kind: "details",
      canonicalUrl: canonicalUrl(urlState),
      journeyId: urlState.journeyId,
      journey: restored,
    };
  }

  if (!urlState.location || !urlState.birthYear || !urlState.accident) {
    return { kind: "reset", canonicalUrl: "/" };
  }
  const locationPayload = await dependencies.searchLocations(
    urlState.location.postal_code,
    dependencies.signal,
  );
  const location = verifiedLocation(urlState, locationPayload);
  if (!location) return { kind: "reset", canonicalUrl: "/" };

  restored = journeyReducer(restored, { type: "set_location", location });
  restored = journeyReducer(restored, { type: "set_birth_year", birthYear: urlState.birthYear });
  restored = journeyReducer(restored, { type: "set_accident", accident: urlState.accident });

  const allModels = modelChoices.map(({ value }) => value as InsuranceModel);
  const availableDeductibles = ageGroupForBirthYear(String(urlState.birthYear)) === "child"
    ? childDeductibles
    : adultDeductibles;
  const models = urlState.models?.length
    ? urlState.models
    : urlState.intent === "compare_current" ? [] : allModels;
  const deductibles = urlState.deductibles?.length
    ? urlState.deductibles
    : urlState.intent === "compare_current" ? [] : availableDeductibles;
  const base = {
    canonicalUrl: canonicalUrl(urlState, location), journeyId: urlState.journeyId,
    journey: restored, location, birthYear: urlState.birthYear, accident: urlState.accident,
    models, deductibles,
  };
  if (urlState.step === "preferences") return { kind: "preferences", ...base };

  restored = journeyReducer(restored, {
    type: "set_models",
    selection: models.length === allModels.length ? allSelection() : selectedValues(models),
  });
  restored = journeyReducer(restored, {
    type: "set_deductibles",
    selection: deductibles.length === availableDeductibles.length
      ? allSelection()
      : selectedValues(deductibles),
  });
  restored = journeyReducer(restored, { type: "comparison_started" });
  const results = await dependencies.searchPremiums({
    canton: location.canton, region: location.premium_region,
    birthYear: String(urlState.birthYear), accidentCoverage: urlState.accident === "included",
    deductibles, models, currentPremium: "",
  });
  return {
    kind: "results", ...base,
    journey: journeyReducer(restored, { type: "comparison_succeeded" }), results,
  };
}
