"use client";

import { useEffect, useRef, useState } from "react";

import { requestGuideReply, searchPremiums } from "./comparison-api";
import { clearConversationState, loadConversationState, saveConversationState } from "./conversation-storage";
import { adultDeductibles, ageChoices, ageGroupForBirthYear, childDeductibles, modelChoices } from "./config";
import { clearJourneyState, loadJourneyState, saveJourneyState } from "./journey-storage";
import {
  allSelection, createJourneyState, journeyReducer, resolveDeductibles,
  resolveModels, selectedValues,
} from "./journey-machine";
import type { InsuranceModel, JourneyAction, JourneyStage } from "./journey-machine";
import type { AccidentChoice, ChatProfile, LocationSuggestion, Message, PremiumSearchResponse } from "./types";
import { useLocationPicker } from "./use-location-picker";

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function completeLocation(value: ChatProfile["resolved_location"]): value is LocationSuggestion {
  if (!value) return false;
  return ["postal_code", "locality", "municipality_id", "municipality_name", "label", "canton", "premium_region"]
    .every((key) => typeof value[key as keyof typeof value] === "string");
}

export function useComparisonFlow() {
  const [journey, setJourney] = useState(createJourneyState);
  const [hydrated, setHydrated] = useState(false);
  const [restoredNotice, setRestoredNotice] = useState("");
  const [threadId, setThreadId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const locationPicker = useLocationPicker();
  const [birthYear, setBirthYearValue] = useState("");
  const [accident, setAccidentValue] = useState<AccidentChoice>("");
  const [deductibles, setDeductibles] = useState<number[]>(adultDeductibles);
  const [models, setModels] = useState<InsuranceModel[]>(
    modelChoices.map(({ value }) => value as InsuranceModel),
  );
  const [currentPremium, setCurrentPremium] = useState("");
  const [formError, setFormError] = useState("");
  const [results, setResults] = useState<PremiumSearchResponse | null>(null);
  const [searchNotice, setSearchNotice] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const resultsRef = useRef<HTMLElement>(null);

  function reduce(action: JourneyAction) {
    setJourney((current) => journeyReducer(current, action));
    setRestoredNotice("");
  }

  useEffect(() => {
    try {
      const savedJourney = loadJourneyState(window.sessionStorage);
      const savedConversation = loadConversationState(window.sessionStorage);
      if (savedJourney) {
        const restored = savedJourney.stage === "results"
          ? journeyReducer(savedJourney, { type: "edit", stage: "review" })
          : savedJourney;
        setJourney(restored);
        const profile = restored.profile;
        if (profile.location) locationPicker.chooseLocation(profile.location);
        if (profile.birthYear) setBirthYearValue(String(profile.birthYear));
        if (profile.accident) setAccidentValue(profile.accident);
        if (profile.models) setModels(resolveModels(profile));
        if (profile.deductibles) setDeductibles(resolveDeductibles(profile));
        setRestoredNotice(savedJourney.stage === "results"
          ? "Your answers were restored. Compare again to refresh the official premiums."
          : "Your answers were restored for this browser tab.");
      }
      if (savedConversation) {
        setThreadId(savedConversation.threadId);
        setMessages(savedConversation.messages);
        setCurrentPremium(savedConversation.currentPremium);
      } else {
        setThreadId(crypto.randomUUID().replaceAll("-", ""));
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
    if (!hydrated || !threadId) return;
    try {
      saveConversationState(window.sessionStorage, { threadId, messages, currentPremium });
    } catch { /* optional */ }
  }, [currentPremium, hydrated, messages, threadId]);
  useEffect(() => {
    if (results || searchNotice) resultsRef.current?.focus();
  }, [results, searchNotice]);

  const ageGroup = ageGroupForBirthYear(birthYear);
  const availableDeductibles = ageGroup === "child" ? childDeductibles : adultDeductibles;
  const ageLabel = ageChoices.find(({ value }) => value === ageGroup)?.label || "Not chosen";
  const accidentLabel = accident === "included" ? "Included" : accident === "excluded" ? "Excluded" : "Not chosen";

  function setBirthYear(value: string) {
    const nextAgeGroup = ageGroupForBirthYear(value);
    setBirthYearValue(value);
    if (nextAgeGroup && nextAgeGroup !== ageGroup) {
      setDeductibles(nextAgeGroup === "child" ? childDeductibles : adultDeductibles);
    }
    setFormError("");
  }

  function goToStage(target: JourneyStage) {
    setFormError("");
    setSearchNotice("");
    if (journey.stage === "results" || target === journey.stage) {
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

  function applyAgentProfile(profile?: ChatProfile, comparison?: PremiumSearchResponse) {
    if (!profile) return;
    const resolved = completeLocation(profile.resolved_location) ? profile.resolved_location : null;
    if (resolved) locationPicker.chooseLocation(resolved);
    if (profile.birth_year) setBirthYearValue(String(profile.birth_year));
    if (profile.accident_coverage !== undefined) setAccidentValue(profile.accident_coverage ? "included" : "excluded");
    const trustedModels = (profile.insurance_models || []).filter((value): value is InsuranceModel => modelChoices.some((choice) => choice.value === value));
    if (trustedModels.length) setModels(trustedModels);
    if (profile.deductibles?.length) setDeductibles(profile.deductibles);
    setJourney((current) => {
      let next = current;
      if (resolved) next = journeyReducer(next, { type: "set_location", location: resolved });
      if (profile.birth_year) next = journeyReducer(next, { type: "set_birth_year", birthYear: profile.birth_year });
      if (profile.accident_coverage !== undefined) next = journeyReducer(next, { type: "set_accident", accident: profile.accident_coverage ? "included" : "excluded" });
      if (trustedModels.length) next = journeyReducer(next, { type: "set_models", selection: trustedModels.length === modelChoices.length ? allSelection() : selectedValues(trustedModels) });
      if (profile.deductibles?.length) next = journeyReducer(next, { type: "set_deductibles", selection: selectedValues(profile.deductibles) });
      return comparison ? journeyReducer(next, { type: "comparison_succeeded" }) : next;
    });
  }

  async function sendMessage(text: string) {
    const message = text.trim();
    if (!message || !threadId || isSending) return;
    setMessages((current) => [...current, { id: makeId(), role: "user", content: message }]);
    setDraft(""); setIsSending(true);
    try {
      const response = await requestGuideReply(message, threadId, messages);
      if (!response.message) throw new Error(response.detail || "No response.");
      setMessages((current) => [...current, { id: makeId(), role: "assistant", content: response.message!, citations: response.citations }]);
      applyAgentProfile(response.profile, response.comparison);
      if (response.comparison) {
        setResults(response.comparison);
        setSearchNotice(response.comparison.offers.length ? "" : "No published offers match every selected filter.");
      }
    } catch {
      setMessages((current) => [...current, { id: makeId(), role: "assistant", content: "Questions are unavailable right now. You can still use the guided comparison and help topics." }]);
    } finally { setIsSending(false); }
  }

  async function comparePlans() {
    const selectedLocation = locationPicker.selectedLocation;
    if (!selectedLocation || !ageGroup || !birthYear || !accident || !deductibles.length || !models.length) {
      setFormError("Complete each answer before comparing premiums."); return;
    }
    setFormError(""); setIsSearching(true); setSearchNotice(""); setResults(null);
    try {
      const payload = await searchPremiums({ canton: selectedLocation.canton, region: selectedLocation.premium_region, birthYear, accidentCoverage: accident === "included", deductibles, models, currentPremium });
      setResults(payload);
      setJourney((current) => journeyReducer(current, { type: "comparison_succeeded" }));
      if (!payload.offers.length) setSearchNotice("No published offers match every selected filter.");
    } catch (error) {
      setSearchNotice(error instanceof Error ? error.message : "We couldn't load premiums right now. Please try again.");
    } finally {
      setIsSearching(false);
      window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  function toggleDeductible(value: number) { setDeductibles((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value].sort((a, b) => a - b)); }
  function toggleModel(value: string) { setModels((current) => current.includes(value as InsuranceModel) ? current.filter((item) => item !== value) : [...current, value as InsuranceModel]); }
  function restartJourney() {
    try {
      clearJourneyState(window.sessionStorage);
      clearConversationState(window.sessionStorage);
    } catch { /* optional */ }
    setJourney(createJourneyState());
    locationPicker.updateLocationQuery("");
    setBirthYearValue(""); setAccidentValue(""); setDeductibles(adultDeductibles);
    setModels(modelChoices.map(({ value }) => value as InsuranceModel));
    setMessages([]); setCurrentPremium(""); setResults(null); setSearchNotice("");
    setFormError(""); setRestoredNotice(""); setThreadId(crypto.randomUUID().replaceAll("-", ""));
  }

  return {
    ...locationPicker, accident, accidentLabel, ageGroup, ageLabel, allModelCount: modelChoices.length,
    availableDeductibles, birthYear, comparePlans, currentPremium, deductibles, draft, formError,
    completedStages: {
      location: Boolean(journey.profile.location), birth_year: Boolean(journey.profile.birthYear),
      accident: Boolean(journey.profile.accident), models: Boolean(journey.profile.models),
      deductibles: Boolean(journey.profile.deductibles),
    },
    goToStage, isSearching, isSending, journeyStage: journey.stage, location: locationPicker.selectedLocation?.label || "",
    messages, models, restartJourney, restoredNotice, results, resultsRef, searchNotice, sendMessage,
    setAccident: (value: AccidentChoice) => { setAccidentValue(value); setFormError(""); }, setBirthYear,
    setCurrentPremium, setDraft, startJourney: () => reduce({ type: "start" }), threadId,
    toggleDeductible, toggleModel, selectAllModels: () => setModels(modelChoices.map(({ value }) => value as InsuranceModel)),
    selectAllDeductibles: () => setDeductibles(availableDeductibles),
  };
}

export type ComparisonFlow = ReturnType<typeof useComparisonFlow>;
