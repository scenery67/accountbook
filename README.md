# Accountbook Sheet

A React + TypeScript accountbook that uses Google Sheets as its only data store.

## 🚀 Live Demo

**[https://scenery67.github.io/accountbook/](https://scenery67.github.io/accountbook/)**

## Stack

- Vite
- React
- TypeScript
- Google Identity Services
- Google Sheets API

## Features

- Google OAuth login
- Create a managed workbook or connect an existing sheet
- Add, edit, and soft-delete income and expense transactions
- Manage categories by type and color
- Filter by period, payment method, and keyword
- Summary cards for income, expense, balance, and transaction count
- Category totals for the active filter
- CSV export for the current filtered list

## Workbook schema

- `Transactions`
  - `id`, `date`, `type`, `amount`, `category`, `memo`, `payment_method`, `created_at`, `updated_at`, `deleted_at`
- `Categories`
  - `id`, `name`, `type`, `color`, `sort_order`, `enabled`, `deleted_at`
- `Settings`
  - `key`, `value`

## Setup

1. Enable `Google Sheets API` in Google Cloud Console.
2. Create an OAuth 2.0 Web client.
3. Add allowed JavaScript origins such as:
   - `http://localhost:8080`
   - your deployed static site domain
4. Copy `.env.example` to `.env`.
5. Fill `VITE_GOOGLE_CLIENT_ID`.
6. Install dependencies with `npm install`.
7. Run `npm run dev`.

## Environment Variables

- `.env` is intentionally ignored by Git.
- Commit `.env.example`, not `.env`.
- `VITE_GOOGLE_CLIENT_ID` is not a secret, but keeping it in environment variables is still the right setup for local and deployment configuration.
- In CI or hosting platforms, set the same variables in the platform environment settings instead of committing `.env`.

Example:

```env
VITE_GOOGLE_CLIENT_ID=1234567890-abcdefg.apps.googleusercontent.com
VITE_DEFAULT_SHEET_TITLE=Accountbook Sheet
VITE_APP_CURRENCY=KRW
VITE_APP_LOCALE=ko-KR
```

## Notes

- This app is designed for a single user.
- It calls Google Sheets directly from the browser. There is no backend.
- Local Excel read/write is not included in this version.
