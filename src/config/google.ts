// Google API Configuration
export const GOOGLE_CONFIG = {
  // OAuth Client ID from environment variables
  // This is set up once by the developer, not by each user
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',

  // Scopes required for the application
  SCOPES: [
    'https://www.googleapis.com/auth/spreadsheets', // Read and write access to sheets
  ].join(' '),

  // Discovery docs for Google Sheets API
  DISCOVERY_DOCS: [
    'https://sheets.googleapis.com/$discovery/rest?version=v4',
  ],
};

// Sheet column configurations
export const SHEET_CONFIGS = {
  settings: {
    name: 'settings',
    columns: ['key', 'value'],
    defaultData: [
      ['dependents', '0'],
      ['owner_split', '0.70'],
      ['admin_split', '0.30'],
    ],
  },
  airbnb: {
    name: 'airbnb',
    columns: ['date', 'nights', 'total', 'income', 'admin_fee'],
  },
  airbnb_expenses: {
    name: 'airbnb_expenses',
    columns: ['date', 'total', 'category', 'notes'],
  },
  taxes: {
    name: 'taxes',
    columns: ['date', 'income', 'deductions', 'tax_rate', 'tax_owed', 'profit', 'is_paid'],
  },
};
