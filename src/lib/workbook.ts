import { appConfig } from "./config";
import { isoNow } from "./date";
import { parseManwonInputToWon } from "./format";
import {
  SHEETS,
  getDefaultCategories,
  authorizedFetch,
  getSheetValues,
  appendSheetRow,
  updateSheetRow,
  fetchSpreadsheetMetadata,
  ensureWorkbookSchema,
  spreadsheetLink,
  SpreadsheetMeta,
} from "./sheetsClient";
import type {
  CategoryRecord,
  LocaleCode,
  TagRecord,
  TransactionDraft,
  TransactionRecord,
} from "../types";

export const STORAGE_KEYS = {
  spreadsheetId: "accountbook.spreadsheetId",
};

export interface WorkbookData {
  transactions: TransactionRecord[];
  categories: CategoryRecord[];
  tags: TagRecord[];
}

export async function createWorkbook(accessToken: string, locale: LocaleCode): Promise<SpreadsheetMeta> {
  const response = await authorizedFetch("https://sheets.googleapis.com/v4/spreadsheets", accessToken, {
    method: "POST",
    body: JSON.stringify({
      properties: {
        title: `${appConfig.defaultSheetTitle} ${new Date().toISOString().slice(0, 10)}`,
      },
      sheets: [{ properties: { title: SHEETS.transactions.title } }],
    }),
  });

  const spreadsheet = (await response.json()) as {
    spreadsheetId: string;
    spreadsheetUrl: string;
    properties?: { title?: string };
    sheets?: Array<{ properties: { title: string } }>;
  };

  await ensureWorkbookSchema(accessToken, spreadsheet.spreadsheetId, spreadsheet, locale);
  return {
    spreadsheetId: spreadsheet.spreadsheetId,
    spreadsheetTitle: spreadsheet.properties?.title ?? appConfig.defaultSheetTitle,
    spreadsheetUrl: spreadsheet.spreadsheetUrl,
  };
}

export async function openWorkbook(
  accessToken: string,
  spreadsheetId: string,
  locale: LocaleCode
): Promise<SpreadsheetMeta> {
  const metadata = await fetchSpreadsheetMetadata(accessToken, spreadsheetId);
  await ensureWorkbookSchema(accessToken, spreadsheetId, metadata, locale);
  return {
    spreadsheetId,
    spreadsheetTitle: metadata.properties?.title ?? appConfig.defaultSheetTitle,
    spreadsheetUrl: metadata.spreadsheetUrl ?? spreadsheetLink(spreadsheetId),
  };
}

export async function loadWorkbookData(
  accessToken: string,
  spreadsheetId: string
): Promise<WorkbookData> {
  const [transactionRows, categoryRows, tagRows] = await Promise.all([
    getSheetValues(accessToken, spreadsheetId, `${SHEETS.transactions.title}!A2:K`),
    getSheetValues(accessToken, spreadsheetId, `${SHEETS.categories.title}!A2:G`),
    getSheetValues(accessToken, spreadsheetId, `${SHEETS.tags.title}!A2:F`),
  ]);

  return {
    transactions: transactionRows
      .map((row, index) => mapTransactionRow(row, index + 2))
      .filter((transaction) => !transaction.deletedAt),
    categories: categoryRows
      .map((row, index) => mapCategoryRow(row, index + 2))
      .filter((category) => category.enabled && !category.deletedAt)
      .sort((left, right) => Number(left.sortOrder || 999) - Number(right.sortOrder || 999)),
    tags: tagRows
      .map((row, index) => mapTagRow(row, index + 2))
      .filter((tag) => tag.enabled && !tag.deletedAt)
      .sort((left, right) => Number(left.sortOrder || 999) - Number(right.sortOrder || 999)),
  };
}

export async function saveTransaction(
  accessToken: string,
  spreadsheetId: string,
  draft: TransactionDraft,
  existingTransaction?: TransactionRecord | null
): Promise<void> {
  const now = isoNow();
  const amount = parseManwonInputToWon(draft.amount);
  const rowValues = [
    draft.id || crypto.randomUUID(),
    draft.date,
    draft.type,
    amount.toString(),
    draft.category,
    serializeTags(draft.tags),
    draft.memo.trim(),
    draft.paymentMethod.trim(),
    existingTransaction?.createdAt ?? now,
    now,
    "",
  ];

  if (existingTransaction) {
    await updateSheetRow(
      accessToken,
      spreadsheetId,
      `${SHEETS.transactions.title}!A${existingTransaction.rowNumber}:K${existingTransaction.rowNumber}`,
      rowValues
    );
    return;
  }

  await appendSheetRow(accessToken, spreadsheetId, `${SHEETS.transactions.title}!A2`, rowValues);
}

export async function softDeleteTransaction(
  accessToken: string,
  spreadsheetId: string,
  transaction: TransactionRecord
): Promise<void> {
  const now = isoNow();
  await updateSheetRow(
    accessToken,
    spreadsheetId,
      `${SHEETS.transactions.title}!A${transaction.rowNumber}:K${transaction.rowNumber}`,
    [
      transaction.id,
      transaction.date,
      transaction.type,
      transaction.amount.toString(),
      transaction.category,
      serializeTags(transaction.tags),
      transaction.memo,
      transaction.paymentMethod,
      transaction.createdAt,
      now,
      now,
    ]
  );
}

export async function createCategory(
  accessToken: string,
  spreadsheetId: string,
  category: { name: string; type: CategoryRecord["type"]; color: string },
  categories: CategoryRecord[]
): Promise<void> {
  const nextSort = categories.length
    ? Math.max(...categories.map((entry) => Number(entry.sortOrder || 0))) + 10
    : 10;

  await appendSheetRow(accessToken, spreadsheetId, `${SHEETS.categories.title}!A2`, [
    crypto.randomUUID(),
    category.name.trim(),
    category.type,
    category.color,
    nextSort.toString(),
    "TRUE",
    "",
  ]);
}

export async function createTag(
  accessToken: string,
  spreadsheetId: string,
  tag: { name: string; color: string },
  tags: TagRecord[]
): Promise<void> {
  const nextSort = tags.length
    ? Math.max(...tags.map((entry) => Number(entry.sortOrder || 0))) + 10
    : 10;

  await appendSheetRow(accessToken, spreadsheetId, `${SHEETS.tags.title}!A2`, [
    crypto.randomUUID(),
    tag.name.trim(),
    tag.color,
    nextSort.toString(),
    "TRUE",
    "",
  ]);
}

export async function disableCategory(
  accessToken: string,
  spreadsheetId: string,
  category: CategoryRecord
): Promise<void> {
  await updateSheetRow(
    accessToken,
    spreadsheetId,
    `${SHEETS.categories.title}!A${category.rowNumber}:G${category.rowNumber}`,
    [category.id, category.name, category.type, category.color, category.sortOrder, "FALSE", isoNow()]
  );
}

export async function disableTag(
  accessToken: string,
  spreadsheetId: string,
  tag: TagRecord
): Promise<void> {
  await updateSheetRow(
    accessToken,
    spreadsheetId,
    `${SHEETS.tags.title}!A${tag.rowNumber}:F${tag.rowNumber}`,
    [tag.id, tag.name, tag.color, tag.sortOrder, "FALSE", isoNow()]
  );
}

function mapTransactionRow(row: string[], rowNumber: number): TransactionRecord {
  return {
    id: row[0] ?? "",
    date: row[1] ?? "",
    type: (row[2] as TransactionRecord["type"]) ?? "expense",
    amount: Number(row[3] ?? 0),
    category: row[4] ?? "",
    tags: parseTags(row[5] ?? ""),
    memo: row[6] ?? "",
    paymentMethod: row[7] ?? "",
    createdAt: row[8] ?? "",
    updatedAt: row[9] ?? "",
    deletedAt: row[10] ?? "",
    rowNumber,
  };
}

function mapCategoryRow(row: string[], rowNumber: number): CategoryRecord {
  return {
    id: row[0] ?? "",
    name: row[1] ?? "",
    type: (row[2] as CategoryRecord["type"]) ?? "expense",
    color: row[3] ?? "#fa7b55",
    sortOrder: row[4] ?? "999",
    enabled: (row[5] ?? "TRUE").toUpperCase() === "TRUE",
    deletedAt: row[6] ?? "",
    rowNumber,
  };
}

function mapTagRow(row: string[], rowNumber: number): TagRecord {
  return {
    id: row[0] ?? "",
    name: row[1] ?? "",
    color: row[2] ?? "#5476d8",
    sortOrder: row[3] ?? "999",
    enabled: (row[4] ?? "TRUE").toUpperCase() === "TRUE",
    deletedAt: row[5] ?? "",
    rowNumber,
  };
}

function parseTags(value: string): string[] {
  return value.split(",").map((entry) => entry.trim()).filter(Boolean);
}

function serializeTags(tags: string[]): string {
  return [...new Set(tags.map((entry) => entry.trim()).filter(Boolean))].join(", ");
}
