import { describe, expect, it, vi } from 'vitest';
import { isReservationPaid } from '../taxCalculations';

describe('isReservationPaid', () => {
  it('returns true when checkout is before the reference date', () => {
    // Given
    const reservation = { id: '1', date: '2025-06-01', nights: 3, total: 100, ownerAmount: 70, adminFee: 30 };
    const asOf = new Date(2025, 6, 5); // 2025-07-05

    // When
    const result = isReservationPaid(reservation, asOf);

    // Then
    expect(result).toBe(true);
  });

  it('returns false when checkout is on the reference date', () => {
    // Given
    const reservation = { id: '1', date: '2025-06-01', nights: 4, total: 100, ownerAmount: 70, adminFee: 30 };
    const asOf = new Date(2025, 5, 5); // 2025-06-05 (checkout day)

    // When
    const result = isReservationPaid(reservation, asOf);

    // Then
    expect(result).toBe(false);
  });

  it('returns false when checkout is after the reference date', () => {
    // Given
    const reservation = { id: '1', date: '2025-06-01', nights: 5, total: 100, ownerAmount: 70, adminFee: 30 };
    const asOf = new Date(2025, 5, 5); // 2025-06-05

    // When
    const result = isReservationPaid(reservation, asOf);

    // Then
    expect(result).toBe(false);
  });

  it('defaults to today when no asOf date provided', () => {
    // Given
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 10));
    const reservation = { id: '1', date: '2025-06-01', nights: 3, total: 100, ownerAmount: 70, adminFee: 30 };

    // When
    const result = isReservationPaid(reservation);

    // Then
    expect(result).toBe(true);
    vi.useRealTimers();
  });

  it('handles checkout-today boundary correctly', () => {
    // Given
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 10));
    const checkoutToday = { id: '1', date: '2025-06-09', nights: 1, total: 50, ownerAmount: 35, adminFee: 15 };
    const paidYesterday = { id: '2', date: '2025-06-08', nights: 1, total: 50, ownerAmount: 35, adminFee: 15 };

    // When
    const checkoutTodayResult = isReservationPaid(checkoutToday);
    const paidYesterdayResult = isReservationPaid(paidYesterday);

    // Then
    expect(checkoutTodayResult).toBe(false);
    expect(paidYesterdayResult).toBe(true);
    vi.useRealTimers();
  });
});
