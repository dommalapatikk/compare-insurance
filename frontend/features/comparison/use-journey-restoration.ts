"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

import { searchLocations, searchPremiums } from "./comparison-api";
import {
  consumeJourneyRootHistoryReturn,
  createJourneyId,
  markJourneyRootHistoryReturn,
} from "./journey-history";
import { loadJourneyState } from "./journey-storage";
import {
  createJourneyState,
  journeyReducer,
  resolveDeductibles,
  resolveModels,
} from "./journey-machine";
import type { InsuranceModel, JourneyState } from "./journey-machine";
import { resolveJourneyUrl } from "./journey-url-resolution";
import type { JourneyUrlResolution } from "./journey-url-resolution";
import type { AccidentChoice, LocationSuggestion, PremiumSearchResponse } from "./types";

export { resolveJourneyUrl } from "./journey-url-resolution";
export type { JourneyUrlResolution } from "./journey-url-resolution";

type RestorationControls = {
  chooseLocation: (location: LocationSuggestion) => void;
  setAccident: Dispatch<SetStateAction<AccidentChoice>>;
  setBirthYear: Dispatch<SetStateAction<string>>;
  setDeductibles: Dispatch<SetStateAction<number[]>>;
  setHydrated: Dispatch<SetStateAction<boolean>>;
  setIsSearching: Dispatch<SetStateAction<boolean>>;
  setJourney: Dispatch<SetStateAction<JourneyState>>;
  setJourneyId: Dispatch<SetStateAction<string | null>>;
  setModels: Dispatch<SetStateAction<InsuranceModel[]>>;
  setRestoredNotice: Dispatch<SetStateAction<string>>;
  setResults: Dispatch<SetStateAction<PremiumSearchResponse | null>>;
  setSearchNotice: Dispatch<SetStateAction<string>>;
};

export function useJourneyRestoration(controls: RestorationControls) {
  useEffect(() => {
    let cancelled = false;
    const abortController = new AbortController();

    function applyProfile(resolution: Extract<
      JourneyUrlResolution,
      { kind: "details" | "preferences" | "results" }
    >) {
      if (resolution.location) controls.chooseLocation(resolution.location);
      if (resolution.birthYear) controls.setBirthYear(String(resolution.birthYear));
      if (resolution.accident) controls.setAccident(resolution.accident);
      if (resolution.models) controls.setModels(resolution.models);
      if (resolution.deductibles) controls.setDeductibles(resolution.deductibles);
    }

    async function restoreUrl() {
      let resolution: JourneyUrlResolution;
      try {
        resolution = await resolveJourneyUrl(new URL(window.location.href), {
          storage: window.sessionStorage,
          searchLocations,
          searchPremiums,
          signal: abortController.signal,
        });
      } catch (error) {
        if (abortController.signal.aborted) return true;
        window.history.replaceState({}, "", "/");
        controls.setSearchNotice(error instanceof Error
          ? error.message
          : "We couldn't restore this comparison. Please try again.");
        return true;
      }

      if (cancelled || resolution.kind === "none") return false;
      if (resolution.kind === "reset") {
        controls.setJourney(createJourneyState());
        controls.setJourneyId(null);
        window.history.replaceState({}, "", resolution.canonicalUrl);
        return true;
      }

      controls.setJourneyId(resolution.journeyId);
      controls.setJourney(resolution.journey);
      window.history.replaceState({}, "", resolution.canonicalUrl);
      applyProfile(resolution);
      if (resolution.kind === "details") {
        controls.setRestoredNotice(resolution.notice ?? "");
        return true;
      }
      if (resolution.kind === "preferences") return true;

      controls.setResults(resolution.results);
      if (!resolution.results.offers.length) {
        controls.setSearchNotice("No published offers match every selected filter.");
      }
      return true;
    }

    async function restore() {
      const returnedToRoot = consumeJourneyRootHistoryReturn(window.sessionStorage);
      controls.setIsSearching(Boolean(new URL(window.location.href).searchParams.get("step") === "results"));
      if (await restoreUrl()) return;
      if (returnedToRoot) return;
      const saved = loadJourneyState(window.sessionStorage);
      if (!saved) return;
      const restored = saved.stage === "results"
        ? journeyReducer(saved, {
            type: "edit",
            stage: saved.intent === "explore" ? "location" : "models",
          })
        : saved;
      controls.setJourney(restored);
      controls.setJourneyId(createJourneyId());
      const { profile } = restored;
      if (profile.location) controls.chooseLocation(profile.location);
      if (profile.birthYear) controls.setBirthYear(String(profile.birthYear));
      if (profile.accident) controls.setAccident(profile.accident);
      if (profile.models) controls.setModels(resolveModels(profile));
      if (profile.deductibles) controls.setDeductibles(resolveDeductibles(profile));
      if (Object.values(saved.profile).some((value) => value !== null)) {
        controls.setRestoredNotice(saved.stage === "results"
          ? "Your answers were restored. Compare again to refresh the official premiums."
          : "Your answers were restored for this browser tab.");
      }
    }

    void restore().finally(() => {
      if (!cancelled) {
        controls.setIsSearching(false);
        controls.setHydrated(true);
      }
    });
    const reloadFromHistory = () => {
      if (!new URL(window.location.href).searchParams.get("journeyId")) {
        markJourneyRootHistoryReturn(window.sessionStorage);
      }
      window.location.reload();
    };
    window.addEventListener("popstate", reloadFromHistory);
    return () => {
      cancelled = true;
      abortController.abort();
      window.removeEventListener("popstate", reloadFromHistory);
    };
    // The restoration intentionally runs once for the initial URL/session state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
