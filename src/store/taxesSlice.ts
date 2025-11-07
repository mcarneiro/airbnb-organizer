import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TaxesState {
  paidMonths: string[]; // Array of month strings in YYYY-MM format
}

const initialState: TaxesState = {
  paidMonths: [],
};

const taxesSlice = createSlice({
  name: 'taxes',
  initialState,
  reducers: {
    markMonthAsPaid: (state, action: PayloadAction<string>) => {
      if (!state.paidMonths.includes(action.payload)) {
        state.paidMonths.push(action.payload);
      }
    },
    markMonthAsUnpaid: (state, action: PayloadAction<string>) => {
      state.paidMonths = state.paidMonths.filter(month => month !== action.payload);
    },
    setPaidMonths: (state, action: PayloadAction<string[]>) => {
      state.paidMonths = action.payload;
    },
  },
});

export const { markMonthAsPaid, markMonthAsUnpaid, setPaidMonths } = taxesSlice.actions;
export default taxesSlice.reducer;
