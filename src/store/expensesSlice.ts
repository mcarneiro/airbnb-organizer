import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Expense } from '../types';

interface ExpensesState {
  items: Expense[];
  loading: boolean;
  error: string | null;
}

const initialState: ExpensesState = {
  items: [],
  loading: false,
  error: null,
};

const expensesSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    setExpenses: (state, action: PayloadAction<Expense[]>) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    addExpense: (state, action: PayloadAction<Expense>) => {
      state.items.push(action.payload);
    },
    updateExpense: (state, action: PayloadAction<Expense>) => {
      const index = state.items.findIndex(e => e.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteExpense: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(e => e.id !== action.payload);
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
  setExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
  setLoading,
  setError,
} = expensesSlice.actions;

export default expensesSlice.reducer;
