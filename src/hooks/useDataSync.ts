import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useGoogleAuth } from '../contexts/GoogleAuthContext';
import { googleSheetsService } from '../services/GoogleSheetsService';
import { setReservations } from '../store/reservationsSlice';
import { setExpenses } from '../store/expensesSlice';
import { setSettings } from '../store/settingsSlice';
import { setPaidMonths } from '../store/taxesSlice';
import { setDataLoading, setDataLoaded } from '../store/appSlice';
import { getAllMonths, groupReservationsByMonth, groupExpensesByMonth, calculateMonthlyTax } from '../utils/taxCalculations';

/**
 * Helper hook for debounced auto-save
 */
function useDebouncedAutoSave(
  data: any,
  saveCallback: () => Promise<void>,
  isSignedIn: boolean,
  sheetId: string | null,
  isLoadingData: React.MutableRefObject<boolean>
) {
  useEffect(() => {
    // Skip if not signed in, no sheet ID, or currently loading data
    if (!isSignedIn || !sheetId || isLoadingData.current) return;

    const timeoutId = setTimeout(() => {
      saveCallback();
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [data, isSignedIn, sheetId, saveCallback, isLoadingData]);
}

/**
 * Hook to sync data with Google Sheets
 */
export function useDataSync() {
  const dispatch = useAppDispatch();
  const { isSignedIn, accessToken, signOut } = useGoogleAuth();
  const sheetId = useAppSelector(state => state.settings.sheetId);
  const reservations = useAppSelector(state => state.reservations.items);
  const expenses = useAppSelector(state => state.expenses.items);
  const settings = useAppSelector(state => state.settings.settings);
  const paidMonths = useAppSelector(state => state.taxes.paidMonths);

  // Track if we're currently loading data to prevent auto-save during load
  const isLoadingData = useRef(false);

  /**
   * Handle API errors, especially token expiration
   */
  const handleApiError = useCallback((error: any) => {
    if (error?.code === 'TOKEN_EXPIRED') {
      console.error('Token expired, signing out user');
      signOut('expired');
    }
    console.error('API error:', error);
  }, [signOut]);

  // Set access token when available
  useEffect(() => {
    if (accessToken) {
      googleSheetsService.setAccessToken(accessToken);
    }
  }, [accessToken]);

  /**
   * Load all data from Google Sheets
   */
  const loadData = useCallback(async () => {
    if (!isSignedIn || !sheetId) return;

    // Set loading flag to prevent auto-save during load
    isLoadingData.current = true;
    dispatch(setDataLoading(true));

    try {
      // Load settings
      const loadedSettings = await googleSheetsService.readSettings(sheetId);
      dispatch(setSettings(loadedSettings));

      // Load reservations
      const loadedReservations = await googleSheetsService.readReservations(sheetId);
      dispatch(setReservations(loadedReservations));

      // Load expenses
      const loadedExpenses = await googleSheetsService.readExpenses(sheetId);
      dispatch(setExpenses(loadedExpenses));

      // Load paid tax months
      const loadedPaidMonths = await googleSheetsService.readPaidTaxMonths(sheetId);
      dispatch(setPaidMonths(loadedPaidMonths));

      console.log('Data loaded from Google Sheets');
      dispatch(setDataLoaded(true));
    } catch (error) {
      handleApiError(error);
      dispatch(setDataLoaded(false));
    } finally {
      // Clear loading flag after a short delay to ensure all updates have settled
      setTimeout(() => {
        isLoadingData.current = false;
      }, 100);
    }
  }, [isSignedIn, sheetId, dispatch, handleApiError]);

  /**
   * Save reservations to Google Sheets
   */
  const saveReservations = useCallback(async () => {
    if (!isSignedIn || !sheetId) return;

    try {
      await googleSheetsService.writeReservations(sheetId, reservations);
      console.log('Reservations saved to Google Sheets');
    } catch (error) {
      handleApiError(error);
    }
  }, [isSignedIn, sheetId, reservations, handleApiError]);

  /**
   * Save expenses to Google Sheets
   */
  const saveExpenses = useCallback(async () => {
    if (!isSignedIn || !sheetId) return;

    try {
      await googleSheetsService.writeExpenses(sheetId, expenses);
      console.log('Expenses saved to Google Sheets');
    } catch (error) {
      handleApiError(error);
    }
  }, [isSignedIn, sheetId, expenses, handleApiError]);

  /**
   * Save settings to Google Sheets
   */
  const saveSettings = useCallback(async () => {
    if (!isSignedIn || !sheetId) return;

    try {
      await googleSheetsService.writeSettings(sheetId, settings);
      console.log('Settings saved to Google Sheets');
    } catch (error) {
      handleApiError(error);
    }
  }, [isSignedIn, sheetId, settings, handleApiError]);

  /**
   * Save tax data to Google Sheets
   */
  const saveTaxData = useCallback(async () => {
    if (!isSignedIn || !sheetId) return;

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
          };
        });

      // Only write if we have valid data
      if (taxData.length > 0) {
        await googleSheetsService.writeTaxData(sheetId, taxData);
        console.log('Tax data saved to Google Sheets');
      }
    } catch (error) {
      handleApiError(error);
    }
  }, [isSignedIn, sheetId, reservations, expenses, settings.dependents, paidMonths, handleApiError]);

  // Load data on mount (when signed in, sheet ID, and access token are available)
  useEffect(() => {
    if (isSignedIn && sheetId && accessToken) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, sheetId, accessToken]); // Only run when these change, not loadData

  // Auto-save data when it changes (with debouncing)
  useDebouncedAutoSave(reservations, saveReservations, isSignedIn, sheetId, isLoadingData);
  useDebouncedAutoSave(expenses, saveExpenses, isSignedIn, sheetId, isLoadingData);
  useDebouncedAutoSave(settings, saveSettings, isSignedIn, sheetId, isLoadingData);

  // Auto-save tax data ONLY when paidMonths change
  // Tax data is derived/calculated data and should only be saved when user marks something as paid/unpaid
  // This prevents the isPaid status from being reset when reservations/expenses change
  useDebouncedAutoSave(paidMonths, saveTaxData, isSignedIn, sheetId, isLoadingData);

  return {
    loadData,
    saveReservations,
    saveExpenses,
    saveSettings,
    saveTaxData,
  };
}
