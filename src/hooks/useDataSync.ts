import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useGoogleAuth } from '../contexts/GoogleAuthContext';
import { googleSheetsService } from '../services/GoogleSheetsService';
import { setReservations } from '../store/reservationsSlice';
import { setExpenses } from '../store/expensesSlice';
import { setSettings } from '../store/settingsSlice';

/**
 * Helper hook for debounced auto-save
 */
function useDebouncedAutoSave(
  data: any,
  saveCallback: () => Promise<void>,
  isSignedIn: boolean,
  sheetId: string,
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

  // Track if we're currently loading data to prevent auto-save during load
  const isLoadingData = useRef(false);

  /**
   * Handle API errors, especially token expiration
   */
  const handleApiError = useCallback((error: any) => {
    if (error.code === 'TOKEN_EXPIRED') {
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

      console.log('Data loaded from Google Sheets');
    } catch (error) {
      handleApiError(error);
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

  // Load data on mount (when signed in, sheet ID, and access token are available)
  useEffect(() => {
    if (isSignedIn && sheetId && accessToken) {
      loadData();
    }
  }, [isSignedIn, sheetId, accessToken, loadData]); // Include all dependencies

  // Auto-save data when it changes (with debouncing)
  useDebouncedAutoSave(reservations, saveReservations, isSignedIn, sheetId, isLoadingData);
  useDebouncedAutoSave(expenses, saveExpenses, isSignedIn, sheetId, isLoadingData);
  useDebouncedAutoSave(settings, saveSettings, isSignedIn, sheetId, isLoadingData);

  return {
    loadData,
    saveReservations,
    saveExpenses,
    saveSettings,
  };
}
