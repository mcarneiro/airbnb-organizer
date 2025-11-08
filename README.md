# Airbnb Organizer

A modern web application to manage Airbnb rental properties, track reservations, expenses, and calculate Brazilian rental income taxes. All data is stored in your own Google Sheet for full control and easy access.

> This is a vibe coding experiment!

## Features

- **Dashboard**: Overview of current and upcoming months with income, occupation, and nights
- **Reservations Management**: Add and track Airbnb reservations with automatic split calculations
- **Expense Tracking**: Categorize expenses (IPTU, Condominium, Utilities, etc.)
- **Tax Calculator**: Brazilian progressive tax calculation (2025 rules) with IRS filing support
- **Google Sheets Integration**: All data automatically syncs to your Google Sheet
- **Mobile-First Design**: Responsive interface optimized for mobile devices
- **Auto-Save**: Changes sync to Google Sheets automatically (1-second debounce)

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Google Sheets API v4** for data persistence
- **Google OAuth 2.0** for authentication

## Prerequisites

- Node.js 18+ and npm
- Google Cloud Console account
- A Google Sheets document

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd airbnb-organizer
npm install
```

### 2. Configure Google OAuth (One-Time Developer Setup)

As a developer, you need to set up Google OAuth once. Users will then just sign in with Google.

#### Step 2.1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Sheets API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

#### Step 2.2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in required fields (app name, support email, etc.)
   - Add your email as a test user
   - Add scope: `https://www.googleapis.com/auth/spreadsheets`
4. For Application type, select "Web application"
5. Add authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - Your production domain (if deploying)
6. Click "Create"
7. Copy the **Client ID** (format: `xxx-xxx.apps.googleusercontent.com`)

#### Step 2.3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your Client ID:

```
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## User Onboarding

When users first access the application, they'll be guided through a simple 2-step onboarding:

1. **Sign in with Google**: Click the "Sign in with Google" button and authorize the app to access Google Sheets
2. **Connect Google Sheet**: Paste the URL of a Google Sheet (can be empty or existing)

The app will automatically:
- Create required sheets (`settings`, `airbnb`, `airbnb_expenses`, `taxes`) if they don't exist
- Add proper column headers
- Initialize default settings

Users don't need to:
- Go to Google Cloud Console
- Create OAuth credentials
- Configure any technical settings

## Architecture

### Folder Structure

```
src/
├── components/         # Reusable UI components
│   └── Layout.tsx     # Bottom navigation layout
├── config/            # Configuration files
│   └── google.ts      # Google API config
├── contexts/          # React contexts
│   └── GoogleAuthContext.tsx
├── features/          # Feature-based modules
│   ├── dashboard/     # Dashboard page
│   ├── expenses/      # Expense management
│   ├── onboarding/    # First-time setup
│   ├── reservations/  # Reservation management
│   ├── settings/      # App settings
│   └── taxes/         # Tax calculations
├── hooks/             # Custom React hooks
│   └── useDataSync.ts # Auto-sync with Google Sheets
├── services/          # External services
│   ├── BrazilianRentalTaxCalculator.ts
│   └── GoogleSheetsService.ts
├── store/             # Redux store
│   ├── expensesSlice.ts
│   ├── reservationsSlice.ts
│   ├── settingsSlice.ts
│   └── store.ts
├── types/             # TypeScript types
│   └── index.ts
└── utils/             # Utility functions
    ├── currency.ts    # Currency formatting
    └── taxCalculations.ts
```

### Data Flow

1. **Local State**: Redux stores current application state
2. **Auto-Sync**: `useDataSync` hook monitors Redux changes
3. **Debouncing**: Changes are debounced (1 second) before saving
4. **Google Sheets**: Data persists to user's Google Sheet
5. **On Load**: Data loads from Google Sheets on app mount

### Google Sheets Structure

The app creates and manages the following sheets:

#### `settings` Sheet
| key | value |
|-----|-------|
| dependents | 0 |
| owner_split | 0.70 |
| admin_split | 0.30 |

#### `airbnb` Sheet (Reservations)
| date | nights | total | income | admin_fee |
|------|--------|-------|--------|-----------|
| 2025-01-15 | 3 | 1500.00 | 1050.00 | 450.00 |

#### `airbnb_expenses` Sheet
| date | total | category | notes |
|------|-------|----------|-------|
| 2025-01-10 | 350.00 | IPTU | Tax payment |

#### `taxes` Sheet
| date | income | deductions | tax_rate | tax_owed | profit | is_paid |
|------|--------|------------|----------|----------|--------|---------|
| 2025-01 | 5000.00 | 1200.00 | 0.075 | 285.00 | 3515.00 | false |

## Tax Calculation

The app uses Brazilian progressive tax brackets for 2025:

| Income Range | Tax Rate | Deduction |
|--------------|----------|-----------|
| Up to R$ 2,428.81 | 7.5% | R$ 182.16 |
| R$ 2,428.82 - R$ 2,826.66 | 15% | R$ 394.16 |
| R$ 2,826.67 - R$ 3,751.05 | 22.5% | R$ 675.49 |
| R$ 3,751.06 - R$ 4,664.68 | 27.5% | R$ 908.73 |

### Tax Calculation Formula

1. Monthly gross income (from reservations)
2. Subtract deductible expenses
3. Apply dependent deduction (R$ 182.16 per dependent)
4. Determine tax bracket and rate
5. Calculate: (Taxable Income × Rate) - Bracket Deduction
6. Net profit = Income - Expenses - Tax

### IRS Filing Support

The tax page includes copy buttons to prepare IRS filing:
- **Deductions**: Copy all expense breakdowns
- **Reservations**: Copy all reservation details

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npx tsc --noEmit

# Lint (if configured)
npm run lint
```

## Security

### Overview

This application implements multiple security layers to protect user data and prevent common web vulnerabilities.

### Implemented Security Measures

#### 1. **Content Security Policy (CSP)**
The app includes a strict CSP header that prevents XSS attacks by:
- Allowing scripts only from trusted sources (self and Google APIs)
- Preventing inline script execution
- Restricting connections to approved domains
- Blocking unauthorized frame embedding

The CSP is configured in `index.html` and allows:
- Scripts: Self-hosted and Google authentication services
- Connections: Google Sheets API, OAuth services
- Styles: Self-hosted with inline styles for Tailwind CSS

#### 2. **XSS Protection**
- All user inputs are rendered through React's safe JSX syntax (auto-escaped)
- No use of `dangerouslySetInnerHTML` in the codebase
- Input validation on all forms (dates, numbers, text)
- Type safety enforced via TypeScript

#### 3. **Authentication Token Storage**
The app provides two storage options for authentication tokens:

**Option A: Persistent Auth (Default)**
- Tokens stored in `localStorage`
- User stays signed in after closing browser
- Convenient for personal devices

**Option B: Session-Only Auth (More Secure)**
- Tokens stored in `sessionStorage`
- User logged out when browser closes
- Recommended for shared computers
- Toggle available in Settings → Security Settings

⚠️ **Important**: While `localStorage` is convenient, it's vulnerable to XSS attacks. We mitigate this with CSP and secure coding practices, but consider using session-only auth on shared devices.

#### 4. **Token Expiration**
- Google access tokens automatically expire after ~1 hour
- Users must re-authenticate after expiration
- Limits exposure window if token is compromised

#### 5. **HTTPS Deployment**
**Critical**: Always deploy to HTTPS in production. HTTP is insecure and exposes tokens to interception.

##### Deployment Options:

**Free HTTPS Hosting:**
1. **Vercel** (Recommended)
   ```bash
   npm install -g vercel
   vercel --prod
   ```
   - Automatic HTTPS
   - Free tier available
   - Custom domains supported

2. **Netlify**
   ```bash
   npm run build
   # Drag dist/ folder to netlify.com
   ```
   - Automatic HTTPS
   - Free tier available

3. **GitHub Pages** (Static hosting)
   - Enable HTTPS in repository settings
   - Configure custom domain with SSL

4. **Cloudflare Pages**
   - Free HTTPS and CDN
   - Connect to GitHub repository

**After Deployment:**
1. Update Google Cloud Console OAuth settings
2. Add your production domain to "Authorized JavaScript origins"
   - Example: `https://your-domain.com`
3. Test authentication flow on production URL

#### 6. **Data Privacy**
- All data stored in user's own Google Sheet
- No third-party data storage
- No analytics or tracking scripts
- App only requests Google Sheets API access (no other services)

### Security Best Practices

#### For Developers
- ✅ Never commit `.env` file to version control
- ✅ Keep dependencies updated (check regularly for security patches)
- ✅ Always deploy with HTTPS enabled
- ✅ Review Google Cloud Console security settings periodically
- ✅ Use OAuth consent screen with minimal required scopes

#### For Users
- ✅ Only sign in on trusted devices
- ✅ Use "Session-only auth" on shared computers (Settings → Security)
- ✅ Keep browser updated for latest security patches
- ✅ Review Google account "Apps with access" periodically
- ✅ Revoke access from [Google Account Security](https://myaccount.google.com/permissions) if needed
- ✅ Use strong Google account password with 2FA enabled

### Security Audit Checklist

Before deploying to production:
- [ ] HTTPS enabled and verified
- [ ] Google OAuth configured with production domain
- [ ] CSP header properly set (check browser console for violations)
- [ ] No console errors on production build
- [ ] Test authentication flow works correctly
- [ ] Verify data syncs to Google Sheets
- [ ] Test on multiple browsers and devices
- [ ] Review Google Cloud Console security settings

### Reporting Security Issues

If you discover a security vulnerability, please:
1. **Do not** open a public GitHub issue
2. Email security concerns directly to the maintainer
3. Provide detailed information about the vulnerability
4. Allow reasonable time for patch before public disclosure

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Android)

## License

[Your License Here]

## Support

For issues or questions, please open an issue on GitHub.
