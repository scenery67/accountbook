import { useEffect, useState } from "react";
import { AuthHero } from "./components/AuthHero";
import { CategorySummary } from "./components/CategorySummary";
import { EntityManager } from "./components/EntityManager";
import { FiltersBar } from "./components/FiltersBar";
import { SheetPanel } from "./components/SheetPanel";
import { SummaryCards } from "./components/SummaryCards";
import { Toast } from "./components/Toast";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionTable } from "./components/TransactionTable";
import { appConfig } from "./lib/config";
import { getMessage } from "./i18n";
import { useGoogleAuth } from "./hooks/useGoogleAuth";
import { useWorkbook } from "./hooks/useWorkbook";
import { useTransactions } from "./hooks/useTransactions";
import { useCategories } from "./hooks/useCategories";
import { useTags } from "./hooks/useTags";
import { useFilteredTotals } from "./hooks/useFilteredTotals";
import { useCsvExport } from "./hooks/useCsvExport";
import type { LocaleCode } from "./types";

const LOCALE_STORAGE_KEY = "accountbook.locale";
type AppTab = "input" | "transactions" | "settings";

export default function App() {
  const [locale, setLocale] = useState<LocaleCode>(
    (localStorage.getItem(LOCALE_STORAGE_KEY) as LocaleCode) || "ko"
  );
  const [toastMessage, setToastMessage] = useState("");
  const [activeTab, setActiveTab] = useState<AppTab>("input");
  const [isSheetMenuOpen, setIsSheetMenuOpen] = useState(false);

  const t = (key: string) => getMessage(locale, key);

  // Initialize hooks
  const googleAuth = useGoogleAuth({
    locale,
    t,
    setToast: setToastMessage,
  });

  const workbook = useWorkbook({
    accessToken: googleAuth.accessToken,
    locale,
    t,
    setToast: setToastMessage,
  });

  const filteredTotals = useFilteredTotals({
    transactions: workbook.transactions,
    categories: workbook.categories,
    tags: workbook.tags,
  });

  const transactions = useTransactions({
    accessToken: googleAuth.accessToken,
    spreadsheetId: workbook.spreadsheetId,
    transactions: workbook.transactions,
    categories: workbook.categories,
    refresh: workbook.refresh,
    t,
    setToast: setToastMessage,
  });

  const categories = useCategories({
    accessToken: googleAuth.accessToken,
    spreadsheetId: workbook.spreadsheetId,
    categories: workbook.categories,
    refresh: workbook.refresh,
    t,
    setToast: setToastMessage,
  });

  const tags = useTags({
    accessToken: googleAuth.accessToken,
    spreadsheetId: workbook.spreadsheetId,
    tags: workbook.tags,
    refresh: workbook.refresh,
    onTagDisabled: transactions.removeTagFromDraft,
    t,
    setToast: setToastMessage,
  });

  const csvExport = useCsvExport({
    t,
    setToast: setToastMessage,
  });

  // Locale effect
  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  // Toast auto-dismiss effect
  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timeout = window.setTimeout(() => setToastMessage(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  // Helpers
  const isAuthenticated = googleAuth.isAuthenticated;
  const isConnected = googleAuth.accessToken && workbook.spreadsheetId ? true : false;
  const canSaveTransaction = isConnected && workbook.categories.length > 0;
  const canManageCategories = isConnected;
  const activeLocale = locale === "ko" ? "ko-KR" : "en-US";

  function handleLogout(): void {
    googleAuth.logout();
    workbook.clearSession();
    transactions.clearDraft();
    setToastMessage(t("toast.signedOut"));
  }

  return (
    <div className="page-shell">
      <AuthHero
        isAuthenticated={isAuthenticated}
        isAuthReady={googleAuth.isAuthReady}
        userName={googleAuth.userProfile?.name}
        userEmail={googleAuth.userProfile?.email}
        userPicture={googleAuth.userProfile?.picture}
        currentLocale={locale}
        t={t}
        onLocaleChange={setLocale}
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
                  spreadsheetTitle={workbook.spreadsheetTitle || workbook.spreadsheetId}
                  spreadsheetUrl={workbook.spreadsheetUrl}
                  lastSyncAt={workbook.lastSyncAt}
                  locale={locale}
                  t={t}
                  onCreate={() => void workbook.create()}
                  onConnect={(nextSpreadsheetId) => void workbook.connect(nextSpreadsheetId)}
                />
              </div>
            ) : null}
          </div>
        }
        onLogin={googleAuth.login}
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
                onClick={() => void workbook.refresh()}
              >
                {t("dashboard.refresh")}
              </button>
            </div>

            <FiltersBar
              filters={filteredTotals.filters}
              paymentMethods={filteredTotals.paymentMethods}
              t={t}
              tagOptions={filteredTotals.tagNames}
              onChange={filteredTotals.setFilters}
            />
            <SummaryCards
              totals={filteredTotals.totals}
              locale={activeLocale}
              currency={appConfig.currency}
              t={t}
            />
          </section>

          <CategorySummary
            entries={filteredTotals.categoryTotals}
            locale={activeLocale}
            currency={appConfig.currency}
            t={t}
            titleKey="chart.title"
            subtitleKey="chart.subtitle"
            emptyKey="chart.empty"
          />

          <CategorySummary
            entries={filteredTotals.tagTotals.map((entry) => ({
              key: entry.key,
              type: entry.type,
              category: entry.tag,
              total: entry.total,
              color: entry.color,
            }))}
            locale={activeLocale}
            currency={appConfig.currency}
            t={t}
            titleKey="tag.summaryTitle"
            subtitleKey="tag.summarySubtitle"
            emptyKey="tag.summaryEmpty"
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
              draft={transactions.draft}
              categories={workbook.categories}
              availableTags={filteredTotals.tagNames}
              disabled={!canSaveTransaction}
              isEditing={Boolean(transactions.editingTransactionId)}
              t={t}
              onChange={transactions.setDraft}
              onSubmit={() => void transactions.saveTransaction()}
              onReset={transactions.resetDraft}
            />
          ) : null}

          {activeTab === "transactions" ? (
            <TransactionTable
              transactions={filteredTotals.filteredTransactions}
              locale={activeLocale}
              currency={appConfig.currency}
              t={t}
              onEdit={transactions.editTransaction}
              onDelete={(transactionId) => void transactions.deleteTransaction(transactionId)}
              onExport={() => csvExport.exportCsv(filteredTotals.filteredTransactions)}
              exportDisabled={filteredTotals.filteredTransactions.length === 0}
            />
          ) : null}

          {activeTab === "settings" ? (
            <div className="settings-grid">
              <EntityManager
                kind="category"
                t={t}
                disabled={!canManageCategories}
                name={categories.draft.name}
                color={categories.draft.color}
                categoryType={categories.draft.type}
                items={workbook.categories.map((c) => ({
                  id: c.id,
                  name: c.name,
                  color: c.color,
                  sortOrder: c.sortOrder,
                  type: c.type,
                }))}
                onNameChange={(name) => categories.setDraft({ ...categories.draft, name })}
                onColorChange={(color) => categories.setDraft({ ...categories.draft, color })}
                onCategoryTypeChange={(type) => categories.setDraft({ ...categories.draft, type })}
                onSubmit={() => void categories.createCategory()}
                onDisable={(categoryId) => void categories.disableCategory(categoryId)}
              />

              <EntityManager
                kind="tag"
                t={t}
                disabled={!canManageCategories}
                name={tags.draft.name}
                color={tags.draft.color}
                items={workbook.tags.map((tag) => ({
                  id: tag.id,
                  name: tag.name,
                  color: tag.color,
                  sortOrder: tag.sortOrder,
                }))}
                onNameChange={(name) => tags.setDraft({ ...tags.draft, name })}
                onColorChange={(color) => tags.setDraft({ ...tags.draft, color })}
                onSubmit={() => void tags.createTag()}
                onDisable={(tagId) => void tags.disableTag(tagId)}
              />
            </div>
          ) : null}
        </section>
      </main>

      <Toast message={toastMessage} />
    </div>
  );
}
