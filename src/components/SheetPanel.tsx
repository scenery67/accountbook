import { extractSpreadsheetId } from "../lib/format";
import type { TFunction } from "../types";

interface SheetPanelProps {
  isAuthenticated: boolean;
  isConnected: boolean;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  lastSyncAt: Date | null;
  locale: string;
  t: TFunction;
  onCreate: () => void;
  onConnect: (spreadsheetId: string) => void;
}

export function SheetPanel({
  isAuthenticated,
  isConnected,
  spreadsheetTitle,
  spreadsheetUrl,
  lastSyncAt,
  locale,
  t,
  onCreate,
  onConnect,
}: SheetPanelProps) {
  const activeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const lastSyncLabel = lastSyncAt
    ? lastSyncAt.toLocaleString(activeLocale)
    : t("sheet.notSynced");

  return (
    <aside className="panel panel-accent sheet-panel">
      <div className="panel-header">
        <div>
          <h2>{t("sheet.title")}</h2>
          <p className="muted">{t("sheet.subtitle")}</p>
        </div>
        <span className={`badge ${isConnected ? "badge-online" : "badge-offline"}`}>
          {isConnected ? t("sheet.connected") : t("sheet.disconnected")}
        </span>
      </div>

      <div className="sheet-actions">
        <button className="secondary-button" onClick={onCreate} disabled={!isAuthenticated}>
          {t("sheet.create")}
        </button>

        <form
          className="inline-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const rawValue = String(form.get("sheetInput") ?? "").trim();
            const spreadsheetId = extractSpreadsheetId(rawValue);
            if (!spreadsheetId) {
              return;
            }
            onConnect(spreadsheetId);
            event.currentTarget.reset();
          }}
        >
          <label className="field-label" htmlFor="sheetInput">{t("sheet.inputLabel")}</label>
          <input
            id="sheetInput"
            name="sheetInput"
            type="text"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            disabled={!isAuthenticated}
          />
          <button className="secondary-button" type="submit" disabled={!isAuthenticated}>
            {t("sheet.connect")}
          </button>
        </form>
      </div>

      <div className="sheet-meta">
        <div>
          <span className="meta-label">{t("sheet.current")}</span>
          {spreadsheetUrl ? (
            <a href={spreadsheetUrl} target="_blank" rel="noreferrer">
              {spreadsheetTitle}
            </a>
          ) : (
            <span className="muted">{t("sheet.none")}</span>
          )}
        </div>
        <div>
          <span className="meta-label">{t("sheet.lastSync")}</span>
          <span className="muted">{lastSyncLabel}</span>
        </div>
      </div>
    </aside>
  );
}
