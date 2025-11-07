import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppSettings } from '../types';

interface SettingsState {
  settings: AppSettings;
  sheetId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  settings: {
    dependents: 0,
    ownerSplit: 0.70,
    adminSplit: 0.30,
  },
  sheetId: localStorage.getItem('sheetId') || null,
  loading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings: (state, action: PayloadAction<AppSettings>) => {
      state.settings = action.payload;
      state.loading = false;
      state.error = null;
    },
    updateSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    setSheetId: (state, action: PayloadAction<string>) => {
      state.sheetId = action.payload;
      localStorage.setItem('sheetId', action.payload);
    },
    clearSheetId: (state) => {
      state.sheetId = null;
      localStorage.removeItem('sheetId');
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setSettings,
  updateSettings,
  setSheetId,
  clearSheetId,
  setLoading,
  setError,
} = settingsSlice.actions;

export default settingsSlice.reducer;
