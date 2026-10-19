import { modelChoices } from "./config";
import { allSelection, journeyReducer, selectedValues } from "./journey-machine";
import type { InsuranceModel, JourneyState } from "./journey-machine";
import type { AccidentChoice, ChatProfile, LocationSuggestion, PremiumSearchResponse } from "./types";

function completeLocation(value: ChatProfile["resolved_location"]): value is LocationSuggestion {
  if (!value) return false;
  return ["postal_code", "locality", "municipality_id", "municipality_name", "label", "canton", "premium_region"]
    .every((key) => typeof value[key as keyof typeof value] === "string");
}

export function applyAgentProfile(
  profile: ChatProfile | undefined,
  comparison: PremiumSearchResponse | undefined,
  controls: {
    chooseLocation: (location: LocationSuggestion) => void;
    setBirthYear: (value: string) => void;
    setAccident: (value: AccidentChoice) => void;
    setModels: (values: InsuranceModel[]) => void;
    setDeductibles: (values: number[]) => void;
    setJourney: (update: (current: JourneyState) => JourneyState) => void;
  },
) {
  if (!profile) return;
  const resolved = completeLocation(profile.resolved_location) ? profile.resolved_location : null;
  if (resolved) controls.chooseLocation(resolved);
  if (profile.birth_year) controls.setBirthYear(String(profile.birth_year));
  if (profile.accident_coverage !== undefined) controls.setAccident(profile.accident_coverage ? "included" : "excluded");
  const trustedModels = (profile.insurance_models || []).filter((value): value is InsuranceModel => modelChoices.some((choice) => choice.value === value));
  if (trustedModels.length) controls.setModels(trustedModels);
  if (profile.deductibles?.length) controls.setDeductibles(profile.deductibles);
  controls.setJourney((current) => {
    let next = current;
    if (resolved) next = journeyReducer(next, { type: "set_location", location: resolved });
    if (profile.birth_year) next = journeyReducer(next, { type: "set_birth_year", birthYear: profile.birth_year });
    if (profile.accident_coverage !== undefined) next = journeyReducer(next, { type: "set_accident", accident: profile.accident_coverage ? "included" : "excluded" });
    if (trustedModels.length) next = journeyReducer(next, { type: "set_models", selection: trustedModels.length === modelChoices.length ? allSelection() : selectedValues(trustedModels) });
    if (profile.deductibles?.length) next = journeyReducer(next, { type: "set_deductibles", selection: selectedValues(profile.deductibles) });
    return comparison ? journeyReducer(next, { type: "comparison_succeeded" }) : next;
  });
}
