import { describe, expect, it } from "vitest";

import {
  CONVERSATION_SCHEMA_VERSION,
  CONVERSATION_STORAGE_KEY,
  clearConversationState,
  loadConversationState,
  parseConversationSnapshot,
  saveConversationState,
} from "./conversation-storage";

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe("conversation session storage", () => {
  it("round-trips bounded, source-linked chat state", () => {
    const storage = new MemoryStorage();
    const state = {
      threadId: "thread_123456",
      currentPremium: "412.50",
      messages: [{
        id: "m1",
        role: "assistant" as const,
        content: "Official guidance",
        citations: [{ title: "BAG", url: "https://www.bag.admin.ch/" }],
      }],
    };
    saveConversationState(storage, state);
    expect(loadConversationState(storage)).toEqual(state);
    expect(storage.getItem(CONVERSATION_STORAGE_KEY)).not.toBeNull();
    clearConversationState(storage);
    expect(storage.getItem(CONVERSATION_STORAGE_KEY)).toBeNull();
  });

  it("removes an outdated conversation instead of restoring it again", () => {
    const storage = new MemoryStorage();
    storage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify({
      schemaVersion: CONVERSATION_SCHEMA_VERSION - 1,
      state: { threadId: "thread_123456", currentPremium: "", messages: [] },
    }));

    expect(loadConversationState(storage)).toBeNull();
    expect(storage.getItem(CONVERSATION_STORAGE_KEY)).toBeNull();
  });

  it("rejects executable links, excessive history and unknown fields", () => {
    const valid = {
      schemaVersion: CONVERSATION_SCHEMA_VERSION,
      state: { threadId: "thread_123456", currentPremium: "", messages: [] },
    };
    expect(parseConversationSnapshot(JSON.stringify({
      ...valid,
      state: { ...valid.state, secret: "no" },
    }))).toBeNull();
    expect(parseConversationSnapshot(JSON.stringify({
      ...valid,
      state: {
        ...valid.state,
        messages: Array.from({ length: 25 }, (_, index) => ({
          id: `m${index}`, role: "user", content: "hello",
        })),
      },
    }))).toBeNull();
    expect(parseConversationSnapshot(JSON.stringify({
      ...valid,
      state: {
        ...valid.state,
        messages: [{
          id: "m1", role: "assistant", content: "bad",
          citations: [{ title: "bad", url: "javascript:alert(1)" }],
        }],
      },
    }))).toBeNull();
  });
});
