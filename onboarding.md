# Onboarding & Data Sync Documentation

## Overview
The onboarding process guides new users through Google authentication and Google Sheets setup. Once completed, the app automatically syncs all data bidirectionally between Redux store and Google Sheets. This document covers authentication, initial setup, data sync mechanisms, and Google Sheets structure.

## System Architecture

### Data Flow
```
User Browser
    ↓
React App (Redux Store)
    ↓
Google Sheets Service
    ↓
Google Sheets API
    ↓
User's Google Sheet
```

### Storage Layers

1. **Redux Store** (in-memory)
   - All application state during session
   - Source of truth for UI rendering
   - Cleared on page reload

2. **localStorage** (persistent)
   - Google Sheet ID
   - persistAuth preference
   - Auth tokens (if persistAuth is ON)

3. **sessionStorage** (session-only)
   - Auth tokens (if persistAuth is OFF, default)
   - Cleared when browser closes

4. **Google Sheets** (cloud persistence)
   - All user data (reservations, expenses, settings)
   - Tax calculations
   - Paid month tracking
   - True source of truth

## Onboarding Component

**Location:** `src/features/onboarding/Onboarding.tsx`

**Route:** `/onboarding` (default route when not authenticated)

**Purpose:** Guides new users through authentication and setup, or allows returning users to re-authenticate.

## Onboarding Flow

### Step 1: Configuration Check

**Lines 19-20:**
```typescript
const isConfigured = !!GOOGLE_CONFIG.CLIENT_ID;
```

Checks if `.env` file has `VITE_GOOGLE_CLIENT_ID` configured.

**If NOT configured:**
- Red warning box appears
- Sign-in button is disabled
- User must configure environment variable first

**Configuration File:**
- Location: `.env` (root directory)
- Required variable: `VITE_GOOGLE_CLIENT_ID`
- Example provided in `.env.example`

### Step 2: Google Authentication

**Lines 90-134:**

**UI:**
- "Step 1: Sign in with Google" heading
- Blue info box explaining permissions:
  - Read and write to your Google Sheets
  - No access to other Google services
  - Your data stays in your own Google Sheet
- Google sign-in button with Google logo

**Process:**
1. User clicks "Sign in with Google"
2. `handleSignIn()` called (lines 26-34)
3. Triggers Google OAuth flow via `signIn()` from GoogleAuthContext
4. Google consent screen opens in popup
5. User grants permissions
6. OAuth returns access token
7. App fetches user email from Google API
8. Auth state saved to appropriate storage (session/local based on persistAuth)

**Required Scope:**
```typescript
scope: 'https://www.googleapis.com/auth/spreadsheets'
```

This grants full read/write access to user's Google Sheets.

### Step 3: Google Sheet Setup

**Lines 148-195:**

Only shown for NEW users (existing users skip directly to dashboard).

**UI:**
- Green success box: "✓ Signed in as {email}"
- "Step 2: Connect Your Google Sheet" heading
- URL input field
- Link to create new sheet: https://sheets.new
- Blue "Complete Setup" button

**Process:**
1. User creates or opens existing Google Sheet
2. User copies full URL from browser
3. User pastes URL into input field
4. User clicks "Complete Setup"
5. `handleSheetSetup()` called (lines 36-65)
6. App extracts spreadsheet ID from URL
7. Sheet ID saved to Redux and localStorage
8. `googleSheetsService.initializeSheets()` called
9. App creates required tabs and structure (if needed)
10. User navigated to dashboard
11. Initial data load begins automatically

**URL Extraction:**
```typescript
const spreadsheetId = GoogleSheetsService.extractSpreadsheetId(sheetUrl);
```

Extracts ID from URLs like:
- `https://docs.google.com/spreadsheets/d/{ID}/edit`
- `https://docs.google.com/spreadsheets/d/{ID}/edit#gid=0`

### Returning User Flow

**Lines 22-24:**
```typescript
const hasExistingSetup = !!existingSheetId;
```

If user has Sheet ID but is not signed in:
- Shows "Sign in to Continue" instead of "Step 1"
- Skips Step 2 after authentication
- Immediately navigates to dashboard
- Data loads automatically

**Lines 135-147:**
Loading state for returning users:
- Green success box with email
- Spinning loader
- "Loading your data..." message
- App.tsx handles navigation

## Google Authentication Context

**Location:** `src/contexts/GoogleAuthContext.tsx`

### Auth State
```typescript
interface GoogleAuthContextType {
  isSignedIn: boolean;
  userEmail: string | null;
  accessToken: string | null;
  error: string | null;
  signIn: () => void;
  signOut: (reason?: 'expired') => void;
  fullLogout: () => void;
  persistAuth: boolean;
  setPersistAuth: (persist: boolean) => void;
  sessionExpired: boolean;
  clearSessionExpired: () => void;
}
```

### Token Management

**Token Lifetime:**
- Google OAuth tokens expire after 1 hour (3600 seconds)
- Expiration time calculated: `Date.now() + (expiresIn * 1000)`
- Stored along with token

**Token Expiration Check (lines 86-105):**
On app initialization:
```typescript
useEffect(() => {
  const storage = getStorage();
  const expiresAt = storage.getItem('googleAuth_expiresAt');
  const wasSignedIn = storage.getItem('googleAuth_isSignedIn') === 'true';

  // If token is expired and user was signed in
  if (expiresAt && Date.now() >= parseInt(expiresAt) && wasSignedIn) {
    setSessionExpired(true); // Show notification
    // Clear all auth data
    storage.removeItem('googleAuth_isSignedIn');
    storage.removeItem('googleAuth_userEmail');
    storage.removeItem('googleAuth_accessToken');
    storage.removeItem('googleAuth_expiresAt');
  }

  // Mark auth as initialized
  dispatch(setAuthInitialized(true));
}, [dispatch]);
```

### Storage Strategy

**Helper Function (lines 22-31):**
```typescript
function getStorage(): Storage {
  const persistAuth = localStorage.getItem('persistAuth') === 'true';
  return persistAuth ? localStorage : sessionStorage;
}

function shouldPersistAuth(): boolean {
  return localStorage.getItem('persistAuth') === 'true'; // Default: false
}
```

**Default Behavior (2025-11-09):**
- `persistAuth` defaults to `false` (more secure)
- Auth data stored in sessionStorage by default
- User logged out when browser closes
- Must explicitly opt-in to persistence

**Storage Keys:**
- `googleAuth_isSignedIn` - Boolean string
- `googleAuth_userEmail` - Email address
- `googleAuth_accessToken` - OAuth token
- `googleAuth_expiresAt` - Timestamp (ms)
- `persistAuth` - Boolean preference (always in localStorage)
- `sheetId` - Google Sheet ID (always in localStorage)

## Google Sheets Service

**Location:** `src/services/GoogleSheetsService.ts`

### Sheet Structure

When `initializeSheets()` is called, the following tabs are created (if they don't exist):

#### 1. Reservations Tab
**Columns:**
1. ID (UUID)
2. Date (ISO string)
3. Nights (number)
4. Total (number)
5. Owner Amount (number)
6. Admin Fee (number)

**Example Row:**
```
abc-123-def | 2025-11-09T00:00:00.000Z | 3 | 1500 | 1050 | 450
```

#### 2. Expenses Tab
**Columns:**
1. ID (UUID)
2. Date (ISO string)
3. Amount (number)
4. Category (string, optional)
5. Notes (string, optional)

**Example Row:**
```
xyz-789-ghi | 2025-11-01T00:00:00.000Z | 150 | Luz | Conta de outubro
```

#### 3. Settings Tab
**Format:** Key-value pairs (2 columns)

**Rows:**
```
dependents | 2
ownerSplit | 0.70
adminSplit | 0.30
```

#### 4. Taxes Tab
**Columns:**
1. Month (YYYY-MM)
2. Income (number)
3. Deductions (number)
4. Tax Rate (decimal)
5. Tax Owed (number)
6. Profit (number)
7. Is Paid (boolean string)

**Example Row:**
```
2025-11 | 3500 | 450 | 0.075 | 189.15 | 2860.85 | false
```

**Note:** Tax data is calculated/derived data. Written automatically when:
- Reservations change
- Expenses change
- User marks month as paid/unpaid

### API Methods

**Read Operations:**
```typescript
readReservations(sheetId: string): Promise<Reservation[]>
readExpenses(sheetId: string): Promise<Expense[]>
readSettings(sheetId: string): Promise<AppSettings>
readPaidTaxMonths(sheetId: string): Promise<string[]>
```

**Write Operations:**
```typescript
writeReservations(sheetId: string, reservations: Reservation[]): Promise<void>
writeExpenses(sheetId: string, expenses: Expense[]): Promise<void>
writeSettings(sheetId: string, settings: AppSettings): Promise<void>
writeTaxData(sheetId: string, taxData: TaxData[]): Promise<void>
```

**Initialization:**
```typescript
initializeSheets(sheetId: string): Promise<void>
```

**Utility:**
```typescript
static extractSpreadsheetId(url: string): string | null
```

### Error Handling

**Token Expiration:**
If API returns 401 or token-related error:
```typescript
if (error?.code === 'TOKEN_EXPIRED') {
  signOut('expired');
}
```

This triggers:
1. User signed out
2. `sessionExpired` flag set
3. Notification shown on dashboard
4. User must re-authenticate

## Data Sync Hook

**Location:** `src/hooks/useDataSync.ts`

**Purpose:** Automatically syncs data between Redux store and Google Sheets.

### Loading Data

**Triggered:** When user signs in and has Sheet ID

**Process (lines 70-105):**
```typescript
const loadData = useCallback(async () => {
  if (!isSignedIn || !sheetId) return;

  isLoadingData.current = true;
  dispatch(setDataLoading(true));

  try {
    // Load all data in parallel
    const loadedSettings = await googleSheetsService.readSettings(sheetId);
    dispatch(setSettings(loadedSettings));

    const loadedReservations = await googleSheetsService.readReservations(sheetId);
    dispatch(setReservations(loadedReservations));

    const loadedExpenses = await googleSheetsService.readExpenses(sheetId);
    dispatch(setExpenses(loadedExpenses));

    const loadedPaidMonths = await googleSheetsService.readPaidTaxMonths(sheetId);
    dispatch(setPaidMonths(loadedPaidMonths));

    dispatch(setDataLoaded(true));
  } catch (error) {
    handleApiError(error);
  } finally {
    setTimeout(() => {
      isLoadingData.current = false;
    }, 100);
  }
}, [isSignedIn, sheetId, dispatch, handleApiError]);
```

**Loading Flag:**
`isLoadingData.current` prevents auto-save during initial load.

**App State:**
- `dataLoading`: true during load, shows skeletons
- `dataLoaded`: true after load, shows actual data

### Auto-Save Mechanism

**Debounced Auto-Save (lines 15-32):**
```typescript
function useDebouncedAutoSave(
  data: any,
  saveCallback: () => Promise<void>,
  isSignedIn: boolean,
  sheetId: string | null,
  isLoadingData: React.MutableRefObject<boolean>
) {
  useEffect(() => {
    if (!isSignedIn || !sheetId || isLoadingData.current) return;

    const timeoutId = setTimeout(() => {
      saveCallback();
    }, 1000); // 1 second debounce

    return () => clearTimeout(timeoutId);
  }, [data, isSignedIn, sheetId, saveCallback, isLoadingData]);
}
```

**How it works:**
1. User makes change (e.g., adds reservation)
2. Redux state updates immediately
3. UI renders new data instantly
4. After 1 second of no changes, auto-save triggers
5. Data written to Google Sheets in background
6. If user makes another change within 1 second, timer resets

**What's Auto-Saved:**
```typescript
// Line 214-217
useDebouncedAutoSave(reservations, saveReservations, isSignedIn, sheetId, isLoadingData);
useDebouncedAutoSave(expenses, saveExpenses, isSignedIn, sheetId, isLoadingData);
useDebouncedAutoSave(settings, saveSettings, isSignedIn, sheetId, isLoadingData);

// Line 221 - Only when paidMonths change
useDebouncedAutoSave(paidMonths, saveTaxData, isSignedIn, sheetId, isLoadingData);
```

**Important:** Tax data saves ONLY when `paidMonths` changes, not when reservations/expenses change. This prevents the `isPaid` status from being reset.

### Save Operations

**Individual Saves (lines 110-203):**
Each data type has its own save function:
- `saveReservations()` - Writes all reservations
- `saveExpenses()` - Writes all expenses
- `saveSettings()` - Writes settings
- `saveTaxData()` - Calculates and writes tax data for all months

**Tax Data Calculation (lines 152-203):**
```typescript
const saveTaxData = useCallback(async () => {
  // Get all months with data
  const allMonths = getAllMonths(reservations, expenses);

  // Calculate tax for each month
  const taxData = allMonths
    .filter(month => month && month.match(/^\d{4}-\d{2}$/))
    .map(month => {
      const monthReservations = reservationsByMonth.get(month) || [];
      const monthExpenses = expensesByMonth.get(month) || [];
      const isPaid = paidMonths.includes(month);

      const monthlyTax = calculateMonthlyTax(
        month,
        monthReservations,
        monthExpenses,
        settings.dependents,
        isPaid
      );

      return {
        month: monthlyTax.month,
        income: monthlyTax.totalIncome,
        deductions: monthlyTax.totalDeductions,
        taxRate: monthlyTax.taxRate,
        taxOwed: monthlyTax.taxOwed,
        profit: monthlyTax.profit,
        isPaid: monthlyTax.isPaid,
      };
    });

  // Write to Sheets
  await googleSheetsService.writeTaxData(sheetId, taxData);
}, [isSignedIn, sheetId, reservations, expenses, settings.dependents, paidMonths]);
```

## User Flows

### Flow 1: Brand New User

1. User visits app for first time
2. App checks: no Sheet ID, not signed in
3. Redirects to `/onboarding`
4. **Step 1:** User clicks "Sign in with Google"
5. Google OAuth popup opens
6. User grants spreadsheet permissions
7. Auth token received and stored (sessionStorage by default)
8. User email fetched and displayed
9. **Step 2:** UI shows Sheet setup form
10. User creates new Google Sheet at https://sheets.new
11. User copies Sheet URL
12. User pastes URL and clicks "Complete Setup"
13. App extracts Sheet ID
14. Sheet ID saved to localStorage
15. App calls `initializeSheets()` to create tabs
16. User redirected to dashboard
17. `useDataSync` hook triggers initial data load
18. Dashboard shows empty state (no reservations yet)
19. User can start adding data

### Flow 2: Returning User (Session Persisted)

1. User returns to app (browser not closed)
2. Auth token in sessionStorage (or localStorage if persistAuth ON)
3. Token not expired yet
4. App checks: has Sheet ID, is signed in
5. Redirects to dashboard
6. `useDataSync` hook loads data from Sheets
7. Data populates Redux store
8. Dashboard shows user's data

### Flow 3: Returning User (Session Expired)

1. User returns to app after several hours
2. Token exists but is expired
3. `GoogleAuthContext` detects expiration on mount
4. Sets `sessionExpired` flag
5. Clears all auth data
6. App redirects to onboarding
7. Shows "Sign in to Continue" message
8. User clicks "Sign in with Google"
9. New token obtained
10. Sheet ID already exists, skip Step 2
11. Redirect to dashboard
12. Data loads from Sheets

### Flow 4: User Makes Changes

**Example: Adding a Reservation**

1. User navigates to `/reservations/new/2025-11`
2. User fills form: date, nights, total
3. User clicks "Adicionar Reserva"
4. Form calls `dispatch(addReservation(reservation))`
5. Redux store updates immediately
6. User redirected to `/reservations/2025-11`
7. New reservation appears in list instantly
8. After 1 second, `useDebouncedAutoSave` triggers
9. `saveReservations()` writes all reservations to Sheets
10. Console logs: "Reservations saved to Google Sheets"
11. If user adds another reservation within 1 second, debounce timer resets

### Flow 5: Full Logout and Re-setup

1. User navigates to Settings
2. User clicks "Sair e Limpar Todos os Dados"
3. Confirmation modal appears
4. User clicks "Sim, Sair"
5. `fullLogout()` called
6. All localStorage cleared (auth, Sheet ID, persistAuth)
7. All sessionStorage cleared
8. Redux store reset via page reload
9. User redirected to onboarding
10. Shows as brand new user (Step 1 and Step 2)
11. User can sign in again (same or different Google account)
12. User can connect to same Sheet or different Sheet
13. Data in original Sheet remains untouched

### Flow 6: Multiple Devices

**Scenario:** User has app open on laptop and phone

1. **Laptop:** User adds reservation
2. **Laptop:** Auto-save writes to Sheets after 1 second
3. **Phone:** User refreshes page
4. **Phone:** `loadData()` reads from Sheets
5. **Phone:** Redux store updates
6. **Phone:** New reservation appears
7. **Phone:** User adds expense
8. **Phone:** Auto-save writes to Sheets
9. **Laptop:** User refreshes page
10. **Laptop:** Sees both reservation and expense

**Note:** No real-time sync. Users must refresh to see changes from other devices.

## Important Technical Details

### Date Serialization

**Problem:** JavaScript Date objects need to be serialized for Google Sheets.

**Solution:** Convert to ISO strings when writing, parse back to Date objects when reading.

```typescript
// Writing
date: reservation.date.toISOString()

// Reading
date: new Date(row[1])
```

### Local Date Parsing

**Problem:** `new Date(dateString)` interprets as UTC, causing timezone shifts.

**Solution:** Parse date components locally.

```typescript
// BAD (timezone bug)
const date = new Date('2025-10-01');

// GOOD (local date)
const [year, month, day] = '2025-10-01'.split('-').map(Number);
const date = new Date(year, month - 1, day);
```

### Percentage Storage

**UI:** Shows percentages (70%, 30%)
**Storage:** Stores as decimals (0.70, 0.30)

```typescript
// UI to storage
ownerSplit: parseFloat(formData.ownerSplit) / 100

// Storage to UI
ownerSplit: (settings.ownerSplit * 100).toString()
```

### Empty vs Missing Data

**Empty Sheet:** `initializeSheets()` creates structure with empty data
**Missing Tabs:** Creates any missing tabs
**Existing Data:** Preserves existing data, only adds structure

### Error Recovery

If API call fails:
1. Error logged to console
2. User not notified (silent failure)
3. Data remains in Redux store
4. Next auto-save will retry
5. If token expired, user signed out

## Internationalization (i18n)

### Overview

The application supports multiple languages with automatic browser detection and manual language selection.

**Supported Languages:**
- Portuguese (Brazil) - `pt-BR` (primary)
- English (US) - `en-US`

**Library:** react-i18next with i18next-browser-languagedetector

**Configuration Location:** `src/config/i18n.ts`

### Language Detection

**Custom Detection Logic:**
```typescript
const languageDetector = new LanguageDetector();
languageDetector.addDetector({
  name: 'customDetector',
  lookup() {
    // 1. Check localStorage for saved preference
    const stored = localStorage.getItem('i18nextLng');
    if (stored) return stored;

    // 2. Check browser language
    const browserLang = navigator.language || (navigator as any).userLanguage;
    if (browserLang?.startsWith('pt')) return 'pt-BR';
    if (browserLang?.startsWith('en')) return 'en-US';

    // 3. Fallback to English
    return 'en-US';
  }
});
```

**Detection Priority:**
1. **localStorage** (`i18nextLng`) - User's saved preference
2. **Browser Language** - Navigator language with mapping:
   - Any `pt-*` variant → `pt-BR`
   - Any `en-*` variant → `en-US`
   - All other languages → `en-US` (fallback)
3. **Default** - `en-US` if no match

**Storage:** localStorage key `i18nextLng` (persists across sessions)

### Translation Files

**Location:** `src/locales/{language}/translation.json`

**Structure:** Organized by feature namespaces
- `common` - Shared text (loading, save, cancel, etc.)
- `navigation` - Bottom nav labels
- `dashboard` - Dashboard page
- `reservations` - Reservations feature
- `expenses` - Expenses feature
- `taxes` - Tax calculations
- `settings` - Settings page
- `onboarding` - Welcome and setup flow
- `date` - Date formatting patterns

**Example Structure:**
```json
{
  "onboarding": {
    "title": "Bem-vindo ao Airbnb Organizer",
    "subtitle": "Conecte suas Planilhas Google para começar",
    "step1": "Passo 1: Entre com Google",
    "signInButton": "Entrar com Google"
  }
}
```

### Features

**Pluralization:**
Uses i18next's plural handling with `_one` and `_other` suffixes:
```json
{
  "reservation_one": "reserva",
  "reservation_other": "reservas"
}
```

Usage: `t('dashboard.reservation', { count: 5 })` → "5 reservas"

**Interpolation:**
Dynamic values using double curly braces:
```json
{
  "signedInAs": "✓ Conectado como {{email}}"
}
```

Usage: `t('onboarding.signedInAs', { email: userEmail })`

**Locale-aware Date Formatting:**
Uses `i18n.language` for date display:
```typescript
date.toLocaleDateString(i18n.language, {
  month: 'long',
  year: 'numeric'
})
```

**Real-time Switching:**
- No page reload required
- Updates all UI text immediately
- Preference saved to localStorage

### Language Selector

**Location:** Settings page (first field)

**Implementation:**
```typescript
<select
  value={i18n.language}
  onChange={(e) => i18n.changeLanguage(e.target.value)}
>
  <option value="pt-BR">Português (Brasil)</option>
  <option value="en-US">English (US)</option>
</select>
```

### Onboarding Text

All onboarding text is translated including:
- Welcome title and subtitle
- Configuration error messages
- Sign-in instructions and buttons
- Permission descriptions
- Sheet setup instructions
- Loading messages
- Form labels and placeholders

**Default Language:** Determined by browser on first visit, can be changed in Settings at any time.

## Configuration Requirements

### Environment Variables

**File:** `.env` (root directory)

**Required:**
```
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

**How to get Client ID:**
1. Go to Google Cloud Console
2. Create new project (or use existing)
3. Enable Google Sheets API
4. Create OAuth 2.0 Client ID
5. Add authorized JavaScript origins
6. Copy Client ID to `.env`

**Example File:** `.env.example`

### Google Cloud Project Setup

**Required APIs:**
- Google Sheets API
- Google OAuth 2.0

**OAuth Consent Screen:**
- Internal (for organization) or External (for anyone)
- Scopes: `https://www.googleapis.com/auth/spreadsheets`

**Authorized Origins:**
- `http://localhost:5173` (development)
- `https://yourdomain.com` (production)

## Security Considerations

1. **Client-side OAuth:** Token exposed in browser, acceptable for personal apps
2. **No backend:** All API calls from browser to Google Sheets
3. **User controls data:** Data in user's own Google account
4. **Token expiration:** Automatically logs out after 1 hour
5. **Session-only default:** More secure default (persistAuth = false)
6. **No sensitive data:** App doesn't handle passwords or payment info

## Troubleshooting

### "Configuration Required" Error
**Cause:** `.env` file missing or `VITE_GOOGLE_CLIENT_ID` not set
**Solution:** Create `.env` with valid Client ID

### "Invalid Google Sheet URL" Error
**Cause:** URL doesn't contain spreadsheet ID
**Solution:** Copy full URL from Google Sheets, including `/d/{ID}/`

### "Token Expired" Error
**Cause:** OAuth token older than 1 hour
**Solution:** Sign in again to get new token

### Data Not Syncing
**Cause:** Network error, API quota exceeded, or permissions issue
**Solution:** Check browser console for errors, verify Sheet permissions

### Changes Not Appearing on Other Device
**Cause:** No real-time sync, manual refresh required
**Solution:** Refresh page to load latest data from Sheets

## Future Enhancements

Potential improvements not currently implemented:

1. **Real-time sync:** Use Google Sheets API push notifications
2. **Offline mode:** Cache data with IndexedDB, sync when online
3. **Conflict resolution:** Handle concurrent edits from multiple devices
4. **Backup/restore:** Export/import data as JSON
5. **Multiple sheets:** Switch between different properties
6. **Sharing:** Allow multiple users to access same sheet
7. **Audit log:** Track all changes with timestamps
8. **Data validation:** Server-side validation in Google Apps Script

## Summary

The onboarding and data sync system provides:
- Simple 2-step setup (Google auth + Sheet connection)
- Automatic bidirectional sync with 1-second debounce
- Secure token management with expiration handling
- Offline-first experience (Redux) with cloud backup (Sheets)
- No backend required, all data in user's Google account
- Support for multiple devices with manual refresh
- Full logout with data preservation in cloud
