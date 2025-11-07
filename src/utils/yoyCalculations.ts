import { Reservation, Expense } from '../types';
import { formatMonth, groupReservationsByMonth, groupExpensesByMonth, calculateMonthlyTax } from './taxCalculations';

export interface YearMonthData {
  month: number; // 1-12 (January = 1)
  monthName: string; // Short month name
  profit: number;
  accumulatedProfit: number;
}

export interface YearOverYearData {
  month: number; // 1-12
  monthName: string;
  [year: string]: number | string; // Dynamic year keys like "2024", "2025", etc.
}

/**
 * Calculate accumulated profit for each month of a specific year
 */
function calculateYearProfit(
  year: number,
  reservations: Reservation[],
  expenses: Expense[],
  dependents: number
): YearMonthData[] {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Filter reservations and expenses for this year
  const yearReservations = reservations.filter(r => r.date.getFullYear() === year);
  const yearExpenses = expenses.filter(e => e.date.getFullYear() === year);

  // Group by month
  const reservationsByMonth = groupReservationsByMonth(yearReservations);
  const expensesByMonth = groupExpensesByMonth(yearExpenses);

  let accumulated = 0;
  const monthlyData: YearMonthData[] = [];

  // Calculate for each month (1-12)
  for (let month = 1; month <= 12; month++) {
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    const monthReservations = reservationsByMonth.get(monthStr) || [];
    const monthExpenses = expensesByMonth.get(monthStr) || [];

    // Calculate monthly profit
    const taxSummary = calculateMonthlyTax(monthStr, monthReservations, monthExpenses, dependents);
    const profit = taxSummary.profit;

    // Add to accumulated
    accumulated += profit;

    monthlyData.push({
      month,
      monthName: monthNames[month - 1],
      profit,
      accumulatedProfit: accumulated,
    });
  }

  return monthlyData;
}

/**
 * Get all years that have data
 */
function getAvailableYears(reservations: Reservation[], expenses: Expense[]): number[] {
  const years = new Set<number>();

  reservations.forEach(r => years.add(r.date.getFullYear()));
  expenses.forEach(e => years.add(e.date.getFullYear()));

  return Array.from(years).sort((a, b) => b - a); // Most recent first
}

/**
 * Calculate Year-over-Year accumulated profit data
 * Returns data formatted for Recharts with months on X-axis and accumulated profit for each year
 */
export function calculateYoYAccumulatedProfit(
  reservations: Reservation[],
  expenses: Expense[],
  dependents: number
): YearOverYearData[] {
  const years = getAvailableYears(reservations, expenses);

  if (years.length === 0) {
    return [];
  }

  // Calculate data for each year
  const yearData = new Map<number, YearMonthData[]>();
  years.forEach(year => {
    yearData.set(year, calculateYearProfit(year, reservations, expenses, dependents));
  });

  // Transform to Recharts format: one object per month with year columns
  const chartData: YearOverYearData[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let month = 1; month <= 12; month++) {
    const dataPoint: YearOverYearData = {
      month,
      monthName: monthNames[month - 1],
    };

    // Add accumulated profit for each year
    years.forEach(year => {
      const monthData = yearData.get(year)?.find(m => m.month === month);
      dataPoint[`year${year}`] = monthData?.accumulatedProfit || 0;
    });

    chartData.push(dataPoint);
  }

  return chartData;
}

/**
 * Get the current year and previous year (for legend labels)
 */
export function getYearLabels(reservations: Reservation[], expenses: Expense[]): {
  currentYear: number | null;
  previousYear: number | null;
} {
  const years = getAvailableYears(reservations, expenses);

  return {
    currentYear: years[0] || null,
    previousYear: years[1] || null,
  };
}
