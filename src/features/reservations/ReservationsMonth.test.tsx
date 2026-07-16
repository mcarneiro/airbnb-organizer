import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
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
  });
});
