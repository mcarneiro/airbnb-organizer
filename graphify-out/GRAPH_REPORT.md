# Graph Report - airbnb-organizer  (2026-07-24)

## Corpus Check
- 62 files · ~35,880 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 320 nodes · 544 edges · 39 communities (22 shown, 17 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.72)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `54e3a7d7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

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
2. `formatMonth()` - 18 edges
3. `useAppSelector` - 18 edges
4. `compilerOptions` - 16 edges
5. `useAppDispatch()` - 15 edges
6. `BrazilianRentalTaxCalculator` - 11 edges
7. `formatCurrency()` - 11 edges
8. `Taxes()` - 10 edges
9. `useGoogleAuth()` - 9 edges
10. `getMonthName()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Google OAuth Configuration Checker` --references--> `VITE_GOOGLE_CLIENT_ID`  [EXTRACTED]
  check-config.html → OAUTH_TROUBLESHOOTING.md
- `ExpensesMonth()` --calls--> `formatMonth()`  [EXTRACTED]
  src/features/expenses/ExpensesMonth.tsx → src/utils/taxCalculations.ts
- `NewExpense()` --calls--> `formatMonth()`  [EXTRACTED]
  src/features/expenses/NewExpense.tsx → src/utils/taxCalculations.ts
- `NewReservation()` --calls--> `formatMonth()`  [EXTRACTED]
  src/features/reservations/NewReservation.tsx → src/utils/taxCalculations.ts
- `YearOverYearChart()` --calls--> `formatCurrency()`  [EXTRACTED]
  src/components/YearOverYearChart.tsx → src/utils/currency.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Google Sheets data synchronization** — onboarding_data_sync, onboarding_redux_store, onboarding_google_sheets_service [EXTRACTED 0.75]

## Communities (39 total, 17 thin omitted)

### Community 0 - "Sheets Integration"
Cohesion: 0.16
Nodes (5): GoogleSheetsService, ExpensesState, SettingsState, AppSettings, Expense

### Community 1 - "Dashboard Components"
Cohesion: 0.15
Nodes (28): MonthNavigation(), MonthNavigationProps, CustomTooltipProps, TooltipPayload, YearOverYearChart(), YearOverYearChartProps, Dashboard(), ReservationsMonth() (+20 more)

### Community 2 - "Lint Tooling"
Cohesion: 0.05
Nodes (41): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jsdom, devDependencies, eslint (+33 more)

### Community 3 - "Application Startup"
Cohesion: 0.19
Nodes (19): App(), getCurrentMonth(), IMPORTANT: This useEffect must be called before any early returns (Rules of Hook, LoadingScreen(), getStorage(), GoogleAuthContext, GoogleAuthContextType, GoogleAuthProvider() (+11 more)

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
Cohesion: 0.08
Nodes (27): GOOGLE_CONFIG, SHEET_CONFIGS, languageDetector, SheetResponse, ValueResponse, appSlice, AppState, initialState (+19 more)

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
- **135 isolated node(s):** `$schema`, `AGENTS.md`, `name`, `private`, `version` (+130 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GoogleSheetsService` connect `Sheets Integration` to `Internationalization State`, `Application Startup`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Lint Tooling` to `Frontend Dependencies`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **What connects `$schema`, `AGENTS.md`, `name` to the rest of the system?**
  _135 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dashboard Components` be split into smaller, more focused modules?**
  _Cohesion score 0.1484480431848853 - nodes in this community are weakly interconnected._
- **Should `Lint Tooling` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._
- **Should `Frontend Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `TypeScript Configuration` be split into smaller, more focused modules?**
  _Cohesion score 0.08695652173913043 - nodes in this community are weakly interconnected._