import type { FiltersState, PeriodPreset } from "../types";

interface FiltersBarProps {
  filters: FiltersState;
  paymentMethods: string[];
  labels: {
    period: string;
    start: string;
    end: string;
    payment: string;
    keyword: string;
    keywordPlaceholder: string;
    all: string;
    thisMonth: string;
    thisWeek: string;
    last30: string;
    custom: string;
  };
  onChange: (next: FiltersState) => void;
}

export function FiltersBar({ filters, paymentMethods, labels, onChange }: FiltersBarProps) {
  const setField = <K extends keyof FiltersState>(key: K, value: FiltersState[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="filter-grid">
      <label>
        <span className="field-label">{labels.period}</span>
        <select
          value={filters.preset}
          onChange={(event) => setField("preset", event.target.value as PeriodPreset)}
        >
          <option value="thisMonth">{labels.thisMonth}</option>
          <option value="thisWeek">{labels.thisWeek}</option>
          <option value="last30">{labels.last30}</option>
          <option value="all">{labels.all}</option>
          <option value="custom">{labels.custom}</option>
        </select>
      </label>
      <label>
        <span className="field-label">{labels.start}</span>
        <input
          type="date"
          value={filters.startDate}
          onChange={(event) =>
            onChange({ ...filters, startDate: event.target.value, preset: "custom" })
          }
        />
      </label>
      <label>
        <span className="field-label">{labels.end}</span>
        <input
          type="date"
          value={filters.endDate}
          onChange={(event) =>
            onChange({ ...filters, endDate: event.target.value, preset: "custom" })
          }
        />
      </label>
      <label>
        <span className="field-label">{labels.payment}</span>
        <select
          value={filters.paymentMethod}
          onChange={(event) => setField("paymentMethod", event.target.value)}
        >
          <option value="">{labels.all}</option>
          {paymentMethods.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>
      </label>
      <label className="search-span">
        <span className="field-label">{labels.keyword}</span>
        <input
          type="search"
          value={filters.keyword}
          placeholder={labels.keywordPlaceholder}
          onChange={(event) => setField("keyword", event.target.value)}
        />
      </label>
    </div>
  );
}
