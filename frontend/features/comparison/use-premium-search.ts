"use client";

import { useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";

import { searchPremiumOfferPage, searchPremiums } from "./comparison-api";
import { journeyReducer } from "./journey-machine";
import type { InsuranceModel, JourneyIntent, JourneyState } from "./journey-machine";
import { isJourneyUrlIntent, serializeJourneyUrl } from "./journey-url";
import { mergePremiumOfferPage } from "./premium-page-merge";
import type { AccidentChoice, AgeGroup, LocationSuggestion, PremiumSearchResponse } from "./types";

type SearchControls = {
  accident: AccidentChoice;
  ageGroup: AgeGroup;
  birthYear: string;
  currentPremium: string;
  deductibles: number[];
  journey: JourneyState;
  journeyId: string | null;
  models: InsuranceModel[];
  results: PremiumSearchResponse | null;
  resultsRef: RefObject<HTMLElement | null>;
  selectedLocation: LocationSuggestion | null;
  setFormError: Dispatch<SetStateAction<string>>;
  setJourney: Dispatch<SetStateAction<JourneyState>>;
  setResults: Dispatch<SetStateAction<PremiumSearchResponse | null>>;
  setSearchNotice: Dispatch<SetStateAction<string>>;
};

type SearchOptions = {
  updateHistory?: boolean;
  intent?: JourneyIntent | null;
};

export function usePremiumSearch(controls: SearchControls) {
  const [isSearching, setIsSearching] = useState(false);
  const [loadingPlansKey, setLoadingPlansKey] = useState<string | null>(null);

  async function runPremiumSearch(
    selectedDeductibles: number[],
    selectedModels: InsuranceModel[],
    referencePremium: string,
    options: SearchOptions = {},
  ) {
    const { updateHistory = true, intent = controls.journey.intent } = options;
    const { selectedLocation } = controls;
    if (!selectedLocation || !controls.ageGroup || !controls.birthYear || !controls.accident || !selectedDeductibles.length || !selectedModels.length) {
      controls.setFormError("Complete each answer before comparing premiums.");
      return;
    }
    controls.setJourney((current) => journeyReducer(current, { type: "comparison_started" }));
    controls.setFormError("");
    setIsSearching(true);
    controls.setSearchNotice("");
    controls.setResults(null);
    try {
      const payload = await searchPremiums({
        canton: selectedLocation.canton,
        region: selectedLocation.premium_region,
        birthYear: controls.birthYear,
        accidentCoverage: controls.accident === "included",
        deductibles: selectedDeductibles,
        models: selectedModels,
        currentPremium: referencePremium,
      });
      controls.setResults(payload);
      controls.setJourney((current) => journeyReducer(current, { type: "comparison_succeeded" }));
      if (updateHistory && controls.journeyId && isJourneyUrlIntent(intent)) {
        window.history.pushState({}, "", serializeJourneyUrl({
          journeyId: controls.journeyId,
          step: "results",
          intent,
          location: selectedLocation,
          birthYear: Number(controls.birthYear),
          accident: controls.accident as Exclude<AccidentChoice, "">,
          models: selectedModels,
          deductibles: selectedDeductibles,
        }));
      }
      if (!payload.offers.length) controls.setSearchNotice("No published offers match every selected filter.");
    } catch (error) {
      controls.setSearchNotice(error instanceof Error ? error.message : "We couldn't load premiums right now. Please try again.");
      controls.setJourney((current) => journeyReducer(current, { type: "edit", stage: controls.journey.intent === "explore" ? "location" : "models" }));
    } finally {
      setIsSearching(false);
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      window.setTimeout(() => controls.resultsRef.current?.scrollIntoView({ behavior }), 50);
    }
  }

  async function loadMorePlans(franchise: number, activeModel: string) {
    const { results, selectedLocation } = controls;
    if (!results || !selectedLocation) return;
    const group = results.ranked_by_deductible.find(
      ({ deductible_chf }) => deductible_chf === franchise,
    );
    const ranking = activeModel === "all"
      ? group?.all_selected_models
      : group?.models.find(({ insurance_model }) => insurance_model === activeModel)?.ranking;
    if (!ranking || ranking.offers.length >= ranking.total_eligible_offers) return;

    const key = `${franchise}:${activeModel}`;
    if (loadingPlansKey === key) return;
    const selectedModels = activeModel === "all"
      ? results.query.insurance_models
      : [activeModel];
    setLoadingPlansKey(key);
    try {
      const page = await searchPremiumOfferPage({
        canton: selectedLocation.canton,
        region: selectedLocation.premium_region,
        birthYear: controls.birthYear,
        accidentCoverage: controls.accident === "included",
        deductible: franchise,
        models: selectedModels,
        currentPremium: controls.journey.intent === "compare_current"
          ? controls.currentPremium
          : "",
        offset: ranking.offers.length,
        limit: 10,
      });
      controls.setResults((current) => current
        ? mergePremiumOfferPage(current, franchise, activeModel, page)
        : current);
    } catch (error) {
      throw new Error(error instanceof Error
        ? error.message
        : "We couldn't load more premiums right now. Please try again.");
    } finally {
      setLoadingPlansKey(null);
    }
  }

  return { isSearching, loadMorePlans, loadingPlansKey, runPremiumSearch, setIsSearching };
}
