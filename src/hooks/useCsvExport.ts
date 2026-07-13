import { todayIso } from "../lib/date";
import type { TransactionRecord } from "../types";
import type { TFunction } from "../types";

interface UseCsvExportOptions {
  t: TFunction;
  setToast: (message: string) => void;
}

interface UseCsvExportReturn {
  exportCsv: (transactions: TransactionRecord[]) => void;
}

export function useCsvExport(options: UseCsvExportOptions): UseCsvExportReturn {
  const { t, setToast } = options;

  function handleExport(transactions: TransactionRecord[]): void {
    if (transactions.length === 0) {
      setToast(t("toast.exportEmpty"));
      return;
    }
    const header = ["date", "type", "category", "tags", "payment_method", "memo", "amount"];
    const body = transactions.map((transaction) => [
      transaction.date,
      transaction.type,
      transaction.category,
      transaction.tags.join(", "),
      transaction.paymentMethod,
      transaction.memo,
      String(transaction.amount),
    ]);
    const csv = [header, ...body]
      .map((row) => row.map((cell) => `"${String(cell ?? "").split('"').join('""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `accountbook-${todayIso()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return {
    exportCsv: handleExport,
  };
}
