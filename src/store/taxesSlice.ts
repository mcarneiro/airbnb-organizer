import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TaxesState {
  paidMonths: string[]; // Array of month strings in YYYY-MM format
  notes: Record<string, string>; // Notes per month (month -> note)
}

const initialState: TaxesState = {
  paidMonths: [],
  notes: {},
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
    setMonthNote: (state, action: PayloadAction<{ month: string; note: string }>) => {
      if (action.payload.note.trim()) {
        state.notes[action.payload.month] = action.payload.note;
      } else {
        delete state.notes[action.payload.month];
      }
    },
    setNotes: (state, action: PayloadAction<Record<string, string>>) => {
      state.notes = action.payload;
    },
  },
});

export const { markMonthAsPaid, markMonthAsUnpaid, setPaidMonths, setMonthNote, setNotes } = taxesSlice.actions;
export default taxesSlice.reducer;
