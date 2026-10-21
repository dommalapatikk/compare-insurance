import { ageGroupForBirthYear, adultDeductibles, childDeductibles } from "./config";
import {
  journeyStages,
} from "./journey-machine";
import type {
  InsuranceModel,
  JourneyAgeGroup,
  JourneyProfile,
  JourneyStage,
  JourneyState,
  Selection,
} from "./journey-machine";
import type { LocationSuggestion } from "./types";
import { APP_SESSION_SCHEMA_VERSION } from "./session-version";

export const JOURNEY_SCHEMA_VERSION = APP_SESSION_SCHEMA_VERSION;
export const JOURNEY_STORAGE_KEY = "compare-insurance:guided-journey";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const stages = new Set<string>(journeyStages);
const ageGroups = new Set<string>(["child", "young_adult", "adult"]);
const accidents = new Set<string>(["included", "excluded"]);
const models = new Set<string>(["standard", "flex", "praxis", "tel_dig", "pharm"]);
const intents = new Set<string>(["compare_current", "explore"]);
const profileKeys = new Set([
  "location",
  "birthYear",
  "ageGroup",
  "accident",
  "models",
  "deductibles",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: Set<string>): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

function isLocation(value: unknown): value is LocationSuggestion {
  if (!isRecord(value)) return false;
  const fields = [
    "postal_code", "locality", "municipality_id", "municipality_name",
    "canton", "premium_region", "label",
  ];
  return hasOnlyKeys(value, new Set(fields))
    && fields.every((field) => typeof value[field] === "string")
    && /^\d{4}$/.test(value.postal_code as string)
    && /^[A-Za-z]{2}$/.test(value.canton as string)
    && /^[0-3]$/.test(value.premium_region as string);
}

function isSelection<T extends string | number>(
  value: unknown,
  isAllowed: (item: unknown) => item is T,
): value is Selection<T> {
  if (!isRecord(value) || typeof value.kind !== "string") return false;
  if (value.kind === "all") return Object.keys(value).length === 1;
  if (value.kind !== "selected" || !Array.isArray(value.values)) return false;
  if (!hasOnlyKeys(value, new Set(["kind", "values"]))) return false;
  return value.values.length > 0
    && value.values.every(isAllowed)
    && new Set(value.values).size === value.values.length;
}

function isProfile(value: unknown): value is JourneyProfile {
  if (!isRecord(value) || !hasOnlyKeys(value, profileKeys)) return false;
  const location = value.location;
  const birthYear = value.birthYear;
  const ageGroup = value.ageGroup;
  const accident = value.accident;

  if (location !== null && !isLocation(location)) return false;
  if (birthYear !== null && (!Number.isInteger(birthYear) || typeof birthYear !== "number")) {
    return false;
  }
  if (ageGroup !== null && (typeof ageGroup !== "string" || !ageGroups.has(ageGroup))) {
    return false;
  }
  if (accident !== null && (typeof accident !== "string" || !accidents.has(accident))) {
    return false;
  }
  if ((birthYear === null) !== (ageGroup === null)) return false;
  if (typeof birthYear === "number") {
    if (ageGroupForBirthYear(String(birthYear)) !== ageGroup) return false;
  }

  if (value.models !== null && !isSelection<InsuranceModel>(
    value.models,
    (item): item is InsuranceModel => typeof item === "string" && models.has(item),
  )) return false;

  if (value.deductibles !== null) {
    if (!ageGroup) return false;
    const allowed = new Set(ageGroup === "child" ? childDeductibles : adultDeductibles);
    if (!isSelection<number>(
      value.deductibles,
      (item): item is number => typeof item === "number" && allowed.has(item),
    )) return false;
  }
  return true;
}

function validForStage(stage: JourneyStage, profile: JourneyProfile): boolean {
  if (stage === "welcome") {
    return Object.values(profile).every((value) => value === null);
  }
  if (stage === "location") return true;
  if (!profile.location) return false;
  if (stage === "birth_year") return true;
  if (!profile.birthYear || !profile.ageGroup) return false;
  if (stage === "accident") return true;
  if (!profile.accident) return false;
  if (stage === "models") return true;
  if (!profile.models) return false;
  if (stage === "deductibles") return true;
  return profile.deductibles !== null;
}

function isJourneyState(value: unknown): value is JourneyState {
  if (!isRecord(value) || !hasOnlyKeys(value, new Set(["stage", "intent", "profile"]))) return false;
  if (typeof value.stage !== "string" || !stages.has(value.stage)) return false;
  if (value.intent !== null && (typeof value.intent !== "string" || !intents.has(value.intent))) return false;
  if (value.stage === "welcome" && value.intent !== null) return false;
  if (value.stage !== "welcome" && value.intent === null) return false;
  if (!isProfile(value.profile)) return false;
  return validForStage(value.stage as JourneyStage, value.profile);
}

export function serializeJourneySnapshot(state: JourneyState): string {
  return JSON.stringify({ schemaVersion: JOURNEY_SCHEMA_VERSION, state });
}

export function parseJourneySnapshot(value: string): JourneyState | null {
  try {
    const snapshot: unknown = JSON.parse(value);
    if (!isRecord(snapshot) || snapshot.schemaVersion !== JOURNEY_SCHEMA_VERSION) return null;
    return isJourneyState(snapshot.state) ? snapshot.state : null;
  } catch {
    return null;
  }
}

export function saveJourneyState(storage: StorageLike, state: JourneyState): void {
  storage.setItem(JOURNEY_STORAGE_KEY, serializeJourneySnapshot(state));
}

export function loadJourneyState(storage: StorageLike): JourneyState | null {
  const snapshot = storage.getItem(JOURNEY_STORAGE_KEY);
  if (!snapshot) return null;

  const state = parseJourneySnapshot(snapshot);
  if (!state) storage.removeItem(JOURNEY_STORAGE_KEY);
  return state;
}

export function clearJourneyState(storage: StorageLike): void {
  storage.removeItem(JOURNEY_STORAGE_KEY);
}
