import { extractSpreadsheetId } from "../lib/format";

interface SheetPanelProps {
  isAuthenticated: boolean;
  isConnected: boolean;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  lastSyncLabel: string;
  title: string;
  subtitle: string;
  connectedLabel: string;
  disconnectedLabel: string;
  createLabel: string;
  connectLabel: string;
  inputLabel: string;
  currentLabel: string;
  noneLabel: string;
  lastSyncTextLabel: string;
  onCreate: () => void;
  onConnect: (spreadsheetId: string) => void;
}

export function SheetPanel({
  isAuthenticated,
  isConnected,
  spreadsheetTitle,
  spreadsheetUrl,
  lastSyncLabel,
  title,
  subtitle,
  connectedLabel,
  disconnectedLabel,
  createLabel,
  connectLabel,
  inputLabel,
  currentLabel,
  noneLabel,
  lastSyncTextLabel,
  onCreate,
  onConnect,
}: SheetPanelProps) {
  return (
    <aside className="panel panel-accent sheet-panel">
      <div className="panel-header">
        <div>
          <h2>{title}</h2>
          <p className="muted">{subtitle}</p>
        </div>
        <span className={`badge ${isConnected ? "badge-online" : "badge-offline"}`}>
          {isConnected ? connectedLabel : disconnectedLabel}
        </span>
      </div>

      <div className="sheet-actions">
        <button className="secondary-button" onClick={onCreate} disabled={!isAuthenticated}>
          {createLabel}
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
          <label className="field-label" htmlFor="sheetInput">{inputLabel}</label>
          <input
            id="sheetInput"
            name="sheetInput"
            type="text"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            disabled={!isAuthenticated}
          />
          <button className="secondary-button" type="submit" disabled={!isAuthenticated}>
            {connectLabel}
          </button>
        </form>
      </div>

      <div className="sheet-meta">
        <div>
          <span className="meta-label">{currentLabel}</span>
          {spreadsheetUrl ? (
            <a href={spreadsheetUrl} target="_blank" rel="noreferrer">
              {spreadsheetTitle}
            </a>
          ) : (
            <span className="muted">{noneLabel}</span>
          )}
        </div>
        <div>
          <span className="meta-label">{lastSyncTextLabel}</span>
          <span className="muted">{lastSyncLabel}</span>
        </div>
      </div>
    </aside>
  );
}
