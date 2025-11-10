# Settings Feature Documentation

## Overview
The settings page allows users to configure their Google Sheets connection, security preferences, tax calculation parameters, and income split percentages. All settings are persisted either to localStorage or Google Sheets depending on their purpose.

## Data Model

### AppSettings Interface
**Location:** `src/types/index.ts:41-45`

```typescript
export interface AppSettings {
  dependents: number;      // Number of dependents for tax calculation
  ownerSplit: number;      // Owner's percentage (0.0-1.0, default: 0.70)
  adminSplit: number;      // Admin's percentage (0.0-1.0, default: 0.30)
}
```

**Note:** These settings are synced to Google Sheets via the data sync mechanism.

### Google Sheet ID
Stored in localStorage at key `sheetId`. This is the only app data stored locally (not synced to Google Sheets) as it's needed to establish the connection.

### Security Preferences
**persistAuth** - Boolean flag stored in localStorage at key `persistAuth`:
- `true`: Authentication stored in localStorage (persists after closing browser)
- `false`: Authentication stored in sessionStorage (cleared when browser closes) - **DEFAULT**

## Component

### Settings Component
**Location:** `src/features/settings/Settings.tsx`

**Purpose:** Configure all application settings and security preferences.

**Route:** `/settings`

## Settings Sections

### 1. Language Preferences

**Field:** Idioma (Language)

**Purpose:** Controls the application's display language.

**Storage:** localStorage key `i18nextLng`

**Available Languages:**
- Português (Brasil) - `pt-BR`
- English (US) - `en-US`

**Implementation:**
```typescript
<select
  id="language"
  value={i18n.language}
  onChange={(e) => handleLanguageChange(e.target.value)}
>
  <option value="pt-BR">{t('settings.languagePtBR')}</option>
  <option value="en-US">{t('settings.languageEnUS')}</option>
</select>
```

**Browser Language Detection:**
- On first visit, automatically detects browser language
- Portuguese variants (pt-BR, pt-PT, etc.) → pt-BR
- English variants (en-US, en-GB, etc.) → en-US
- All other languages → en-US (fallback)
- User selection overrides auto-detection
- Preference persists across sessions

**Internationalization (i18n):**
- All UI text is translatable
- Uses react-i18next library
- Translations stored in `src/locales/{language}/translation.json`
- Includes pluralization support (e.g., "1 reserva" vs "2 reservas")
- Locale-aware date formatting based on selected language
- Real-time language switching (no page reload required)

**Note:** This setting is stored separately from AppSettings and does not sync to Google Sheets.

### 2. Google Sheet Connection

**Field:** ID da Planilha Google (Google Sheet ID)

**Purpose:** Identifies which Google Sheet to use for data storage.

**Storage:** localStorage key `sheetId`

**Implementation (lines 62-77):**
```typescript
<input
  type="text"
  id="sheetId"
  value={formData.sheetId}
  onChange={(e) => setFormData({ ...formData, sheetId: e.target.value })}
  className="..."
  placeholder="Digite o ID da sua Planilha Google..."
/>
<p className="mt-1 text-xs text-gray-500">
  Armazenado localmente apenas para fins de conexão
</p>
```

**How to get Sheet ID:**
1. Open Google Sheet in browser
2. Look at URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
3. Copy the `{SHEET_ID}` part
4. Paste in this field

**Note:** Stored locally only, NOT synced to Google Sheets (would be circular dependency).

### 3. Security Settings

#### Manter Conectado (Keep Me Signed In)

**Purpose:** Controls whether authentication persists after closing browser.

**Default:** OFF (false) - More secure

**Storage:** localStorage key `persistAuth`

**Toggle Switch (lines 96-111):**
```typescript
<button
  type="button"
  onClick={() => setPersistAuth(!persistAuth)}
  className={`... ${persistAuth ? 'bg-blue-600' : 'bg-gray-200'}`}
  role="switch"
  aria-checked={persistAuth}
>
  {/* Toggle indicator */}
</button>
```

**Behavior:**
- **OFF (Default):**
  - Auth data stored in sessionStorage
  - User logged out when browser closes
  - More secure for shared computers
  - Recommended for security

- **ON:**
  - Auth data stored in localStorage
  - User stays logged in after closing browser
  - Convenient but less secure
  - Not recommended for shared computers

**Security Note (lines 113-119):**
Blue box warning users:
> Para melhor segurança, desative "Manter conectado" em computadores compartilhados.
> Isso armazena seu token de acesso apenas no armazenamento de sessão, que é limpo quando você fecha o navegador.

**Implementation Details:**
When toggled, `setPersistAuth()` migrates data between storages:
- OFF→ON: Moves auth data from sessionStorage to localStorage
- ON→OFF: Moves auth data from localStorage to sessionStorage

**Location:** `src/contexts/GoogleAuthContext.tsx:108-142`

### 4. Tax Settings

#### Número de Dependentes (Number of Dependents)

**Purpose:** Used to calculate tax deductions in Brazilian Carnê Leão system.

**Type:** Number (integer, min: 0)

**Default:** Configured during onboarding

**Storage:** Google Sheets "Settings" tab

**Implementation (lines 128-144):**
```typescript
<input
  type="number"
  id="dependents"
  min="0"
  value={formData.dependents}
  onChange={(e) => setFormData({ ...formData, dependents: e.target.value })}
  required
/>
<p className="mt-1 text-xs text-gray-500">
  Usado para cálculo de dedução de impostos
</p>
```

**How it affects taxes:**
Each dependent increases the tax deduction amount. See `BrazilianRentalTaxCalculator.ts` for calculation details.

### 5. Income Split Settings

#### Porcentagem do Proprietário (Owner Percentage)

**Purpose:** Owner's share of rental income.

**Type:** Number (0-100%, with 2 decimal precision)

**Default:** 70%

**Storage:** Google Sheets "Settings" tab

**Implementation (lines 152-174):**
```typescript
<input
  type="number"
  id="ownerSplit"
  min="0"
  max="100"
  step="0.01"
  value={formData.ownerSplit}
  onChange={(e) => {
    const ownerValue = parseFloat(e.target.value);
    setFormData({
      ...formData,
      ownerSplit: e.target.value,
      adminSplit: (100 - ownerValue).toFixed(2), // Auto-calculate admin split
    });
  }}
/>
```

#### Porcentagem do Administrador (Admin Percentage)

**Purpose:** Administrator's share of rental income.

**Type:** Number (0-100%, with 2 decimal precision)

**Default:** 30%

**Storage:** Google Sheets "Settings" tab

**Implementation (lines 177-199):**
```typescript
<input
  type="number"
  id="adminSplit"
  min="0"
  max="100"
  step="0.01"
  value={formData.adminSplit}
  onChange={(e) => {
    const adminValue = parseFloat(e.target.value);
    setFormData({
      ...formData,
      adminSplit: e.target.value,
      ownerSplit: (100 - adminValue).toFixed(2), // Auto-calculate owner split
    });
  }}
/>
```

**Validation (lines 202-208):**
Yellow warning box appears if percentages don't sum to 100%:
```typescript
{parseFloat(formData.ownerSplit) + parseFloat(formData.adminSplit) !== 100 && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
    <p className="text-sm text-yellow-800">
      ⚠ As porcentagens do Proprietário e Administrador devem somar 100%
    </p>
  </div>
)}
```

Submit button is disabled until validation passes.

**How it works:**
- Changing one percentage automatically updates the other
- Example: Setting owner to 75% automatically sets admin to 25%
- Must always sum to exactly 100%
- Used when creating/editing reservations to calculate splits

### 6. Logout Section

#### Sair e Limpar Todos os Dados (Logout and Clear All Data)

**Purpose:** Complete logout with full data cleanup.

**Type:** Destructive action with confirmation

**Implementation (lines 222-233):**
```typescript
<button
  type="button"
  onClick={() => setShowLogoutConfirm(true)}
  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
>
  Sair e Limpar Todos os Dados
</button>
<p className="mt-2 text-xs text-center text-gray-500">
  Isso removerá todos os dados armazenados localmente e fará logout da sua conta
</p>
```

**Confirmation Modal (lines 236-268):**
Warns user that this action will:
- Fazer logout da sua conta Google
- Remover o ID da planilha armazenado
- Limpar todas as configurações locais
- Limpar todos os dados em memória

**Reassurance:**
"Seus dados na Planilha Google permanecerão intactos."

**fullLogout() Implementation:**
**Location:** `src/contexts/GoogleAuthContext.tsx:238-262`

```typescript
const fullLogout = () => {
  // Clear all auth state
  setIsSignedIn(false);
  setUserEmail(null);
  setAccessToken(null);
  setTokenExpiresAt(null);
  setError(null);

  // Clear localStorage
  localStorage.removeItem('googleAuth_isSignedIn');
  localStorage.removeItem('googleAuth_userEmail');
  localStorage.removeItem('googleAuth_accessToken');
  localStorage.removeItem('googleAuth_expiresAt');
  localStorage.removeItem('sheetId');
  localStorage.removeItem('persistAuth');

  // Clear sessionStorage
  sessionStorage.removeItem('googleAuth_isSignedIn');
  sessionStorage.removeItem('googleAuth_userEmail');
  sessionStorage.removeItem('googleAuth_accessToken');
  sessionStorage.removeItem('googleAuth_expiresAt');

  // Reload page to reset Redux store and return to onboarding
  window.location.href = '/';
};
```

**What's cleared:**
- All authentication tokens and user info
- Google Sheet ID
- persistAuth preference
- All Redux state (via page reload)

**What's preserved:**
- All data in Google Sheets (untouched)
- User can re-authenticate and reconnect to same sheet

## Save Behavior

**Submit Handler (lines 24-42):**
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  // Update Google Sheet ID (localStorage)
  if (formData.sheetId !== currentSheetId) {
    dispatch(setSheetId(formData.sheetId));
  }

  // Update settings (will sync to Google Sheets)
  dispatch(updateSettings({
    dependents: parseInt(formData.dependents),
    ownerSplit: parseFloat(formData.ownerSplit) / 100,  // Convert % to decimal
    adminSplit: parseFloat(formData.adminSplit) / 100,  // Convert % to decimal
  }));

  // Show saved feedback
  setIsSaved(true);
  setTimeout(() => setIsSaved(false), 2000);
};
```

**Save Button (lines 212-218):**
```typescript
<button
  type="submit"
  disabled={parseFloat(formData.ownerSplit) + parseFloat(formData.adminSplit) !== 100}
  className="..."
>
  {isSaved ? '✓ Salvo!' : 'Salvar Configurações'}
</button>
```

Shows checkmark for 2 seconds after successful save.

## State Management

### Redux Slice
**Location:** `src/store/settingsSlice.ts`

**State:**
```typescript
interface SettingsState {
  settings: AppSettings;
  sheetId: string | null;
}
```

**Actions:**
- `updateSettings(AppSettings)` - Update tax and split settings (synced to Sheets)
- `setSheetId(string)` - Update Google Sheet ID (localStorage only)

## Data Persistence

**Settings Object:** Synced to Google Sheets "Settings" tab
- dependents
- ownerSplit
- adminSplit

**Local Storage Only:**
- sheetId (needed to connect to Sheets)
- persistAuth (security preference)
- Auth tokens (if persistAuth is ON)

**Session Storage:**
- Auth tokens (if persistAuth is OFF)

## Security Considerations

### PersistAuth Default

**Changed:** 2025-11-09

**Previous:** Default to true (persist by default)

**Current:** Default to false (session-only by default)

**Implementation:**
```typescript
function shouldPersistAuth(): boolean {
  return localStorage.getItem('persistAuth') === 'true'; // Default to false
}
```

**Rationale:**
- More secure default behavior
- Protects users on shared computers
- Users must explicitly opt-in to persistence
- Follows principle of least privilege

### Token Storage

When **persistAuth is OFF:**
- Access token stored in sessionStorage
- Cleared when browser/tab closes
- More secure for shared environments
- Recommended default

When **persistAuth is ON:**
- Access token stored in localStorage
- Persists after browser closes
- Convenient but less secure
- User must explicitly enable

### Token Expiration

**Location:** `src/contexts/GoogleAuthContext.tsx:86-105`

On app initialization:
1. Checks if token exists and is expired
2. If expired, shows "Session Expired" notification
3. Clears all auth data
4. Requires user to re-authenticate

**Token Lifetime:**
Google OAuth tokens typically expire after 1 hour (3600 seconds).

## User Flows

### Flow 1: Initial Setup (First Time)

1. User completes onboarding and Google authentication
2. User configures settings during setup wizard
3. Settings saved to Google Sheets "Settings" tab
4. User can access Settings page later to modify

### Flow 2: Changing Income Split

1. User navigates to Settings
2. User sees current split: Owner 70%, Admin 30%
3. User changes Owner to 65%
4. Admin automatically updates to 35%
5. User clicks "Salvar Configurações"
6. Button shows "✓ Salvo!" for 2 seconds
7. New split percentages synced to Google Sheets
8. Future reservations use new split percentages

### Flow 3: Toggling Persist Auth

**Scenario A: Turning OFF (more secure)**
1. User is on shared computer
2. User sees "Manter conectado" is ON
3. User clicks toggle switch
4. Toggle turns gray (OFF)
5. Auth data immediately migrated from localStorage to sessionStorage
6. User will be logged out when browser closes

**Scenario B: Turning ON (convenience)**
1. User is on personal computer
2. User sees "Manter conectado" is OFF
3. User clicks toggle switch
4. Toggle turns blue (ON)
5. Auth data immediately migrated from sessionStorage to localStorage
6. User will stay logged in after closing browser

### Flow 4: Full Logout

1. User clicks red "Sair e Limpar Todos os Dados" button
2. Confirmation modal appears
3. Modal explains what will be cleared
4. User clicks "Sim, Sair"
5. All localStorage and sessionStorage cleared
6. Redux store reset via page reload
7. User redirected to onboarding page
8. User can re-authenticate with same Google account
9. User can reconnect to same Google Sheet
10. All data in Google Sheets is intact

### Flow 5: Updating Sheet ID

**Use Case:** User wants to switch to a different Google Sheet

1. User navigates to Settings
2. User sees current Sheet ID
3. User copies new Sheet ID from different Google Sheet URL
4. User pastes new ID in field
5. User clicks "Salvar Configurações"
6. New Sheet ID saved to localStorage
7. App immediately starts syncing with new Sheet
8. Previous Sheet's data is no longer accessed
9. New Sheet must have proper structure (see `onboarding.md`)

## Integration with Other Features

### Reservations
- Uses `ownerSplit` and `adminSplit` to calculate reservation amounts
- See `reservations.md` for details

### Taxes
- Uses `dependents` for tax deduction calculation
- See `taxes.md` for details

### Data Sync
- Settings synced via `useDataSync` hook
- See `onboarding.md` for data sync details

## UI Components

### Form Layout
- Header with back button and title
- Five bordered sections with headings
- Form fields with labels and helper text
- Validation warnings when applicable
- Blue submit button
- Red logout button below form

### Visual Hierarchy
1. **Language:** Language selector (first field for easy access)
2. **Connection:** Google Sheet ID (most critical)
3. **Security:** persistAuth toggle with warning
4. **Taxes:** Dependents field
5. **Splits:** Owner and Admin percentages with validation
6. **Logout:** Destructive action separated by border

### Accessibility
- All form fields properly labeled
- Toggle switch has role="switch" and aria-checked
- Validation messages clearly visible
- Color coding: blue for primary actions, red for destructive
- Keyboard navigation support

## Important Notes

- **Language:** Supports pt-BR and en-US with auto-detection and manual switching
- **Validation:** Split percentages must sum to exactly 100%
- **Auto-calculation:** Changing one split automatically updates the other
- **Percentage vs Decimal:** UI shows percentages (70%), stored as decimals (0.70)
- **Security Default:** persistAuth defaults to false (more secure)
- **Logout Preserves Data:** fullLogout only clears local data, Google Sheets untouched
- **Sheet ID Format:** Long alphanumeric string from Google Sheets URL
- **Dependents:** Integer value, minimum 0
- **Save Feedback:** Checkmark appears for 2 seconds after save
- **No Auto-save:** User must explicitly click save button
- **Internationalization:** All UI text is translatable with real-time switching
- **Pluralization:** Language-specific plural forms (e.g., "1 despesa" vs "2 despesas")
- **Date Formatting:** Locale-aware date display based on selected language
