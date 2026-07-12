import type { PeriodPreset } from "../types";

export function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export function todayIso(): string {
  return formatDate(new Date());
}

export function isoNow(): string {
  return new Date().toISOString();
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function getRangeByPreset(
  preset: PeriodPreset,
  currentStartDate = "",
  currentEndDate = ""
): { startDate: string; endDate: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (preset === "all") {
    return { startDate: "", endDate: "" };
  }

  if (preset === "thisWeek") {
    const day = today.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = addDays(today, diffToMonday);
    const end = addDays(start, 6);
    return { startDate: formatDate(start), endDate: formatDate(end) };
  }

  if (preset === "last30") {
    return { startDate: formatDate(addDays(today, -29)), endDate: formatDate(today) };
  }

  if (preset === "custom") {
    return { startDate: currentStartDate, endDate: currentEndDate };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { startDate: formatDate(start), endDate: formatDate(end) };
}
