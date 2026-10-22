export function currentPremiumError(value: string) {
  if (!value.trim()) return "Enter your 2027 renewal premium.";

  const premium = Number(value);
  if (!Number.isFinite(premium) || premium <= 0) {
    return "Enter a monthly premium greater than CHF 0.";
  }
  if (premium > 2000) {
    return "Enter a monthly premium of CHF 2,000 or less.";
  }
  if (Math.abs(premium * 20 - Math.round(premium * 20)) > 1e-8) {
    return "Enter the premium in CHF 0.05 increments.";
  }
  return "";
}
