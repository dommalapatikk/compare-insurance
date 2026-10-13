import type { AgeGroup, Choice } from "./types";

export const adultDeductibles = [300, 500, 1000, 1500, 2000, 2500];
export const childDeductibles = [0, 100, 200, 300, 400, 500, 600];

export const ageChoices: Choice[] = [
  { value: "child", label: "Child", description: "Up to age 18" },
  { value: "young_adult", label: "Young adult", description: "Age 19–25" },
  { value: "adult", label: "Adult", description: "Age 26+" },
];

export function ageGroupForBirthYear(
  birthYear: string,
  premiumYear = 2027,
): AgeGroup {
  if (!/^\d{4}$/.test(birthYear)) return "";
  const year = Number(birthYear);
  if (year < 1900 || year > premiumYear) return "";
  const age = premiumYear - year;
  if (age <= 18) return "child";
  if (age <= 25) return "young_adult";
  return "adult";
}

export const modelChoices: Choice[] = [
  {
    value: "standard",
    label: "Standard",
    description: "Free choice of doctor under the plan rules.",
  },
  {
    value: "flex",
    label: "FLEX",
    description: "Choose between several defined first-contact options.",
  },
  {
    value: "praxis",
    label: "PRAXIS",
    description: "A designated doctor or medical practice is your first contact.",
  },
  {
    value: "tel_dig",
    label: "TEL-DIG",
    description: "Your first contact is by phone, app or another digital service.",
  },
  {
    value: "pharm",
    label: "PHARM",
    description: "A partner pharmacy is your first contact.",
  },
];

export const quickQuestions = [
  "What does the deductible mean?",
  "Should I include accident cover?",
  "What does the family-doctor model mean?",
];

export const modelLabels: Record<string, string> = Object.fromEntries(
  modelChoices.map(({ value, label }) => [value, label]),
);

