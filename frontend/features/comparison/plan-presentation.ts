export type PraxisSubtype = "HMO centre" | "Your own family doctor" | "Doctor network";

const HMO_TERMS = /\bHMO\b|Gesundheitszentrum|Health centre/i;
const FAMILY_DOCTOR_TERMS = /\bGP\b|General Practitioner|Hausarzt|family doctor|médecin de famille|Casamed/i;
const REGION_CODE = /\s+R\d+\s*$/i;

function escaped(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function planDisplayName({
  insuranceModel,
  legalInsurerName,
  productName,
  shortInsurerName,
}: {
  insuranceModel: string;
  legalInsurerName: string;
  productName: string;
  shortInsurerName: string;
}) {
  let displayName = productName.trim().replace(REGION_CODE, "").trim();
  for (const insurerName of [legalInsurerName, shortInsurerName].filter(Boolean).toSorted((a, b) => b.length - a.length)) {
    displayName = displayName.replace(
      new RegExp(`^${escaped(insurerName)}(?:$|\\s+|\\s*[-–—:]\\s*)`, "i"),
      "",
    ).trim();
  }
  if (insuranceModel === "standard" && /^Basic health insurance$/i.test(displayName)) return "";
  return displayName;
}

export function praxisSubtype(planName: string): PraxisSubtype {
  if (HMO_TERMS.test(planName)) return "HMO centre";
  if (FAMILY_DOCTOR_TERMS.test(planName)) return "Your own family doctor";
  return "Doctor network";
}

const loggedGenericPraxisPlans = new Set<string>();

export function logGenericPraxisPlan(planName: string) {
  if (process.env.NODE_ENV === "production" || loggedGenericPraxisPlans.has(planName)) return;
  loggedGenericPraxisPlans.add(planName);
  console.info(`[comparison] Review generic PRAXIS subtype: ${planName}`);
}

export function duplicatePraxisPlanNote(
  insurerName: string,
  subtypes: PraxisSubtype[],
) {
  const planCount = subtypes.length;
  if (subtypes.includes("HMO centre") && subtypes.includes("Your own family doctor")) {
    return `${insurerName} has ${planCount} plans in this group. HMO plans use a specific centre; family-doctor plans let you choose from ${insurerName}’s doctor list.`;
  }
  return `${insurerName} has ${planCount} plans in this group. Their first-contact rules or doctor networks can differ, so check the plan details before switching.`;
}
