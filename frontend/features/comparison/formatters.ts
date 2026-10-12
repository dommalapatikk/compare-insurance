export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-CH", {
    style: "currency",
    currency: "CHF",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDeductible(value: number) {
  return `CHF ${value.toLocaleString("en-CH")}`;
}

