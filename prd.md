# (PRD) Airbnb Rental Management Interface

## Overview

### Problem Statement
Currently managing an Airbnb rental property using Google Sheets as the single source of truth for:
- Reservation tracking
- Income/expense management
- Brazilian tax calculations
- Profit analysis and YoY comparisons
- Tax payment tracking

While Google Sheets works as a database, it has limitations:
- Poor UX for data entry and visualization
- Limited programming capabilities (no variables, objects, lists)
- Complex formulas are hard to maintain
- No proper state management for tasks (like tax payment tracking)

### Solution
A React-based web application that uses Google Sheets as a database but provides:
- Clean, intuitive interface for different actions/states
- Proper tax calculation logic in code
- Better data visualization
- Improved workflow for common tasks

## Goals

### Primary Goals
1. Improve UX for managing Airbnb rental data
2. Move tax calculation logic from spreadsheet to application code
3. Provide better visualization of key metrics
4. Streamline common workflows (adding reservations, expenses, checking status)

### Secondary Goals
1. Maintain Google Sheets as single source of truth for tax purposes
2. Design tax system to support future expansion to other countries
3. Enable easy data export for tax filing

## User Personas

### Primary User: Property Owner
- Owns an Airbnb property managed by an administrator
- Receives 70% of rental income (administrator keeps 30%)
- Responsible for tax filing and payment
- Needs to track expenses for deductions
- Wants to understand profitability and occupation patterns
- Uses data to plan personal visits during low-occupation periods

## Features

### P0 Features (MVP)

#### 1. Onboarding & Configuration
- **Google Sheet Setup**: One-time onboarding to connect Google Sheet
  - User provides Google Sheet URL (can be empty or existing sheet)
  - Store Sheet ID in localStorage (only for connecting to the sheet)
  - App automatically validates and initializes required sheets:
    - Creates missing sheets (settings, airbnb, airbnb_expenses, taxes)
    - Adds proper column headers
    - Initializes default settings
  - Settings page to change connected sheet
- **User Settings** (stored in Google Sheets "settings" sheet):
  - Number of dependents (for tax calculation)
  - Income split percentage (default: 70% owner, 30% administrator)
  - All settings synced via Google Sheets for cross-device consistency

#### 2. Google Sheets Integration
- **Authentication**: Google OAuth to access user's Google Sheets
- **Data Sync**:
  - Fetch all data on app load (reservations, expenses, settings, tax status)
  - Write changes back to Google Sheets in real-time
  - Settings stored in sheet enable cross-device consistency
  - No need for continuous bi-directional sync after initial load

#### 3. Reservation Management
**Sheet: "airbnb"**

Fields:
- `date`: First date of reservation
- `nights`: Number of nights
- `total`: Total amount Airbnb will pay
- `income`: Amount owner receives (70% of total)
- `admin_fee`: Administrator's share (30% of total)

Features:
- Add new reservation
- Edit existing reservation
- Auto-calculate splits based on total amount
- List view of all reservations

#### 4. Expense Management
**Sheet: "airbnb_expenses"**

Fields:
- `date`: Expense date
- `total`: Amount spent
- `category`: Expense category
- `notes`: Optional description (especially for maintenance)

Categories (fixed list):
- IPTU (Property Tax)
- Condomínio (HOA fees)
- Luz (Electricity)
- Internet
- Gas
- Manutenção (Maintenance)

Features:
- Add new expense
- Suggest previous month's expenses as template
- Allow user to modify/remove suggested expenses
- Add notes/descriptions for maintenance items
- List view of expenses by month

#### 5. Tax Calculation
**Logic in Application (not in sheets)**

Brazilian Rental Income Tax Rules (2025):
```
1. Calculate Net Income:
   - Start with owner's receipt (70% of total)
   - Subtract monthly expenses
   = Liquid Income

2. Apply Deductions:
   - Per dependent: R$ 189.59
   - Simplified deduction: R$ 607.20
   - Use whichever is greater (MAX function)
   = Taxable Income

3. Apply Progressive Tax Brackets:
   <= R$ 2,428.81 → 7.5%  - R$ 182.16
   <= R$ 2,826.66 → 15%   - R$ 394.16
   <= R$ 3,751.05 → 22.5% - R$ 675.49
   <= R$ 4,664.68 → 27.5% - R$ 908.73

   Tax = (Taxable Income × Rate) - Deduction

4. Calculate Profit:
   Profit = Liquid Income - Tax Owed
```

Display:
- Monthly tax calculation breakdown
- Show all steps clearly
- Taxable income
- Tax owed
- Final profit

#### 6. Dashboard Views

**Current Month Status**:
- Total reservations
- Total income expected
- Occupation rate %
- Taxes owed (for previous month if unpaid)
- Highlight if previous month taxes are pending

**Next 3 Months Quick View**:
- Summary of reservations
- Expected income
- Projected occupation rate

**YoY Comparison**:
- Accumulated profit chart
- Compare current year vs previous year

**Monthly Overview (Pivot)**:
- Sum of nights per month
- Total income per month
- Occupation rate calculation

#### 7. Tax Filing Support

**Export for IRS Filing**:
For each month, generate:
1. Total deductions (sum of expenses)
2. Reservation description text:
   ```
   01/11 - 8 diárias = R$ 1,300.00
   05/11 - 12 diárias = R$ 2,300.00
   ```
3. Copy to clipboard functionality

**Tax Payment Tracking**:
- Mark month as "tax paid"
- Store in Google Sheets
- Show pending tax payments prominently

### P1 Features (Future Enhancements)

- Receipt attachment/linking (Google Drive integration)
- Advanced analytics and reports
- Multi-property support
- Different tax systems for other countries
- Budget forecasting
- Automated expense reminders
- Export to PDF/CSV

## Technical Requirements

### Tech Stack
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit
- **UI Framework**: Tailwind CSS
- **API Integration**: Google Sheets API v4
- **Authentication**: Google OAuth 2.0

### Architecture Principles

#### Tax System Design
- Use Strategy Pattern for tax calculations
- Abstract tax calculation into pluggable modules
- Current implementation: `BrazilianRentalTaxCalculator`
- Future: `PortugalRentalTaxCalculator`, `USRentalTaxCalculator`, etc.

#### Component Structure
- Feature-based folder structure
- Separation of concerns (UI, logic, API)
- Reusable components for common patterns
- Type-safe throughout

### Data Model

#### Reservation
```typescript
interface Reservation {
  id: string;
  date: Date;           // Data
  nights: number;       // Diárias
  total: number;        // Total
  ownerAmount: number;  // Recebimento (70%)
  adminFee: number;     // Taxa Adm (30%)
}
```

#### Expense
```typescript
type ExpenseCategory =
  | 'IPTU'
  | 'Condomínio'
  | 'Luz'
  | 'Internet'
  | 'Gas'
  | 'Manutenção';

interface Expense {
  id: string;
  date: Date;           // Data
  amount: number;       // Valor
  category: ExpenseCategory; // Conta
  notes?: string;       // Notas
}
```

#### Monthly Tax Summary
```typescript
interface MonthlyTaxSummary {
  month: string;        // YYYY-MM
  totalIncome: number;  // Recebimentos
  totalDeductions: number; // Deduções
  taxableIncome: number;
  taxRate: number;      // Alíquota
  taxOwed: number;      // Imposto a pagar
  profit: number;       // Lucro
  isPaid: boolean;      // Tax payment status
}
```

#### Settings (from Google Sheets)
```typescript
interface AppSettings {
  dependents: number;      // Number of dependents for tax calculation
  ownerSplit: number;      // Default: 0.70
  adminSplit: number;      // Default: 0.30
}

// Stored only in localStorage for connection purposes
interface LocalConfig {
  sheetId: string;         // Google Sheet ID
}
```

### Google Sheets Integration

#### Sheet Structure
1. **"airbnb"** - Reservations
   - Columns: `date`, `nights`, `total`, `income`, `admin_fee`

2. **"airbnb_expenses"** - Expenses
   - Columns: `date`, `total`, `category`, `notes`

3. **"settings"** - Application Settings
   - Columns: `key`, `value`
   - Rows:
     - `dependents` | `2` (number of dependents for tax calculation)
     - `owner_split` | `0.70` (percentage owner receives)
     - `admin_split` | `0.30` (percentage administrator receives)
   - Note: This sheet enables cross-device sync of user preferences

4. **"taxes"** (optional, for backwards compatibility)
   - Columns: `date`, `income`, `deductions`, `tax_rate`, `tax_owned`, `profit`, `is_paid`

#### API Operations
- Read all data on app initialization
- Write individual rows on create/update
- Batch operations for bulk updates
- Error handling for API rate limits

#### Sheet Initialization
On first connection or when sheets are missing/incorrectly formatted:

**1. "settings" sheet:**
- If doesn't exist or missing columns:
  - Create sheet with columns: `key`, `value`
  - Initialize default rows:
    - `dependents` | `0`
    - `owner_split` | `0.70`
    - `admin_split` | `0.30`
  - Prompt user to review and update in Settings page

**2. "airbnb" sheet (Reservations):**
- If doesn't exist or missing columns:
  - Create sheet with columns: `date`, `nights`, `total`, `income`, `admin_fee`
  - Add header row only (no data)

**3. "airbnb_expenses" sheet:**
- If doesn't exist or missing columns:
  - Create sheet with columns: `date`, `total`, `category`, `notes`
  - Add header row only (no data)

**4. "taxes" sheet:**
- If doesn't exist or missing columns:
  - Create sheet with columns: `date`, `income`, `deductions`, `tax_rate`, `tax_owed`, `profit`, `is_paid`
  - Add header row only (no data)
  - Note: This sheet is optional and will be populated by the app as taxes are calculated/paid

**Validation:**
- On app load, validate all required sheets exist with correct columns
- If any sheet is missing or malformed, offer to auto-initialize
- Show user-friendly error messages with "Fix automatically" option

## UI/UX Requirements

### Design Principles
1. **Clean & Minimal**: Show only what's needed for current state/action
2. **Responsive**: Mainly for mobile and tablet. Desktop can follow with a max-width centralized container.
3. **Fast**: Optimistic UI updates
4. **Clear Feedback**: Loading states, success/error messages
5. **Accessible**: Proper labels, keyboard navigation

### Key Screens

#### 1. Dashboard (Home)
- Card: Current Month Status
  - Metrics: Total income, occupation %, reservations count
  - Alert: "Previous month taxes pending" if applicable
- Card: Next 3 Months Preview
  - Mini calendar or list view
- Chart: YoY Accumulated Profit

#### 2. Reservations
- Add button (prominent)
- List/table of reservations
- Quick actions: Edit, Delete
- Filters: By month, year

#### 3. Expenses
- Add button
- Suggest previous month's recurring expenses
- List/table of expenses grouped by month
- Quick actions: Edit, Delete
- Category breakdown chart

#### 4. Taxes
- Monthly view
- Calculation breakdown for selected month
- "Prepare for IRS" action:
  - Show summary
  - Copy buttons for deductions and reservation details
  - Mark as paid button
- List of unpaid months highlighted

#### 5. Settings
- Google Sheet connection (change sheet URL - stored in localStorage)
- Number of dependents (saved to Google Sheets "settings" sheet)
- Income split percentages (saved to Google Sheets "settings" sheet)
- Note: Settings are synced via Google Sheets, enabling consistent state across devices

### Navigation
- Side navigation or top nav bar
- Clear labels: Dashboard, Reservations, Expenses, Taxes, Settings

## Brazilian Tax Calculation Specification

### Input Variables
- `totalIncome`: Sum of `total` from `airbnb` sheet for the month
- `expenses`: Sum of all `total` from `airbnb_expenses` sheet for the month
- `dependents`: Number of dependents (from `settings` sheet)

### Calculation Steps

**Step 1: Liquid Income**
```
liquidIncome = totalIncome - expenses
```

**Step 2: Deduction**
```
dependentDeduction = dependents × 189.59
simplifiedDeduction = 607.20
deduction = MAX(dependentDeduction, simplifiedDeduction)
```

**Step 3: Taxable Income**
```
taxableIncome = liquidIncome - deduction
```

**Step 4: Tax Calculation**
```
if (taxableIncome <= 2428.81) {
  tax = taxableIncome × 0.075 - 182.16
}
else if (taxableIncome <= 2826.66) {
  tax = taxableIncome × 0.15 - 394.16
}
else if (taxableIncome <= 3751.05) {
  tax = taxableIncome × 0.225 - 675.49
}
else if (taxableIncome <= 4664.68) {
  tax = taxableIncome × 0.275 - 908.73
}

// Ensure tax is not negative
tax = MAX(tax, 0)
```

**Step 5: Final Profit**
```
profit = liquidIncome - tax
```

### Tax Brackets (2025)
| Taxable Income Range | Rate | Deduction |
|---------------------|------|-----------|
| Up to R$ 2,428.81 | 7.5% | R$ 182.16 |
| R$ 2,428.82 - R$ 2,826.66 | 15% | R$ 394.16 |
| R$ 2,826.67 - R$ 3,751.05 | 22.5% | R$ 675.49 |
| R$ 3,751.06 - R$ 4,664.68 | 27.5% | R$ 908.73 |

### Example Calculation
```
Given:
- Airbnb payout: R$ 14,285.71
- Owner receives: R$ 10,000.00 (70%)
- Expenses: R$ 100.00 (R$ 80 energy + R$ 10 gas + R$ 10 internet)
- Dependents: 2

Step 1: Liquid Income
10,000.00 - 100.00 = R$ 9,900.00

Step 2: Deduction
Dependent: 2 × 189.59 = R$ 379.18
Simplified: R$ 607.20
Use: R$ 607.20 (greater)

Step 3: Taxable Income
9,900.00 - 607.20 = R$ 9,292.80

Step 4: Tax (falls in 27.5% bracket)
9,292.80 × 0.275 - 908.73 = R$ 1,646.79

Step 5: Profit
9,900.00 - 1,646.79 = R$ 8,253.21
```

## Deployment

### Initial
- Local development only
- Environment variables for Google OAuth credentials

### Future
- Deploy to Vercel or Netlify
- Environment configuration for production
- CI/CD pipeline

## Success Metrics

1. **Usability**: Time to add reservation < 30 seconds
2. **Accuracy**: Tax calculations match current spreadsheet results
3. **Adoption**: Primary user fully migrates from direct spreadsheet editing
4. **Reliability**: Data sync success rate > 99%

## Out of Scope (V1)

- Mobile app (native)
- Multiple users/roles
- Multi-property management
- Receipt storage/management
- Email notifications
- Automated Airbnb integration
- Bank account integration
- Multi-currency support

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Google Sheets API rate limits | Implement caching, batch operations, exponential backoff |
| Data loss during sync | Optimistic UI + rollback, regular backups prompt |
| Tax calculation errors | Extensive testing against existing spreadsheet data |
| Breaking changes to tax rules | Abstract tax logic, easy to update constants |
| User has existing sheet with different structure | Auto-initialization only creates missing sheets; warn if existing sheets have unexpected columns |
| Concurrent edits from multiple devices | Load data on app start only; display "Refresh" option if user needs latest data |

## Future Considerations

1. **Multi-country Tax Support**: Design allows for adding new tax calculators
2. **Receipt Management**: Google Drive integration for storing receipts
3. **Advanced Analytics**: Predictive modeling for occupation rates
4. **Expense Templates**: Pre-configured recurring expense sets
5. **Budget Alerts**: Notifications when expenses exceed thresholds
6. **Export Options**: PDF reports, CSV exports
7. **Collaborative Features**: Share read-only view with accountant
