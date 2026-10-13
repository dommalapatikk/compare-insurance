export type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
  citations?: ChatCitation[];
};

export type ChatCitation = {
  title: string;
  url: string;
};

export type Choice = {
  value: string;
  label: string;
  description?: string;
};

export type AgeGroup = "" | "child" | "young_adult" | "adult";

export type AccidentChoice = "" | "included" | "excluded";

export type LocationSuggestion = {
  postal_code: string;
  locality: string;
  municipality_id: string;
  municipality_name: string;
  canton: string;
  premium_region: string;
  label: string;
};

export type LocationSearchResponse = {
  query: string;
  premium_year: number;
  source_name: string;
  locations: LocationSuggestion[];
};

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
  query: PremiumSearchQuery;
  source_year: number;
  source_name: string;
  total_eligible_offers: number;
  offers: PremiumOffer[];
  cheapest_by_deductible: CategoryMinimum[];
  cheapest_by_model: CategoryMinimum[];
  cheapest_by_deductible_and_model: CategoryMinimum[];
};

export type PremiumSearchQuery = {
  canton: string;
  region: string;
  age_category: Exclude<AgeGroup, "">;
  birth_year: number | null;
  deductibles: number[];
  accident_coverage: boolean;
  insurance_models: string[];
  year: number;
  top_n: number;
  reference_monthly_premium_chf: string | null;
};

export type ChatProfile = {
  resolved_location?: Partial<LocationSuggestion> & Pick<
    LocationSuggestion,
    "label" | "canton" | "premium_region"
  >;
  birth_year?: number;
  age_category?: Exclude<AgeGroup, "">;
  accident_coverage?: boolean;
  insurance_models?: string[];
  deductibles?: number[];
};

export type ChatResponse = {
  message?: string;
  detail?: string;
  thread_id?: string;
  comparison?: PremiumSearchResponse;
  citations?: ChatCitation[];
  profile?: ChatProfile;
};

