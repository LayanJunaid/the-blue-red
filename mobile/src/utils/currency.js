export function formatTRY(value) {
  if (value === null || value === undefined || value === "") {
    return "₺0";
  }

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value));
}