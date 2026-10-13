"use client";

import { useEffect, useRef, useState } from "react";

import {
  adultDeductibles,
  ageGroupForBirthYear,
  ageChoices,
  childDeductibles,
  modelChoices,
} from "./config";
import type {
  AccidentChoice,
  LocationSearchResponse,
  LocationSuggestion,
  Message,
  PremiumSearchResponse,
} from "./types";

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useComparisonFlow() {
  const [threadId, setThreadId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [locationNotice, setLocationNotice] = useState("");
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [activeLocationIndex, setActiveLocationIndex] = useState(-1);
  const [birthYear, setBirthYearValue] = useState("");
  const [accident, setAccident] = useState<AccidentChoice>("");
  const [deductibles, setDeductibles] = useState<number[]>(adultDeductibles);
  const [models, setModels] = useState<string[]>(modelChoices.map(({ value }) => value));
  const [currentPremium, setCurrentPremium] = useState("");
  const [formError, setFormError] = useState("");
  const [results, setResults] = useState<PremiumSearchResponse | null>(null);
  const [searchNotice, setSearchNotice] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => setThreadId(crypto.randomUUID().replaceAll("-", "")), []);
  useEffect(() => {
    if (results || searchNotice) resultsRef.current?.focus();
  }, [results, searchNotice]);

  useEffect(() => {
    const query = locationQuery.trim();
    if (query.length < 2 || selectedLocation?.label === query) {
      setLocationSuggestions([]);
      setActiveLocationIndex(-1);
      setLocationNotice("");
      setIsLoadingLocations(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoadingLocations(true);
      setLocationNotice("");
      try {
        const response = await fetch(`/api/locations?q=${encodeURIComponent(query)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as LocationSearchResponse & { detail?: string };
        if (!response.ok) throw new Error(payload.detail || "Location search is unavailable.");
        setLocationSuggestions(payload.locations);
        setActiveLocationIndex(payload.locations.length ? 0 : -1);
        setLocationNotice(payload.locations.length ? "" : "No Swiss postcode or municipality found.");
        setShowLocationSuggestions(true);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setLocationSuggestions([]);
        setActiveLocationIndex(-1);
        setLocationNotice("Location search is unavailable. Please try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoadingLocations(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [locationQuery, selectedLocation]);

  const ageGroup = ageGroupForBirthYear(birthYear);
  const availableDeductibles = ageGroup === "child" ? childDeductibles : adultDeductibles;
  const ageLabel = ageChoices.find(({ value }) => value === ageGroup)?.label || "Not chosen";
  const accidentLabel = accident === "included"
    ? "Included"
    : accident === "excluded" ? "Excluded" : "Not chosen";
  const location = selectedLocation?.label || "";

  function updateLocationQuery(value: string) {
    setLocationQuery(value);
    if (value !== selectedLocation?.label) setSelectedLocation(null);
    setShowLocationSuggestions(true);
    setActiveLocationIndex(-1);
    setFormError("");
  }

  function chooseLocation(value: LocationSuggestion) {
    setSelectedLocation(value);
    setLocationQuery(value.label);
    setLocationSuggestions([]);
    setActiveLocationIndex(-1);
    setLocationNotice("");
    setShowLocationSuggestions(false);
    setFormError("");
  }

  function moveLocationSelection(direction: 1 | -1) {
    if (!locationSuggestions.length) return;
    setShowLocationSuggestions(true);
    setActiveLocationIndex((current) => {
      if (current < 0) return direction === 1 ? 0 : locationSuggestions.length - 1;
      return (current + direction + locationSuggestions.length) % locationSuggestions.length;
    });
  }

  function chooseActiveLocation() {
    const location = locationSuggestions[activeLocationIndex];
    if (showLocationSuggestions && location) chooseLocation(location);
  }

  function setBirthYear(value: string) {
    const previousAgeGroup = ageGroup;
    const nextAgeGroup = ageGroupForBirthYear(value);
    setBirthYearValue(value);
    if (nextAgeGroup && nextAgeGroup !== previousAgeGroup) {
      setDeductibles(nextAgeGroup === "child" ? childDeductibles : adultDeductibles);
    }
    setFormError("");
  }

  function toggleDeductible(value: number) {
    setDeductibles((current) => current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value].sort((a, b) => a - b));
  }

  function toggleModel(value: string) {
    setModels((current) => current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]);
  }

  async function sendMessage(text: string) {
    const message = text.trim();
    if (!message || !threadId || isSending) return;
    setMessages((current) => [...current, { id: makeId(), role: "user", content: message }]);
    setDraft("");
    setIsSending(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, thread_id: threadId }),
      });
      const result = (await response.json()) as { message?: string; detail?: string };
      if (!response.ok || !result.message) throw new Error(result.detail || "No response.");
      setMessages((current) => [
        ...current,
        { id: makeId(), role: "assistant", content: result.message! },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: "assistant",
          content: "Questions are unavailable right now. You can still compare premiums and read the help topics.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function comparePlans() {
    if (!selectedLocation || !ageGroup || !birthYear || !accident) {
      setFormError("Choose your location, enter your birth year and select accident cover.");
      return;
    }
    if (!deductibles.length || !models.length) {
      setFormError("Choose at least one deductible and one insurance model.");
      return;
    }
    setFormError("");
    setIsSearching(true);
    setSearchNotice("");
    setResults(null);
    const params = new URLSearchParams({
      canton: selectedLocation.canton,
      region: selectedLocation.premium_region,
      birth_year: birthYear,
      accident_coverage: String(accident === "included"),
      year: "2027",
      top_n: "10",
    });
    deductibles.forEach((value) => params.append("deductible", String(value)));
    models.forEach((value) => params.append("insurance_model", value));
    if (currentPremium) params.set("reference_monthly_premium_chf", currentPremium);
    try {
      const response = await fetch(`/api/premiums?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json()) as PremiumSearchResponse & { detail?: string };
      if (!response.ok) throw new Error("We couldn't load premiums right now. Please try again.");
      setResults(payload);
      if (!payload.offers.length) setSearchNotice("No published offers match every selected filter.");
    } catch (error) {
      setSearchNotice(
        error instanceof Error
          ? error.message
          : "We couldn't load premiums right now. Please try again.",
      );
    } finally {
      setIsSearching(false);
      window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return {
    accident, accidentLabel, activeLocationIndex, ageGroup, ageLabel,
    availableDeductibles, birthYear, chooseActiveLocation, chooseLocation,
    comparePlans, currentPremium, deductibles, draft, formError,
    isLoadingLocations, isSearching, isSending, location, locationNotice,
    locationQuery, locationSuggestions, messages, models, results, resultsRef,
    searchNotice, selectedLocation, sendMessage, setAccident, setBirthYear,
    setActiveLocationIndex, setCurrentPremium, setDraft, setModels,
    setShowLocationSuggestions,
    showLocationSuggestions, threadId, toggleDeductible, toggleModel,
    updateLocationQuery, moveLocationSelection,
  };
}

export type ComparisonFlow = ReturnType<typeof useComparisonFlow>;
