import type { AccidentChoice, LocationSuggestion } from "./types";
import type { InsuranceModel, JourneyIntent } from "./journey-machine";
import { serializeJourneyUrl } from "./journey-url";

export type ProfileJourneyStep = "details" | "preferences";

export function serializeProfileJourneyUrl(input: {
  journeyId: string;
  step: ProfileJourneyStep;
  intent: Exclude<JourneyIntent, null>;
  location: LocationSuggestion;
  birthYear: string;
  accident: Exclude<AccidentChoice, "">;
  models: InsuranceModel[];
  deductibles: number[];
}) {
  return serializeJourneyUrl({
    journeyId: input.journeyId,
    step: input.step,
    intent: input.intent,
    location: input.location,
    birthYear: Number(input.birthYear),
    accident: input.accident,
    models: input.models,
    deductibles: input.deductibles,
  });
}
