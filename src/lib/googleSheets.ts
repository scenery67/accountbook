import { appConfig } from "./config";
import { isoNow } from "./date";
import { parseManwonInputToWon } from "./format";
import type {
  CategoryRecord,
  FiltersState,
  GoogleUserProfile,
  LocaleCode,
  TagRecord,
  TransactionDraft,
  TransactionRecord,
  TransactionType,
} from "../types";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (options: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => GoogleTokenClient;
          revoke: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

export interface GoogleTokenClient {
  requestAccessToken: (options?: { prompt?: string }) => void;
}

const GOOGLE_SCRIPT_ID = "google-identity-script";

export const STORAGE_KEYS = {
  spreadsheetId: "accountbook.spreadsheetId",
};

export const SHEETS = {
  transactions: {
    title: "Transactions",
    headers: [
      "id",
      "date",
      "type",
      "amount",
      "category",
      "tags",
      "memo",
      "payment_method",
      "created_at",
      "updated_at",
      "deleted_at",
    ],
  },
  categories: {
    title: "Categories",
    headers: ["id", "name", "type", "color", "sort_order", "enabled", "deleted_at"],
  },
  tags: {
    title: "Tags",
    headers: ["id", "name", "color", "sort_order", "enabled", "deleted_at"],
  },
  settings: {
    title: "Settings",
    headers: ["key", "value"],
  },
} as const;

export function getDefaultCategories(
  locale: LocaleCode
): Array<[string, string, TransactionType | "both", string, string, string, string]> {
  if (locale === "en") {
    return [
      ["cat-food", "Food", "expense", "#f97352", "10", "TRUE", ""],
      ["cat-transport", "Transport", "expense", "#5476d8", "20", "TRUE", ""],
      ["cat-housing", "Housing", "expense", "#9b6bf3", "30", "TRUE", ""],
      ["cat-salary", "Salary", "income", "#18a37e", "10", "TRUE", ""],
      ["cat-side", "Side Income", "income", "#f0b43c", "20", "TRUE", ""],
    ];
  }

  return [
    ["cat-food", "식비", "expense", "#f97352", "10", "TRUE", ""],
    ["cat-transport", "교통", "expense", "#5476d8", "20", "TRUE", ""],
    ["cat-housing", "주거", "expense", "#9b6bf3", "30", "TRUE", ""],
    ["cat-salary", "급여", "income", "#18a37e", "10", "TRUE", ""],
    ["cat-side", "부수입", "income", "#f0b43c", "20", "TRUE", ""],
  ];
}

export const PAYMENT_METHOD_PRESETS = ["Cash", "Debit Card", "Credit Card", "Transfer"];

export interface SpreadsheetMeta {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
}

export interface WorkbookData {
  transactions: TransactionRecord[];
  categories: CategoryRecord[];
  tags: TagRecord[];
}

export async function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts.oauth2) {
    return;
  }

  const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript) {
    await waitForGoogleIdentityServices();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google auth script."));
    document.head.append(script);
  });

  await waitForGoogleIdentityServices();
}

async function waitForGoogleIdentityServices(): Promise<void> {
  const startedAt = Date.now();
  while (!window.google?.accounts.oauth2) {
    if (Date.now() - startedAt > 8000) {
      throw new Error("Google sign-in script is taking too long to load.");
    }
    await new Promise((resolve) => window.setTimeout(resolve, 150));
  }
}

export function getGoogleTokenClient(
  callback: (response: { access_token?: string; error?: string }) => void
): GoogleTokenClient {
  if (!window.google?.accounts.oauth2) {
    throw new Error("Google Identity Services is not loaded yet.");
  }

  return window.google.accounts.oauth2.initTokenClient({
    client_id: appConfig.googleClientId,
    scope:
      "openid email profile https://www.googleapis.com/auth/spreadsheets",
    callback,
  });
}

export function revokeGoogleToken(token: string): void {
  window.google?.accounts.oauth2.revoke(token);
}

export async function fetchGoogleUserProfile(accessToken: string): Promise<GoogleUserProfile> {
  const response = await authorizedFetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    accessToken,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const data = (await response.json()) as {
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
  };

  return {
    id: data.id ?? "",
    email: data.email ?? "",
    name: data.name ?? "",
    picture: data.picture ?? "",
  };
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

export function filterTransactions(
  transactions: TransactionRecord[],
  filters: FiltersState
): TransactionRecord[] {
  return transactions.filter((transaction) => {
    const matchesDate =
      (!filters.startDate || transaction.date >= filters.startDate) &&
      (!filters.endDate || transaction.date <= filters.endDate);
    const matchesPayment =
      !filters.paymentMethod || transaction.paymentMethod === filters.paymentMethod;
    const matchesTag = !filters.tag || transaction.tags.includes(filters.tag);
    const queryTarget =
      `${transaction.memo} ${transaction.category} ${transaction.paymentMethod} ${transaction.tags.join(" ")}`.toLowerCase();
    const matchesKeyword =
      !filters.keyword || queryTarget.includes(filters.keyword.trim().toLowerCase());
    return matchesDate && matchesPayment && matchesTag && matchesKeyword;
  });
}

async function fetchSpreadsheetMetadata(accessToken: string, spreadsheetId: string) {
  const response = await authorizedFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
    accessToken
  );
  return response.json() as Promise<{
    spreadsheetUrl?: string;
    properties?: { title?: string };
    sheets?: Array<{ properties: { title: string } }>;
  }>;
}

async function ensureWorkbookSchema(
  accessToken: string,
  spreadsheetId: string,
  metadata: { sheets?: Array<{ properties: { title: string } }> },
  locale: LocaleCode
): Promise<void> {
  const existingTitles = new Set((metadata.sheets ?? []).map((sheet) => sheet.properties.title));
  const addRequests: Array<{ addSheet: { properties: { title: string } } }> = [];

  Object.values(SHEETS).forEach((sheet) => {
    if (!existingTitles.has(sheet.title)) {
      addRequests.push({ addSheet: { properties: { title: sheet.title } } });
    }
  });

  if (addRequests.length > 0) {
    await authorizedFetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      accessToken,
      {
        method: "POST",
        body: JSON.stringify({ requests: addRequests }),
      }
    );
  }

  await Promise.all(
    Object.values(SHEETS).map((sheet) =>
      ensureHeaderRow(accessToken, spreadsheetId, sheet.title, [...sheet.headers])
    )
  );

  await seedDefaultCategories(accessToken, spreadsheetId, locale);
  await ensureDefaultSettings(accessToken, spreadsheetId);
}

async function ensureHeaderRow(
  accessToken: string,
  spreadsheetId: string,
  sheetTitle: string,
  headers: string[]
): Promise<void> {
  const response = await authorizedFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeRange(`${sheetTitle}!1:1`)}`,
    accessToken
  );
  const data = (await response.json()) as { values?: string[][] };
  const firstRow = data.values?.[0] ?? [];
  const isMatching =
    firstRow.length === headers.length && headers.every((header, index) => firstRow[index] === header);

  if (isMatching) {
    return;
  }

  await authorizedFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeRange(
      `${sheetTitle}!A1`
    )}?valueInputOption=RAW`,
    accessToken,
    {
      method: "PUT",
      body: JSON.stringify({
        range: `${sheetTitle}!A1`,
        majorDimension: "ROWS",
        values: [headers],
      }),
    }
  );
}

async function seedDefaultCategories(
  accessToken: string,
  spreadsheetId: string,
  locale: LocaleCode
): Promise<void> {
  const rows = await getSheetValues(accessToken, spreadsheetId, `${SHEETS.categories.title}!A2:G`);
  const activeRows = rows.filter((row) => row[1] && !row[6]);
  if (activeRows.length > 0) {
    return;
  }

  await authorizedFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeRange(
      `${SHEETS.categories.title}!A2`
    )}:append?valueInputOption=RAW`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        majorDimension: "ROWS",
        values: getDefaultCategories(locale),
      }),
    }
  );
}

async function ensureDefaultSettings(accessToken: string, spreadsheetId: string): Promise<void> {
  const rows = await getSheetValues(accessToken, spreadsheetId, `${SHEETS.settings.title}!A2:B`);
  if (rows.length > 0) {
    return;
  }

  await authorizedFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeRange(
      `${SHEETS.settings.title}!A2`
    )}:append?valueInputOption=RAW`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        majorDimension: "ROWS",
        values: [
          ["currency", appConfig.currency],
          ["locale", appConfig.locale],
          ["version", "1"],
        ],
      }),
    }
  );
}

async function getSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<string[][]> {
  const response = await authorizedFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeRange(range)}`,
    accessToken
  );
  const data = (await response.json()) as { values?: string[][] };
  return data.values ?? [];
}

async function appendSheetRow(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  rowValues: string[]
): Promise<void> {
  await authorizedFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeRange(
      range
    )}:append?valueInputOption=RAW`,
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({
        majorDimension: "ROWS",
        values: [rowValues],
      }),
    }
  );
}

async function updateSheetRow(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  rowValues: string[]
): Promise<void> {
  await authorizedFetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeRange(
      range
    )}?valueInputOption=RAW`,
    accessToken,
    {
      method: "PUT",
      body: JSON.stringify({
        range,
        majorDimension: "ROWS",
        values: [rowValues],
      }),
    }
  );
}

async function authorizedFetch(
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!accessToken) {
    throw new Error("Google login is required.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new Error(errorBody?.error?.message ?? `Google API request failed (${response.status})`);
  }

  return response;
}

function mapTransactionRow(row: string[], rowNumber: number): TransactionRecord {
  return {
    id: row[0] ?? "",
    date: row[1] ?? "",
    type: (row[2] as TransactionType) ?? "expense",
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

function encodeRange(value: string): string {
  return encodeURIComponent(value);
}

function spreadsheetLink(spreadsheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
}

function parseTags(value: string): string[] {
  return value.split(",").map((entry) => entry.trim()).filter(Boolean);
}

function serializeTags(tags: string[]): string {
  return [...new Set(tags.map((entry) => entry.trim()).filter(Boolean))].join(", ");
}
