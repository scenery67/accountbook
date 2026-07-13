import { useEffect, useMemo, useState } from "react";
import { getRangeByPreset } from "../lib/date";
import { filterTransactions, PAYMENT_METHOD_PRESETS } from "../lib/transactions";
import type {
  CategoryAggregate,
  CategoryRecord,
  FiltersState,
  SummaryTotals,
  TagAggregate,
  TagRecord,
  TransactionRecord,
} from "../types";

interface UseFilteredTotalsOptions {
  transactions: TransactionRecord[];
  categories: CategoryRecord[];
  tags: TagRecord[];
}

interface UseFilteredTotalsReturn {
  filters: FiltersState;
  setFilters: (next: FiltersState) => void;
  filteredTransactions: TransactionRecord[];
  paymentMethods: string[];
  tagNames: string[];
  totals: SummaryTotals;
  categoryTotals: CategoryAggregate[];
  tagTotals: TagAggregate[];
}

function initialFilters(): FiltersState {
  const range = getRangeByPreset("thisMonth");
  return {
    preset: "thisMonth",
    startDate: range.startDate,
    endDate: range.endDate,
    paymentMethod: "",
    tag: "",
    keyword: "",
  };
}

export function useFilteredTotals(options: UseFilteredTotalsOptions): UseFilteredTotalsReturn {
  const { transactions, categories, tags } = options;
  const [filters, setFilters] = useState<FiltersState>(initialFilters);

  useEffect(() => {
    if (filters.preset === "custom") {
      return;
    }
    const range = getRangeByPreset(filters.preset, filters.startDate, filters.endDate);
    setFilters((current) => ({ ...current, ...range }));
  }, [filters.preset]);

  const filteredTransactions = useMemo(() => {
    return filterTransactions(transactions, filters).sort((left, right) =>
      right.date.localeCompare(left.date)
    );
  }, [transactions, filters]);

  const paymentMethods = useMemo(() => {
    const values = new Set(PAYMENT_METHOD_PRESETS);
    transactions.forEach((transaction) => {
      if (transaction.paymentMethod) {
        values.add(transaction.paymentMethod);
      }
    });
    return [...values].sort((left, right) => left.localeCompare(right));
  }, [transactions]);

  const tagNames = useMemo(() => tags.map((entry) => entry.name), [tags]);

  const totals = useMemo<SummaryTotals>(() => {
    const income = filteredTransactions
      .filter((entry) => entry.type === "income")
      .reduce((sum, entry) => sum + entry.amount, 0);
    const expense = filteredTransactions
      .filter((entry) => entry.type === "expense")
      .reduce((sum, entry) => sum + entry.amount, 0);
    return {
      income,
      expense,
      balance: income - expense,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const categoryTotals = useMemo<CategoryAggregate[]>(() => {
    const aggregate = new Map<string, CategoryAggregate>();
    filteredTransactions.forEach((transaction) => {
      const key = `${transaction.type}:${transaction.category}`;
      const current = aggregate.get(key) ?? {
        key,
        type: transaction.type,
        category: transaction.category,
        total: 0,
        color: categories.find((entry) => entry.name === transaction.category)?.color ?? "#7c6f67",
      };
      current.total += transaction.amount;
      aggregate.set(key, current);
    });
    return [...aggregate.values()].sort((left, right) => right.total - left.total);
  }, [categories, filteredTransactions]);

  const tagTotals = useMemo<TagAggregate[]>(() => {
    const aggregate = new Map<string, TagAggregate>();
    filteredTransactions.forEach((transaction) => {
      transaction.tags.forEach((tag) => {
        const key = `${transaction.type}:${tag}`;
        const current = aggregate.get(key) ?? {
          key,
          type: transaction.type,
          tag,
          total: 0,
          color: tags.find((entry) => entry.name === tag)?.color ?? "#5476d8",
        };
        current.total += transaction.amount;
        aggregate.set(key, current);
      });
    });
    return [...aggregate.values()].sort((left, right) => right.total - left.total);
  }, [filteredTransactions, tags]);

  return {
    filters,
    setFilters,
    filteredTransactions,
    paymentMethods,
    tagNames,
    totals,
    categoryTotals,
    tagTotals,
  };
}
