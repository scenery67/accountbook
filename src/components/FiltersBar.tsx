import type { FiltersState, PeriodPreset, TFunction } from "../types";

interface FiltersBarProps {
  filters: FiltersState;
  paymentMethods: string[];
  tagOptions: string[];
  t: TFunction;
  onChange: (next: FiltersState) => void;
}

export function FiltersBar({
  filters,
  paymentMethods,
  tagOptions,
  t,
  onChange,
}: FiltersBarProps) {
  const setField = <K extends keyof FiltersState>(key: K, value: FiltersState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="filter-grid">
      <label>
        <span className="field-label">{t("filters.period")}</span>
        <select
          value={filters.preset}
          onChange={(event) => setField("preset", event.target.value as PeriodPreset)}
        >
          <option value="thisMonth">{t("filters.thisMonth")}</option>
          <option value="thisWeek">{t("filters.thisWeek")}</option>
          <option value="last30">{t("filters.last30")}</option>
          <option value="all">{t("filters.all")}</option>
          <option value="custom">{t("filters.custom")}</option>
        </select>
      </label>
      <label>
        <span className="field-label">{t("filters.start")}</span>
        <input
          type="date"
          value={filters.startDate}
          onChange={(event) =>
            onChange({ ...filters, startDate: event.target.value, preset: "custom" })
          }
        />
      </label>
      <label>
        <span className="field-label">{t("filters.end")}</span>
        <input
          type="date"
          value={filters.endDate}
          onChange={(event) =>
            onChange({ ...filters, endDate: event.target.value, preset: "custom" })
          }
        />
      </label>
      <label>
        <span className="field-label">{t("filters.payment")}</span>
        <select
          value={filters.paymentMethod}
          onChange={(event) => setField("paymentMethod", event.target.value)}
        >
          <option value="">{t("filters.all")}</option>
          {paymentMethods.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="field-label">{t("filters.tag")}</span>
        <select
          value={filters.tag}
          onChange={(event) => setField("tag", event.target.value)}
        >
          <option value="">{t("filters.all")}</option>
          {tagOptions.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </label>
      <label className="search-span">
        <span className="field-label">{t("filters.keyword")}</span>
        <input
          type="search"
          value={filters.keyword}
          placeholder={t("filters.keywordPlaceholder")}
          onChange={(event) => setField("keyword", event.target.value)}
        />
      </label>
    </div>
  );
}
