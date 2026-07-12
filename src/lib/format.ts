const KRW_TEN_THOUSAND_UNIT = 10000;

export function formatCurrency(value: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function parseManwonInputToWon(value: string): number {
  return Math.round(Number(value) * KRW_TEN_THOUSAND_UNIT);
}

export function formatWonToManwonInput(value: number): string {
  const converted = value / KRW_TEN_THOUSAND_UNIT;
  return String(Number.isInteger(converted) ? converted : converted);
}

export function extractSpreadsheetId(value: string): string {
  const match = value.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match?.[1]) {
    return match[1];
  }
  return /^[a-zA-Z0-9-_]{20,}$/.test(value) ? value : "";
}

export function labelForType(type: string): string {
  if (type === "income") {
    return "Income";
  }
  if (type === "both") {
    return "Shared";
  }
  return "Expense";
}
