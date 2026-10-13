import type { Message } from "./types";
import { APP_SESSION_SCHEMA_VERSION } from "./session-version";

export const CONVERSATION_SCHEMA_VERSION = APP_SESSION_SCHEMA_VERSION;
export const CONVERSATION_STORAGE_KEY = "compare-insurance:conversation";
export const MAX_STORED_MESSAGES = 24;

export type ConversationState = {
  threadId: string;
  messages: Message[];
  currentPremium: string;
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCitation(value: unknown): boolean {
  return isRecord(value)
    && typeof value.title === "string"
    && typeof value.url === "string"
    && value.url.startsWith("https://");
}

function isMessage(value: unknown): value is Message {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  if (keys.some((key) => !["id", "role", "content", "citations"].includes(key))) return false;
  return typeof value.id === "string"
    && value.id.length > 0
    && (value.role === "user" || value.role === "assistant")
    && typeof value.content === "string"
    && value.content.length > 0
    && value.content.length <= 2_000
    && (value.citations === undefined
      || (Array.isArray(value.citations) && value.citations.every(isCitation)));
}

export function parseConversationSnapshot(raw: string): ConversationState | null {
  try {
    const snapshot: unknown = JSON.parse(raw);
    if (!isRecord(snapshot) || snapshot.schemaVersion !== CONVERSATION_SCHEMA_VERSION) return null;
    if (!isRecord(snapshot.state)) return null;
    if (Object.keys(snapshot.state).some(
      (key) => !["threadId", "messages", "currentPremium"].includes(key),
    )) return null;
    const { threadId, messages, currentPremium } = snapshot.state;
    if (typeof threadId !== "string" || !/^[A-Za-z0-9_-]{8,100}$/.test(threadId)) return null;
    if (!Array.isArray(messages) || messages.length > MAX_STORED_MESSAGES) return null;
    if (!messages.every(isMessage)) return null;
    if (typeof currentPremium !== "string" || !/^\d{0,6}(?:\.\d{0,2})?$/.test(currentPremium)) {
      return null;
    }
    return { threadId, messages, currentPremium };
  } catch {
    return null;
  }
}

export function loadConversationState(storage: StorageLike): ConversationState | null {
  const raw = storage.getItem(CONVERSATION_STORAGE_KEY);
  if (!raw) return null;

  const state = parseConversationSnapshot(raw);
  if (!state) storage.removeItem(CONVERSATION_STORAGE_KEY);
  return state;
}

export function saveConversationState(
  storage: StorageLike,
  state: ConversationState,
): void {
  storage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify({
    schemaVersion: CONVERSATION_SCHEMA_VERSION,
    state: {
      ...state,
      messages: state.messages.slice(-MAX_STORED_MESSAGES),
    },
  }));
}

export function clearConversationState(storage: StorageLike): void {
  storage.removeItem(CONVERSATION_STORAGE_KEY);
}
