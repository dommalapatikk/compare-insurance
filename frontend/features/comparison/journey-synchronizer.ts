import {
  allSelection,
  journeyReducer,
  selectedValues,
} from "./journey-machine";
import type {
  InsuranceModel,
  JourneyState,
} from "./journey-machine";
import type { AccidentChoice, LocationSuggestion } from "./types";

export type JourneyDraft = {
  location: LocationSuggestion | null;
  birthYear: string;
  accident: AccidentChoice;
  models: InsuranceModel[];
  deductibles: number[];
  allModelCount: number;
  allDeductibleCount: number;
};

export function synchronizeDetails(state: JourneyState, draft: JourneyDraft) {
  if (!draft.location || !draft.birthYear || !draft.accident) return state;
  let next = journeyReducer(state, { type: "set_location", location: draft.location });
  next = journeyReducer(next, { type: "set_birth_year", birthYear: Number(draft.birthYear) });
  return journeyReducer(next, { type: "set_accident", accident: draft.accident });
}

export function synchronizePreferences(state: JourneyState, draft: JourneyDraft) {
  if (!draft.models.length || !draft.deductibles.length) return state;
  let next = synchronizeDetails(state, draft);
  next = journeyReducer(next, {
    type: "set_models",
    selection: draft.models.length === draft.allModelCount
      ? allSelection()
      : selectedValues(draft.models),
  });
  return journeyReducer(next, {
    type: "set_deductibles",
    selection: draft.deductibles.length === draft.allDeductibleCount
      ? allSelection<number>()
      : selectedValues(draft.deductibles),
  });
}
