# Taxes Feature Documentation

## Overview
The taxes feature calculates Brazilian rental income tax (Carnê Leão) based on reservations and expenses. It shows monthly tax breakdowns, allows copying data for IRS filing, and tracks payment status.

## Data Model

### MonthlyTaxSummary Interface
**Location:** `src/types/index.ts:28-39`

```typescript
export interface MonthlyTaxSummary {
  month: string;        // YYYY-MM format
  totalIncome: number;  // Total owner receipts
  totalDeductions: number; // Sum of expenses
  liquidIncome: number; // Income - expenses
  deduction: number;    // Tax deduction (dependent or simplified)
  taxableIncome: number;
  taxRate: number;      // Tax rate applied
  taxOwed: number;      // Tax amount to pay
  profit: number;       // Final profit after tax
  isPaid: boolean;      // Payment status
}
```

## Components

### Taxes Component
**Location:** `src/features/taxes/Taxes.tsx`

**Purpose:** Display tax calculations for months and allow marking as paid.

**Key Features:**
- Month navigation to view different months
- Tax calculation breakdown showing:
  - Total Income (Owner's share from reservations)
  - Total Expenses (Deductions)
  - Liquid Income
  - Tax Deduction (based on dependents)
  - Taxable Income
  - Tax Rate
  - Tax Owed
  - Final Profit
- IRS filing section with copyable fields:
  - Total Income
  - Total Deductions
  - Reservation Details (formatted for Carnê Leão)
- Mark as Paid / Unpaid toggle
- Summary list showing last 6 months (most recent first)

**Route:** `/taxes/:month?` (month is optional)

**Important Implementation Details:**
- Uses `useParams()` to get month from URL
- If no month in URL, defaults to most recent month with data
- Month list shows last 6 entries only: `availableMonths.slice(0, 6)`
- Months are color-coded:
  - Green: Paid
  - Yellow: Unpaid with tax > 0
  - Gray: No tax owed
- Links to Carnê Leão Web: https://www3.cav.receita.fazenda.gov.br/carneleao/rendimentos/rendimento

## Tax Calculation Utilities
**Location:** `src/utils/taxCalculations.ts`

### Key Functions

#### 1. `calculateMonthlyTax()`
**Lines:** 67-103

Calculates all tax information for a specific month.

**Parameters:**
- `month`: YYYY-MM string
- `reservations`: Array of reservations for the month
- `expenses`: Array of expenses for the month
- `dependents`: Number of dependents (affects deductions)
- `isPaid`: Whether month is marked as paid

**Returns:** `MonthlyTaxSummary`

**Process:**
1. Sums owner amounts from all reservations
2. Sums all expenses
3. Calculates liquid income (income - expenses)
4. Uses `BrazilianRentalTaxCalculator` to compute tax
5. Calculates final profit (liquid income - tax owed)

#### 2. `getAllMonths()`
**Lines:** 108-115

Gets all unique months that have reservations or expenses.

**Returns:** Array of month strings in YYYY-MM format, sorted most recent first

#### 3. `getMostRecentUnpaidMonth()`
**Lines:** 136-170

**IMPORTANT:** Determines if the tax notification should show on the dashboard.

**Logic:**
1. Filters out current month and future months
2. Only considers past months with data
3. Checks each month from most recent to oldest:
   - Skip if already marked as paid
   - Calculate tax for the month
   - Return month if `taxOwed > 0`
4. Returns `null` if no unpaid months with tax owed

**Key Change (2025-11-09):** Now checks if `taxOwed > 0` before returning a month. This means months with zero tax don't trigger notifications and don't need to be marked as paid.

**Parameters:**
- `availableMonths`: All months with data (sorted newest first)
- `paidMonths`: Array of months marked as paid
- `reservations`: All reservations (needed to calculate tax)
- `expenses`: All expenses (needed to calculate tax)
- `dependents`: Number of dependents

#### 4. `groupReservationsByMonth()` & `groupExpensesByMonth()`
**Lines:** 33-62

Group reservations/expenses by YYYY-MM month format.

**Returns:** `Map<string, Reservation[]>` or `Map<string, Expense[]>`

#### 5. `formatReservationsForIRS()`
**Lines:** 120-129

Formats reservation details for copying into Carnê Leão.

**Format:** `DD/MM - X diárias = R$ XXX.XX` (one per line)

**Example:**
```
01/11 - 5 diárias = R$ 1.050,00
15/11 - 3 diárias = R$ 630,00
```

## Tax Calculation Service
**Location:** `src/services/BrazilianRentalTaxCalculator.ts`

Implements Brazilian tax bracket logic with deductions based on dependents.

## State Management

### Redux Slice
**Location:** `src/store/taxesSlice.ts`

**State:**
```typescript
interface TaxesState {
  paidMonths: string[]; // Array of YYYY-MM strings
}
```

**Actions:**
- `markMonthAsPaid(month: string)` - Add month to paid list
- `markMonthAsUnpaid(month: string)` - Remove month from paid list
- `setPaidMonths(months: string[])` - Set entire paid months array

**Note:** Paid status is persisted to Google Sheets via data sync.

## Dashboard Integration
**Location:** `src/features/dashboard/Dashboard.tsx:59-62`

The dashboard shows a yellow notification banner when there are unpaid taxes.

**Logic:**
```typescript
const unpaidMonth = useMemo(
  () => getMostRecentUnpaidMonth(availableMonths, paidMonths, reservations, expenses, settings.dependents),
  [availableMonths, paidMonths, reservations, expenses, settings.dependents]
);
```

**Display (lines 115-124):**
- Only shows if `dataLoaded && unpaidMonth` exists
- Yellow banner with text: "Não se esqueça de pagar seus impostos de {month}"
- Clicking navigates to `/taxes/{month}`
- **Will NOT show for months with zero tax owed**

## User Flow: Handling Monthly Taxes

1. User views dashboard
2. If there's an unpaid month with tax > 0, yellow notification appears
3. User clicks notification (or navigates to Taxes page)
4. User sees selected month's tax breakdown
5. User can:
   - Navigate to different months using month selector
   - Copy income, deductions, and reservation details
   - Click Carnê Leão link to file taxes
   - Mark month as paid after filing
6. Month turns green in the list
7. Notification disappears from dashboard

## User Flows

### Flow 1: Viewing and Paying Taxes

1. User sees yellow notification on dashboard: "Não se esqueça de pagar seus impostos de Outubro 2025"
2. User clicks notification
3. App navigates to `/taxes/2025-10`
4. User sees full tax breakdown for October:
   - Total Income: R$ 3,500.00
   - Deductions: R$ 450.00
   - Liquid Income: R$ 3,050.00
   - Tax Deduction: R$ 528.00
   - Taxable Income: R$ 2,522.00
   - Tax Rate: 7.5%
   - Tax Owed: R$ 189.15
   - Final Profit: R$ 2,860.85
5. User scrolls to "Preparar para Declaração" section
6. User clicks "Copiar" on Total Income field
7. Pastes in Carnê Leão Web form
8. Repeats for Deductions and Reservation Details
9. User submits tax declaration on Carnê Leão website
10. User returns to app and clicks "Marcar como Pago"
11. Month turns green in list
12. Dashboard notification disappears

### Flow 2: Navigating Between Months

1. User is on `/taxes/2025-11` (November)
2. User sees "Últimos 6 Meses" list below
3. User sees October is yellow (unpaid, tax owed)
4. User clicks October month item (entire button is clickable)
5. App navigates to `/taxes/2025-10`
6. User reviews October's tax details
7. User can use month navigation arrows to go to September
8. Or click another month from the list

### Flow 3: Zero Tax Months

1. User has a month with high expenses and low income
2. Tax calculation shows:
   - Total Income: R$ 1,000.00
   - Deductions: R$ 1,200.00
   - Liquid Income: R$ -200.00
   - Taxable Income: R$ 0.00
   - Tax Owed: R$ 0.00
3. Month appears gray in list with "Sem imposto" badge
4. No notification appears on dashboard
5. User doesn't need to mark as paid
6. Month doesn't block other notifications

## Recent Changes (2025-11-09)

### What Changed:

1. **Limited display to last 6 months**
   - Changed "Todos os Meses" to "Últimos 6 Meses"
   - Only shows `availableMonths.slice(0, 6)` instead of all months
   - Reduces clutter for long-term users

2. **Zero tax months don't require marking as paid**
   - Updated `getMostRecentUnpaidMonth()` to calculate tax before determining notification
   - Now only returns month if `taxOwed > 0`
   - Dashboard notification won't show for months with zero tax
   - No need to manually mark zero-tax months as paid

3. **Made month items clickable**
   - Entire month card in "Últimos 6 Meses" list is now a button
   - Clicking navigates to that month's tax detail page
   - No separate view/arrow icon needed
   - Better UX and accessibility

### Why:
- Improve UX by reducing noise (don't show old months)
- Eliminate unnecessary action for zero-tax months
- Focus attention on months that actually need payment
- Easier navigation between months with full clickable items

## Important Notes

- Tax calculation uses Brazilian Carnê Leão progressive tax brackets
- Dependents affect deduction amount (configured in settings)
- Month format throughout: `YYYY-MM` (e.g., `2025-11`)
- Paid status is stored in Redux and synced to Google Sheets
- Past months only: Current and future months never show in notifications
- Expenses reduce taxable income (deductions)
- Only owner's share (70% by default) is considered for tax calculation
- Tax calculation: (liquidIncome - deductions) × taxRate = taxOwed
- Final profit: liquidIncome - taxOwed

## Color Coding in Month List

- **Green background** (`border-green-200 bg-green-50`): Month is marked as paid
- **Yellow background** (`border-yellow-200 bg-yellow-50`): Unpaid with tax owed > 0
- **Gray background** (`border-gray-200 bg-gray-50`): No tax owed or future month

## Status Badges

- **"✓ Pago"** (green): Month is paid
- **"Pendente"** (yellow): Tax owed but not paid
- **"Sem imposto"** (gray): No tax to pay
