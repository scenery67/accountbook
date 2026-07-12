export type TransactionType = "income" | "expense";
export type CategoryType = TransactionType | "both";
export type PeriodPreset = "thisMonth" | "thisWeek" | "last30" | "all" | "custom";
export type LocaleCode = "ko" | "en";

export interface TransactionRecord {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  category: string;
  memo: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string;
  rowNumber: number;
}

export interface CategoryRecord {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  sortOrder: string;
  enabled: boolean;
  deletedAt: string;
  rowNumber: number;
}

export interface FiltersState {
  preset: PeriodPreset;
  startDate: string;
  endDate: string;
  paymentMethod: string;
  keyword: string;
}

export interface TransactionDraft {
  id: string;
  date: string;
  type: TransactionType;
  amount: string;
  category: string;
  memo: string;
  paymentMethod: string;
}

export interface CategoryDraft {
  name: string;
  type: CategoryType;
  color: string;
}

export interface SummaryTotals {
  income: number;
  expense: number;
  balance: number;
  count: number;
}

export interface CategoryAggregate {
  key: string;
  type: TransactionType;
  category: string;
  total: number;
  color: string;
}

export interface AppConfig {
  googleClientId: string;
  defaultSheetTitle: string;
  currency: string;
  locale: string;
}

export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
}
