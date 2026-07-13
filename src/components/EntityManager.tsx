import type { CategoryType, TFunction } from "../types";

export interface EntityItem {
  id: string;
  name: string;
  color: string;
  sortOrder: string;
  type?: CategoryType;
}

export interface EntityManagerProps {
  kind: "category" | "tag";
  t: TFunction;
  disabled: boolean;
  name: string;
  color: string;
  categoryType?: CategoryType;
  items: EntityItem[];
  onNameChange: (name: string) => void;
  onColorChange: (color: string) => void;
  onCategoryTypeChange?: (type: CategoryType) => void;
  onSubmit: () => void;
  onDisable: (id: string) => void;
}

export function EntityManager({
  kind,
  t,
  disabled,
  name,
  color,
  categoryType,
  items,
  onNameChange,
  onColorChange,
  onCategoryTypeChange,
  onSubmit,
  onDisable,
}: EntityManagerProps) {
  return (
    <section className="panel category-panel">
      <div className="panel-header">
        <div>
          <h2>{t(`${kind}.title`)}</h2>
          <p className="muted">{t(`${kind}.subtitle`)}</p>
        </div>
      </div>

      <form
        className={kind === "category" ? "category-form" : "tag-form"}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label>
          <span className="field-label">{t(`${kind}.name`)}</span>
          <input
            type="text"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            required
          />
        </label>

        {kind === "category" && onCategoryTypeChange ? (
          <label>
            <span className="field-label">{t("transaction.type")}</span>
            <select
              value={categoryType}
              onChange={(event) => onCategoryTypeChange(event.target.value as CategoryType)}
            >
              <option value="expense">{t("type.expense")}</option>
              <option value="income">{t("type.income")}</option>
              <option value="both">{t("type.both")}</option>
            </select>
          </label>
        ) : null}

        <label>
          <span className="field-label">{t(`${kind}.color`)}</span>
          <input
            type="color"
            value={color}
            onChange={(event) => onColorChange(event.target.value)}
          />
        </label>

        <button className="secondary-button" type="submit" disabled={disabled}>
          {t(`${kind}.add`)}
        </button>
      </form>

      <div className="category-list">
        {items.length === 0 ? (
          <div className="empty-state">{t(`${kind}.none`)}</div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="category-item">
              <div className="category-header">
                <div className="chip">
                  <span className="color-dot" style={{ background: item.color }} />
                  <span>{item.name}</span>
                </div>
                <button
                  className="mini-button"
                  type="button"
                  onClick={() => onDisable(item.id)}
                >
                  {t(`${kind}.disable`)}
                </button>
              </div>
              <div className="pill-row">
                {kind === "category" && item.type ? (
                  <span className="pill">
                    {item.type === "income"
                      ? t("type.income")
                      : item.type === "both"
                        ? t("type.both")
                        : t("type.expense")}
                  </span>
                ) : null}
                <span className="pill">{t(`${kind}.sort`)} {item.sortOrder}</span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
