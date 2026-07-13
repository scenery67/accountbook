import { useState } from "react";
import {
  createTag,
  disableTag,
} from "../lib/workbook";
import type { TagDraft, TagRecord } from "../types";
import type { TFunction } from "../types";

interface UseTagsOptions {
  accessToken: string;
  spreadsheetId: string;
  tags: TagRecord[];
  refresh: () => Promise<void>;
  onTagDisabled: (tagName: string) => void;
  t: TFunction;
  setToast: (message: string) => void;
}

interface UseTagsReturn {
  draft: TagDraft;
  setDraft: (next: TagDraft) => void;
  createTag: () => Promise<void>;
  disableTag: (tagId: string) => Promise<void>;
}

const initialTagDraft: TagDraft = {
  name: "",
  color: "#5476d8",
};

export function useTags(options: UseTagsOptions): UseTagsReturn {
  const { accessToken, spreadsheetId, tags, refresh, onTagDisabled, t, setToast } = options;
  const [draft, setDraft] = useState<TagDraft>(initialTagDraft);

  async function handleCreateTag(): Promise<void> {
    if (!accessToken || !spreadsheetId) {
      setToast(t("toast.signInFirst"));
      return;
    }
    if (!draft.name.trim()) {
      setToast(t("toast.tagNameRequired"));
      return;
    }
    if (tags.some((entry) => entry.name.toLowerCase() === draft.name.trim().toLowerCase())) {
      setToast(t("toast.tagDuplicate"));
      return;
    }

    try {
      await createTag(accessToken, spreadsheetId, draft, tags);
      await refresh();
      setDraft(initialTagDraft);
      setToast(t("toast.tagAdded"));
    } catch (error) {
      setToast(error instanceof Error ? error.message : t("toast.tagAddFailed"));
    }
  }

  async function handleDisableTag(tagId: string): Promise<void> {
    if (!accessToken || !spreadsheetId) {
      return;
    }
    const tag = tags.find((entry) => entry.id === tagId);
    if (!tag) {
      return;
    }

    try {
      await disableTag(accessToken, spreadsheetId, tag);
      await refresh();
      onTagDisabled(tag.name);
      setToast(t("toast.tagDisabled"));
    } catch (error) {
      setToast(error instanceof Error ? error.message : t("toast.tagDisableFailed"));
    }
  }

  return {
    draft,
    setDraft,
    createTag: handleCreateTag,
    disableTag: handleDisableTag,
  };
}
