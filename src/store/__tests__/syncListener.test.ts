import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import reservationsReducer, { addReservation } from '../reservationsSlice';
import settingsReducer from '../settingsSlice';
import { googleSheetsService } from '../../services/GoogleSheetsService';
import { Reservation } from '../../types';
import { syncListenerMiddleware } from '../middleware/syncListener';

// Mock the Google Sheets service
vi.mock('../../services/GoogleSheetsService', () => ({
  googleSheetsService: {
    writeReservations: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Sync Listener Middleware (Integration)', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    store = configureStore({
      reducer: {
        reservations: reservationsReducer,
        settings: settingsReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().prepend(syncListenerMiddleware.middleware),
    });
  });

  it('should automatically sync reservations when a new reservation is added after debounce', async () => {
    // Given
    const sheetId = 'test-sheet-id';
    store.dispatch({ type: 'settings/setSheetId', payload: sheetId });
    
    const newReservation: Reservation = {
      id: '1',
      date: '2025-01-01',
      nights: 3,
      total: 1000,
      ownerAmount: 700,
      adminFee: 300,
    };

    // When
    store.dispatch(addReservation(newReservation));

    // Then
    // Advance timers by 1000ms (the debounce time in syncListener.ts)
    vi.advanceTimersByTime(1000);

    // Wait for the async effect to complete
    await vi.runAllTimersAsync();

    expect(googleSheetsService.writeReservations).toHaveBeenCalledWith(
      sheetId,
      expect.arrayContaining([newReservation])
    );
  });
});
