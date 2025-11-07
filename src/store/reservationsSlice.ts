import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Reservation } from '../types';

interface ReservationsState {
  items: Reservation[];
  loading: boolean;
  error: string | null;
}

const initialState: ReservationsState = {
  items: [],
  loading: false,
  error: null,
};

const reservationsSlice = createSlice({
  name: 'reservations',
  initialState,
  reducers: {
    setReservations: (state, action: PayloadAction<Reservation[]>) => {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    addReservation: (state, action: PayloadAction<Reservation>) => {
      state.items.push(action.payload);
    },
    updateReservation: (state, action: PayloadAction<Reservation>) => {
      const index = state.items.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteReservation: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(r => r.id !== action.payload);
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
  setReservations,
  addReservation,
  updateReservation,
  deleteReservation,
  setLoading,
  setError,
} = reservationsSlice.actions;

export default reservationsSlice.reducer;
