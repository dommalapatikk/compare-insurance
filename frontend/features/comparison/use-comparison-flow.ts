"use client";

import { useEffect, useRef, useState } from "react";

import {
  adultDeductibles,
  ageChoices,
  childDeductibles,
  modelChoices,
  premiumRegionsFor,
} from "./config";
import type {
  AccidentChoice,
  AgeGroup,
  ComparisonStep,
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
  const [step, setStep] = useState<ComparisonStep>(1);
  const [canton, setCanton] = useState("");
  const [region, setRegion] = useState("");
  const [locationError, setLocationError] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("");
  const [accident, setAccident] = useState<AccidentChoice>("");
  const [deductibles, setDeductibles] = useState<number[]>(adultDeductibles);
  const [models, setModels] = useState<string[]>(modelChoices.map(({ value }) => value));
  const [currentPremium, setCurrentPremium] = useState("");
  const [resetNotice, setResetNotice] = useState("");
  const [results, setResults] = useState<PremiumSearchResponse | null>(null);
  const [searchNotice, setSearchNotice] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setThreadId(crypto.randomUUID().replaceAll("-", ""));
  }, []);

  useEffect(() => {
    if (results || searchNotice) resultsRef.current?.focus();
  }, [results, searchNotice]);

  const availableDeductibles = ageGroup === "child" ? childDeductibles : adultDeductibles;
  const progressStep = Math.min(step, 6);
  const progress = Math.round((progressStep / 6) * 100);
  const ageLabel = ageChoices.find(({ value }) => value === ageGroup)?.label || "Not chosen";
  const accidentLabel =
    accident === "included" ? "Included" : accident === "excluded" ? "Excluded" : "Not chosen";
  const selectedModelLabels = modelChoices
    .filter(({ value }) => models.includes(value))
    .map(({ label }) => label);
  const location = canton && region ? `${canton} · premium region ${region}` : "";
  const availableRegions = premiumRegionsFor(canton);

  function goTo(nextStep: ComparisonStep) {
    setSearchNotice("");
    setStep(nextStep);
  }

  function continueFromLocation() {
    if (!canton || !region) {
      setLocationError("Choose both a canton and an official premium region.");
      return;
    }
    setLocationError("");
    goTo(2);
  }

  function chooseCanton(value: string) {
    const available = premiumRegionsFor(value);
    setCanton(value);
    setRegion(available.length === 1 ? available[0] : "");
    setLocationError("");
  }

  function chooseAge(value: AgeGroup) {
    const choices = value === "child" ? childDeductibles : adultDeductibles;
    if (ageGroup && ageGroup !== value) {
      setResetNotice(
        "Deductibles were reset because valid choices depend on the age category.",
      );
    }
    setAgeGroup(value);
    setDeductibles(choices);
  }

  function toggleDeductible(value: number) {
    setDeductibles((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value].sort((a, b) => a - b),
    );
  }

  function toggleModel(value: string) {
    setModels((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  async function sendMessage(text: string) {
    const message = text.trim();
    if (!message || !threadId || isSending) return;

    setMessages((current) => [
      ...current,
      { id: makeId(), role: "user", content: message },
    ]);
    setDraft("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, thread_id: threadId }),
      });
      const result = (await response.json()) as { message?: string; detail?: string };
      if (!response.ok || !result.message) {
        throw new Error(result.detail || "The guide did not return a message.");
      }
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
          content: "The guide is temporarily unavailable. Your comparison answers are still here.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function comparePlans() {
    if (!canton || !region || !ageGroup || !accident) return;
    setIsSearching(true);
    setSearchNotice("");
    setResults(null);
    const params = new URLSearchParams({
      canton,
      region,
      age_category: ageGroup,
      accident_coverage: String(accident === "included"),
      year: "2027",
      top_n: "10",
    });
    deductibles.forEach((value) => params.append("deductible", String(value)));
    models.forEach((value) => params.append("insurance_model", value));
    if (currentPremium) {
      params.set("reference_monthly_premium_chf", currentPremium);
    }
    try {
      const response = await fetch(`/api/premiums?${params.toString()}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as PremiumSearchResponse & {
        detail?: string;
      };
      if (!response.ok) throw new Error(payload.detail || "Comparison failed.");
      setResults(payload);
      if (payload.offers.length === 0) {
        setSearchNotice("No published offers matched every selected filter.");
      }
    } catch (error) {
      setSearchNotice(
        error instanceof Error ? error.message : "The comparison service is unavailable.",
      );
    } finally {
      setIsSearching(false);
      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }

  return {
    accident,
    accidentLabel,
    ageGroup,
    ageLabel,
    availableDeductibles,
    availableRegions,
    canton,
    chooseCanton,
    chooseAge,
    comparePlans,
    continueFromLocation,
    currentPremium,
    deductibles,
    draft,
    goTo,
    isSending,
    isSearching,
    location,
    locationError,
    messages,
    models,
    progress,
    progressStep,
    resetNotice,
    resultsRef,
    results,
    searchNotice,
    selectedModelLabels,
    sendMessage,
    setAccident,
    setCurrentPremium,
    setDeductibles,
    setDraft,
    setLocationError,
    setModels,
    setRegion,
    step,
    threadId,
    toggleDeductible,
    toggleModel,
    region,
  };
}

export type ComparisonFlow = ReturnType<typeof useComparisonFlow>;

