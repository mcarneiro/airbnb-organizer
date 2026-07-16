# Stayoo Development Guide

## Product

Stayoo is a Brazilian short-term rental management application. It tracks reservations and expenses, calculates monthly rental taxes, and stores user data in Google Sheets.

## Architecture

- Google Sheets is the persistent source of truth. Use `GoogleSheetsService.ts` for Sheets API access.
- Redux Toolkit slices own feature state. `useDataSync.ts` loads data at startup and `store/middleware/syncListener.ts` persists mutations with its established debounce.
- Keep tax rules in calculator services such as `BrazilianRentalTaxCalculator.ts`. Do not put tax logic in components or slices.
- Add all Google Sheets row and API types to `src/types/index.ts`. Do not use `any`.
- Use `react-i18next` for all user-facing text and Tailwind CSS for styling. Preserve the mobile-first UI.

## Development Workflow

- Start with a failing Vitest test for a feature or bug fix. Use Given/When/Then comments in tests.
- Add a reproduction test for every bug fix. Prioritize tests for tax services, utilities, and sync behavior.
- Run `npm run lint`, `npx tsc --noEmit`, and relevant `npm test` tests after changes.
- Keep `README.md` and `prd.md` accurate when product behavior changes.

## Security

- Never log, commit, or expose OAuth tokens, client secrets, spreadsheet IDs, or `.env` values.
- Keep Google OAuth scopes and Sheets access limited to what the feature requires.

## Git

- Use clear conventional commit messages such as `feat:`, `fix:`, and `refactor:`.
