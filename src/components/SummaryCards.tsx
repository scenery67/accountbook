import { formatCurrency } from "../lib/format";
import type { SummaryTotals } from "../types";

interface SummaryCardsProps {
  totals: SummaryTotals;
  locale: string;
  currency: string;
  labels: {
    income: string;
    expense: string;
    balance: string;
    transactions: string;
  };
}

export function SummaryCards({ totals, locale, currency, labels }: SummaryCardsProps) {
  return (
    <div className="stat-grid">
      <article className="stat-card stat-income">
        <span>{labels.income}</span>
        <strong>{formatCurrency(totals.income, locale, currency)}</strong>
      </article>
      <article className="stat-card stat-expense">
        <span>{labels.expense}</span>
        <strong>{formatCurrency(totals.expense, locale, currency)}</strong>
      </article>
      <article className="stat-card stat-balance">
        <span>{labels.balance}</span>
        <strong>{formatCurrency(totals.balance, locale, currency)}</strong>
      </article>
      <article className="stat-card stat-count">
        <span>{labels.transactions}</span>
        <strong>{totals.count}</strong>
      </article>
    </div>
  );
}
