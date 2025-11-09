# Expenses Feature Documentation

## Overview
The expenses feature allows users to track property-related expenses by month. Users can add, edit, and delete expenses with amounts, optional categories, and notes. The feature also supports replicating expenses from the previous month for recurring expenses.

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
- Month navigation (prev/next months)
- Summary card showing total expenses and count
- List of all expenses for the month
- "+" button in header to add new expense
- Clickable expense items (entire item is a button)
- Empty state with option to add or replicate expenses
- Conditional rendering: only shows category badge if category exists
- Loading skeleton while data syncs from Google Sheets

**Route:** `/expenses/:month` (e.g., `/expenses/2025-11`)

**Important Details:**
- Filters expenses by month using `formatMonth(e.date) === month`
- Navigates to `/expenses/new/:month` when adding new expense
- Navigates to `/expenses/edit/:id` when clicking an expense
- Shows "Nenhuma despesa neste mês" when no expenses exist
- Only shows after `dataLoaded` is true (prevents flash of empty state)

**Replicate Feature (lines 28-66):**
```typescript
const previousMonthExpenses = useMemo(() => {
  // Calculate previous month
  const [year, monthNum] = month.split('-').map(Number);
  let prevYear = year;
  let prevMonth = monthNum - 1;
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear = year - 1;
  }
  const previousMonth = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
  return expenses.filter(e => formatMonth(e.date) === previousMonth);
}, [expenses, month]);

const handleReplicateExpenses = () => {
  // Create new expenses with current month's date
  previousMonthExpenses.forEach((expense) => {
    const newExpense = {
      id: crypto.randomUUID(),
      date: expenseDate, // First day of current month
      amount: expense.amount,
      category: expense.category,
      notes: expense.notes,
    };
    dispatch(addExpense(newExpense));
  });
};
```

**Empty State Logic:**
- Shows "Adicionar uma despesa" button
- If previous month has expenses, also shows green "Replicar despesas do mês anterior (count)" button
- Only visible when `dataLoaded && monthExpenses.length === 0`

### 2. NewExpense Component
**Location:** `src/features/expenses/NewExpense.tsx`

**Purpose:** Reusable form for adding new expenses OR editing existing ones.

**Mode Detection (lines 23-25):**
```typescript
const isEditMode = !!id;
const existingExpense = isEditMode ? expenses.find(e => e.id === id) : null;
```

**Form Fields:**
1. **Amount** (required) - Numeric input for expense amount
2. **Category** (optional) - Dropdown with predefined categories
3. **Notes** (optional) - Textarea for additional details

**Key Implementation Details:**
- Date field was removed (previously required)
- Date is automatically set to the 1st day of the month from URL parameter in create mode
- In edit mode, date is preserved from existing expense
- Uses `useParams()` to get either `month` (create) or `id` (edit)
- Creates date using: `new Date(parseInt(year), parseInt(monthNum) - 1, 1)`
- Form validation only checks for amount (`isFormValid = formData.amount`)
- Pre-fills form data with `useEffect` when in edit mode (lines 36-44)
- After submission, navigates back to `/expenses/${month}`
- Header text changes: "Nova Despesa" vs "Editar Despesa"
- Submit button text changes: "Adicionar Despesa" vs "Salvar Alterações"

**Edit Mode Pre-fill (lines 36-44):**
```typescript
useEffect(() => {
  if (existingExpense) {
    setFormData({
      amount: existingExpense.amount.toString(),
      category: existingExpense.category || '',
      notes: existingExpense.notes || '',
    });
  }
}, [existingExpense]);
```

**Delete Functionality (lines 46-54, 187-222):**
- Red "Remover Despesa" button only shows in edit mode
- Clicking shows confirmation modal
- Modal warns: "Esta ação não pode ser desfeita"
- On confirm, dispatches `deleteExpense(id)` and navigates to expense month
- Uses `showDeleteConfirm` state to control modal visibility

**Routes:**
- Create: `/expenses/new/:month` (e.g., `/expenses/new/2025-11`)
- Edit: `/expenses/edit/:id` (e.g., `/expenses/edit/abc-123`)

## Routing Configuration
**Location:** `src/App.tsx:98-101`

```typescript
<Route path="/expenses" element={<Navigate to={`/expenses/${getCurrentMonth()}`} replace />} />
<Route path="/expenses/new/:month" element={<NewExpense />} />
<Route path="/expenses/edit/:id" element={<NewExpense />} />
<Route path="/expenses/:month" element={<Layout><ExpensesMonth /></Layout>} />
```

- `/expenses` redirects to current month
- `/expenses/new/:month` requires month parameter (create mode)
- `/expenses/edit/:id` requires expense ID (edit mode)
- `/expenses/:month` displays expenses for specific month
- Note: Same component (NewExpense) handles both create and edit

## State Management

### Redux Slice
**Location:** `src/store/expensesSlice.ts`

**State:**
```typescript
interface ExpensesState {
  items: Expense[];
  loading: boolean;
  error: string | null;
}
```

**Actions:**
- `setExpenses(Expense[])` - Set all expenses (used during data sync)
- `addExpense(Expense)` - Add single expense
- `updateExpense(Expense)` - Update existing expense
- `deleteExpense(string)` - Delete by ID
- `setLoading(boolean)` - Set loading state
- `setError(string | null)` - Set error state

**Note:** Expenses are persisted to Google Sheets via data sync (see `onboarding.md`).

## User Flows

### Flow 1: Adding an Expense

1. User navigates to `/expenses/2025-11` (November 2025)
2. User clicks "+" button in header
3. App navigates to `/expenses/new/2025-11`
4. Form shows with empty fields:
   - Amount: empty (required)
   - Category: "Selecione uma categoria" (optional)
   - Notes: empty (optional)
5. User fills out amount (e.g., 150.00)
6. Optionally selects category (e.g., "Luz")
7. Optionally adds notes (e.g., "Conta de outubro")
8. User clicks "Adicionar Despesa"
9. System creates expense with:
   - ID: auto-generated UUID
   - Date: November 1, 2025 (first day of month)
   - Amount: 150.00
   - Category: "Luz"
   - Notes: "Conta de outubro"
10. Expense is dispatched to Redux store
11. Data sync saves to Google Sheets
12. User is redirected back to `/expenses/2025-11`

### Flow 2: Editing an Expense

1. User is on `/expenses/2025-11`
2. User sees expense: "R$ 150,00 | Luz"
3. User clicks anywhere on the expense item (full button)
4. App navigates to `/expenses/edit/abc-123`
5. Form pre-fills with existing data:
   - Amount: 150.00
   - Category: "Luz"
   - Notes: "Conta de outubro"
6. Header shows "Editar Despesa"
7. User changes amount to 175.00
8. User clicks "Salvar Alterações"
9. System updates expense:
   - Keeps same ID, date
   - Updates amount to 175.00
10. Updated expense dispatched to Redux
11. Data sync updates Google Sheets
12. User redirected to `/expenses/2025-11`

### Flow 3: Deleting an Expense

1. User is editing expense at `/expenses/edit/abc-123`
2. User scrolls down and sees red "Remover Despesa" button
3. User clicks button
4. Confirmation modal appears: "Confirmar Remoção"
5. Modal warns: "Tem certeza que deseja remover esta despesa? Esta ação não pode ser desfeita."
6. User clicks "Sim, Remover" (or "Cancelar" to abort)
7. System dispatches `deleteExpense('abc-123')`
8. Expense removed from Redux store
9. Data sync removes from Google Sheets
10. User redirected to `/expenses/2025-11`

### Flow 4: Replicating Previous Month's Expenses

1. User navigates to `/expenses/2025-12` (December)
2. December has no expenses yet
3. November has 3 expenses: IPTU, Luz, Condomínio
4. User sees empty state message
5. Below "Adicionar uma despesa", user sees green button:
   "Replicar despesas do mês anterior (3)"
6. User clicks replicate button
7. System creates 3 new expenses:
   - Each with new UUID
   - Each with date: December 1, 2025
   - Same amounts, categories, notes as November
8. Expenses appear in December list
9. User can now edit amounts if they changed

## Recent Changes (2025-11-09)

### What Changed:

1. **Made category optional** - Previously required, now optional in both type definition and form
2. **Removed date field** - Date input removed from form entirely
3. **Auto-set date to 1st of month** - Date automatically determined from URL parameter
4. **Updated routing** - Changed from `/expenses/new` to `/expenses/new/:month`
5. **Simplified validation** - Only amount field is validated
6. **Added edit functionality** - Reused NewExpense component with mode detection
7. **Added delete functionality** - Red button with confirmation modal
8. **Made expense items clickable** - Entire item is now a button, removed separate edit icon
9. **Added replicate feature** - Copy all expenses from previous month
10. **Added loading state** - Skeleton animation while data loads

### Why:
- Streamline expense entry process
- Reduce user input by inferring date from current context
- Make category optional for flexibility
- Enable full CRUD operations (Create, Read, Update, Delete)
- Improve UX with replicate feature for recurring expenses
- Better accessibility with full clickable items

## Important Notes

- **Date handling:** Expense dates are always set to the 1st day of the month
- **Month format:** URLs use `YYYY-MM` (e.g., `2025-11` for November 2025)
- **Category:** Optional field - expenses without categories are valid
- **Conditional rendering:** Category badges only show when category exists
- **Form state:** Only includes amount, category, and notes (no date field)
- **Reusable component:** NewExpense handles both create and edit modes
- **Loading state:** Show skeleton until `dataLoaded === true`
- **Navigation:** Back button always returns to month view, not dashboard
- **Replicate:** Preserves all expense data except ID and date
- **Delete:** Permanent action with confirmation required

## Integration with Tax Calculations

Expenses reduce taxable income:
- Total expenses for a month are summed
- Subtracted from owner's rental income
- Result is liquid income used for tax calculation
- See `taxes.md` for detailed tax calculation logic

## Data Persistence

All expenses are synced to Google Sheets:
- Sheet: "Expenses" tab
- Columns: ID, Date, Amount, Category, Notes
- Auto-sync via `useDataSync` hook
- See `onboarding.md` for Google Sheets setup

## UI Components

### ExpensesMonth Layout
- Header with back button, title, and "+" button
- MonthNavigation component (shared with reservations and taxes)
- Summary card with total in red
- List with category badges and notes
- Loading skeleton matching card layout

### NewExpense Layout
- Header with back button and dynamic title
- Form with three fields (amount, category, notes)
- Blue "Adicionar/Salvar" button
- Red "Remover" button (edit mode only)
- Confirmation modal (fixed overlay, centered)

## Accessibility

- Full items are buttons, not divs with onclick
- Proper keyboard navigation support
- Clear visual feedback on hover
- Confirmation required for destructive actions
- Color coding: red for expenses/delete, blue for actions, green for replicate
