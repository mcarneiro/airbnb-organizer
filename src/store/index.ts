import { configureStore } from '@reduxjs/toolkit';
import reservationsReducer from './reservationsSlice';
import expensesReducer from './expensesSlice';
import settingsReducer from './settingsSlice';
import taxesReducer from './taxesSlice';
import appReducer from './appSlice';
import { syncListenerMiddleware } from './middleware/syncListener';

export const store = configureStore({
  reducer: {
    app: appReducer,
    reservations: reservationsReducer,
    expenses: expensesReducer,
    settings: settingsReducer,
    taxes: taxesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(syncListenerMiddleware.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
