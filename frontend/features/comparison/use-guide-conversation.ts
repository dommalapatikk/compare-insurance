"use client";

import { useEffect, useState } from "react";

import { requestGuideReply } from "./comparison-api";
import { clearConversationState, loadConversationState, saveConversationState } from "./conversation-storage";
import type { ChatResponse, Message } from "./types";

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useGuideConversation(onResponse: (response: ChatResponse) => void) {
  const [hydrated, setHydrated] = useState(false);
  const [threadId, setThreadId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [currentPremium, setCurrentPremium] = useState("");

  useEffect(() => {
    const saved = loadConversationState(window.sessionStorage);
    if (saved) {
      setThreadId(saved.threadId);
      setMessages(saved.messages);
      setCurrentPremium(saved.currentPremium);
    } else {
      setThreadId(crypto.randomUUID().replaceAll("-", ""));
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !threadId) return;
    try {
      saveConversationState(window.sessionStorage, { threadId, messages, currentPremium });
    } catch { /* optional */ }
  }, [currentPremium, hydrated, messages, threadId]);

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
        content: "Questions are unavailable right now. You can still use the guided comparison and help topics.",
      }]);
    } finally {
      setIsSending(false);
    }
  }

  function resetConversation() {
    try { clearConversationState(window.sessionStorage); } catch { /* optional */ }
    setMessages([]);
    setCurrentPremium("");
    setDraft("");
    setThreadId(crypto.randomUUID().replaceAll("-", ""));
  }

  return {
    currentPremium, draft, isSending, messages, resetConversation, sendMessage,
    setCurrentPremium, setDraft, threadId,
  };
}
