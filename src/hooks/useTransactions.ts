import { useEffect, useState } from "react";
import {
  saveTransaction,
  softDeleteTransaction,
} from "../lib/workbook";
import { parseManwonInputToWon, formatWonToManwonInput } from "../lib/format";
import { todayIso } from "../lib/date";
import type {
  CategoryRecord,
  TransactionDraft,
  TransactionRecord,
} from "../types";
import type { TFunction } from "../types";

interface UseTransactionsOptions {
  accessToken: string;
  spreadsheetId: string;
  transactions: TransactionRecord[];
  categories: CategoryRecord[];
  refresh: () => Promise<void>;
  t: TFunction;
  setToast: (message: string) => void;
}

interface UseTransactionsReturn {
  draft: TransactionDraft;
  setDraft: (next: TransactionDraft) => void;
  editingTransactionId: string;
  saveTransaction: () => Promise<void>;
  editTransaction: (transactionId: string) => void;
  deleteTransaction: (transactionId: string) => Promise<void>;
  resetDraft: () => void;
  clearDraft: () => void;
  removeTagFromDraft: (tagName: string) => void;
}

function createInitialTransactionDraft(categories: CategoryRecord[] = []): TransactionDraft {
  return {
    id: "",
    date: todayIso(),
    type: "expense",
    amount: "",
    category: categories.find((entry) => entry.type === "expense" || entry.type === "both")?.name ?? "",
    tags: [],
    memo: "",
    paymentMethod: "",
  };
}

export function useTransactions(options: UseTransactionsOptions): UseTransactionsReturn {
  const { accessToken, spreadsheetId, transactions, categories, refresh, t, setToast } = options;
  const [draft, setDraft] = useState<TransactionDraft>(createInitialTransactionDraft());
  const [editingTransactionId, setEditingTransactionId] = useState("");

  useEffect(() => {
    if (editingTransactionId === "") {
      setDraft(createInitialTransactionDraft(categories));
    }
  }, [categories]);

  async function handleSaveTransaction(): Promise<void> {
    if (!accessToken || !spreadsheetId) {
      setToast(t("toast.signInFirst"));
      return;
    }
    if (!draft.date || !draft.amount || !draft.category) {
      setToast(t("toast.requiredTransaction"));
      return;
    }
    if (!Number.isFinite(parseManwonInputToWon(draft.amount))) {
      setToast(t("toast.requiredTransaction"));
      return;
    }

    try {
      const existing =
        transactions.find((entry) => entry.id === editingTransactionId || entry.id === draft.id) ??
        null;
      await saveTransaction(accessToken, spreadsheetId, draft, existing);
      await refresh();
      resetDraft();
      setToast(existing ? t("toast.transactionUpdated") : t("toast.transactionCreated"));
    } catch (error) {
      setToast(error instanceof Error ? error.message : t("toast.transactionSaveFailed"));
    }
  }

  function handleEditTransaction(transactionId: string): void {
    const transaction = transactions.find((entry) => entry.id === transactionId);
    if (!transaction) {
      return;
    }
    setEditingTransactionId(transaction.id);
    setDraft({
      id: transaction.id,
      date: transaction.date,
      type: transaction.type,
      amount: formatWonToManwonInput(transaction.amount),
      category: transaction.category,
      tags: transaction.tags,
      memo: transaction.memo,
      paymentMethod: transaction.paymentMethod,
    });
  }

  async function handleDeleteTransaction(transactionId: string): Promise<void> {
    if (!accessToken || !spreadsheetId) {
      return;
    }
    const transaction = transactions.find((entry) => entry.id === transactionId);
    if (!transaction) {
      return;
    }

    try {
      await softDeleteTransaction(accessToken, spreadsheetId, transaction);
      await refresh();
      if (editingTransactionId === transactionId) {
        resetDraft();
      }
      setToast(t("toast.transactionDeleted"));
    } catch (error) {
      setToast(error instanceof Error ? error.message : t("toast.transactionDeleteFailed"));
    }
  }

  function resetDraft(): void {
    setEditingTransactionId("");
    setDraft(createInitialTransactionDraft(categories));
  }

  function clearDraft(): void {
    setEditingTransactionId("");
    setDraft(createInitialTransactionDraft());
  }

  function removeTagFromDraft(tagName: string): void {
    setDraft((current) => ({
      ...current,
      tags: current.tags.filter((entry) => entry !== tagName),
    }));
  }

  return {
    draft,
    setDraft,
    editingTransactionId,
    saveTransaction: handleSaveTransaction,
    editTransaction: handleEditTransaction,
    deleteTransaction: handleDeleteTransaction,
    resetDraft,
    clearDraft,
    removeTagFromDraft,
  };
}
