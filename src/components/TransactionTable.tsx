import { formatCurrency } from "../lib/format";
import type { TransactionRecord } from "../types";

interface TransactionTableProps {
  transactions: TransactionRecord[];
  locale: string;
  currency: string;
  labels: {
    title: string;
    subtitle: string;
    export: string;
    date: string;
    type: string;
    category: string;
    payment: string;
    memo: string;
    amount: string;
    actions: string;
    empty: string;
    edit: string;
    delete: string;
    income: string;
    expense: string;
  };
  onEdit: (transactionId: string) => void;
  onDelete: (transactionId: string) => void;
  onExport: () => void;
  exportDisabled: boolean;
}

export function TransactionTable({
  transactions,
  locale,
  currency,
  labels,
  onEdit,
  onDelete,
  onExport,
  exportDisabled,
}: TransactionTableProps) {
  return (
    <section className="panel ledger-panel">
      <div className="panel-header">
        <div>
          <h2>{labels.title}</h2>
          <p className="muted">{labels.subtitle}</p>
        </div>
        <button className="ghost-button" onClick={onExport} disabled={exportDisabled}>
          {labels.export}
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{labels.date}</th>
              <th>{labels.type}</th>
              <th>{labels.category}</th>
              <th>{labels.payment}</th>
              <th>{labels.memo}</th>
              <th className="numeric">{labels.amount}</th>
              <th>{labels.actions}</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td className="table-empty" colSpan={7}>
                  {labels.empty}
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{transaction.date}</td>
                  <td>
                    <span className={transaction.type === "income" ? "type-income" : "type-expense"}>
                      {transaction.type === "income" ? labels.income : labels.expense}
                    </span>
                  </td>
                  <td>{transaction.category}</td>
                  <td>{transaction.paymentMethod || "-"}</td>
                  <td>{transaction.memo || "-"}</td>
                  <td className="numeric">{formatCurrency(transaction.amount, locale, currency)}</td>
                  <td>
                    <div className="action-row">
                      <button className="mini-button" type="button" onClick={() => onEdit(transaction.id)}>
                        {labels.edit}
                      </button>
                      <button className="mini-button" type="button" onClick={() => onDelete(transaction.id)}>
                        {labels.delete}
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
