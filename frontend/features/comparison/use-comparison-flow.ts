"use client";
import { useEffect, useRef, useState } from "react";
import { applyAgentProfile } from "./agent-profile-sync";
import { searchPremiums } from "./comparison-api";
import { adultDeductibles, ageChoices, ageGroupForBirthYear, childDeductibles, modelChoices } from "./config";
import { clearJourneyState, loadJourneyState, saveJourneyState } from "./journey-storage";
import { allSelection, createJourneyState, isPreviousOrCurrentStage, journeyReducer, resolveDeductibles, resolveModels, selectedValues } from "./journey-machine";
import type { InsuranceModel, JourneyAction, JourneyIntent, JourneyStage } from "./journey-machine";
import { synchronizeDetails, synchronizePreferences } from "./journey-synchronizer";
import type { AccidentChoice, PremiumSearchResponse } from "./types";
import { useGuideConversation } from "./use-guide-conversation";
import { useLocationPicker } from "./use-location-picker";
export function useComparisonFlow() {
  const [journey, setJourney] = useState(createJourneyState);
  const [hydrated, setHydrated] = useState(false);
  const [restoredNotice, setRestoredNotice] = useState("");
  const locationPicker = useLocationPicker();
  const [birthYear, setBirthYearValue] = useState("");
  const [accident, setAccidentValue] = useState<AccidentChoice>("");
  const [deductibles, setDeductibles] = useState<number[]>(adultDeductibles);
  const [models, setModels] = useState<InsuranceModel[]>(
    modelChoices.map(({ value }) => value as InsuranceModel),
  );
  const [formError, setFormError] = useState("");
  const [results, setResults] = useState<PremiumSearchResponse | null>(null);
  const [searchNotice, setSearchNotice] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const resultsRef = useRef<HTMLElement>(null);
  const guide = useGuideConversation((response) => {
    applyAgentProfile(response.profile, response.comparison, {
      chooseLocation: locationPicker.chooseLocation,
      setBirthYear: setBirthYearValue,
      setAccident: setAccidentValue,
      setModels,
      setDeductibles,
      setJourney,
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
  useEffect(() => {
    try {
      const savedJourney = loadJourneyState(window.sessionStorage);
      if (savedJourney) {
        const restored = savedJourney.stage === "results"
          ? journeyReducer(savedJourney, { type: "edit", stage: savedJourney.intent === "explore" ? "location" : "models" })
          : savedJourney;
        setJourney(restored);
        const profile = restored.profile;
        if (profile.location) locationPicker.chooseLocation(profile.location);
        if (profile.birthYear) setBirthYearValue(String(profile.birthYear));
        if (profile.accident) setAccidentValue(profile.accident);
        if (profile.models) setModels(resolveModels(profile));
        if (profile.deductibles) setDeductibles(resolveDeductibles(profile));
        const hasSavedAnswers = Object.values(savedJourney.profile).some((value) => value !== null);
        if (hasSavedAnswers) {
          setRestoredNotice(savedJourney.stage === "results"
            ? "Your answers were restored. Compare again to refresh the official premiums."
            : "Your answers were restored for this browser tab.");
        }
      }
    } finally {
      setHydrated(true);
    }
    // The location picker is intentionally hydrated once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { saveJourneyState(window.sessionStorage, journey); } catch { /* optional */ }
  }, [hydrated, journey]);
  useEffect(() => {
    if (results || searchNotice) resultsRef.current?.focus();
  }, [results, searchNotice]);
  const ageGroup = ageGroupForBirthYear(birthYear);
  const availableDeductibles = ageGroup === "child" ? childDeductibles : adultDeductibles;
  const ageLabel = ageChoices.find(({ value }) => value === ageGroup)?.label || "Not chosen";
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
    setFormError("");
  }

  function goToStage(target: JourneyStage) {
    setFormError("");
    setSearchNotice("");
    if (journey.stage === "results" || isPreviousOrCurrentStage(journey.stage, target)) {
      if (target !== "welcome" && target !== "results") reduce({ type: "edit", stage: target });
      if (target !== "results") setResults(null);
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
      await runPremiumSearch(availableDeductibles, modelChoices.map(({ value }) => value as InsuranceModel), "");
    } else {
      setJourney(detailedJourney);
    }
    setRestoredNotice("");
  }

  async function runPremiumSearch(
    selectedDeductibles: number[],
    selectedModels: InsuranceModel[],
    referencePremium: string,
  ) {
    const selectedLocation = locationPicker.selectedLocation;
    if (!selectedLocation || !ageGroup || !birthYear || !accident || !selectedDeductibles.length || !selectedModels.length) {
      setFormError("Complete each answer before comparing premiums."); return;
    }
    setJourney((current) => journeyReducer(current, { type: "comparison_started" }));
    setFormError(""); setIsSearching(true); setSearchNotice(""); setResults(null);
    try {
      const payload = await searchPremiums({
        canton: selectedLocation.canton,
        region: selectedLocation.premium_region,
        birthYear,
        accidentCoverage: accident === "included",
        deductibles: selectedDeductibles,
        models: selectedModels,
        currentPremium: referencePremium,
      });
      setResults(payload);
      setJourney((current) => journeyReducer(current, { type: "comparison_succeeded" }));
      if (!payload.offers.length) setSearchNotice("No published offers match every selected filter.");
    } catch (error) {
      setSearchNotice(error instanceof Error ? error.message : "We couldn't load premiums right now. Please try again.");
      setJourney((current) => journeyReducer(current, { type: "edit", stage: journey.intent === "explore" ? "location" : "models" }));
    } finally {
      setIsSearching(false);
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth";
      window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior }), 50);
    }
  }

  async function comparePlans() {
    if (journey.intent === "compare_current") {
      const premium = Number(guide.currentPremium);
      if (!Number.isFinite(premium) || premium <= 0) {
        setFormError("Enter the monthly premium you pay now.");
        return;
      }
      if (models.length !== 1 || deductibles.length !== 1) {
        setFormError("Choose the one insurance model and franchise you have now.");
        return;
      }
    }
    setJourney((current) => synchronizePreferences(current, journeyDraft));
    await runPremiumSearch(
      deductibles,
      models,
      journey.intent === "compare_current" ? guide.currentPremium : "",
    );
  }

  function toggleDeductible(value: number) { setDeductibles((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value].sort((a, b) => a - b)); }
  function toggleModel(value: string) { setModels((current) => current.includes(value as InsuranceModel) ? current.filter((item) => item !== value) : [...current, value as InsuranceModel]); }
  function restartJourney() {
    try {
      clearJourneyState(window.sessionStorage);
    } catch { /* optional */ }
    setJourney(createJourneyState());
    locationPicker.updateLocationQuery("");
    setBirthYearValue(""); setAccidentValue(""); setDeductibles(adultDeductibles);
    setModels(modelChoices.map(({ value }) => value as InsuranceModel));
    guide.resetConversation(); setResults(null); setSearchNotice("");
    setFormError(""); setRestoredNotice("");
  }

  function selectJourneyIntent(intent: JourneyIntent) {
    setJourney((current) => journeyReducer(current, { type: "select_intent", intent }));
    setResults(null);
    setSearchNotice("");
    setFormError("");
    guide.setCurrentPremium("");
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
    availableDeductibles, birthYear, comparePlans, currentPremium: guide.currentPremium, deductibles, draft: guide.draft, formError,
    completedStages: {
      location: Boolean(journey.profile.location), birth_year: Boolean(journey.profile.birthYear),
      accident: Boolean(journey.profile.accident), models: Boolean(journey.profile.models),
      deductibles: Boolean(journey.profile.deductibles),
    },
    continueFromDetails, goToStage, isSearching, isSending: guide.isSending, journeyStage: journey.stage, location: locationPicker.selectedLocation?.label || "",
    journeyIntent: journey.intent, messages: guide.messages, models, restartJourney, restoredNotice, results, resultsRef, searchNotice, sendMessage: guide.sendMessage,
    setAccident: (value: AccidentChoice) => { setAccidentValue(value); setFormError(""); }, setBirthYear,
    setCurrentPremium: guide.setCurrentPremium, setDraft: guide.setDraft, selectJourneyIntent, startJourney: () => reduce({ type: "start" }), threadId: guide.threadId,
    toggleDeductible, toggleModel, selectAllModels: () => setModels(modelChoices.map(({ value }) => value as InsuranceModel)),
    selectAllDeductibles: () => setDeductibles(availableDeductibles),
    selectSingleModel: (value: InsuranceModel) => { setModels([value]); setFormError(""); },
    selectSingleDeductible: (value: number) => { setDeductibles([value]); setFormError(""); },
    chooseSpecificModels: () => setModels((current) => current.length === modelChoices.length ? [] : current),
    chooseSpecificDeductibles: () => setDeductibles((current) => current.length === availableDeductibles.length ? [] : current),
  };
}

export type ComparisonFlow = ReturnType<typeof useComparisonFlow>;
