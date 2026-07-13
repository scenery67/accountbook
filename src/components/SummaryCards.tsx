import { formatCurrency } from "../lib/format";
import type { SummaryTotals, TFunction } from "../types";

interface SummaryCardsProps {
  totals: SummaryTotals;
  locale: string;
  currency: string;
  t: TFunction;
}

export function SummaryCards({ totals, locale, currency, t }: SummaryCardsProps) {
  return (
    <div className="stat-grid">
      <article className="stat-card stat-income">
        <span>{t("summary.income")}</span>
        <strong>{formatCurrency(totals.income, locale, currency)}</strong>
      </article>
      <article className="stat-card stat-expense">
        <span>{t("summary.expense")}</span>
        <strong>{formatCurrency(totals.expense, locale, currency)}</strong>
      </article>
      <article className="stat-card stat-balance">
        <span>{t("summary.balance")}</span>
        <strong>{formatCurrency(totals.balance, locale, currency)}</strong>
      </article>
      <article className="stat-card stat-count">
        <span>{t("summary.transactions")}</span>
        <strong>{totals.count}</strong>
      </article>
    </div>
  );
}
