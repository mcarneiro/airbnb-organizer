# Graph Report - .  (2026-07-24)

## Corpus Check
- Corpus is ~35,335 words - fits in a single context window. You may not need a graph.

## Summary
- 319 nodes · 565 edges · 39 communities (22 shown, 17 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Sheets Integration
- Dashboard Components
- Lint Tooling
- Application Startup
- Frontend Dependencies
- TypeScript Configuration
- Tax Calculator
- Build Configuration
- Internationalization State
- Product Domain
- Architecture Overview
- OAuth Configuration
- Expense Management
- Agent Configuration
- App Layout
- Tax Summary
- Data Synchronization
- Reservation Models
- Reservation Status
- Google Authentication
- Tax Calculations
- Vite Branding
- Sheets Data Loading
- Sheet Settings
- React Branding
- Project Context
- Issue Tracking
- Issue Triage
- Security Policy
- Expense Entity
- Sheets Concept
- Reservation Entity
- OAuth Protocol
- Reservation Tests
- Auth Persistence

## God Nodes (most connected - your core abstractions)
1. `GoogleSheetsService` - 26 edges
2. `useAppSelector` - 20 edges
3. `formatMonth()` - 18 edges
4. `compilerOptions` - 16 edges
5. `useAppDispatch()` - 15 edges
6. `formatCurrency()` - 15 edges
7. `BrazilianRentalTaxCalculator` - 12 edges
8. `Dashboard()` - 10 edges
9. `Taxes()` - 10 edges
10. `useGoogleAuth()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Google OAuth Configuration Checker` --references--> `VITE_GOOGLE_CLIENT_ID`  [EXTRACTED]
  check-config.html → OAUTH_TROUBLESHOOTING.md
- `YearOverYearChart()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/components/YearOverYearChart.tsx → src/utils/currency.ts
- `Dashboard()` --calls--> `useAppSelector`  [EXTRACTED]
  src/features/dashboard/Dashboard.tsx → src/store/hooks.ts
- `ExpensesMonth()` --calls--> `useAppDispatch()`  [EXTRACTED]
  src/features/expenses/ExpensesMonth.tsx → src/store/hooks.ts
- `ExpensesMonth()` --calls--> `useAppSelector`  [EXTRACTED]
  src/features/expenses/ExpensesMonth.tsx → src/store/hooks.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Google Sheets data synchronization** — onboarding_data_sync, onboarding_redux_store, onboarding_google_sheets_service [EXTRACTED 0.75]

## Communities (39 total, 17 thin omitted)

### Community 0 - "Sheets Integration"
Cohesion: 0.09
Nodes (18): GoogleSheetsService, SheetResponse, ValueResponse, expensesSlice, ExpensesState, initialState, initialState, reservationsSlice (+10 more)

### Community 1 - "Dashboard Components"
Cohesion: 0.16
Nodes (30): MonthNavigation(), MonthNavigationProps, CustomTooltipProps, TooltipPayload, YearOverYearChart(), YearOverYearChartProps, Dashboard(), ExpensesMonth() (+22 more)

### Community 2 - "Lint Tooling"
Cohesion: 0.05
Nodes (41): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jsdom, devDependencies, eslint (+33 more)

### Community 3 - "Application Startup"
Cohesion: 0.12
Nodes (27): App(), getCurrentMonth(), IMPORTANT: This useEffect must be called before any early returns (Rules of Hook, LoadingScreen(), GOOGLE_CONFIG, SHEET_CONFIGS, getStorage(), GoogleAuthContext (+19 more)

### Community 4 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (32): i18next, i18next-browser-languagedetector, dependencies, i18next, i18next-browser-languagedetector, react, react-dom, react-i18next (+24 more)

### Community 5 - "TypeScript Configuration"
Cohesion: 0.09
Nodes (22): DOM, DOM.Iterable, ES2020, src, compilerOptions, allowImportingTsExtensions, isolatedModules, jsx (+14 more)

### Community 6 - "Tax Calculator"
Cohesion: 0.26
Nodes (3): BrazilianRentalTaxCalculator, TaxBracket, TaxCalculator

### Community 7 - "Build Configuration"
Cohesion: 0.20
Nodes (9): vite.config.ts, compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, strict (+1 more)

### Community 8 - "Internationalization State"
Cohesion: 0.22
Nodes (4): languageDetector, initialState, taxesSlice, TaxesState

### Community 9 - "Product Domain"
Cohesion: 0.40
Nodes (5): Brazilian Rental Tax, Expenses, Google Sheets, Reservations, Stayoo

### Community 10 - "Architecture Overview"
Cohesion: 0.50
Nodes (4): BrazilianRentalTaxCalculator, Google Sheets, Redux Toolkit, Stayoo

### Community 11 - "OAuth Configuration"
Cohesion: 0.50
Nodes (4): Google OAuth Configuration Checker, Google OAuth, Google Sheets API, VITE_GOOGLE_CLIENT_ID

### Community 12 - "Expense Management"
Cohesion: 0.50
Nodes (4): Expense, ExpensesMonth, expensesSlice, NewExpense

### Community 13 - "Agent Configuration"
Cohesion: 0.50
Nodes (3): instructions, $schema, AGENTS.md

### Community 14 - "App Layout"
Cohesion: 0.67
Nodes (3): getCurrentMonth(), Layout(), LayoutProps

### Community 15 - "Tax Summary"
Cohesion: 0.50
Nodes (4): BrazilianRentalTaxCalculator, calculateMonthlyTax, MonthlyTaxSummary, Paid Tax Months

### Community 16 - "Data Synchronization"
Cohesion: 0.67
Nodes (3): Data Sync, GoogleSheetsService, Redux Store

### Community 17 - "Reservation Models"
Cohesion: 0.67
Nodes (3): AppSettings, NewReservation, Reservation

## Knowledge Gaps
- **134 isolated node(s):** `$schema`, `AGENTS.md`, `name`, `private`, `version` (+129 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GoogleSheetsService` connect `Sheets Integration` to `Dashboard Components`, `Application Startup`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Lint Tooling` to `Frontend Dependencies`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `$schema`, `AGENTS.md`, `name` to the rest of the system?**
  _134 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Sheets Integration` be split into smaller, more focused modules?**
  _Cohesion score 0.08787878787878788 - nodes in this community are weakly interconnected._
- **Should `Lint Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `Application Startup` be split into smaller, more focused modules?**
  _Cohesion score 0.11923076923076924 - nodes in this community are weakly interconnected._
- **Should `Frontend Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._