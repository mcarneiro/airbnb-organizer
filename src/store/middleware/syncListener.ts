import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import { addReservation, updateReservation, deleteReservation } from '../reservationsSlice';
import { addExpense, updateExpense, deleteExpense } from '../expensesSlice';
import { setSettings } from '../settingsSlice';
import { setPaidMonths, setNotes } from '../taxesSlice';
import { googleSheetsService } from '../../services/GoogleSheetsService';
import { RootState } from '../index';
import { getAllMonths, groupReservationsByMonth, groupExpensesByMonth, calculateMonthlyTax } from '../../utils/taxCalculations';

export const syncListenerMiddleware = createListenerMiddleware();

// Helper to save all data types
const startAppListening = syncListenerMiddleware.startListening.withTypes<RootState>();

// Reservations Sync
startAppListening({
  matcher: isAnyOf(addReservation, updateReservation, deleteReservation),
  effect: async (action, listenerApi) => {
    await listenerApi.delay(1000); // 1s debounce
    listenerApi.cancelActiveListeners(); // Cancel any pending saves

    const state = listenerApi.getState();
    const { items } = state.reservations;
    const { sheetId } = state.settings;

    if (sheetId) {
      try {
        await googleSheetsService.writeReservations(sheetId, items);
        console.log('Reservations synced to Google Sheets');
      } catch (error) {
        console.error('Failed to sync reservations:', error);
      }
    }
  },
});

// Expenses Sync
startAppListening({
  matcher: isAnyOf(addExpense, updateExpense, deleteExpense),
  effect: async (action, listenerApi) => {
    await listenerApi.delay(1000);
    listenerApi.cancelActiveListeners();

    const state = listenerApi.getState();
    const { items } = state.expenses;
    const { sheetId } = state.settings;

    if (sheetId) {
      try {
        await googleSheetsService.writeExpenses(sheetId, items);
        console.log('Expenses synced to Google Sheets');
      } catch (error) {
        console.error('Failed to sync expenses:', error);
      }
    }
  },
});

// Settings Sync
startAppListening({
  actionCreator: setSettings,
  effect: async (action, listenerApi) => {
    await listenerApi.delay(1000);
    listenerApi.cancelActiveListeners();

    const state = listenerApi.getState();
    const { settings, sheetId } = state.settings;

    if (sheetId) {
      try {
        await googleSheetsService.writeSettings(sheetId, settings);
        console.log('Settings synced to Google Sheets');
      } catch (error) {
        console.error('Failed to sync settings:', error);
      }
    }
  },
});

// Tax Data Sync (Paid Months & Notes)
startAppListening({
  matcher: isAnyOf(setPaidMonths, setNotes),
  effect: async (action, listenerApi) => {
    await listenerApi.delay(1000);
    listenerApi.cancelActiveListeners();

    const state = listenerApi.getState();
    const { sheetId } = state.settings;
    const { paidMonths, notes: taxNotes } = state.taxes;
    const { items: reservations } = state.reservations;
    const { items: expenses } = state.expenses;
    const { settings } = state.settings;

    if (sheetId) {
      try {
        // Get all months with data
        const allMonths = getAllMonths(reservations, expenses);

        // Skip if there are no months with data (nothing to save)
        if (allMonths.length === 0) {
          return;
        }

        // Group data by month
        const reservationsByMonth = groupReservationsByMonth(reservations);
        const expensesByMonth = groupExpensesByMonth(expenses);

        // Calculate tax data for all months
        const taxData = allMonths
          .filter(month => month && month.match(/^\d{4}-\d{2}$/)) // Only valid YYYY-MM format
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
              notes: taxNotes[month] || '',
            };
          });

        // Only write if we have valid data
        if (taxData.length > 0) {
          await googleSheetsService.writeTaxData(sheetId, taxData);
          console.log('Tax data synced to Google Sheets');
        }
      } catch (error) {
        console.error('Failed to sync tax data:', error);
      }
    }
  },
});
