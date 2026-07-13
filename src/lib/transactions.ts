import type { FiltersState, TransactionRecord } from "../types";

export const PAYMENT_METHOD_PRESETS = ["Cash", "Debit Card", "Credit Card", "Transfer"];

export function filterTransactions(
  transactions: TransactionRecord[],
  filters: FiltersState
): TransactionRecord[] {
  return transactions.filter((transaction) => {
    const matchesDate =
      (!filters.startDate || transaction.date >= filters.startDate) &&
      (!filters.endDate || transaction.date <= filters.endDate);
    const matchesPayment =
      !filters.paymentMethod || transaction.paymentMethod === filters.paymentMethod;
    const matchesTag = !filters.tag || transaction.tags.includes(filters.tag);
    const queryTarget =
      `${transaction.memo} ${transaction.category} ${transaction.paymentMethod} ${transaction.tags.join(" ")}`.toLowerCase();
    const matchesKeyword =
      !filters.keyword || queryTarget.includes(filters.keyword.trim().toLowerCase());
    return matchesDate && matchesPayment && matchesTag && matchesKeyword;
  });
}
