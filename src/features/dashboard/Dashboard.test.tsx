import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import './../../config/i18n';

// Mock ResizeObserver for recharts
vi.stubGlobal('ResizeObserver', vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})));

import Dashboard from './Dashboard';
import appReducer, { setDataLoaded } from '../../store/appSlice';
import expensesReducer from '../../store/expensesSlice';
import reservationsReducer, { setReservations } from '../../store/reservationsSlice';
import settingsReducer from '../../store/settingsSlice';
import taxesReducer from '../../store/taxesSlice';

describe('Dashboard next reservation card', () => {
  it('shows the next reservation card when data is loaded and a non-paid reservation exists', () => {
    // Given
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 10));
    const store = configureStore({
      reducer: {
        app: appReducer,
        reservations: reservationsReducer,
        expenses: expensesReducer,
        settings: settingsReducer,
        taxes: taxesReducer,
      },
    });
    store.dispatch(setDataLoaded(true));
    store.dispatch(setReservations([
      { id: '1', date: '2025-06-15', nights: 3, total: 300, ownerAmount: 210, adminFee: 90 },
    ]));

    // When
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </Provider>,
    );

    // Then
    expect(screen.getByText('Next Reservation')).toBeInTheDocument();
    expect(screen.getByText('06/15')).toBeInTheDocument();
    expect(screen.getByText('3 nights · R$ 210,00')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('shows an ongoing stay as the next reservation', () => {
    // Given
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 10));
    const store = configureStore({
      reducer: {
        app: appReducer,
        reservations: reservationsReducer,
        expenses: expensesReducer,
        settings: settingsReducer,
        taxes: taxesReducer,
      },
    });
    store.dispatch(setDataLoaded(true));
    store.dispatch(setReservations([
      { id: 'ongoing', date: '2025-06-08', nights: 5, total: 500, ownerAmount: 350, adminFee: 150 },
      { id: 'future', date: '2025-06-20', nights: 2, total: 200, ownerAmount: 140, adminFee: 60 },
    ]));

    // When
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </Provider>,
    );

    // Then
    expect(screen.getByText('Next Reservation')).toBeInTheDocument();
    expect(screen.getByText('06/08')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('does not show the next reservation card when all reservations are paid', () => {
    // Given
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 10));
    const store = configureStore({
      reducer: {
        app: appReducer,
        reservations: reservationsReducer,
        expenses: expensesReducer,
        settings: settingsReducer,
        taxes: taxesReducer,
      },
    });
    store.dispatch(setDataLoaded(true));
    store.dispatch(setReservations([
      { id: '1', date: '2025-05-01', nights: 3, total: 100, ownerAmount: 70, adminFee: 30 },
    ]));

    // When
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </Provider>,
    );

    // Then
    expect(screen.queryByText('Next Reservation')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('does not show the next reservation card before data loads', () => {
    // Given
    const store = configureStore({
      reducer: {
        app: appReducer,
        reservations: reservationsReducer,
        expenses: expensesReducer,
        settings: settingsReducer,
        taxes: taxesReducer,
      },
    });

    // When
    render(
      <Provider store={store}>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </Provider>,
    );

    // Then
    expect(screen.queryByText('Next Reservation')).not.toBeInTheDocument();
  });
});
