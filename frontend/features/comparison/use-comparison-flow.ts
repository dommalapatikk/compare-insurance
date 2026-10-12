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
  const [canton, setCanton] = useState("");
  const [region, setRegion] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("adult");
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

  const availableDeductibles = ageGroup === "child" ? childDeductibles : adultDeductibles;
  const availableRegions = premiumRegionsFor(canton);
  const ageLabel = ageChoices.find(({ value }) => value === ageGroup)?.label || "Not chosen";
  const accidentLabel = accident === "included" ? "Included" : "Excluded";
  const location = canton && region ? `${canton} · premium region ${region}` : "";

  function chooseCanton(value: string) {
    const regions = premiumRegionsFor(value);
    setCanton(value);
    setRegion(regions.length === 1 ? regions[0] : "");
    setFormError("");
  }

  function chooseAge(value: AgeGroup) {
    setAgeGroup(value);
    setDeductibles(value === "child" ? childDeductibles : adultDeductibles);
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
          content: "The AI guide is unavailable. The official explanations above and price comparison still work.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function comparePlans() {
    if (!canton || !region || !ageGroup || !accident) {
      setFormError("Choose your location, age category, and accident coverage.");
      return;
    }
    if (!deductibles.length || !models.length) {
      setFormError("Select at least one franchise and one insurance model.");
      return;
    }
    setFormError("");
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
    if (currentPremium) params.set("reference_monthly_premium_chf", currentPremium);
    try {
      const response = await fetch(`/api/premiums?${params.toString()}`, { cache: "no-store" });
      const payload = (await response.json()) as PremiumSearchResponse & { detail?: string };
      if (!response.ok) throw new Error(payload.detail || "Comparison failed.");
      setResults(payload);
      if (!payload.offers.length) setSearchNotice("No published offers match every selected filter.");
    } catch (error) {
      setSearchNotice(error instanceof Error ? error.message : "Comparison unavailable.");
    } finally {
      setIsSearching(false);
      window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return {
    accident, accidentLabel, ageGroup, ageLabel, availableDeductibles, availableRegions,
    canton, chooseAge, chooseCanton, comparePlans, currentPremium, deductibles, draft,
    formError, isSearching, isSending, location, messages, models, region, results,
    resultsRef, searchNotice, sendMessage, setAccident, setCurrentPremium, setDraft,
    setModels, setRegion, threadId, toggleDeductible, toggleModel,
  };
}

export type ComparisonFlow = ReturnType<typeof useComparisonFlow>;
