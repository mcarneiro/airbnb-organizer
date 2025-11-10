# Reservations Feature Documentation

## Overview
The reservations feature allows users to track property bookings by month. Users can add reservations with check-in dates, number of nights, and total amounts. The system automatically calculates owner and admin splits based on configured percentages.

## Data Model

### Reservation Interface
**Location:** `src/types/index.ts:3-10`

```typescript
export interface Reservation {
  id: string;
  date: Date;           // First date of reservation (check-in date)
  nights: number;       // Number of nights
  total: number;        // Total amount Airbnb will pay
  ownerAmount: number;  // Amount owner receives (70% by default)
  adminFee: number;     // Administrator's share (30% by default)
}
```

## Components

### 1. ReservationsMonth Component
**Location:** `src/features/reservations/ReservationsMonth.tsx`

**Purpose:** Displays all reservations for a selected month with summary statistics and navigation.

**Key Features:**
- Month navigation (prev/next)
- Summary card showing:
  - Total owner income
  - Occupation percentage (based on 30 days/month)
  - Number of reservations
  - Total nights booked
- List of all reservations for the month with:
  - Check-in date (DD/MM format)
  - Number of nights
  - Total amount
  - Owner amount (highlighted in blue)
  - Admin fee
- "+" button to add new reservation
- Empty state with link to add first reservation

**Route:** `/reservations/:month` (e.g., `/reservations/2025-11`)

**Important Details:**
- Filters reservations by month using `formatMonth(r.date) === month`
- Navigates to `/reservations/new/:month` when adding new reservation
- Shows "Nenhuma reserva neste mês" when no reservations exist
- Calculates occupation: `Math.round((nights / 30) * 100)`

### 2. NewReservation Component
**Location:** `src/features/reservations/NewReservation.tsx`

**Purpose:** Form to add a new reservation with automatic split calculations.

**Form Fields:**
1. **Check-in Date** (required) - Date input, pre-filled based on context
2. **Number of Nights** (required) - Numeric input (minimum 1)
3. **Total Amount** (required) - Numeric input for total payment

**Calculated Display:**
- Shows real-time calculation of owner and admin splits as user types
- Uses settings from Redux store for split percentages
- Default: 70% owner, 30% admin

**Key Implementation Details:**
- Uses `useParams()` to get month from route: `/reservations/new/:month`
- Implements smart date pre-fill logic (see below)
- Calculates splits: `ownerAmount = total * settings.ownerSplit`
- After submission, navigates back to `/reservations/${month}`
- Form validation checks all three fields are filled

**Date Pre-fill Logic (lines 15-32):**
```typescript
const getInitialDate = (): string => {
  if (!month) return '';

  const now = new Date();
  const currentMonth = formatMonth(now);

  if (month === currentMonth) {
    // Current month: use today's date
    const year = now.getFullYear();
    const monthNum = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${monthNum}-${day}`;
  } else {
    // Past or future month: use first day of that month
    const [year, monthNum] = month.split('-');
    return `${year}-${monthNum}-01`;
  }
};
```

**Route:** `/reservations/new/:month` (e.g., `/reservations/new/2025-11`)

## Routing Configuration
**Location:** `src/App.tsx:103-104`

```typescript
<Route path="/reservations/new/:month" element={<Layout><NewReservation /></Layout>} />
<Route path="/reservations/:month" element={<Layout><ReservationsMonth /></Layout>} />
```

- `/reservations/new/:month` requires month parameter for date pre-fill
- `/reservations/:month` displays reservations for specific month

## Navigation Entry Points

### 1. Dashboard (Current & Next Months)
**Location:** `src/features/dashboard/Dashboard.tsx`

Users can click on current month or next month cards to view reservations for that month.

### 2. Bottom Navigation Bar
**Location:** `src/components/Layout.tsx:49`

The blue circular "+" button in the center of bottom nav navigates to:
```typescript
navigate(`/reservations/new/${getCurrentMonth()}`)
```

This ensures the date is pre-filled with today's date when adding from the nav bar.

### 3. ReservationsMonth Page
Users can click the "+" button in the header or the "Adicionar uma reserva" link.

## State Management

### Redux Slice
**Location:** `src/store/reservationsSlice.ts`

**State:**
```typescript
interface ReservationsState {
  items: Reservation[];
  loading: boolean;
  error: string | null;
}
```

**Actions:**
- `setReservations(Reservation[])` - Set all reservations
- `addReservation(Reservation)` - Add single reservation
- `updateReservation(Reservation)` - Update existing reservation
- `deleteReservation(string)` - Delete by ID
- `setLoading(boolean)` - Set loading state
- `setError(string | null)` - Set error state

**Note:** Reservations are persisted to Google Sheets via data sync.

## Settings Integration

### AppSettings
**Location:** `src/types/index.ts:41-45`

```typescript
export interface AppSettings {
  dependents: number;      // Number of dependents for tax calculation
  ownerSplit: number;      // Default: 0.70
  adminSplit: number;      // Default: 0.30
}
```

The split percentages are configurable in Settings and used for all reservation calculations.

## User Flow: Adding a Reservation

### Scenario 1: From Current Month (November 2025, today is Nov 9)
1. User navigates to `/reservations/2025-11` (November 2025)
2. User clicks "+" button in header
3. App navigates to `/reservations/new/2025-11`
4. **Date pre-fills with: 2025-11-09** (today's date)
5. User fills out:
   - Nights: 3
   - Total: R$ 1,500.00
6. System displays calculated amounts:
   - Owner (70%): R$ 1,050.00
   - Admin (30%): R$ 450.00
7. User submits form
8. Reservation is created with:
   - Date: November 9, 2025
   - Nights: 3
   - Total: 1,500.00
   - Owner: 1,050.00
   - Admin: 450.00
9. User is redirected back to `/reservations/2025-11`

### Scenario 2: From Past/Future Month (October 2025)
1. User navigates to `/reservations/2025-10` (October 2025)
2. User clicks "+" button
3. App navigates to `/reservations/new/2025-10`
4. **Date pre-fills with: 2025-10-01** (first day of October)
5. User can change date or keep it as is
6. Rest of flow is same as above

### Scenario 3: From Bottom Nav Bar
1. User clicks blue "+" button in bottom nav (from any page)
2. App navigates to `/reservations/new/2025-11` (current month)
3. **Date pre-fills with today's date**
4. Rest of flow is same as Scenario 1

## Edit and Delete Functionality

### Edit Mode
**Location:** `src/features/reservations/NewReservation.tsx`

NewReservation component is reusable for both creating and editing reservations.

**Mode Detection (lines 16-17):**
```typescript
const isEditMode = !!id;
const existingReservation = isEditMode ? reservations.find(r => r.id === id) : null;
```

**Pre-fill Form in Edit Mode (lines 57-71):**
```typescript
useEffect(() => {
  if (existingReservation) {
    const date = existingReservation.date;
    const year = date.getFullYear();
    const monthNum = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${monthNum}-${day}`;

    setFormData({
      date: dateString,
      nights: existingReservation.nights.toString(),
      total: existingReservation.total.toString(),
    });
  }
}, [existingReservation]);
```

**Update Handler (lines 95-110):**
- Updates existing reservation with new values
- Preserves the same ID
- Recalculates owner and admin splits based on new total
- Navigates back to reservation's month after save

**Routes:**
- Create: `/reservations/new/:month` (e.g., `/reservations/new/2025-11`)
- Edit: `/reservations/edit/:id` (e.g., `/reservations/edit/abc-123`)

**UI Changes:**
- Header text: "Nova Reserva" vs "Editar Reserva"
- Submit button: "Adicionar Reserva" vs "Salvar Alterações"
- Delete button only shows in edit mode

### Delete Mode
**Location:** `src/features/reservations/NewReservation.tsx:73-81, 241-276`

**Delete Handler:**
```typescript
const handleDelete = () => {
  if (!existingReservation) return;

  dispatch(deleteReservation(existingReservation.id));

  // Navigate back to reservations list for this reservation's month
  const reservationMonth = formatMonth(existingReservation.date);
  navigate(`/reservations/${reservationMonth}`);
};
```

**Delete Button:**
- Red "Remover Reserva" button only visible in edit mode
- Appears below "Salvar Alterações"
- Opens confirmation modal on click

**Confirmation Modal:**
- Title: "Confirmar Remoção"
- Warning: "Tem certeza que deseja remover esta reserva? Esta ação não pode ser desfeita."
- Buttons: "Cancelar" (gray) and "Sim, Remover" (red)
- Modal uses `showDeleteConfirm` state

### Clickable Reservation Items
**Location:** `src/features/reservations/ReservationsMonth.tsx:144-178`

Entire reservation items are clickable buttons (not just icons):
```typescript
<button
  key={reservation.id}
  onClick={() => navigate(`/reservations/edit/${reservation.id}`)}
  className="w-full px-6 py-4 hover:bg-gray-50 transition-colors text-left"
>
  {/* Reservation content */}
</button>
```

- No separate edit icon needed
- Full item has hover effect
- Maintains text-left alignment
- Keyboard accessible

## Timezone Bug Fix

**Problem:** When user entered October 1st (2025-10-01), it was saved as September 30th.

**Root Cause:** `new Date(dateString)` interprets the date as UTC midnight. In UTC-3 timezone (Brazil), this becomes the previous day.

**Solution (lines 91-93):**
Parse date components locally instead of using Date constructor with string:

```typescript
// Before (buggy):
const reservation = {
  date: new Date(formData.date) // UTC interpretation!
};

// After (fixed):
const [year, monthNum, day] = formData.date.split('-').map(Number);
const localDate = new Date(year, monthNum - 1, day); // Local interpretation
const reservation = {
  date: localDate
};
```

This ensures dates are always interpreted in the local timezone, not UTC.

## Recent Changes (2025-11-09)

### What Changed:

1. **Smart date pre-fill based on context**
   - Added month parameter to NewReservation route
   - Implemented `getInitialDate()` function
   - Current month → uses today's date
   - Past/future month → uses first day of month

2. **Updated navigation to pass month context**
   - ReservationsMonth "+" button → `/reservations/new/:month`
   - Bottom nav bar button → `/reservations/new/${getCurrentMonth()}`
   - Empty state link → `/reservations/new/:month`

3. **Improved navigation flow**
   - After submission, returns to month page instead of dashboard
   - Maintains context throughout the flow

4. **Added edit functionality**
   - Reused NewReservation component with mode detection via URL params
   - Pre-fills form with existing data in edit mode
   - Dynamic header and button text based on mode

5. **Added delete functionality**
   - Red "Remover Reserva" button in edit mode
   - Confirmation modal before deletion
   - Safe deletion with navigation to month view

6. **Made reservation items clickable**
   - Entire item is now a button (not just icon)
   - Removed separate pencil edit icon
   - Better UX and accessibility

7. **Fixed timezone bug**
   - Changed from `new Date(dateString)` to local date parsing
   - Prevents date shifting due to timezone conversion
   - User input matches saved date exactly

### Why:
- Reduce manual input by intelligently pre-filling dates
- Maintain context awareness (current vs past/future months)
- Improve UX by reducing clicks and preventing invalid states
- Fix bug where bottom nav button generated invalid date page
- Enable full CRUD operations for reservations
- Better accessibility with full clickable items
- Ensure date accuracy across timezones

## Important Notes

- Reservation dates use the check-in date (first day of stay)
- Month format throughout: `YYYY-MM` (e.g., `2025-11`)
- Date input format: `YYYY-MM-DD` (e.g., `2025-11-09`)
- Owner/Admin splits are calculated in real-time as user types
- Split percentages come from settings (default: 70/30)
- Reservations are grouped by the month of the check-in date
- Occupation percentage assumes 30 days per month
- All amounts are in Brazilian Reais (R$)
- Date field is always pre-filled (never empty)
- **Internationalization:** All UI text is translatable (pt-BR / en-US)
- **Pluralization:** "diária" vs "diárias" based on count
- **Date Formatting:** Locale-aware display (DD/MM for pt-BR, MM/DD for en-US)

## Occupation Calculation

```typescript
const occupationRate = Math.round((nights / 30) * 100);
```

- Based on 30-day months
- Example: 15 nights = 50% occupation
- Example: 30 nights = 100% occupation

## Display Formatting

- **Dates in list:** DD/MM format (e.g., "09/11")
- **Currency:** Uses `formatCurrency()` utility
- **Nights:** Shows "diária" (singular) or "diárias" (plural)
- **Owner amounts:** Highlighted in blue
- **Admin fees:** Displayed in gray

## Integration with Tax Calculations

Reservations are used to calculate monthly taxes:
- Only the `ownerAmount` is considered for tax purposes
- Taxes are calculated on: (owner income - expenses)
- See `taxes.md` for detailed tax calculation logic
