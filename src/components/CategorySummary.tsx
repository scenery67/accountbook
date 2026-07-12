import { formatCurrency } from "../lib/format";
import type { CategoryAggregate } from "../types";

interface CategorySummaryProps {
  entries: CategoryAggregate[];
  locale: string;
  currency: string;
  labels: {
    title: string;
    subtitle: string;
    empty: string;
  };
}

export function CategorySummary({ entries, locale, currency, labels }: CategorySummaryProps) {
  if (entries.length === 0) {
    return (
      <section className="panel chart-panel">
        <div className="panel-header">
          <div>
            <h2>{labels.title}</h2>
            <p className="muted">{labels.subtitle}</p>
          </div>
        </div>
        <div className="empty-state">{labels.empty}</div>
      </section>
    );
  }

  const maxValue = entries[0]?.total || 1;

  return (
    <section className="panel chart-panel">
      <div className="panel-header">
        <div>
          <h2>{labels.title}</h2>
          <p className="muted">{labels.subtitle}</p>
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
