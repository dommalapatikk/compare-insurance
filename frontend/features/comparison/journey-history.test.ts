import { describe, expect, it } from "vitest";

import {
  createJourneyId,
  consumeJourneyRootHistoryReturn,
  isJourneyRestorable,
  JOURNEY_TOMBSTONES_KEY,
  markJourneyRootHistoryReturn,
  tombstoneJourney,
} from "./journey-history";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe("journey history lifecycle", () => {
  it("creates URL-safe opaque ids", () => {
    expect(createJourneyId(() => "123e4567-e89b-12d3-a456-426614174000"))
      .toBe("123e4567e89b12d3a456426614174000");
  });

  it("tombstones a restarted journey so a Back navigation cannot restore it", () => {
    const storage = new MemoryStorage();
    const oldJourneyId = "123e4567e89b12d3a456426614174000";

    expect(isJourneyRestorable(storage, oldJourneyId)).toBe(true);
    tombstoneJourney(storage, oldJourneyId);
    expect(isJourneyRestorable(storage, oldJourneyId)).toBe(false);
  });

  it("keeps every tab-lifetime tombstone so older Back entries stay invalid", () => {
    const storage = new MemoryStorage();
    for (let index = 0; index < 40; index += 1) {
      tombstoneJourney(storage, index.toString(16).padStart(32, "0"));
    }

    const snapshot = JSON.parse(storage.getItem(JOURNEY_TOMBSTONES_KEY) ?? "null") as { ids: string[] };
    expect(snapshot.ids).toHaveLength(40);
    expect(isJourneyRestorable(storage, "00000000000000000000000000000000")).toBe(false);
    expect(snapshot.ids.at(-1)).toBe("00000000000000000000000000000027");
    expect(isJourneyRestorable(storage, "unsafe!")).toBe(false);
  });

  it("consumes a browser-history return-to-root marker only once", () => {
    const storage = new MemoryStorage();
    expect(consumeJourneyRootHistoryReturn(storage)).toBe(false);
    markJourneyRootHistoryReturn(storage);
    expect(consumeJourneyRootHistoryReturn(storage)).toBe(true);
    expect(consumeJourneyRootHistoryReturn(storage)).toBe(false);
  });
});
