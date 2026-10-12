"use client";

import { useEffect, useRef, useState } from "react";

import {
  adultDeductibles,
  ageChoices,
  childDeductibles,
  modelChoices,
} from "./config";
import type {
  AccidentChoice,
  AgeGroup,
  ComparisonStep,
  Message,
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
  const [location, setLocation] = useState("");
  const [locationError, setLocationError] = useState("");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("");
  const [accident, setAccident] = useState<AccidentChoice>("");
  const [deductibles, setDeductibles] = useState<number[]>(adultDeductibles);
  const [models, setModels] = useState<string[]>(modelChoices.map(({ value }) => value));
  const [currentPremium, setCurrentPremium] = useState("");
  const [resetNotice, setResetNotice] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [searchNotice, setSearchNotice] = useState(false);
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setThreadId(crypto.randomUUID().replaceAll("-", ""));
  }, []);

  useEffect(() => {
    if (showPreview) resultsRef.current?.focus();
  }, [showPreview]);

  const availableDeductibles = ageGroup === "child" ? childDeductibles : adultDeductibles;
  const progressStep = Math.min(step, 6);
  const progress = Math.round((progressStep / 6) * 100);
  const ageLabel = ageChoices.find(({ value }) => value === ageGroup)?.label || "Not chosen";
  const accidentLabel =
    accident === "included" ? "Included" : accident === "excluded" ? "Excluded" : "Not chosen";
  const selectedModelLabels = modelChoices
    .filter(({ value }) => models.includes(value))
    .map(({ label }) => label);

  function goTo(nextStep: ComparisonStep) {
    setSearchNotice(false);
    setStep(nextStep);
  }

  function continueFromLocation() {
    if (!location.trim()) {
      setLocationError("Enter a municipality or four-digit postal code.");
      return;
    }
    setLocationError("");
    goTo(2);
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

  function comparePlans() {
    setSearchNotice(true);
    setShowPreview(true);
    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return {
    accident,
    accidentLabel,
    ageGroup,
    ageLabel,
    availableDeductibles,
    chooseAge,
    comparePlans,
    continueFromLocation,
    currentPremium,
    deductibles,
    draft,
    goTo,
    isSending,
    location,
    locationError,
    messages,
    models,
    progress,
    progressStep,
    resetNotice,
    resultsRef,
    searchNotice,
    selectedModelLabels,
    sendMessage,
    setAccident,
    setCurrentPremium,
    setDeductibles,
    setDraft,
    setLocation,
    setLocationError,
    setModels,
    showPreview,
    step,
    threadId,
    toggleDeductible,
    toggleModel,
  };
}

export type ComparisonFlow = ReturnType<typeof useComparisonFlow>;

