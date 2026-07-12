/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_DEFAULT_SHEET_TITLE?: string;
  readonly VITE_APP_CURRENCY?: string;
  readonly VITE_APP_LOCALE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
