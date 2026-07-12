import type { CategoryRecord, TransactionDraft, TransactionType } from "../types";

interface TransactionFormProps {
  draft: TransactionDraft;
  categories: CategoryRecord[];
  disabled: boolean;
  isEditing: boolean;
  labels: {
    title: string;
    subtitle: string;
    editing: string;
    new: string;
    date: string;
    type: string;
    amount: string;
    category: string;
    payment: string;
    memo: string;
    paymentPlaceholder: string;
    memoPlaceholder: string;
    save: string;
    reset: string;
    expense: string;
    income: string;
  };
  onChange: (next: TransactionDraft) => void;
  onSubmit: () => void;
  onReset: () => void;
}

export function TransactionForm({
  draft,
  categories,
  disabled,
  isEditing,
  labels,
  onChange,
  onSubmit,
  onReset,
}: TransactionFormProps) {
  const filteredCategories = categories.filter(
    (category) => category.type === draft.type || category.type === "both"
  );

  const setType = (type: TransactionType) => {
    const nextCategories = categories.filter(
      (category) => category.type === type || category.type === "both"
    );
    const currentStillValid = nextCategories.some((category) => category.name === draft.category);
    onChange({
      ...draft,
      type,
      category: currentStillValid ? draft.category : nextCategories[0]?.name ?? "",
    });
  };

  return (
    <section className="panel transaction-panel">
      <div className="panel-header">
        <div>
          <h2>{labels.title}</h2>
          <p className="muted">{labels.subtitle}</p>
        </div>
        <span className="badge">{isEditing ? labels.editing : labels.new}</span>
      </div>

      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label>
          <span className="field-label">{labels.date}</span>
          <input
            type="date"
            value={draft.date}
            onChange={(event) => onChange({ ...draft, date: event.target.value })}
            required
          />
        </label>
        <label>
          <span className="field-label">{labels.type}</span>
          <select value={draft.type} onChange={(event) => setType(event.target.value as TransactionType)}>
            <option value="expense">{labels.expense}</option>
            <option value="income">{labels.income}</option>
          </select>
        </label>
        <label>
          <span className="field-label">{labels.amount}</span>
          <input
            type="number"
            min="0"
            step="1"
            value={draft.amount}
            onChange={(event) => onChange({ ...draft, amount: event.target.value })}
            required
          />
        </label>
        <label>
          <span className="field-label">{labels.category}</span>
          <select
            value={draft.category}
            onChange={(event) => onChange({ ...draft, category: event.target.value })}
          >
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="field-label">{labels.payment}</span>
          <input
            type="text"
            value={draft.paymentMethod}
            placeholder={labels.paymentPlaceholder}
            onChange={(event) => onChange({ ...draft, paymentMethod: event.target.value })}
          />
        </label>
        <label className="full-span">
          <span className="field-label">{labels.memo}</span>
          <input
            type="text"
            value={draft.memo}
            maxLength={120}
            placeholder={labels.memoPlaceholder}
            onChange={(event) => onChange({ ...draft, memo: event.target.value })}
          />
        </label>
        <div className="form-actions full-span">
          <button className="primary-button" type="submit" disabled={disabled}>
            {labels.save}
          </button>
          <button className="ghost-button" type="button" onClick={onReset}>
            {labels.reset}
          </button>
        </div>
      </form>
    </section>
  );
}
