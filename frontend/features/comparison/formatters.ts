export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-CH", {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatWholeCurrency(value: number) {
  return new Intl.NumberFormat("en-CH", {
    style: "currency",
    currency: "CHF",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(value));
}

export function formatDeductible(value: number) {
  return `CHF ${value.toLocaleString("en-CH")}`;
}

