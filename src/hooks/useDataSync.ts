import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useGoogleAuth } from '../contexts/GoogleAuthContext';
import { googleSheetsService } from '../services/GoogleSheetsService';
import { setReservations } from '../store/reservationsSlice';
import { setExpenses } from '../store/expensesSlice';
import { setSettings } from '../store/settingsSlice';

/**
 * Hook to sync data with Google Sheets
 */
export function useDataSync() {
  const dispatch = useAppDispatch();
  const { isSignedIn, accessToken } = useGoogleAuth();
  const sheetId = useAppSelector(state => state.settings.sheetId);
  const reservations = useAppSelector(state => state.reservations.items);
  const expenses = useAppSelector(state => state.expenses.items);
  const settings = useAppSelector(state => state.settings.settings);

  // Track if we're currently loading data to prevent auto-save during load
  const isLoadingData = useRef(false);

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
      console.error('Failed to load data from Google Sheets:', error);
    } finally {
      // Clear loading flag after a short delay to ensure all updates have settled
      setTimeout(() => {
        isLoadingData.current = false;
      }, 100);
    }
  }, [isSignedIn, sheetId, dispatch]);

  /**
   * Save reservations to Google Sheets
   */
  const saveReservations = useCallback(async () => {
    if (!isSignedIn || !sheetId) return;

    try {
      await googleSheetsService.writeReservations(sheetId, reservations);
      console.log('Reservations saved to Google Sheets');
    } catch (error) {
      console.error('Failed to save reservations:', error);
    }
  }, [isSignedIn, sheetId, reservations]);

  /**
   * Save expenses to Google Sheets
   */
  const saveExpenses = useCallback(async () => {
    if (!isSignedIn || !sheetId) return;

    try {
      await googleSheetsService.writeExpenses(sheetId, expenses);
      console.log('Expenses saved to Google Sheets');
    } catch (error) {
      console.error('Failed to save expenses:', error);
    }
  }, [isSignedIn, sheetId, expenses]);

  /**
   * Save settings to Google Sheets
   */
  const saveSettings = useCallback(async () => {
    if (!isSignedIn || !sheetId) return;

    try {
      await googleSheetsService.writeSettings(sheetId, settings);
      console.log('Settings saved to Google Sheets');
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [isSignedIn, sheetId, settings]);

  // Load data on mount (when signed in and sheet ID is available)
  useEffect(() => {
    if (isSignedIn && sheetId) {
      loadData();
    }
  }, [isSignedIn, sheetId]); // Only run when these change, not loadData

  // Auto-save reservations when they change (with debouncing)
  useEffect(() => {
    // Skip if not signed in, no sheet ID, or currently loading data
    if (!isSignedIn || !sheetId || isLoadingData.current) return;

    const timeoutId = setTimeout(() => {
      saveReservations();
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [reservations, isSignedIn, sheetId]); // Don't include saveReservations to avoid infinite loop

  // Auto-save expenses when they change (with debouncing)
  useEffect(() => {
    // Skip if not signed in, no sheet ID, or currently loading data
    if (!isSignedIn || !sheetId || isLoadingData.current) return;

    const timeoutId = setTimeout(() => {
      saveExpenses();
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [expenses, isSignedIn, sheetId]); // Don't include saveExpenses to avoid infinite loop

  // Auto-save settings when they change (with debouncing)
  useEffect(() => {
    // Skip if not signed in, no sheet ID, or currently loading data
    if (!isSignedIn || !sheetId || isLoadingData.current) return;

    const timeoutId = setTimeout(() => {
      saveSettings();
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [settings, isSignedIn, sheetId]); // Don't include saveSettings to avoid infinite loop

  return {
    loadData,
    saveReservations,
    saveExpenses,
    saveSettings,
  };
}
