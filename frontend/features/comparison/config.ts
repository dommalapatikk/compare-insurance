import type { Choice } from "./types";

export const adultDeductibles = [300, 500, 1000, 1500, 2000, 2500];
export const childDeductibles = [0, 100, 200, 300, 400, 500, 600];

export const ageChoices: Choice[] = [
  { value: "child", label: "Child", description: "Up to age 18" },
  { value: "young_adult", label: "Young adult", description: "Age 19–25" },
  { value: "adult", label: "Adult", description: "Age 26+" },
];

export const modelChoices: Choice[] = [
  {
    value: "standard",
    label: "Standard",
    description: "Free choice of doctor under the plan rules.",
  },
  {
    value: "family_doctor",
    label: "Family doctor",
    description: "Your chosen practice is normally the first contact.",
  },
  {
    value: "hmo",
    label: "HMO",
    description: "An HMO network is normally the first contact.",
  },
  {
    value: "telmed",
    label: "Telmed",
    description: "A medical advice line is normally the first contact.",
  },
  {
    value: "other",
    label: "Other models",
    description: "Other source-defined restricted-care models.",
  },
];

export const quickQuestions = [
  "What does the deductible mean?",
  "Should I include accident cover?",
  "How do HMO and Telmed differ?",
];

export const modelLabels: Record<string, string> = Object.fromEntries(
  modelChoices.map(({ value, label }) => [value, label]),
);

export const cantonChoices = [
  "AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU",
  "LU", "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR",
  "VD", "VS", "ZG", "ZH",
];

const subdividedPremiumRegions: Record<string, string[]> = {
  BE: ["1", "2", "3"],
  BL: ["1", "2"],
  FR: ["1", "2"],
  GR: ["1", "2", "3"],
  LU: ["1", "2", "3"],
  SG: ["1", "2", "3"],
  SH: ["1", "2"],
  TI: ["1", "2"],
  VD: ["1", "2"],
  VS: ["1", "2"],
  ZH: ["1", "2", "3"],
};

export function premiumRegionsFor(canton: string) {
  return canton ? subdividedPremiumRegions[canton] || ["0"] : [];
}

