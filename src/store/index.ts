import { configureStore } from '@reduxjs/toolkit';
import reservationsReducer from './reservationsSlice';
import expensesReducer from './expensesSlice';
import settingsReducer from './settingsSlice';
import taxesReducer from './taxesSlice';
import appReducer from './appSlice';

export const store = configureStore({
  reducer: {
    app: appReducer,
    reservations: reservationsReducer,
    expenses: expensesReducer,
    settings: settingsReducer,
    taxes: taxesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore Date objects in reservations and expenses
        ignoredPaths: ['reservations.items', 'expenses.items'],
        ignoredActions: ['reservations/setReservations', 'expenses/setExpenses', 'reservations/addReservation', 'expenses/addExpense'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
