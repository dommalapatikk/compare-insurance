import type { Choice, PreviewDeductible, PreviewPlan } from "./types";

export const adultDeductibles = [300, 500, 1000, 1500, 2000, 2500];
export const childDeductibles = [0, 100, 200, 300, 400, 500, 600];

export const ageChoices: Choice[] = [
  { value: "child", label: "Child", description: "Up to age 18" },
  { value: "young-adult", label: "Young adult", description: "Age 19–25" },
  { value: "adult", label: "Adult", description: "Age 26+" },
];

export const modelChoices: Choice[] = [
  {
    value: "standard",
    label: "Standard",
    description: "Free choice of doctor under the plan rules.",
  },
  {
    value: "family-doctor",
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
  "How does the deductible change my costs?",
  "Should accident coverage be included?",
  "What is the difference between HMO and Telmed?",
];

export const previewPlans: PreviewPlan[] = [
  { name: "Example plan A", monthly: 318, difference: 0, model: "Telmed" },
  { name: "Example plan B", monthly: 329, difference: 11, model: "HMO" },
  { name: "Example plan C", monthly: 347, difference: 29, model: "Family doctor" },
];

export const previewDeductibles: PreviewDeductible[] = [
  { deductible: 300, monthly: 372 },
  { deductible: 500, monthly: 350 },
  { deductible: 1000, monthly: 334 },
  { deductible: 1500, monthly: 327 },
  { deductible: 2000, monthly: 322 },
  { deductible: 2500, monthly: 318 },
];

