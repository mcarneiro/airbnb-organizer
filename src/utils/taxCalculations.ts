import { Reservation, Expense, MonthlyTaxSummary } from '../types';
import { BrazilianRentalTaxCalculator } from '../services/BrazilianRentalTaxCalculator';
import { formatCurrency } from './currency';

/**
 * Format date to YYYY-MM string
 */
export function formatMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Parse YYYY-MM string to Date
 */
export function parseMonth(monthStr: string): Date {
  const [year, month] = monthStr.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

/**
 * Get month name in Portuguese
 */
export function getMonthName(monthStr: string): string {
  const date = parseMonth(monthStr);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

/**
 * Group reservations by month
 */
export function groupReservationsByMonth(reservations: Reservation[]): Map<string, Reservation[]> {
  const grouped = new Map<string, Reservation[]>();

  reservations.forEach((reservation) => {
    const month = formatMonth(reservation.date);
    if (!grouped.has(month)) {
      grouped.set(month, []);
    }
    grouped.get(month)!.push(reservation);
  });

  return grouped;
}

/**
 * Group expenses by month
 */
export function groupExpensesByMonth(expenses: Expense[]): Map<string, Expense[]> {
  const grouped = new Map<string, Expense[]>();

  expenses.forEach((expense) => {
    const month = formatMonth(expense.date);
    if (!grouped.has(month)) {
      grouped.set(month, []);
    }
    grouped.get(month)!.push(expense);
  });

  return grouped;
}

/**
 * Calculate monthly tax summary
 */
export function calculateMonthlyTax(
  month: string,
  reservations: Reservation[],
  expenses: Expense[],
  dependents: number,
  isPaid: boolean = false
): MonthlyTaxSummary {
  const calculator = new BrazilianRentalTaxCalculator();

  // Sum total income for the month (owner's portion)
  const totalIncome = reservations.reduce((sum, r) => sum + r.ownerAmount, 0);

  // Sum total expenses for the month
  const totalDeductions = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Calculate liquid income
  const liquidIncome = totalIncome - totalDeductions;

  // Calculate tax using the Brazilian tax calculator
  const taxCalculation = calculator.calculateTax(liquidIncome, dependents);

  // Calculate final profit
  const profit = liquidIncome - taxCalculation.taxOwed;

  return {
    month,
    totalIncome,
    totalDeductions,
    liquidIncome,
    deduction: taxCalculation.deduction,
    taxableIncome: taxCalculation.taxableIncome,
    taxRate: taxCalculation.taxRate,
    taxOwed: taxCalculation.taxOwed,
    profit,
    isPaid,
  };
}

/**
 * Get all months with reservations or expenses
 */
export function getAllMonths(reservations: Reservation[], expenses: Expense[]): string[] {
  const months = new Set<string>();

  reservations.forEach((r) => months.add(formatMonth(r.date)));
  expenses.forEach((e) => months.add(formatMonth(e.date)));

  return Array.from(months).sort().reverse(); // Most recent first
}

/**
 * Format reservation details for IRS filing
 */
export function formatReservationsForIRS(reservations: Reservation[]): string {
  return reservations
    .map((r) => {
      const day = String(r.date.getDate()).padStart(2, '0');
      const month = String(r.date.getMonth() + 1).padStart(2, '0');
      const amount = formatCurrency(r.ownerAmount);
      return `${day}/${month} - ${r.nights} diárias = R$ ${amount}`;
    })
    .join('\n');
}

/**
 * Get the most recent unpaid month for tax notification
 * Logic: Start from previous month, go back in time until finding an unpaid month
 * Only check months that have data (reservations or expenses)
 */
export function getMostRecentUnpaidMonth(
  availableMonths: string[], // Sorted most recent first
  paidMonths: string[]
): string | null {
  const now = new Date();
  const currentMonth = formatMonth(now);

  // Create a set for faster lookup
  const paidSet = new Set(paidMonths);

  // Filter out current month and future months, then find first unpaid
  const pastMonths = availableMonths.filter(month => month < currentMonth);

  // Find the first (most recent) unpaid month
  return pastMonths.find(month => !paidSet.has(month)) || null;
}
