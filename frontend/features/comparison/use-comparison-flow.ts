"use client";
import { useEffect, useRef, useState } from "react";
import { applyAgentProfile } from "./agent-profile-sync";
import { adultDeductibles, ageChoices, ageGroupForBirthYear, birthYearError, childDeductibles, modelChoices } from "./config";
import { currentPremiumError } from "./current-premium-validation";
import { createJourneyId, tombstoneJourney } from "./journey-history";
import { serializeProfileJourneyUrl } from "./journey-navigation";
import { clearJourneyState, saveJourneyState } from "./journey-storage";
import { allSelection, createJourneyState, isPreviousOrCurrentStage, journeyReducer, selectedValues } from "./journey-machine";
import type { InsuranceModel, JourneyAction, JourneyIntent, JourneyStage } from "./journey-machine";
import { synchronizeDetails, synchronizePreferences } from "./journey-synchronizer";
import { isJourneyUrlIntent, serializeJourneyUrl } from "./journey-url";
import { officialInsurers } from "./insurer-links";
import type { AccidentChoice, PremiumSearchResponse } from "./types";
import { useGuideConversation } from "./use-guide-conversation";
import { useJourneyRestoration } from "./use-journey-restoration";
import { useLocationPicker } from "./use-location-picker";
import { usePremiumSearch } from "./use-premium-search";
export function useComparisonFlow() {
  const [journey, setJourney] = useState(createJourneyState);
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [restoredNotice, setRestoredNotice] = useState("");
  const locationPicker = useLocationPicker();
  const [birthYear, setBirthYearValue] = useState("");
  const [birthYearTouched, setBirthYearTouched] = useState(false);
  const [accident, setAccidentValue] = useState<AccidentChoice>("");
  const [deductibles, setDeductibles] = useState<number[]>(adultDeductibles);
  const [models, setModels] = useState<InsuranceModel[]>(
    modelChoices.map(({ value }) => value as InsuranceModel),
  );
  const [formError, setFormError] = useState("");
  const [results, setResults] = useState<PremiumSearchResponse | null>(null);
  const [searchNotice, setSearchNotice] = useState("");
  const resultsRef = useRef<HTMLElement>(null), hadResultsRef = useRef(false);
  const guide = useGuideConversation(journeyId, (response) => {
    applyAgentProfile(response.profile, response.comparison, {
      chooseLocation: locationPicker.chooseLocation, setBirthYear: setBirthYearValue,
      setAccident: setAccidentValue, setModels, setDeductibles, setJourney,
    });
    if (response.comparison) {
      setResults(response.comparison);
      setSearchNotice(response.comparison.offers.length ? "" : "No published offers match every selected filter.");
    }
  });
  function reduce(action: JourneyAction) {
    setJourney((current) => journeyReducer(current, action));
    setRestoredNotice("");
  }
  const ageGroup = ageGroupForBirthYear(birthYear);
  const premiumSearch = usePremiumSearch({
    accident, ageGroup, birthYear,
    currentPremium: guide.currentPremium,
    deductibles, journey, journeyId, models, results, resultsRef,
    selectedLocation: locationPicker.selectedLocation,
    setFormError, setJourney, setResults, setSearchNotice,
  });
  useJourneyRestoration({
    chooseLocation: locationPicker.chooseLocation,
    setAccident: setAccidentValue, setBirthYear: setBirthYearValue,
    setDeductibles, setHydrated,
    setIsSearching: premiumSearch.setIsSearching,
    setJourney, setJourneyId, setModels, setRestoredNotice, setResults, setSearchNotice,
  });
  useEffect(() => {
    if (!hydrated) return;
    try { saveJourneyState(window.sessionStorage, journey); } catch { /* optional */ }
  }, [hydrated, journey]);
  useEffect(() => {
    const receivedFirstResults = Boolean(results) && !hadResultsRef.current;
    if (receivedFirstResults || searchNotice) resultsRef.current?.focus();
    hadResultsRef.current = Boolean(results);
  }, [results, searchNotice]);
  const birthYearValidation = birthYearTouched ? birthYearError(birthYear) : "";
  const availableDeductibles = ageGroup === "child" ? childDeductibles : adultDeductibles;
  const ageLabel = ageChoices.find(({ value }) => value === ageGroup)?.label || "Not chosen";
  const currentInsurerName = officialInsurers.find(({ id }) => id === guide.currentInsurerId)?.name ?? "";
  const accidentLabel = accident === "included" ? "Included" : accident === "excluded" ? "Excluded" : "Not chosen";
  const journeyDraft = {
    location: locationPicker.selectedLocation, birthYear, accident, models, deductibles,
    allModelCount: modelChoices.length, allDeductibleCount: availableDeductibles.length,
  };
  function setBirthYear(value: string) {
    const nextAgeGroup = ageGroupForBirthYear(value);
    setBirthYearValue(value);
    if (nextAgeGroup && nextAgeGroup !== ageGroup) {
      setDeductibles(journey.intent === "compare_current"
        ? []
        : nextAgeGroup === "child" ? childDeductibles : adultDeductibles);
    }
    if (nextAgeGroup === "child") setAccidentValue("included");
    setFormError("");
  }
  function goToStage(target: JourneyStage) {
    setFormError("");
    setSearchNotice("");
    if (journey.stage === "results" || isPreviousOrCurrentStage(journey.stage, target)) {
      if (target !== "welcome" && target !== "results") reduce({ type: "edit", stage: target });
      if (target !== "results") setResults(null);
      if (target === "location" && journeyId && isJourneyUrlIntent(journey.intent)) {
        const url = locationPicker.selectedLocation && ageGroup && accident
          ? serializeProfileJourneyUrl({ journeyId, step: "details", intent: journey.intent, location: locationPicker.selectedLocation, birthYear, accident: accident as Exclude<AccidentChoice, "">, models, deductibles })
          : serializeJourneyUrl({ journeyId, step: "details", intent: journey.intent });
        window.history.pushState({}, "", url);
      }
      if (target === "models" && journeyId && isJourneyUrlIntent(journey.intent) && locationPicker.selectedLocation && ageGroup && accident) {
        window.history.pushState({}, "", serializeProfileJourneyUrl({ journeyId, step: "preferences", intent: journey.intent, location: locationPicker.selectedLocation, birthYear, accident: accident as Exclude<AccidentChoice, "">, models, deductibles }));
      }
      return;
    }
    if (journey.stage === "location" && locationPicker.selectedLocation) reduce({ type: "set_location", location: locationPicker.selectedLocation });
    else if (journey.stage === "birth_year" && ageGroup) reduce({ type: "set_birth_year", birthYear: Number(birthYear) });
    else if (journey.stage === "accident" && accident) reduce({ type: "set_accident", accident });
    else if (journey.stage === "models" && models.length) reduce({ type: "set_models", selection: models.length === modelChoices.length ? allSelection() : selectedValues(models) });
    else if (journey.stage === "deductibles" && deductibles.length) reduce({ type: "set_deductibles", selection: deductibles.length === availableDeductibles.length ? allSelection() : selectedValues(deductibles) });
    else if (target !== "welcome" && target !== "results") reduce({ type: "edit", stage: target });
  }
  async function continueFromDetails() {
    if (!locationPicker.selectedLocation || !ageGroup || !birthYear || !accident) {
      setFormError("Enter your postcode, birth year and accident cover.");
      return;
    }
    setFormError("");
    setSearchNotice("");
    setResults(null);
    const detailedJourney = synchronizeDetails(journey, journeyDraft);
    if (journeyId && isJourneyUrlIntent(journey.intent)) {
      window.history.replaceState({}, "", serializeProfileJourneyUrl({ journeyId, step: "details", intent: journey.intent, location: locationPicker.selectedLocation, birthYear, accident: accident as Exclude<AccidentChoice, "">, models, deductibles }));
    }
    if (journey.intent === "explore") {
      const withModels = journeyReducer(detailedJourney, {
        type: "set_models",
        selection: allSelection(),
      });
      const readyJourney = journeyReducer(withModels, {
        type: "set_deductibles",
        selection: allSelection(),
      });
      setJourney(readyJourney);
      await premiumSearch.runPremiumSearch(
        availableDeductibles,
        modelChoices.map(({ value }) => value as InsuranceModel),
        "",
        { intent: journey.intent },
      );
    } else {
      setJourney(detailedJourney);
      if (journeyId && isJourneyUrlIntent(journey.intent)) {
        window.history.pushState({}, "", serializeJourneyUrl({
          journeyId,
          step: "preferences",
          intent: journey.intent,
          location: locationPicker.selectedLocation,
          birthYear: Number(birthYear),
          accident: accident as Exclude<AccidentChoice, "">,
        }));
      }
    }
    setRestoredNotice("");
  }

  async function comparePlans() {
    if (journey.intent === "compare_current") {
      const premiumValidation = currentPremiumError(guide.currentPremium);
      if (premiumValidation) {
        setFormError(premiumValidation);
        return;
      }
      if (models.length !== 1 || deductibles.length !== 1) {
        setFormError("Choose the one insurance model and franchise you have now.");
        return;
      }
    }
    setJourney((current) => synchronizePreferences(current, journeyDraft));
    if (journeyId && isJourneyUrlIntent(journey.intent) && locationPicker.selectedLocation && accident) {
      window.history.replaceState({}, "", serializeProfileJourneyUrl({ journeyId, step: "preferences", intent: journey.intent, location: locationPicker.selectedLocation, birthYear, accident: accident as Exclude<AccidentChoice, "">, models, deductibles }));
    }
    await premiumSearch.runPremiumSearch(
      deductibles,
      models,
      journey.intent === "compare_current" ? guide.currentPremium : "",
      { intent: journey.intent },
    );
  }

  function toggleDeductible(value: number) { setDeductibles((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value].sort((a, b) => a - b)); }
  function toggleModel(value: string) { setModels((current) => current.includes(value as InsuranceModel) ? current.filter((item) => item !== value) : [...current, value as InsuranceModel]); }
  function restartJourney() {
    try {
      tombstoneJourney(window.sessionStorage, journeyId);
      clearJourneyState(window.sessionStorage);
    } catch { /* optional */ }
    setJourney(createJourneyState());
    setJourneyId(null);
    locationPicker.updateLocationQuery("");
    setBirthYearValue(""); setBirthYearTouched(false); setAccidentValue(""); setDeductibles(adultDeductibles);
    setModels(modelChoices.map(({ value }) => value as InsuranceModel));
    guide.resetConversation(); setResults(null); setSearchNotice("");
    setFormError(""); setRestoredNotice("");
    window.history.replaceState({}, "", "/");
  }

  function selectJourneyIntent(intent: JourneyIntent) {
    if (!isJourneyUrlIntent(intent)) return;
    const nextJourneyId = createJourneyId();
    setJourneyId(nextJourneyId);
    setJourney((current) => journeyReducer(current, { type: "select_intent", intent }));
    setResults(null);
    setSearchNotice("");
    setFormError("");
    guide.setCurrentPremium("");
    guide.setCurrentInsurerId("");
    window.history.pushState({}, "", serializeJourneyUrl({
      journeyId: nextJourneyId,
      step: "details",
      intent,
    }));
    if (intent === "compare_current") {
      setModels([]);
      setDeductibles([]);
    } else {
      setModels(modelChoices.map(({ value }) => value as InsuranceModel));
      setDeductibles(availableDeductibles);
    }
  }
  return {
    ...locationPicker, accident, accidentLabel, ageGroup, ageLabel, allModelCount: modelChoices.length,
    availableDeductibles, birthYear, birthYearError: birthYearValidation, chatAvailable: guide.isAvailable,
    comparePlans, currentInsurerId: guide.currentInsurerId, currentInsurerName, currentPremium: guide.currentPremium, deductibles, draft: guide.draft, formError,
    completedStages: {
      location: Boolean(journey.profile.location), birth_year: Boolean(journey.profile.birthYear),
      accident: Boolean(journey.profile.accident), models: Boolean(journey.profile.models),
      deductibles: Boolean(journey.profile.deductibles),
    },
    continueFromDetails, goToStage, isSearching: premiumSearch.isSearching, isSending: guide.isSending, journeyStage: journey.stage, loadMorePlans: premiumSearch.loadMorePlans, loadingPlansKey: premiumSearch.loadingPlansKey, location: locationPicker.selectedLocation?.label || "",
    journeyIntent: journey.intent, messages: guide.messages, models, restartJourney, restoredNotice, results, resultsRef, searchNotice, sendMessage: guide.sendMessage,
    setAccident: (value: AccidentChoice) => { setAccidentValue(value); setFormError(""); }, setBirthYear,
    touchBirthYear: () => setBirthYearTouched(true),
    setCurrentInsurerId: guide.setCurrentInsurerId, setCurrentPremium: guide.setCurrentPremium, setDraft: guide.setDraft, selectJourneyIntent, startJourney: () => reduce({ type: "start" }), threadId: guide.threadId,
    toggleDeductible, toggleModel, selectAllModels: () => setModels(modelChoices.map(({ value }) => value as InsuranceModel)),
    selectAllDeductibles: () => setDeductibles(availableDeductibles),
    selectSingleModel: (value: InsuranceModel) => { setModels([value]); setFormError(""); },
    selectSingleDeductible: (value: number) => { setDeductibles([value]); setFormError(""); },
    chooseSpecificModels: () => setModels((current) => current.length === modelChoices.length ? [] : current),
    chooseSpecificDeductibles: () => setDeductibles((current) => current.length === availableDeductibles.length ? [] : current),
  };
}
export type ComparisonFlow = ReturnType<typeof useComparisonFlow>;
