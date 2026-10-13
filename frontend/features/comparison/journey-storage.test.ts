import { describe, expect, it } from "vitest";

import {
  JOURNEY_SCHEMA_VERSION,
  JOURNEY_STORAGE_KEY,
  clearJourneyState,
  loadJourneyState,
  parseJourneySnapshot,
  saveJourneyState,
  serializeJourneySnapshot,
} from "./journey-storage";
import {
  allSelection,
  createJourneyState,
  journeyReducer,
} from "./journey-machine";
import type { JourneyState } from "./journey-machine";

function readyState(): JourneyState {
  let state = journeyReducer(createJourneyState(), { type: "start" });
  state = journeyReducer(state, {
    type: "set_location",
    location: {
      postal_code: "3011",
      locality: "Bern",
      municipality_id: "351",
      municipality_name: "Bern",
      canton: "BE",
      premium_region: "1",
      label: "3011 Bern, BE",
    },
  });
  state = journeyReducer(state, { type: "set_birth_year", birthYear: 1980 });
  state = journeyReducer(state, { type: "set_accident", accident: "excluded" });
  state = journeyReducer(state, { type: "set_models", selection: allSelection() });
  return journeyReducer(state, { type: "set_deductibles", selection: allSelection() });
}

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

describe("guided journey session storage", () => {
  it("round-trips a valid journey snapshot", () => {
    const state = readyState();
    expect(parseJourneySnapshot(serializeJourneySnapshot(state))).toEqual(state);
  });

  it("saves, loads and clears through the storage boundary", () => {
    const storage = new MemoryStorage();
    const state = readyState();
    saveJourneyState(storage, state);
    expect(loadJourneyState(storage)).toEqual(state);
    clearJourneyState(storage);
    expect(storage.getItem(JOURNEY_STORAGE_KEY)).toBeNull();
  });

  it("removes an outdated snapshot instead of restoring it again", () => {
    const storage = new MemoryStorage();
    storage.setItem(JOURNEY_STORAGE_KEY, JSON.stringify({
      schemaVersion: JOURNEY_SCHEMA_VERSION - 1,
      state: readyState(),
    }));

    expect(loadJourneyState(storage)).toBeNull();
    expect(storage.getItem(JOURNEY_STORAGE_KEY)).toBeNull();
  });

  it("rejects malformed, outdated or gender-bearing snapshots", () => {
    expect(parseJourneySnapshot("not-json")).toBeNull();
    expect(parseJourneySnapshot(JSON.stringify({ schemaVersion: JOURNEY_SCHEMA_VERSION - 1, state: readyState() })))
      .toBeNull();

    const state = readyState();
    const profile = { ...state.profile, gender: "female" };
    expect(parseJourneySnapshot(JSON.stringify({
      schemaVersion: JOURNEY_SCHEMA_VERSION,
      state: { ...state, profile },
    }))).toBeNull();
  });

  it("rejects a stored child profile with an adult-only deductible", () => {
    const state = readyState();
    const invalid = {
      ...state,
      profile: {
        ...state.profile,
        birthYear: 2015,
        ageGroup: "child",
        deductibles: { kind: "selected", values: [2500] },
      },
    };
    expect(parseJourneySnapshot(JSON.stringify({ schemaVersion: JOURNEY_SCHEMA_VERSION, state: invalid })))
      .toBeNull();
  });
});
