import {
  adultDeductibles,
  ageGroupForBirthYear,
  childDeductibles,
  modelChoices,
} from "./config";
import type { AccidentChoice, AgeGroup, LocationSuggestion } from "./types";

export const journeyStages = [
  "welcome",
  "location",
  "birth_year",
  "accident",
  "models",
  "deductibles",
  "review",
  "results",
] as const;

export type JourneyStage = (typeof journeyStages)[number];
export type JourneySection = "intent" | "details" | "preferences" | "results";
export type EditableJourneyStage = Exclude<JourneyStage, "welcome" | "results">;
export type JourneyIntent = "compare_current" | "explore";
export type JourneyAgeGroup = Exclude<AgeGroup, "">;
export type JourneyAccident = Exclude<AccidentChoice, "">;
export type InsuranceModel = "standard" | "flex" | "praxis" | "tel_dig" | "pharm";
export type Selection<T extends string | number> =
  | { readonly kind: "all" }
  | { readonly kind: "selected"; readonly values: readonly T[] };

export type JourneyProfile = {
  readonly location: LocationSuggestion | null;
  readonly birthYear: number | null;
  readonly ageGroup: JourneyAgeGroup | null;
  readonly accident: JourneyAccident | null;
  readonly models: Selection<InsuranceModel> | null;
  readonly deductibles: Selection<number> | null;
};

export type JourneyState = {
  readonly stage: JourneyStage;
  readonly intent: JourneyIntent | null;
  readonly profile: JourneyProfile;
};

export type JourneyAction =
  | { readonly type: "start" }
  | { readonly type: "select_intent"; readonly intent: JourneyIntent }
  | { readonly type: "set_location"; readonly location: LocationSuggestion }
  | { readonly type: "set_birth_year"; readonly birthYear: number }
  | { readonly type: "set_accident"; readonly accident: JourneyAccident }
  | { readonly type: "set_models"; readonly selection: Selection<InsuranceModel> }
  | { readonly type: "set_deductibles"; readonly selection: Selection<number> }
  | { readonly type: "comparison_started" }
  | { readonly type: "comparison_succeeded" }
  | { readonly type: "edit"; readonly stage: EditableJourneyStage }
  | { readonly type: "restart" };

const insuranceModels = modelChoices.map(({ value }) => value) as InsuranceModel[];
const insuranceModelSet = new Set<string>(insuranceModels);

export function allSelection<T extends string | number = never>(): Selection<T> {
  return { kind: "all" };
}

export function selectedValues<T extends string | number>(
  values: readonly T[],
): Selection<T> {
  return { kind: "selected", values: [...new Set(values)] };
}

export function createJourneyState(): JourneyState {
  return {
    stage: "welcome",
    intent: null,
    profile: {
      location: null,
      birthYear: null,
      ageGroup: null,
      accident: null,
      models: null,
      deductibles: null,
    },
  };
}

export function isPreviousOrCurrentStage(
  current: JourneyStage,
  target: JourneyStage,
): boolean {
  return journeyStages.indexOf(target) <= journeyStages.indexOf(current);
}

export function journeySection(stage: JourneyStage): JourneySection {
  if (stage === "welcome") return "intent";
  if (stage === "results") return "results";
  if (["models", "deductibles", "review"].includes(stage)) return "preferences";
  return "details";
}

export function resolveModels(profile: JourneyProfile): InsuranceModel[] {
  if (!profile.models) return [];
  return profile.models.kind === "all"
    ? [...insuranceModels]
    : [...profile.models.values];
}

export function resolveDeductibles(profile: JourneyProfile): number[] {
  if (!profile.ageGroup || !profile.deductibles) return [];
  if (profile.deductibles.kind === "selected") {
    return [...profile.deductibles.values].sort((left, right) => left - right);
  }
  return profile.ageGroup === "child"
    ? [...childDeductibles]
    : [...adultDeductibles];
}

export function isJourneyReady(state: JourneyState): boolean {
  const { profile } = state;
  return Boolean(
    profile.location
    && state.intent
    && profile.birthYear
    && profile.ageGroup
    && profile.accident
    && resolveModels(profile).length
    && resolveDeductibles(profile).length,
  );
}

function validModels(selection: Selection<InsuranceModel>): boolean {
  return selection.kind === "all" || (
    selection.values.length > 0
    && selection.values.every((value) => insuranceModelSet.has(value))
  );
}

function validDeductibles(
  selection: Selection<number>,
  ageGroup: JourneyAgeGroup,
): boolean {
  if (selection.kind === "all") return true;
  const allowed = new Set(ageGroup === "child" ? childDeductibles : adultDeductibles);
  return selection.values.length > 0 && selection.values.every((value) => allowed.has(value));
}

function resetInvalidDeductibles(
  selection: Selection<number> | null,
  ageGroup: JourneyAgeGroup,
): Selection<number> | null {
  if (!selection || validDeductibles(selection, ageGroup)) return selection;
  return allSelection();
}

export function journeyReducer(
  state: JourneyState,
  action: JourneyAction,
): JourneyState {
  switch (action.type) {
    case "start":
      return state.stage === "welcome" ? { ...state, stage: "location" } : state;
    case "select_intent":
      return { ...state, intent: action.intent, stage: "location" };
    case "set_location":
      return {
        ...state,
        stage: "birth_year",
        profile: { ...state.profile, location: action.location },
      };
    case "set_birth_year": {
      if (!state.profile.location) return state;
      const ageGroup = ageGroupForBirthYear(String(action.birthYear));
      if (!ageGroup) return state;
      return {
        ...state,
        stage: "accident",
        profile: {
          ...state.profile,
          birthYear: action.birthYear,
          ageGroup,
          accident: ageGroup === "child" ? "included" : state.profile.accident,
          deductibles: resetInvalidDeductibles(state.profile.deductibles, ageGroup),
        },
      };
    }
    case "set_accident":
      if (!state.profile.ageGroup) return state;
      return {
        ...state,
        stage: "models",
        profile: { ...state.profile, accident: action.accident },
      };
    case "set_models":
      if (!state.profile.accident || !validModels(action.selection)) return state;
      return {
        ...state,
        stage: "deductibles",
        profile: { ...state.profile, models: action.selection },
      };
    case "set_deductibles":
      if (
        !state.profile.ageGroup
        || !state.profile.models
        || !validDeductibles(action.selection, state.profile.ageGroup)
      ) return state;
      return {
        ...state,
        stage: "review",
        profile: { ...state.profile, deductibles: action.selection },
      };
    case "comparison_started":
    case "comparison_succeeded":
      return isJourneyReady(state) ? { ...state, stage: "results" } : state;
    case "edit":
      return { ...state, stage: action.stage };
    case "restart":
      return createJourneyState();
  }
}
