import { useEffect, useState } from "react";
import {
  createWorkbook,
  loadWorkbookData,
  openWorkbook,
  STORAGE_KEYS,
} from "../lib/workbook";
import type { CategoryRecord, LocaleCode, TagRecord, TransactionRecord } from "../types";
import type { TFunction } from "../types";

interface UseWorkbookOptions {
  accessToken: string;
  locale: LocaleCode;
  t: TFunction;
  setToast: (message: string) => void;
}

interface UseWorkbookReturn {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  categories: CategoryRecord[];
  tags: TagRecord[];
  transactions: TransactionRecord[];
  lastSyncAt: Date | null;
  isConnected: boolean;
  refresh: (currentSpreadsheetId?: string) => Promise<void>;
  connect: (nextSpreadsheetId: string) => Promise<void>;
  create: () => Promise<void>;
  clearSession: () => void;
}

export function useWorkbook(options: UseWorkbookOptions): UseWorkbookReturn {
  const { accessToken, locale, t, setToast } = options;
  const [spreadsheetId, setSpreadsheetId] = useState(
    localStorage.getItem(STORAGE_KEYS.spreadsheetId) ?? ""
  );
  const [spreadsheetTitle, setSpreadsheetTitle] = useState("");
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [tags, setTags] = useState<TagRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!accessToken || !spreadsheetId) {
      return;
    }
    void connect(spreadsheetId);
  }, [accessToken]);

  async function refresh(currentSpreadsheetId = spreadsheetId): Promise<void> {
    if (!accessToken || !currentSpreadsheetId) {
      return;
    }
    const workbook = await loadWorkbookData(accessToken, currentSpreadsheetId);
    setTransactions(workbook.transactions);
    setCategories(workbook.categories);
    setTags(workbook.tags);
    setLastSyncAt(new Date());
  }

  async function connect(nextSpreadsheetId: string): Promise<void> {
    if (!accessToken) {
      setToast(t("toast.signInFirst"));
      return;
    }
    try {
      const meta = await openWorkbook(accessToken, nextSpreadsheetId, locale);
      setSpreadsheetId(meta.spreadsheetId);
      setSpreadsheetTitle(meta.spreadsheetTitle);
      setSpreadsheetUrl(meta.spreadsheetUrl);
      localStorage.setItem(STORAGE_KEYS.spreadsheetId, meta.spreadsheetId);
      await refresh(meta.spreadsheetId);
      setToast(t("toast.workbookConnected"));
    } catch (error) {
      setToast(error instanceof Error ? error.message : t("toast.workbookConnectFailed"));
    }
  }

  async function create(): Promise<void> {
    if (!accessToken) {
      setToast(t("toast.signInFirst"));
      return;
    }
    try {
      const meta = await createWorkbook(accessToken, locale);
      setSpreadsheetId(meta.spreadsheetId);
      setSpreadsheetTitle(meta.spreadsheetTitle);
      setSpreadsheetUrl(meta.spreadsheetUrl);
      localStorage.setItem(STORAGE_KEYS.spreadsheetId, meta.spreadsheetId);
      await refresh(meta.spreadsheetId);
      setToast(t("toast.workbookCreated"));
    } catch (error) {
      setToast(error instanceof Error ? error.message : t("toast.workbookCreateFailed"));
    }
  }

  function clearSession(): void {
    setSpreadsheetTitle("");
    setSpreadsheetUrl("");
    setCategories([]);
    setTags([]);
    setTransactions([]);
    setLastSyncAt(null);
  }

  return {
    spreadsheetId,
    spreadsheetTitle,
    spreadsheetUrl,
    categories,
    tags,
    transactions,
    lastSyncAt,
    isConnected: !!spreadsheetId,
    refresh,
    connect,
    create,
    clearSession,
  };
}
