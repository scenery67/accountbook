import { useEffect, useMemo, useRef, useState } from "react";
import { AuthHero } from "./components/AuthHero";
import { CategoryManager } from "./components/CategoryManager";
import { CategorySummary } from "./components/CategorySummary";
import { FiltersBar } from "./components/FiltersBar";
import { SheetPanel } from "./components/SheetPanel";
import { SummaryCards } from "./components/SummaryCards";
import { Toast } from "./components/Toast";
import { TagManager } from "./components/TagManager";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionTable } from "./components/TransactionTable";
import { appConfig } from "./lib/config";
import { getRangeByPreset, todayIso } from "./lib/date";
import {
  PAYMENT_METHOD_PRESETS,
  STORAGE_KEYS,
  createCategory,
  createTag,
  createWorkbook,
  disableCategory,
  disableTag,
  fetchGoogleUserProfile,
  filterTransactions,
  getGoogleTokenClient,
  loadGoogleIdentityScript,
  loadWorkbookData,
  openWorkbook,
  revokeGoogleToken,
  saveTransaction,
  softDeleteTransaction,
} from "./lib/googleSheets";
import { formatCurrency, formatWonToManwonInput, parseManwonInputToWon } from "./lib/format";
import { getMessage } from "./i18n";
import type {
  CategoryAggregate,
  CategoryDraft,
  CategoryRecord,
  FiltersState,
  LocaleCode,
  SummaryTotals,
  TagAggregate,
  TagDraft,
  TagRecord,
  TransactionDraft,
  TransactionRecord,
  GoogleUserProfile,
} from "./types";

const initialFilters = (): FiltersState => {
  const range = getRangeByPreset("thisMonth");
  return {
    preset: "thisMonth",
    startDate: range.startDate,
    endDate: range.endDate,
    paymentMethod: "",
    tag: "",
    keyword: "",
  };
};

const initialCategoryDraft: CategoryDraft = {
  name: "",
  type: "expense",
  color: "#fa7b55",
};

const initialTagDraft: TagDraft = {
  name: "",
  color: "#5476d8",
};

const LOCALE_STORAGE_KEY = "accountbook.locale";
type AppTab = "input" | "transactions" | "settings";

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

export default function App() {
  const [locale, setLocale] = useState<LocaleCode>(
    (localStorage.getItem(LOCALE_STORAGE_KEY) as LocaleCode) || "ko"
  );
  const [accessToken, setAccessToken] = useState("");
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userProfile, setUserProfile] = useState<GoogleUserProfile | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState(
    localStorage.getItem(STORAGE_KEYS.spreadsheetId) ?? ""
  );
  const [spreadsheetTitle, setSpreadsheetTitle] = useState("");
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [tags, setTags] = useState<TagRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [transactionDraft, setTransactionDraft] = useState<TransactionDraft>(createInitialTransactionDraft());
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>(initialCategoryDraft);
  const [tagDraft, setTagDraft] = useState<TagDraft>(initialTagDraft);
  const [editingTransactionId, setEditingTransactionId] = useState("");
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [activeTab, setActiveTab] = useState<AppTab>("input");
  const [isSheetMenuOpen, setIsSheetMenuOpen] = useState(false);
  const tokenClientRef = useRef<ReturnType<typeof getGoogleTokenClient> | null>(null);
  const t = (key: string) => getMessage(locale, key);

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    if (!appConfig.googleClientId) {
      setToastMessage(t("toast.setClientId"));
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await loadGoogleIdentityScript();
        if (cancelled) {
          return;
        }
        tokenClientRef.current = getGoogleTokenClient((response) => {
          if (response.error) {
            setToastMessage(`${t("toast.signInFailed")}: ${response.error}`);
            return;
          }
          if (!response.access_token) {
            setToastMessage(t("toast.noAccessToken"));
            return;
          }
          setAccessToken(response.access_token);
          void fetchGoogleUserProfile(response.access_token)
            .then((profile) => setUserProfile(profile))
            .catch(() => {
              setUserProfile(null);
            });
        });
        setIsAuthReady(true);
      } catch (error) {
        if (cancelled) {
          return;
        }
        const message = error instanceof Error ? error.message : t("toast.authLoadFailed");
        setToastMessage(message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    if (!accessToken || !spreadsheetId) {
      return;
    }
    void connectWorkbook(spreadsheetId);
  }, [accessToken]);

  useEffect(() => {
    if (filters.preset === "custom") {
      return;
    }
    const range = getRangeByPreset(filters.preset, filters.startDate, filters.endDate);
    setFilters((current) => ({ ...current, ...range }));
  }, [filters.preset]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timeout = window.setTimeout(() => setToastMessage(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  const filteredTransactions = useMemo(() => {
    return filterTransactions(transactions, filters).sort((left, right) =>
      right.date.localeCompare(left.date)
    );
  }, [transactions, filters]);

  const paymentMethods = useMemo(() => {
    const values = new Set(PAYMENT_METHOD_PRESETS);
    transactions.forEach((transaction) => {
      if (transaction.paymentMethod) {
        values.add(transaction.paymentMethod);
      }
    });
    return [...values].sort((left, right) => left.localeCompare(right));
  }, [transactions]);

  const tagNames = useMemo(() => tags.map((entry) => entry.name), [tags]);

  const totals = useMemo<SummaryTotals>(() => {
    const income = filteredTransactions
      .filter((entry) => entry.type === "income")
      .reduce((sum, entry) => sum + entry.amount, 0);
    const expense = filteredTransactions
      .filter((entry) => entry.type === "expense")
      .reduce((sum, entry) => sum + entry.amount, 0);
    return {
      income,
      expense,
      balance: income - expense,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const categoryTotals = useMemo<CategoryAggregate[]>(() => {
    const aggregate = new Map<string, CategoryAggregate>();
    filteredTransactions.forEach((transaction) => {
      const key = `${transaction.type}:${transaction.category}`;
      const current = aggregate.get(key) ?? {
        key,
        type: transaction.type,
        category: transaction.category,
        total: 0,
        color: categories.find((entry) => entry.name === transaction.category)?.color ?? "#7c6f67",
      };
      current.total += transaction.amount;
      aggregate.set(key, current);
    });
    return [...aggregate.values()].sort((left, right) => right.total - left.total);
  }, [categories, filteredTransactions]);

  const tagTotals = useMemo<TagAggregate[]>(() => {
    const aggregate = new Map<string, TagAggregate>();
    filteredTransactions.forEach((transaction) => {
      transaction.tags.forEach((tag) => {
        const key = `${transaction.type}:${tag}`;
        const current = aggregate.get(key) ?? {
          key,
          type: transaction.type,
          tag,
          total: 0,
          color: tags.find((entry) => entry.name === tag)?.color ?? "#5476d8",
        };
        current.total += transaction.amount;
        aggregate.set(key, current);
      });
    });
    return [...aggregate.values()].sort((left, right) => right.total - left.total);
  }, [filteredTransactions, tags]);

  const isAuthenticated = Boolean(accessToken);
  const isConnected = Boolean(accessToken && spreadsheetId);
  const canSaveTransaction = isConnected && categories.length > 0;
  const canManageCategories = isConnected;
  const activeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const lastSyncLabel = lastSyncAt ? lastSyncAt.toLocaleString(activeLocale) : t("sheet.notSynced");

  async function refreshWorkbookData(currentSpreadsheetId = spreadsheetId): Promise<void> {
    if (!accessToken || !currentSpreadsheetId) {
      return;
    }
    const workbook = await loadWorkbookData(accessToken, currentSpreadsheetId);
    setTransactions(workbook.transactions);
    setCategories(workbook.categories);
    setTags(workbook.tags);
    setLastSyncAt(new Date());
    setTransactionDraft((current) => {
      if (current.id) {
        return current;
      }
      return createInitialTransactionDraft(workbook.categories);
    });
  }

  async function connectWorkbook(nextSpreadsheetId: string): Promise<void> {
    if (!accessToken) {
      setToastMessage(t("toast.signInFirst"));
      return;
    }
    try {
      const meta = await openWorkbook(accessToken, nextSpreadsheetId, locale);
      setSpreadsheetId(meta.spreadsheetId);
      setSpreadsheetTitle(meta.spreadsheetTitle);
      setSpreadsheetUrl(meta.spreadsheetUrl);
      localStorage.setItem(STORAGE_KEYS.spreadsheetId, meta.spreadsheetId);
      await refreshWorkbookData(meta.spreadsheetId);
      setToastMessage(t("toast.workbookConnected"));
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : t("toast.workbookConnectFailed"));
    }
  }

  async function handleCreateWorkbook(): Promise<void> {
    if (!accessToken) {
      setToastMessage(t("toast.signInFirst"));
      return;
    }
    try {
      const meta = await createWorkbook(accessToken, locale);
      setSpreadsheetId(meta.spreadsheetId);
      setSpreadsheetTitle(meta.spreadsheetTitle);
      setSpreadsheetUrl(meta.spreadsheetUrl);
      localStorage.setItem(STORAGE_KEYS.spreadsheetId, meta.spreadsheetId);
      await refreshWorkbookData(meta.spreadsheetId);
      setToastMessage(t("toast.workbookCreated"));
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : t("toast.workbookCreateFailed"));
    }
  }

  function handleLogin(): void {
    if (!isAuthReady || !tokenClientRef.current) {
      setToastMessage(t("toast.authNotReady"));
      return;
    }
    tokenClientRef.current.requestAccessToken({ prompt: "consent" });
  }

  function handleLogout(): void {
    if (accessToken) {
      revokeGoogleToken(accessToken);
    }
    setAccessToken("");
    setSpreadsheetTitle("");
    setSpreadsheetUrl("");
    setUserProfile(null);
    setTransactions([]);
    setCategories([]);
    setTags([]);
    setEditingTransactionId("");
    setTransactionDraft(createInitialTransactionDraft());
    setLastSyncAt(null);
    setToastMessage(t("toast.signedOut"));
  }

  async function handleSaveTransaction(): Promise<void> {
    if (!accessToken || !spreadsheetId) {
      setToastMessage(t("toast.signInFirst"));
      return;
    }
    if (!transactionDraft.date || !transactionDraft.amount || !transactionDraft.category) {
      setToastMessage(t("toast.requiredTransaction"));
      return;
    }
    if (!Number.isFinite(parseManwonInputToWon(transactionDraft.amount))) {
      setToastMessage(t("toast.requiredTransaction"));
      return;
    }

    try {
      const existing =
        transactions.find((entry) => entry.id === editingTransactionId || entry.id === transactionDraft.id) ??
        null;
      await saveTransaction(accessToken, spreadsheetId, transactionDraft, existing);
      await refreshWorkbookData();
      resetTransactionDraft();
      setToastMessage(existing ? t("toast.transactionUpdated") : t("toast.transactionCreated"));
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : t("toast.transactionSaveFailed"));
    }
  }

  async function handleCreateCategory(): Promise<void> {
    if (!accessToken || !spreadsheetId) {
      setToastMessage(t("toast.signInFirst"));
      return;
    }
    const duplicate = categories.find(
      (entry) =>
        entry.name.toLowerCase() === categoryDraft.name.trim().toLowerCase() &&
        entry.type === categoryDraft.type
    );
    if (!categoryDraft.name.trim()) {
      setToastMessage(t("toast.categoryNameRequired"));
      return;
    }
    if (duplicate) {
      setToastMessage(t("toast.categoryDuplicate"));
      return;
    }

    try {
      await createCategory(accessToken, spreadsheetId, categoryDraft, categories);
      await refreshWorkbookData();
      setCategoryDraft(initialCategoryDraft);
      setToastMessage(t("toast.categoryAdded"));
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : t("toast.categoryAddFailed"));
    }
  }

  async function handleDisableCategory(categoryId: string): Promise<void> {
    if (!accessToken || !spreadsheetId) {
      return;
    }
    const category = categories.find((entry) => entry.id === categoryId);
    if (!category) {
      return;
    }

    try {
      await disableCategory(accessToken, spreadsheetId, category);
      await refreshWorkbookData();
      setToastMessage(t("toast.categoryDisabled"));
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : t("toast.categoryDisableFailed"));
    }
  }

  function handleEditTransaction(transactionId: string): void {
    const transaction = transactions.find((entry) => entry.id === transactionId);
    if (!transaction) {
      return;
    }
    setEditingTransactionId(transaction.id);
    setTransactionDraft({
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
      await refreshWorkbookData();
      if (editingTransactionId === transactionId) {
        resetTransactionDraft();
      }
      setToastMessage(t("toast.transactionDeleted"));
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : t("toast.transactionDeleteFailed"));
    }
  }

  function resetTransactionDraft(): void {
    setEditingTransactionId("");
    setTransactionDraft(createInitialTransactionDraft(categories));
  }

  async function handleCreateTag(): Promise<void> {
    if (!accessToken || !spreadsheetId) {
      setToastMessage(t("toast.signInFirst"));
      return;
    }
    if (!tagDraft.name.trim()) {
      setToastMessage(t("toast.tagNameRequired"));
      return;
    }
    if (tags.some((entry) => entry.name.toLowerCase() === tagDraft.name.trim().toLowerCase())) {
      setToastMessage(t("toast.tagDuplicate"));
      return;
    }

    try {
      await createTag(accessToken, spreadsheetId, tagDraft, tags);
      await refreshWorkbookData();
      setTagDraft(initialTagDraft);
      setToastMessage(t("toast.tagAdded"));
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : t("toast.tagAddFailed"));
    }
  }

  async function handleDisableTag(tagId: string): Promise<void> {
    if (!accessToken || !spreadsheetId) {
      return;
    }
    const tag = tags.find((entry) => entry.id === tagId);
    if (!tag) {
      return;
    }

    try {
      await disableTag(accessToken, spreadsheetId, tag);
      await refreshWorkbookData();
      setTransactionDraft((current) => ({
        ...current,
        tags: current.tags.filter((entry) => entry !== tag.name),
      }));
      setToastMessage(t("toast.tagDisabled"));
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : t("toast.tagDisableFailed"));
    }
  }

  function handleExport(): void {
    if (filteredTransactions.length === 0) {
      setToastMessage(t("toast.exportEmpty"));
      return;
    }
    const header = ["date", "type", "category", "tags", "payment_method", "memo", "amount"];
    const body = filteredTransactions.map((transaction) => [
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
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `accountbook-${todayIso()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="page-shell">
      <AuthHero
        isAuthenticated={isAuthenticated}
        isAuthReady={isAuthReady}
        userName={userProfile?.name}
        userEmail={userProfile?.email}
        userPicture={userProfile?.picture}
        currentLocale={locale}
        languageLabel={t("lang.label")}
        languageOptions={[
          { value: "ko", label: t("lang.ko") },
          { value: "en", label: t("lang.en") },
        ]}
        onLocaleChange={setLocale}
        title={t("hero.title")}
        eyebrow={t("hero.eyebrow")}
        copy={t("hero.copy")}
        signInLabel={t("auth.signIn")}
        signOutLabel={t("auth.signOut")}
        authLoadingLabel={t("auth.loading")}
        signedInAsLabel={t("auth.signedInAs")}
        extraActions={
          <div className="sheet-menu-wrap">
            <button
              className="ghost-button"
              type="button"
              onClick={() => setIsSheetMenuOpen((current) => !current)}
            >
              {t("sheet.manage")}
            </button>
            {isSheetMenuOpen ? (
              <div className="sheet-dropdown">
                <SheetPanel
                  isAuthenticated={isAuthenticated}
                  isConnected={isConnected}
                  spreadsheetTitle={spreadsheetTitle || spreadsheetId}
                  spreadsheetUrl={spreadsheetUrl}
                  lastSyncLabel={lastSyncLabel}
                  title={t("sheet.title")}
                  subtitle={t("sheet.subtitle")}
                  connectedLabel={t("sheet.connected")}
                  disconnectedLabel={t("sheet.disconnected")}
                  createLabel={t("sheet.create")}
                  connectLabel={t("sheet.connect")}
                  inputLabel={t("sheet.inputLabel")}
                  currentLabel={t("sheet.current")}
                  noneLabel={t("sheet.none")}
                  lastSyncTextLabel={t("sheet.lastSync")}
                  onCreate={() => void handleCreateWorkbook()}
                  onConnect={(nextSpreadsheetId) => void connectWorkbook(nextSpreadsheetId)}
                />
              </div>
            ) : null}
          </div>
        }
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      <main className="app-stack">
        <section className="dashboard-grid">
          <section className="panel summary-panel">
            <div className="panel-header">
              <div>
                <h2>{t("dashboard.title")}</h2>
                <p className="muted">{t("dashboard.subtitle")}</p>
              </div>
              <button
                className="ghost-button"
                disabled={!isConnected}
                onClick={() => void refreshWorkbookData()}
              >
                {t("dashboard.refresh")}
              </button>
            </div>

            <FiltersBar
              filters={filters}
              paymentMethods={paymentMethods}
              labels={{
                period: t("filters.period"),
                start: t("filters.start"),
                end: t("filters.end"),
                payment: t("filters.payment"),
                tag: t("filters.tag"),
                keyword: t("filters.keyword"),
                keywordPlaceholder: t("filters.keywordPlaceholder"),
                all: t("filters.all"),
                thisMonth: t("filters.thisMonth"),
                thisWeek: t("filters.thisWeek"),
                last30: t("filters.last30"),
                custom: t("filters.custom"),
              }}
              tagOptions={tagNames}
              onChange={setFilters}
            />
            <SummaryCards
              totals={totals}
              locale={activeLocale}
              currency={appConfig.currency}
              labels={{
                income: t("summary.income"),
                expense: t("summary.expense"),
                balance: t("summary.balance"),
                transactions: t("summary.transactions"),
              }}
            />
          </section>

          <CategorySummary
            entries={categoryTotals}
            locale={activeLocale}
            currency={appConfig.currency}
            labels={{
              title: t("chart.title"),
              subtitle: t("chart.subtitle"),
              empty: t("chart.empty"),
            }}
          />

          <CategorySummary
            entries={tagTotals.map((entry) => ({
              key: entry.key,
              type: entry.type,
              category: entry.tag,
              total: entry.total,
              color: entry.color,
            }))}
            locale={activeLocale}
            currency={appConfig.currency}
            labels={{
              title: t("tag.summaryTitle"),
              subtitle: t("tag.summarySubtitle"),
              empty: t("tag.summaryEmpty"),
            }}
          />
        </section>

        <section className="panel tab-panel">
          <div className="tab-bar">
            <button
              className={`tab-button ${activeTab === "input" ? "tab-button-active" : ""}`}
              type="button"
              onClick={() => setActiveTab("input")}
            >
              {t("tabs.input")}
            </button>
            <button
              className={`tab-button ${activeTab === "transactions" ? "tab-button-active" : ""}`}
              type="button"
              onClick={() => setActiveTab("transactions")}
            >
              {t("tabs.transactions")}
            </button>
            <button
              className={`tab-button ${activeTab === "settings" ? "tab-button-active" : ""}`}
              type="button"
              onClick={() => setActiveTab("settings")}
            >
              {t("tabs.settings")}
            </button>
          </div>

          {activeTab === "input" ? (
            <TransactionForm
              draft={transactionDraft}
              categories={categories}
              availableTags={tagNames}
              disabled={!canSaveTransaction}
              isEditing={Boolean(editingTransactionId)}
              labels={{
                title: t("transaction.title"),
                subtitle: t("transaction.subtitle"),
                editing: t("transaction.editing"),
                new: t("transaction.new"),
                date: t("transaction.date"),
                type: t("transaction.type"),
                amount: t("transaction.amount"),
                amountHelp: t("transaction.amountHelp"),
                category: t("transaction.category"),
                tags: t("transaction.tags"),
                tagsHelp: t("transaction.tagsHelp"),
                payment: t("transaction.payment"),
                memo: t("transaction.memo"),
                paymentPlaceholder: t("transaction.paymentPlaceholder"),
                memoPlaceholder: t("transaction.memoPlaceholder"),
                save: t("transaction.save"),
                reset: t("transaction.reset"),
                expense: t("type.expense"),
                income: t("type.income"),
              }}
              onChange={setTransactionDraft}
              onSubmit={() => void handleSaveTransaction()}
              onReset={resetTransactionDraft}
            />
          ) : null}

          {activeTab === "transactions" ? (
            <TransactionTable
              transactions={filteredTransactions}
              locale={activeLocale}
              currency={appConfig.currency}
              labels={{
                title: t("table.title"),
                subtitle: t("table.subtitle"),
                export: t("table.export"),
                date: t("table.date"),
                type: t("table.type"),
                category: t("table.category"),
                payment: t("table.payment"),
                memo: t("table.memo"),
                amount: t("table.amount"),
                actions: t("table.actions"),
                empty: t("table.empty"),
                edit: t("table.edit"),
                delete: t("table.delete"),
                income: t("type.income"),
                expense: t("type.expense"),
              }}
              onEdit={handleEditTransaction}
              onDelete={(transactionId) => void handleDeleteTransaction(transactionId)}
              onExport={handleExport}
              exportDisabled={filteredTransactions.length === 0}
            />
          ) : null}

          {activeTab === "settings" ? (
            <div className="settings-grid">
              <CategoryManager
                draft={categoryDraft}
                categories={categories}
                disabled={!canManageCategories}
                labels={{
                  title: t("category.title"),
                  subtitle: t("category.subtitle"),
                  name: t("category.name"),
                  type: t("transaction.type"),
                  color: t("category.color"),
                  add: t("category.add"),
                  none: t("category.none"),
                  disable: t("category.disable"),
                  sort: t("category.sort"),
                  expense: t("type.expense"),
                  income: t("type.income"),
                  both: t("type.both"),
                }}
                onChange={setCategoryDraft}
                onSubmit={() => void handleCreateCategory()}
                onDisable={(categoryId) => void handleDisableCategory(categoryId)}
              />

              <TagManager
                draft={tagDraft}
                tags={tags}
                disabled={!canManageCategories}
                labels={{
                  title: t("tag.title"),
                  subtitle: t("tag.subtitle"),
                  name: t("tag.name"),
                  color: t("tag.color"),
                  add: t("tag.add"),
                  none: t("tag.none"),
                  disable: t("tag.disable"),
                  sort: t("tag.sort"),
                }}
                onChange={setTagDraft}
                onSubmit={() => void handleCreateTag()}
                onDisable={(tagId) => void handleDisableTag(tagId)}
              />
            </div>
          ) : null}
        </section>
      </main>

      <Toast message={toastMessage} />
    </div>
  );
}
