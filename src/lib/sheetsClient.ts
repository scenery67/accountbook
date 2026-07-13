import { appConfig } from "./config";
import { isoNow } from "./date";
import type { LocaleCode, TransactionType } from "../types";

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

export interface SpreadsheetMeta {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
}

export async function authorizedFetch(
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

export async function getSheetValues(
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

export async function appendSheetRow(
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

export async function updateSheetRow(
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

export async function fetchSpreadsheetMetadata(accessToken: string, spreadsheetId: string) {
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

export async function ensureWorkbookSchema(
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

export function spreadsheetLink(spreadsheetId: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
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

function encodeRange(value: string): string {
  return encodeURIComponent(value);
}
