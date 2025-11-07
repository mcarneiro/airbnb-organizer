import { configureStore } from '@reduxjs/toolkit';
import reservationsReducer from './reservationsSlice';
import expensesReducer from './expensesSlice';
import settingsReducer from './settingsSlice';

export const store = configureStore({
  reducer: {
    reservations: reservationsReducer,
    expenses: expensesReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
