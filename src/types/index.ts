// Data Models

export interface Reservation {
  id: string;
  date: Date;           // First date of reservation
  nights: number;       // Number of nights
  total: number;        // Total amount Airbnb will pay
  ownerAmount: number;  // Amount owner receives (70%)
  adminFee: number;     // Administrator's share (30%)
}

export type ExpenseCategory =
  | 'IPTU'
  | 'Condomínio'
  | 'Luz'
  | 'Internet'
  | 'Gas'
  | 'Manutenção';

export interface Expense {
  id: string;
  date: Date;           // Expense date
  amount: number;       // Amount spent
  category?: ExpenseCategory; // Optional expense category
  notes?: string;       // Optional description
}

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

export interface AppSettings {
  dependents: number;      // Number of dependents for tax calculation
  ownerSplit: number;      // Default: 0.70
  adminSplit: number;      // Default: 0.30
}

// Stored only in localStorage for connection purposes
export interface LocalConfig {
  sheetId: string;         // Google Sheet ID
}

// Tax Calculator Interface
export interface TaxCalculator {
  calculateTax(
    liquidIncome: number,
    dependents: number
  ): {
    deduction: number;
    taxableIncome: number;
    taxRate: number;
    taxOwed: number;
  };
}

// Brazilian Tax Brackets
export interface TaxBracket {
  maxIncome: number;
  rate: number;
  deduction: number;
}
