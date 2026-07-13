import type { CategoryRecord, TransactionDraft, TransactionType, TFunction } from "../types";

interface TransactionFormProps {
  draft: TransactionDraft;
  categories: CategoryRecord[];
  availableTags: string[];
  disabled: boolean;
  isEditing: boolean;
  t: TFunction;
  onChange: (next: TransactionDraft) => void;
  onSubmit: () => void;
  onReset: () => void;
}

export function TransactionForm({
  draft,
  categories,
  availableTags,
  disabled,
  isEditing,
  t,
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

  const toggleTag = (tag: string) => {
    const exists = draft.tags.includes(tag);
    onChange({
      ...draft,
      tags: exists ? draft.tags.filter((entry) => entry !== tag) : [...draft.tags, tag],
    });
  };

  return (
    <section className="panel transaction-panel">
      <div className="panel-header">
        <div>
          <h2>{t("transaction.title")}</h2>
          <p className="muted">{t("transaction.subtitle")}</p>
        </div>
        <span className="badge">{isEditing ? t("transaction.editing") : t("transaction.new")}</span>
      </div>

      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label>
          <span className="field-label">{t("transaction.date")}</span>
          <input
            type="date"
            value={draft.date}
            onChange={(event) => onChange({ ...draft, date: event.target.value })}
            required
          />
        </label>
        <label>
          <span className="field-label">{t("transaction.type")}</span>
          <select value={draft.type} onChange={(event) => setType(event.target.value as TransactionType)}>
            <option value="expense">{t("type.expense")}</option>
            <option value="income">{t("type.income")}</option>
          </select>
        </label>
        <label>
          <span className="field-label">{t("transaction.amount")}</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={draft.amount}
            onChange={(event) => onChange({ ...draft, amount: event.target.value })}
            required
          />
          <span className="field-hint">{t("transaction.amountHelp")}</span>
        </label>
        <label>
          <span className="field-label">{t("transaction.category")}</span>
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
        <div className="full-span">
          <span className="field-label">{t("transaction.tags")}</span>
          <div className="tag-picker">
            {availableTags.length === 0 ? (
              <span className="muted">{t("transaction.tagsHelp")}</span>
            ) : (
              availableTags.map((tag) => (
                <button
                  key={tag}
                  className={`tag-chip ${draft.tags.includes(tag) ? "tag-chip-active" : ""}`}
                  type="button"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))
            )}
          </div>
          <span className="field-hint">{t("transaction.tagsHelp")}</span>
        </div>
        <label>
          <span className="field-label">{t("transaction.payment")}</span>
          <input
            type="text"
            value={draft.paymentMethod}
            placeholder={t("transaction.paymentPlaceholder")}
            onChange={(event) => onChange({ ...draft, paymentMethod: event.target.value })}
          />
        </label>
        <label className="full-span">
          <span className="field-label">{t("transaction.memo")}</span>
          <input
            type="text"
            value={draft.memo}
            maxLength={120}
            placeholder={t("transaction.memoPlaceholder")}
            onChange={(event) => onChange({ ...draft, memo: event.target.value })}
          />
        </label>
        <div className="form-actions full-span">
          <button className="primary-button" type="submit" disabled={disabled}>
            {t("transaction.save")}
          </button>
          <button className="ghost-button" type="button" onClick={onReset}>
            {t("transaction.reset")}
          </button>
        </div>
      </form>
    </section>
  );
}
