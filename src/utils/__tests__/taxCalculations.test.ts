import { describe, expect, it, vi } from 'vitest';
import { isReservationPaid, getNextReservation } from '../taxCalculations';

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

describe('getNextReservation', () => {
  it('returns the reservation with the earliest check-in date that is not paid', () => {
    // Given
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 10));
    const reservations = [
      { id: '1', date: '2025-06-15', nights: 3, total: 300, ownerAmount: 210, adminFee: 90 },
      { id: '2', date: '2025-06-20', nights: 2, total: 200, ownerAmount: 140, adminFee: 60 },
      { id: '3', date: '2025-05-01', nights: 3, total: 100, ownerAmount: 70, adminFee: 30 },
    ];

    // When
    const result = getNextReservation(reservations);

    // Then
    expect(result?.id).toBe('1');
    vi.useRealTimers();
  });

  it('returns an ongoing stay (checkin <= today < checkout)', () => {
    // Given
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 10));
    const reservations = [
      { id: 'ongoing', date: '2025-06-08', nights: 5, total: 500, ownerAmount: 350, adminFee: 150 },
      { id: 'future', date: '2025-06-20', nights: 2, total: 200, ownerAmount: 140, adminFee: 60 },
    ];

    // When
    const result = getNextReservation(reservations);

    // Then
    expect(result?.id).toBe('ongoing');
    vi.useRealTimers();
  });

  it('returns null when all reservations are paid', () => {
    // Given
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 10));
    const reservations = [
      { id: '1', date: '2025-05-01', nights: 3, total: 100, ownerAmount: 70, adminFee: 30 },
      { id: '2', date: '2025-05-10', nights: 3, total: 200, ownerAmount: 140, adminFee: 60 },
    ];

    // When
    const result = getNextReservation(reservations);

    // Then
    expect(result).toBeNull();
    vi.useRealTimers();
  });

  it('returns null when no reservations exist', () => {
    // Given
    const reservations: any[] = [];

    // When
    const result = getNextReservation(reservations);

    // Then
    expect(result).toBeNull();
  });

  it('skips paid reservations and returns the next non-paid one', () => {
    // Given
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 10));
    const reservations = [
      { id: 'paid-future', date: '2025-04-01', nights: 3, total: 100, ownerAmount: 70, adminFee: 30 },
      { id: 'next', date: '2025-06-15', nights: 3, total: 300, ownerAmount: 210, adminFee: 90 },
      { id: 'later', date: '2025-07-01', nights: 2, total: 200, ownerAmount: 140, adminFee: 60 },
    ];

    // When
    const result = getNextReservation(reservations);

    // Then
    expect(result?.id).toBe('next');
    vi.useRealTimers();
  });

  it('defaults to today when no asOf date provided', () => {
    // Given
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 5, 10));
    const reservations = [
      { id: '1', date: '2025-06-15', nights: 3, total: 300, ownerAmount: 210, adminFee: 90 },
    ];

    // When
    const result = getNextReservation(reservations);

    // Then
    expect(result?.id).toBe('1');
    vi.useRealTimers();
  });
});
