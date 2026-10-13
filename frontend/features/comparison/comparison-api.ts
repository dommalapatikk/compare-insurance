import type {
  ChatResponse,
  LocationSearchResponse,
  Message,
  PremiumSearchResponse,
} from "./types";

export type PremiumSearchInput = {
  canton: string;
  region: string;
  birthYear: string;
  accidentCoverage: boolean;
  deductibles: number[];
  models: string[];
  currentPremium: string;
};

async function responseJson<T>(response: Response): Promise<T> {
  const payload = await response.json() as T & { detail?: string };
  if (!response.ok) throw new Error(payload.detail || "The service is unavailable.");
  return payload;
}

export async function searchLocations(
  query: string,
  signal: AbortSignal,
): Promise<LocationSearchResponse> {
  const response = await fetch(`/api/locations?q=${encodeURIComponent(query)}`, {
    cache: "no-store",
    signal,
  });
  return responseJson<LocationSearchResponse>(response);
}

export async function requestGuideReply(
  message: string,
  threadId: string,
  history: Message[],
): Promise<ChatResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      thread_id: threadId,
      history: history.slice(-12).map(({ role, content }) => ({ role, content })),
    }),
  });
  return responseJson<ChatResponse>(response);
}

export async function searchPremiums(input: PremiumSearchInput): Promise<PremiumSearchResponse> {
  const params = new URLSearchParams({
    canton: input.canton,
    region: input.region,
    birth_year: input.birthYear,
    accident_coverage: String(input.accidentCoverage),
    year: "2027",
    top_n: "10",
  });
  input.deductibles.forEach((value) => params.append("deductible", String(value)));
  input.models.forEach((value) => params.append("insurance_model", value));
  if (input.currentPremium) params.set("reference_monthly_premium_chf", input.currentPremium);
  const response = await fetch(`/api/premiums?${params.toString()}`, { cache: "no-store" });
  return responseJson<PremiumSearchResponse>(response);
}
