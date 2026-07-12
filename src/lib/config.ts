import type { AppConfig } from "../types";

export const appConfig: AppConfig = {
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "",
  defaultSheetTitle: import.meta.env.VITE_DEFAULT_SHEET_TITLE ?? "Accountbook Sheet",
  currency: import.meta.env.VITE_APP_CURRENCY ?? "KRW",
  locale: import.meta.env.VITE_APP_LOCALE ?? "ko-KR",
};
