import type { InsuranceModel, JourneyIntent } from "./journey-machine";
import { adultDeductibles, ageGroupForBirthYear, birthYearError, childDeductibles, modelChoices } from "./config";
import { isSafeJourneyId } from "./journey-history";
import type { AccidentChoice, LocationSuggestion } from "./types";

export type JourneyUrlIntent = JourneyIntent;
export type JourneyLocationKey = Pick<LocationSuggestion, "postal_code" | "municipality_id">;

export type JourneyUrlState = {
  step: "details" | "preferences" | "results";
  intent: JourneyUrlIntent;
  journeyId: string;
  location?: JourneyLocationKey;
  birthYear?: number;
  accident?: Exclude<AccidentChoice, "">;
  models?: InsuranceModel[];
  deductibles?: number[];
};

const intents = new Set<JourneyUrlIntent>(["compare_current", "explore"]);
const modelOrder = modelChoices.map(({ value }) => value as InsuranceModel);
const models = new Set<InsuranceModel>(modelOrder);
const steps = new Set<JourneyUrlState["step"]>(["details", "preferences", "results"]);

export function isJourneyUrlIntent(value: unknown): value is JourneyUrlIntent {
  return typeof value === "string" && intents.has(value as JourneyUrlIntent);
}

function unique<T>(values: readonly T[]): boolean {
  return new Set(values).size === values.length;
}

function parseModels(value: string | null): InsuranceModel[] | null {
  if (value === null) return [];
  const tokens = value.split(",");
  if (!tokens.length || tokens.some((token) => !models.has(token as InsuranceModel))) return null;
  if (!unique(tokens)) return null;
  return tokens as InsuranceModel[];
}

function parseDeductibles(value: string | null, birthYear: number): number[] | null {
  if (value === null) return [];
  const rawValues = value.split(",");
  if (!rawValues.length || rawValues.some((item) => !/^\d{1,4}$/.test(item))) return null;
  const values = rawValues.map(Number);
  if (!unique(values)) return null;
  const ageGroup = ageGroupForBirthYear(String(birthYear));
  const allowed = new Set(ageGroup === "child" ? childDeductibles : adultDeductibles);
  return values.every((item) => allowed.has(item)) ? values : null;
}

export function serializeJourneyUrl(state: JourneyUrlState) {
  if (!isSafeJourneyId(state.journeyId)) throw new Error("Invalid journey id.");
  const params = new URLSearchParams({
    journey: state.intent,
    step: state.step,
    journeyId: state.journeyId,
  });
  if (state.location) {
    params.set("postcode", state.location.postal_code);
    params.set("municipalityId", state.location.municipality_id);
  }
  if (state.birthYear) params.set("birthYear", String(state.birthYear));
  if (state.accident) params.set("accident", state.accident);
  if (state.models?.length) {
    const selected = new Set(state.models);
    params.set("models", modelOrder.filter((model) => selected.has(model)).join(","));
  }
  if (state.deductibles?.length) {
    params.set("franchises", [...new Set(state.deductibles)].sort((left, right) => left - right).join(","));
  }
  return `/?${params.toString()}`;
}

export function parseJourneyUrl(url: URL): JourneyUrlState | null {
  const intent = url.searchParams.get("journey");
  const step = url.searchParams.get("step") as JourneyUrlState["step"] | null;
  const journeyId = url.searchParams.get("journeyId");
  if (!isJourneyUrlIntent(intent) || !step || !steps.has(step) || !isSafeJourneyId(journeyId)) return null;

  const rawBirthYear = url.searchParams.get("birthYear");
  if (rawBirthYear !== null && birthYearError(rawBirthYear)) return null;
  const parsedModels = parseModels(url.searchParams.get("models"));
  if (parsedModels === null) return null;

  if (step === "details") return { journeyId, step, intent };
  const postcode = url.searchParams.get("postcode");
  const municipalityId = url.searchParams.get("municipalityId");
  const birthYear = Number(rawBirthYear);
  const accident = url.searchParams.get("accident");
  if (!/^\d{4}$/.test(postcode ?? "") || !/^\d{1,6}$/.test(municipalityId ?? "")) return null;
  if (!rawBirthYear || birthYearError(rawBirthYear) || !["included", "excluded"].includes(accident ?? "")) return null;

  const deductibles = parseDeductibles(url.searchParams.get("franchises"), birthYear);
  if (deductibles === null) return null;
  if (step === "results" && (!parsedModels.length || !deductibles.length)) return null;
  return {
    journeyId,
    step,
    intent,
    location: { postal_code: postcode!, municipality_id: municipalityId! },
    birthYear,
    accident: accident as Exclude<AccidentChoice, "">,
    models: parsedModels.length ? parsedModels : undefined,
    deductibles: deductibles.length ? deductibles : undefined,
  };
}
