import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { useGoogleAuth } from '../contexts/GoogleAuthContext';
import { googleSheetsService } from '../services/GoogleSheetsService';
import { setReservations } from '../store/reservationsSlice';
import { setExpenses } from '../store/expensesSlice';
import { setSettings } from '../store/settingsSlice';
import { setPaidMonths, setNotes } from '../store/taxesSlice';
import { setDataLoading, setDataLoaded } from '../store/appSlice';

/**
 * Hook to sync data with Google Sheets
 * Now only handles LOADING data on mount.
 * Saving is handled by Redux Middleware (syncListenerMiddleware).
 */
export function useDataSync() {
  const dispatch = useAppDispatch();
  const { isSignedIn, accessToken, signOut } = useGoogleAuth();
  const sheetId = useAppSelector(state => state.settings.sheetId);

  /**
   * Handle API errors, especially token expiration
   */
  const handleApiError = useCallback((error: Error & { code?: string }) => {
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

      // Load paid tax months and notes
      const { paidMonths: loadedPaidMonths, notes: loadedNotes } = await googleSheetsService.readPaidTaxMonths(sheetId);
      dispatch(setPaidMonths(loadedPaidMonths));
      dispatch(setNotes(loadedNotes));

      console.log('Data loaded from Google Sheets');
      dispatch(setDataLoaded(true));
    } catch (error) {
      handleApiError(error);
      dispatch(setDataLoaded(false));
    }
  }, [isSignedIn, sheetId, dispatch, handleApiError]);

  // Load data on mount (when signed in, sheet ID, and access token are available)
  useEffect(() => {
    if (isSignedIn && sheetId && accessToken) {
      loadData();
    }
  }, [isSignedIn, sheetId, accessToken, loadData]);

  return {
    loadData,
  };
}
