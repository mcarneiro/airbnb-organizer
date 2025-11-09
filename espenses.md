# Expenses Feature Documentation

## Overview
The expenses feature allows users to track property-related expenses by month. Users can add expenses with amounts, optional categories, and notes.

## Data Model

### Expense Interface
**Location:** `src/types/index.ts:20-26`

```typescript
export interface Expense {
  id: string;
  date: Date;           // Expense date (set to 1st day of month)
  amount: number;       // Amount spent
  category?: ExpenseCategory; // Optional expense category
  notes?: string;       // Optional description
}
```

### ExpenseCategory Type
**Location:** `src/types/index.ts:12-18`

```typescript
export type ExpenseCategory =
  | 'IPTU'
  | 'Condomínio'
  | 'Luz'
  | 'Internet'
  | 'Gas'
  | 'Manutenção';
```

## Components

### 1. ExpensesMonth Component
**Location:** `src/features/expenses/ExpensesMonth.tsx`

**Purpose:** Displays all expenses for a selected month with summary and navigation.

**Key Features:**
- Month navigation (prev/next)
- Summary card showing total expenses and count
- List of all expenses for the month
- "+" button to add new expense
- Conditional rendering: only shows category badge if category exists

**Route:** `/expenses/:month` (e.g., `/expenses/2025-11`)

**Important Details:**
- Filters expenses by month using `formatMonth(e.date) === month`
- Navigates to `/expenses/new/:month` when adding new expense
- Shows "Nenhuma despesa neste mês" when no expenses exist

### 2. NewExpense Component
**Location:** `src/features/expenses/NewExpense.tsx`

**Purpose:** Form to add a new expense.

**Form Fields:**
1. **Amount** (required) - Numeric input for expense amount
2. **Category** (optional) - Dropdown with predefined categories
3. **Notes** (optional) - Textarea for additional details

**Key Implementation Details:**
- Date field was removed (previously required)
- Date is automatically set to the 1st day of the month from URL parameter
- Uses `useParams()` to get month from route: `/expenses/new/:month`
- Creates date using: `new Date(parseInt(year), parseInt(monthNum) - 1, 1)`
- Form validation only checks for amount (`isFormValid = formData.amount`)
- After submission, navigates back to `/expenses/${month}`

**Route:** `/expenses/new/:month` (e.g., `/expenses/new/2025-11`)

## Routing Configuration
**Location:** `src/App.tsx:98-100`

```typescript
<Route path="/expenses" element={<Navigate to={`/expenses/${getCurrentMonth()}`} replace />} />
<Route path="/expenses/new/:month" element={<NewExpense />} />
<Route path="/expenses/:month" element={<Layout><ExpensesMonth /></Layout>} />
```

- `/expenses` redirects to current month
- `/expenses/new/:month` requires month parameter
- `/expenses/:month` displays expenses for specific month

## State Management

### Redux Slice
**Location:** `src/store/expensesSlice.ts`

**Actions:**
- `setExpenses(Expense[])` - Set all expenses
- `addExpense(Expense)` - Add single expense
- `updateExpense(Expense)` - Update existing expense
- `deleteExpense(string)` - Delete by ID
- `setLoading(boolean)` - Set loading state
- `setError(string | null)` - Set error state

## User Flow: Adding an Expense

1. User navigates to `/expenses/2025-11` (November 2025)
2. User clicks "+" button in header
3. App navigates to `/expenses/new/2025-11`
4. User fills out:
   - Amount (required)
   - Category (optional - can leave as "Selecione uma categoria")
   - Notes (optional)
5. User submits form
6. System creates expense with:
   - Date: November 1, 2025 (first day of month)
   - Amount: user input
   - Category: user selection or `undefined`
   - Notes: user input or `undefined`
7. Expense is dispatched to Redux store
8. User is redirected back to `/expenses/2025-11`

## Recent Changes (2025-11-09)

### What Changed:
1. **Made category optional** - Previously required, now optional in both type definition and form
2. **Removed date field** - Date input removed from form entirely
3. **Auto-set date to 1st of month** - Date automatically determined from URL parameter
4. **Updated routing** - Changed from `/expenses/new` to `/expenses/new/:month`
5. **Simplified validation** - Only amount field is validated

### Why:
- Streamline expense entry process
- Reduce user input by inferring date from current context
- Make category optional for flexibility

## Important Notes

- Expense dates are always set to the 1st day of the month
- Month format in URLs: `YYYY-MM` (e.g., `2025-11` for November 2025)
- Category is optional - expenses without categories are valid
- The ExpensesMonth component conditionally renders category badges only when present
- Form state only includes: amount, category, and notes (no date field)
