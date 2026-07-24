import { Reservation, Expense, MonthlyTaxSummary } from '../types';
import { BrazilianRentalTaxCalculator } from '../services/BrazilianRentalTaxCalculator';
import { formatCurrency } from './currency';

/**
 * Parse date string or Date object consistently
 */
export function parseDate(date: Date | string): Date {
  if (date instanceof Date) return date;
  const [year, month, day] = date.split('-').map(Number);
  // Use local date to match what user sees in the input[type="date"]
  return new Date(year, month - 1, day);
}

/**
 * Format date to YYYY-MM string
 */
export function formatMonth(date: Date | string): string {
  const d = parseDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Parse YYYY-MM string to Date
 */
export function parseMonth(monthStr: string): Date {
  const [year, month] = monthStr.split('-').map(Number);
  // Use UTC to avoid timezone issues when parsing month strings
  return new Date(Date.UTC(year, month - 1, 1, 12, 0, 0));
}

/**
 * Get month name localized
 */
export function getMonthName(monthStr: string, locale: string = 'pt-BR'): string {
  const date = parseMonth(monthStr);
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
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
  // Extract year from YYYY-MM
  const year = parseInt(month.split('-')[0]);
  const calculator = new BrazilianRentalTaxCalculator(year);

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
      const d = typeof r.date === 'string' ? new Date(r.date) : r.date;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const amount = formatCurrency(r.ownerAmount);
      return `${day}/${month} - ${r.nights} diárias = R$ ${amount}`;
    })
    .join('\n');
}

/**
 * Check if a reservation is paid (checkout date strictly before the given date).
 * Defaults to today at midnight if no date is provided.
 */
export function isReservationPaid(reservation: Reservation, asOf: Date = new Date()): boolean {
  const asOfDate = parseDate(asOf);
  asOfDate.setHours(0, 0, 0, 0);

  const checkoutDate = parseDate(reservation.date);
  checkoutDate.setDate(checkoutDate.getDate() + reservation.nights);

  return checkoutDate < asOfDate;
}

/**
 * Get the most recent unpaid month for tax notification
 * Logic: Start from previous month, go back in time until finding an unpaid month with tax owed > 0
 * Only check months that have data (reservations or expenses)
 */
export function getMostRecentUnpaidMonth(
  availableMonths: string[], // Sorted most recent first
  paidMonths: string[],
  reservations: Reservation[],
  expenses: Expense[],
  dependents: number
): string | null {
  const now = new Date();
  const currentMonth = formatMonth(now);

  // Create a set for faster lookup
  const paidSet = new Set(paidMonths);

  // Filter out current month and future months, then find first unpaid with tax owed > 0
  const pastMonths = availableMonths.filter(month => month < currentMonth);

  // Group reservations and expenses by month
  const reservationsByMonth = groupReservationsByMonth(reservations);
  const expensesByMonth = groupExpensesByMonth(expenses);

  // Find the first (most recent) unpaid month that has tax owed > 0
  return pastMonths.find(month => {
    if (paidSet.has(month)) {
      return false; // Already paid
    }

    // Calculate tax for this month
    const monthReservations = reservationsByMonth.get(month) || [];
    const monthExpenses = expensesByMonth.get(month) || [];
    const taxSummary = calculateMonthlyTax(month, monthReservations, monthExpenses, dependents, false);

    // Only show notification if tax owed > 0
    return taxSummary.taxOwed > 0;
  }) || null;
}
