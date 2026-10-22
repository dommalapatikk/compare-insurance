import type { PremiumSearchInput } from "./comparison-api";
import { adultDeductibles, ageGroupForBirthYear, birthYearError, childDeductibles, modelChoices } from "./config";
import { createJourneyId, isJourneyRestorable, isSafeJourneyId } from "./journey-history";
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
  createJourneyId?: () => string;
};

type RestoredBase = {
  canonicalUrl: string;
  journeyId: string;
  journey: JourneyState;
};

type RestoredProfile = {
  location: LocationSuggestion;
  birthYear: number;
  accident: Exclude<AccidentChoice, "">;
  models: InsuranceModel[];
  deductibles: number[];
};

export type JourneyUrlResolution =
  | { kind: "none" }
  | { kind: "reset"; canonicalUrl: "/" }
  | (RestoredBase & { kind: "details"; notice?: string } & Partial<RestoredProfile>)
  | (RestoredBase & { kind: "preferences" } & RestoredProfile)
  | (RestoredBase & { kind: "results";
      results: PremiumSearchResponse;
    } & RestoredProfile);

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

function recoverableDetails(url: URL) {
  const rawBirthYear = url.searchParams.get("birthYear") ?? "";
  const rawAccident = url.searchParams.get("accident");
  return {
    ...(!birthYearError(rawBirthYear) ? { birthYear: Number(rawBirthYear) } : {}),
    ...(["included", "excluded"].includes(rawAccident ?? "")
      ? { accident: rawAccident as Exclude<AccidentChoice, ""> }
      : {}),
  };
}

export async function resolveJourneyUrl(
  url: URL,
  dependencies: ResolutionDependencies,
): Promise<JourneyUrlResolution> {
  if (!url.search) return { kind: "none" };
  const intent = url.searchParams.get("journey");
  const step = url.searchParams.get("step");
  if (!["compare_current", "explore"].includes(intent ?? "") || !["details", "preferences", "results"].includes(step ?? "")) {
    return { kind: "reset", canonicalUrl: "/" };
  }

  const candidateUrl = new URL(url);
  const rawJourneyId = candidateUrl.searchParams.get("journeyId");
  if (isSafeJourneyId(rawJourneyId) && !isJourneyRestorable(dependencies.storage, rawJourneyId)) {
    return { kind: "reset", canonicalUrl: "/" };
  }
  const resolvedJourneyId = isSafeJourneyId(rawJourneyId)
    ? rawJourneyId
    : (dependencies.createJourneyId ?? createJourneyId)();
  candidateUrl.searchParams.set("journeyId", resolvedJourneyId);
  const urlState = parseJourneyUrl(candidateUrl);
  if (!urlState) {
    const journey = journeyReducer(createJourneyState(), {
      type: "select_intent",
      intent: intent as "compare_current" | "explore",
    });
    const recoveryState: JourneyUrlState = {
      journeyId: resolvedJourneyId,
      step: "details",
      intent: intent as "compare_current" | "explore",
    };
    return {
      kind: "details",
      canonicalUrl: canonicalUrl(recoveryState),
      journeyId: resolvedJourneyId,
      journey,
      notice: "Some details were missing — please check and continue.",
      ...recoverableDetails(candidateUrl),
    };
  }

  let restored = journeyReducer(createJourneyState(), {
    type: "select_intent",
    intent: urlState.intent,
  });
  if (urlState.step === "details" && !urlState.location) {
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
  if (!location) {
    return {
      kind: "details",
      canonicalUrl: serializeJourneyUrl({ journeyId: urlState.journeyId, step: "details", intent: urlState.intent }),
      journeyId: urlState.journeyId,
      journey: restored,
      notice: "Some details were missing — please check and continue.",
      birthYear: urlState.birthYear,
      accident: urlState.accident,
    };
  }

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
    canonicalUrl: canonicalUrl({ ...urlState, models, deductibles }, location), journeyId: urlState.journeyId,
    journey: restored, location, birthYear: urlState.birthYear, accident: urlState.accident,
    models, deductibles,
  };
  if (urlState.step === "details") {
    return {
      kind: "details",
      ...base,
      journey: journeyReducer(restored, { type: "edit", stage: "location" }),
    };
  }
  if (urlState.step === "preferences") return { kind: "preferences", ...base };

  if (!models.length || !deductibles.length) {
    return {
      kind: "preferences",
      ...base,
      canonicalUrl: serializeJourneyUrl({
        journeyId: urlState.journeyId,
        step: "preferences",
        intent: urlState.intent,
        location,
        birthYear: urlState.birthYear,
        accident: urlState.accident,
      }),
    };
  }

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
