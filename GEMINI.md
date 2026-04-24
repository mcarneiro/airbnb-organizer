# Gemini CLI - Foundational Mandate: Stayoo

This document defines the foundational mandates, technical standards, and architectural principles for the Stayoo project. Gemini CLI MUST adhere to these instructions at all times.

## Project Core Purpose
Stayoo is a property management tool for short-term rental hosts, primarily focused on the Brazilian market. It tracks reservations, expenses, and calculates monthly taxes, using Google Sheets as a database via the Google Sheets API.

## Architectural Mandates

### 1. Data Persistence & Sync
- **Single Source of Truth:** Google Sheets is the database. Local state (Redux) must always be synced to/from the sheet.
- **Auto-Sync:** All mutations in the Redux store should trigger a sync via `useDataSync.ts` (using the established 1s debounce pattern).
- **Service Layer:** Use `GoogleSheetsService.ts` for all direct interactions with the Sheets API.

### 2. Tax Calculation Strategy
- **Strategy Pattern:** Tax logic MUST be encapsulated in pluggable service modules (e.g., `BrazilianRentalTaxCalculator.ts`).
- **Encapsulation:** Never inline complex tax logic into components or slices; always use the service layer.
- **Constants:** Keep tax brackets and rates in clearly defined constants within their respective services.

### 3. State Management
- **Redux Toolkit:** Use Slices for feature-based state management.
- **Selectors:** Use memoized selectors for derived data (especially for dashboard metrics and tax summaries).

## Technical Standards

### 1. TypeScript & Type Safety
- **Strict Typing:** Avoid `any` at all costs. Every Google Sheet row structure and API response must have a corresponding interface in `src/types/index.ts`.
- **Validation:** Always run `npm run lint` and `npx tsc --noEmit` after changes.

### 2. Testing & Validation (TDD & BDD)
- **TDD First:** All new features or bug fixes MUST follow a Test-Driven Development approach. Write the test first, see it fail, then implement the minimal code to pass.
- **BDD Style:** Tests MUST follow a Behavioral Driven Development structure using "Given/When/Then" comments within `describe/it` blocks.
- **Runner:** Use Vitest for fast, Vite-integrated testing.
- **Coverage:** Every bug fix MUST have a reproduction test case. Prioritize unit tests for tax services and utility functions.

### 3. UI & State Management
- **Avoid `useEffect`:** Minimize the use of `useEffect`. Favor event handlers, custom hooks (without internal effects where possible), or Redux middleware for side effects.
- **Tailwind CSS:** Use Tailwind for all styling. Maintain the mobile-first approach.
- **i18n:** All user-facing strings MUST be localized using `react-i18next`.

## Workflow Mandates
- **Documentation:** Keep `README.md` and `prd.md` updated as features evolve.
- **Security:** NEVER log or expose OAuth tokens or Sheet IDs in logs or code.
- **Commits:** Follow a clear, descriptive commit message style (e.g., `feat:`, `fix:`, `refactor:`).
