import { useState } from "react";
import {
  createCategory,
  disableCategory,
} from "../lib/workbook";
import type { CategoryDraft, CategoryRecord } from "../types";
import type { TFunction } from "../types";

interface UseCategoriesOptions {
  accessToken: string;
  spreadsheetId: string;
  categories: CategoryRecord[];
  refresh: () => Promise<void>;
  t: TFunction;
  setToast: (message: string) => void;
}

interface UseCategoriesReturn {
  draft: CategoryDraft;
  setDraft: (next: CategoryDraft) => void;
  createCategory: () => Promise<void>;
  disableCategory: (categoryId: string) => Promise<void>;
}

const initialCategoryDraft: CategoryDraft = {
  name: "",
  type: "expense",
  color: "#fa7b55",
};

export function useCategories(options: UseCategoriesOptions): UseCategoriesReturn {
  const { accessToken, spreadsheetId, categories, refresh, t, setToast } = options;
  const [draft, setDraft] = useState<CategoryDraft>(initialCategoryDraft);

  async function handleCreateCategory(): Promise<void> {
    if (!accessToken || !spreadsheetId) {
      setToast(t("toast.signInFirst"));
      return;
    }
    const duplicate = categories.find(
      (entry) =>
        entry.name.toLowerCase() === draft.name.trim().toLowerCase() &&
        entry.type === draft.type
    );
    if (!draft.name.trim()) {
      setToast(t("toast.categoryNameRequired"));
      return;
    }
    if (duplicate) {
      setToast(t("toast.categoryDuplicate"));
      return;
    }

    try {
      await createCategory(accessToken, spreadsheetId, draft, categories);
      await refresh();
      setDraft(initialCategoryDraft);
      setToast(t("toast.categoryAdded"));
    } catch (error) {
      setToast(error instanceof Error ? error.message : t("toast.categoryAddFailed"));
    }
  }

  async function handleDisableCategory(categoryId: string): Promise<void> {
    if (!accessToken || !spreadsheetId) {
      return;
    }
    const category = categories.find((entry) => entry.id === categoryId);
    if (!category) {
      return;
    }

    try {
      await disableCategory(accessToken, spreadsheetId, category);
      await refresh();
      setToast(t("toast.categoryDisabled"));
    } catch (error) {
      setToast(error instanceof Error ? error.message : t("toast.categoryDisableFailed"));
    }
  }

  return {
    draft,
    setDraft,
    createCategory: handleCreateCategory,
    disableCategory: handleDisableCategory,
  };
}
