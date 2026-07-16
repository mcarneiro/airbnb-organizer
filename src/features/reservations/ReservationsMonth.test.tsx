import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import '../../config/i18n';
import ReservationsMonth from './ReservationsMonth';
import appReducer, { setDataLoaded } from '../../store/appSlice';
import expensesReducer from '../../store/expensesSlice';
import reservationsReducer, { setReservations } from '../../store/reservationsSlice';
import settingsReducer from '../../store/settingsSlice';
import taxesReducer from '../../store/taxesSlice';

describe('ReservationsMonth', () => {
  it('orders reservation cards by date ascending', () => {
    // Given
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 22));
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
      { id: 'late', date: '2025-06-20', nights: 1, total: 300, ownerAmount: 210, adminFee: 90 },
      { id: 'early', date: '2025-06-05', nights: 1, total: 100, ownerAmount: 70, adminFee: 30 },
      { id: 'middle', date: '2025-06-12', nights: 1, total: 200, ownerAmount: 140, adminFee: 60 },
    ]));

    // When
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/reservations/2025-06']}>
          <Routes>
            <Route path="/reservations/:month" element={<ReservationsMonth />} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    // Then
    const cards = screen.getAllByRole('button', { name: /total \(r\$\)/i });
    expect(cards.map(card => card.textContent)).toEqual([
      expect.stringContaining('R$ 100,00'),
      expect.stringContaining('R$ 200,00'),
      expect.stringContaining('R$ 300,00'),
    ]);
    expect(screen.getByText('To Receive').parentElement).toHaveTextContent('R$ 0,00');
    expect(screen.getByText('Occupancy').parentElement).toHaveTextContent('10% (3 nights)');
    expect(screen.getByText('(3 nights)')).toHaveClass('text-sm');
    expect(screen.getByText('(3 nights)')).toHaveClass('font-normal');
    vi.useRealTimers();
  });

  it('marks reservations whose checkout is before today as paid', () => {
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
      { id: 'paid', date: '2025-06-05', nights: 4, total: 100, ownerAmount: 70, adminFee: 30 },
      { id: 'checkout-today', date: '2025-06-09', nights: 1, total: 50, ownerAmount: 35, adminFee: 15 },
      { id: 'active', date: '2025-06-09', nights: 2, total: 200, ownerAmount: 140, adminFee: 60 },
    ]));

    // When
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/reservations/2025-06']}>
          <Routes>
            <Route path="/reservations/:month" element={<ReservationsMonth />} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    // Then
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('Paid').closest('button')).toHaveClass('text-gray-500');
    expect(screen.getByText('R$ 200,00').closest('button')).not.toHaveClass('text-gray-500');
    expect(screen.getByText('To Receive').parentElement).toHaveTextContent('R$ 175,00');
    vi.useRealTimers();
  });
});
