import { formatCurrency } from "../lib/format";
import type { TransactionRecord, TFunction } from "../types";

interface TransactionTableProps {
  transactions: TransactionRecord[];
  locale: string;
  currency: string;
  t: TFunction;
  onEdit: (transactionId: string) => void;
  onDelete: (transactionId: string) => void;
  onExport: () => void;
  exportDisabled: boolean;
}

export function TransactionTable({
  transactions,
  locale,
  currency,
  t,
  onEdit,
  onDelete,
  onExport,
  exportDisabled,
}: TransactionTableProps) {
  return (
    <section className="panel ledger-panel">
      <div className="panel-header">
        <div>
          <h2>{t("table.title")}</h2>
          <p className="muted">{t("table.subtitle")}</p>
        </div>
        <button className="ghost-button" onClick={onExport} disabled={exportDisabled}>
          {t("table.export")}
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("table.date")}</th>
              <th>{t("table.type")}</th>
              <th>{t("table.category")}</th>
              <th>{t("table.payment")}</th>
              <th>{t("table.memo")}</th>
              <th className="numeric">{t("table.amount")}</th>
              <th>{t("table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td className="table-empty" colSpan={7}>
                  {t("table.empty")}
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.date}</td>
                  <td>
                    <span className={transaction.type === "income" ? "type-income" : "type-expense"}>
                      {transaction.type === "income" ? t("type.income") : t("type.expense")}
                    </span>
                  </td>
                  <td>{transaction.category}</td>
                  <td>{transaction.paymentMethod || "-"}</td>
                  <td>{transaction.memo || "-"}</td>
                  <td className="numeric">{formatCurrency(transaction.amount, locale, currency)}</td>
                  <td>
                    <div className="action-row">
                      <button className="mini-button" type="button" onClick={() => onEdit(transaction.id)}>
                        {t("table.edit")}
                      </button>
                      <button className="mini-button" type="button" onClick={() => onDelete(transaction.id)}>
                        {t("table.delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
