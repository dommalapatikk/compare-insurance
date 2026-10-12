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

export type AgeGroup = "" | "child" | "young_adult" | "adult";

export type AccidentChoice = "" | "included" | "excluded";

export type PremiumOffer = {
  rank: number;
  insurer_id: string;
  insurer_name: string;
  plan_id: string | null;
  product_name: string;
  canton: string;
  region: string;
  deductible_chf: number;
  accident_coverage: boolean;
  insurance_model: string;
  monthly_premium_chf: string;
  annual_premium_chf: string;
  monthly_difference_from_cheapest_chf: string;
  annual_difference_from_cheapest_chf: string;
  reference_comparison: {
    relation: "cheaper" | "same" | "more_expensive";
    monthly_difference_chf: string;
    annual_difference_chf: string;
  } | null;
};

export type CategoryMinimum = {
  insurer_id: string;
  insurer_name: string;
  plan_id: string | null;
  product_name: string;
  canton: string;
  region: string;
  deductible_chf: number;
  accident_coverage: boolean;
  insurance_model: string;
  monthly_premium_chf: string;
  annual_premium_chf: string;
};

export type PremiumSearchResponse = {
  source_year: number;
  source_name: string;
  total_eligible_offers: number;
  offers: PremiumOffer[];
  cheapest_by_deductible: CategoryMinimum[];
  cheapest_by_model: CategoryMinimum[];
  cheapest_by_deductible_and_model: CategoryMinimum[];
};

