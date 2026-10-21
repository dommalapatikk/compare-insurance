"use client";

import { useEffect, useState } from "react";

import { requestGuideAvailability, requestGuideReply } from "./comparison-api";
import {
  clearConversationState,
  conversationStateForJourney,
  loadConversationState,
  saveConversationState,
} from "./conversation-storage";
import type { ChatResponse, Message } from "./types";

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useGuideConversation(
  journeyId: string | null,
  onResponse: (response: ChatResponse) => void,
) {
  const [hydrated, setHydrated] = useState(false);
  const [threadId, setThreadId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentPremium, setCurrentPremium] = useState("");
  const [currentInsurerId, setCurrentInsurerId] = useState("");

  useEffect(() => {
    const urlJourneyId = new URL(window.location.href).searchParams.get("journeyId");
    const saved = conversationStateForJourney(
      loadConversationState(window.sessionStorage),
      urlJourneyId,
    );
    if (saved) {
      setThreadId(saved.threadId);
      setMessages(saved.messages);
      setCurrentPremium(saved.currentPremium);
      setCurrentInsurerId(saved.currentInsurerId ?? "");
    } else {
      setThreadId(crypto.randomUUID().replaceAll("-", ""));
    }
    setHydrated(true);
    void requestGuideAvailability().then(setIsAvailable);
  }, []);

  useEffect(() => {
    if (!hydrated || !threadId || !journeyId) return;
    try {
      saveConversationState(window.sessionStorage, {
        journeyId, threadId, messages, currentPremium, currentInsurerId,
      });
    } catch { /* optional */ }
  }, [currentInsurerId, currentPremium, hydrated, journeyId, messages, threadId]);

  async function sendMessage(text: string) {
    const message = text.trim();
    if (!message || !threadId || isSending) return;
    setMessages((current) => [...current, { id: makeId(), role: "user", content: message }]);
    setDraft("");
    setIsSending(true);
    try {
      const response = await requestGuideReply(message, threadId, messages);
      if (!response.message) throw new Error(response.detail || "No response.");
      setMessages((current) => [...current, {
        id: makeId(), role: "assistant", content: response.message!, citations: response.citations,
      }]);
      onResponse(response);
    } catch {
      setMessages((current) => [...current, {
        id: makeId(),
        role: "assistant",
        content: "Questions are temporarily unavailable. Your premium comparison still works.",
      }]);
    } finally {
      setIsSending(false);
    }
  }

  function resetConversation() {
    try { clearConversationState(window.sessionStorage); } catch { /* optional */ }
    setMessages([]);
    setCurrentPremium("");
    setCurrentInsurerId("");
    setDraft("");
    setThreadId(crypto.randomUUID().replaceAll("-", ""));
  }

  return {
    currentInsurerId, currentPremium, draft, isAvailable, isSending, messages, resetConversation, sendMessage,
    setCurrentInsurerId, setCurrentPremium, setDraft, threadId,
  };
}
