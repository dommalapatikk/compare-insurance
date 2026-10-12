export type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

export type Choice = {
  value: string;
  label: string;
  description?: string;
};

export type ComparisonStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type AgeGroup = "" | "child" | "young-adult" | "adult";

export type AccidentChoice = "" | "included" | "excluded";

export type PreviewPlan = {
  name: string;
  monthly: number;
  difference: number;
  model: string;
};

export type PreviewDeductible = {
  deductible: number;
  monthly: number;
};

