import type { CategoryDraft, CategoryRecord } from "../types";

interface CategoryManagerProps {
  draft: CategoryDraft;
  categories: CategoryRecord[];
  disabled: boolean;
  labels: {
    title: string;
    subtitle: string;
    name: string;
    type: string;
    color: string;
    add: string;
    none: string;
    disable: string;
    sort: string;
    expense: string;
    income: string;
    both: string;
  };
  onChange: (next: CategoryDraft) => void;
  onSubmit: () => void;
  onDisable: (categoryId: string) => void;
}

export function CategoryManager({
  draft,
  categories,
  disabled,
  labels,
  onChange,
  onSubmit,
  onDisable,
}: CategoryManagerProps) {
  return (
    <section className="panel category-panel">
      <div className="panel-header">
        <div>
          <h2>{labels.title}</h2>
          <p className="muted">{labels.subtitle}</p>
        </div>
      </div>

      <form
        className="category-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label>
          <span className="field-label">{labels.name}</span>
          <input
            type="text"
            value={draft.name}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
            required
          />
        </label>
        <label>
          <span className="field-label">{labels.type}</span>
          <select
            value={draft.type}
            onChange={(event) => onChange({ ...draft, type: event.target.value as CategoryDraft["type"] })}
          >
            <option value="expense">{labels.expense}</option>
            <option value="income">{labels.income}</option>
            <option value="both">{labels.both}</option>
          </select>
        </label>
        <label>
          <span className="field-label">{labels.color}</span>
          <input
            type="color"
            value={draft.color}
            onChange={(event) => onChange({ ...draft, color: event.target.value })}
          />
        </label>
        <button className="secondary-button" type="submit" disabled={disabled}>
          {labels.add}
        </button>
      </form>

      <div className="category-list">
        {categories.length === 0 ? (
          <div className="empty-state">{labels.none}</div>
        ) : (
          categories.map((category) => (
            <article key={category.id} className="category-item">
              <div className="category-header">
                <div className="chip">
                  <span className="color-dot" style={{ background: category.color }} />
                  <span>{category.name}</span>
                </div>
                <button
                  className="mini-button"
                  type="button"
                  onClick={() => onDisable(category.id)}
                >
                  {labels.disable}
                </button>
              </div>
              <div className="pill-row">
                <span className="pill">
                  {category.type === "income"
                    ? labels.income
                    : category.type === "both"
                      ? labels.both
                      : labels.expense}
                </span>
                <span className="pill">{labels.sort} {category.sortOrder}</span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
