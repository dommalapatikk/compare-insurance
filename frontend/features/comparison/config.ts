import type { AgeGroup, Choice } from "./types";

export const adultDeductibles = [300, 500, 1000, 1500, 2000, 2500];
export const childDeductibles = [0, 100, 200, 300, 400, 500, 600];

export function birthYearError(birthYear: string, premiumYear = 2027) {
  if (!birthYear) return "Enter your birth year.";
  if (!/^\d{4}$/.test(birthYear)) return "Enter a 4-digit birth year.";
  const year = Number(birthYear);
  if (year > premiumYear) return "Birth year cannot be in the future.";
  const earliestYear = premiumYear - 120;
  if (year < earliestYear) return `Enter a birth year from ${earliestYear} onwards.`;
  return "";
}

export const ageChoices: Choice[] = [
  { value: "child", label: "Child", description: "Up to age 18" },
  { value: "young_adult", label: "Young adult", description: "Age 19–25" },
  { value: "adult", label: "Adult", description: "Age 26+" },
];

export function ageGroupForBirthYear(
  birthYear: string,
  premiumYear = 2027,
): AgeGroup {
  if (birthYearError(birthYear, premiumYear)) return "";
  const year = Number(birthYear);
  const age = premiumYear - year;
  if (age <= 18) return "child";
  if (age <= 25) return "young_adult";
  return "adult";
}

export const modelChoices: Choice[] = [
  {
    value: "standard",
    label: "Free choice of doctor",
    description: "Choose a doctor without a required first contact.",
  },
  {
    value: "flex",
    label: "Flexible first contact",
    description: "Choose from the contact options allowed by the plan.",
  },
  {
    value: "praxis",
    label: "Family doctor / HMO",
    description: "Contact a designated doctor or medical practice first.",
  },
  {
    value: "tel_dig",
    label: "Telemedicine",
    description: "Contact a medical advice service by phone or online first.",
  },
  {
    value: "pharm",
    label: "Pharmacy first",
    description: "Contact a partner pharmacy first.",
  },
];

export const modelLabels: Record<string, string> = Object.fromEntries(
  modelChoices.map(({ value, label }) => [value, label]),
);

