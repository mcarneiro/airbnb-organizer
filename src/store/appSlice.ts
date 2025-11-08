import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  authInitialized: boolean;
  dataLoading: boolean;
  dataLoaded: boolean;
}

const initialState: AppState = {
  authInitialized: false,
  dataLoading: false,
  dataLoaded: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setAuthInitialized: (state, action: PayloadAction<boolean>) => {
      state.authInitialized = action.payload;
    },
    setDataLoading: (state, action: PayloadAction<boolean>) => {
      state.dataLoading = action.payload;
      if (action.payload) {
        state.dataLoaded = false;
      }
    },
    setDataLoaded: (state, action: PayloadAction<boolean>) => {
      state.dataLoaded = action.payload;
      if (action.payload) {
        state.dataLoading = false;
      }
    },
  },
});

export const {
  setAuthInitialized,
  setDataLoading,
  setDataLoaded,
} = appSlice.actions;

export default appSlice.reducer;
