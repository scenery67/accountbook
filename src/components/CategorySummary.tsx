import { formatCurrency } from "../lib/format";
import type { CategoryAggregate, TFunction } from "../types";

interface CategorySummaryProps {
  entries: CategoryAggregate[];
  locale: string;
  currency: string;
  t: TFunction;
  titleKey: string;
  subtitleKey: string;
  emptyKey: string;
}

export function CategorySummary({ entries, locale, currency, t, titleKey, subtitleKey, emptyKey }: CategorySummaryProps) {
  if (entries.length === 0) {
    return (
      <section className="panel chart-panel">
        <div className="panel-header">
          <div>
            <h2>{t(titleKey)}</h2>
            <p className="muted">{t(subtitleKey)}</p>
          </div>
        </div>
        <div className="empty-state">{t(emptyKey)}</div>
      </section>
    );
  }

  const maxValue = entries[0]?.total || 1;

  return (
    <section className="panel chart-panel">
      <div className="panel-header">
        <div>
          <h2>{t(titleKey)}</h2>
          <p className="muted">{t(subtitleKey)}</p>
        </div>
      </div>

      <div className="summary-list">
        {entries.map((entry) => (
          <article key={entry.key} className="summary-item">
            <div className="summary-header">
              <div className="chip">
                <span className="color-dot" style={{ background: entry.color }} />
                <span>{entry.category}</span>
              </div>
              <span className={entry.type === "income" ? "type-income" : "type-expense"}>
                {formatCurrency(entry.total, locale, currency)}
              </span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{
                  width: `${Math.max(8, (entry.total / maxValue) * 100)}%`,
                  background: entry.color,
                }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
