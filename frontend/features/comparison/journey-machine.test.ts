import { describe, expect, it } from "vitest";

import { adultDeductibles, childDeductibles, modelChoices } from "./config";
import {
  allSelection,
  createJourneyState,
  isJourneyReady,
  isPreviousOrCurrentStage,
  journeySection,
  journeyReducer,
  resolveDeductibles,
  resolveModels,
  selectedValues,
} from "./journey-machine";
import type { JourneyState } from "./journey-machine";
import type { LocationSuggestion } from "./types";

const bern: LocationSuggestion = {
  postal_code: "3011",
  locality: "Bern",
  municipality_id: "351",
  municipality_name: "Bern",
  canton: "BE",
  premium_region: "1",
  label: "3011 Bern, BE",
};

function throughAccident(): JourneyState {
  let state = createJourneyState();
  state = journeyReducer(state, { type: "set_location", location: bern });
  state = journeyReducer(state, { type: "set_birth_year", birthYear: 1980 });
  return journeyReducer(state, { type: "set_accident", accident: "excluded" });
}

describe("guided comparison journey", () => {
  it("moves through every requested stage without a gender step", () => {
    let state = createJourneyState();
    expect(state.stage).toBe("location");
    state = journeyReducer(state, { type: "set_location", location: bern });
    expect(state.stage).toBe("birth_year");
    state = journeyReducer(state, { type: "set_birth_year", birthYear: 1980 });
    expect(state.stage).toBe("accident");
    state = journeyReducer(state, { type: "set_accident", accident: "excluded" });
    expect(state.stage).toBe("models");
    state = journeyReducer(state, {
      type: "set_models",
      selection: selectedValues(["praxis"]),
    });
    expect(state.stage).toBe("deductibles");
    state = journeyReducer(state, {
      type: "set_deductibles",
      selection: selectedValues([300, 2500]),
    });
    expect(state.stage).toBe("review");
    expect(isJourneyReady(state)).toBe(true);

    state = journeyReducer(state, { type: "comparison_succeeded" });
    expect(state.stage).toBe("results");
    expect(Object.keys(state.profile)).not.toContain("gender");
  });

  it("supports compare-all for models and age-valid deductibles", () => {
    let state = throughAccident();
    state = journeyReducer(state, { type: "set_models", selection: allSelection() });
    state = journeyReducer(state, { type: "set_deductibles", selection: allSelection() });

    expect(resolveModels(state.profile)).toEqual(modelChoices.map(({ value }) => value));
    expect(resolveDeductibles(state.profile)).toEqual(adultDeductibles);
    expect(isJourneyReady(state)).toBe(true);
  });

  it("resets an incompatible adult deductible when birth year changes to child", () => {
    let state = throughAccident();
    state = journeyReducer(state, {
      type: "set_models",
      selection: selectedValues(["standard"]),
    });
    state = journeyReducer(state, {
      type: "set_deductibles",
      selection: selectedValues([2500]),
    });
    state = journeyReducer(state, { type: "edit", stage: "birth_year" });
    state = journeyReducer(state, { type: "set_birth_year", birthYear: 2015 });

    expect(state.profile.ageGroup).toBe("child");
    expect(state.profile.deductibles).toEqual(allSelection());
    expect(resolveDeductibles(state.profile)).toEqual(childDeductibles);
  });

  it("edits an answer without discarding unrelated answers and can restart", () => {
    let state = throughAccident();
    state = journeyReducer(state, { type: "edit", stage: "location" });
    expect(state.stage).toBe("location");
    expect(state.profile.birthYear).toBe(1980);
    expect(state.profile.accident).toBe("excluded");

    state = journeyReducer(state, { type: "restart" });
    expect(state).toEqual(createJourneyState());
  });

  it("distinguishes backward edits from forward continuation", () => {
    expect(isPreviousOrCurrentStage("birth_year", "location")).toBe(true);
    expect(isPreviousOrCurrentStage("birth_year", "accident")).toBe(false);
    expect(isPreviousOrCurrentStage("results", "models")).toBe(true);
  });

  it("presents the detailed domain journey as two simple customer sections", () => {
    expect(journeySection("location")).toBe("details");
    expect(journeySection("birth_year")).toBe("details");
    expect(journeySection("accident")).toBe("details");
    expect(journeySection("models")).toBe("preferences");
    expect(journeySection("deductibles")).toBe("preferences");
    expect(journeySection("review")).toBe("preferences");
    expect(journeySection("results")).toBe("results");
  });
});
