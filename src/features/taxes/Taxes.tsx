import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { markMonthAsPaid, markMonthAsUnpaid } from '../../store/taxesSlice';
import {
  getAllMonths,
  groupReservationsByMonth,
  groupExpensesByMonth,
  calculateMonthlyTax,
  getMonthName,
  formatReservationsForIRS,
} from '../../utils/taxCalculations';
import { formatCurrency } from '../../utils/currency';

export default function Taxes() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { month: monthFromUrl } = useParams<{ month?: string }>();
  const reservations = useAppSelector(state => state.reservations.items);
  const expenses = useAppSelector(state => state.expenses.items);
  const settings = useAppSelector(state => state.settings.settings);
  const paidMonths = useAppSelector(state => state.taxes.paidMonths);

  // Get all available months
  const availableMonths = useMemo(
    () => getAllMonths(reservations, expenses),
    [reservations, expenses]
  );

  // Initialize selected month from URL param or default to most recent
  const initialMonth = useMemo(() => {
    if (monthFromUrl && availableMonths.includes(monthFromUrl)) {
      return monthFromUrl;
    }
    return availableMonths[0] || '';
  }, [monthFromUrl, availableMonths]);

  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Update selected month when URL param changes
  useEffect(() => {
    if (monthFromUrl && availableMonths.includes(monthFromUrl)) {
      setSelectedMonth(monthFromUrl);
    }
  }, [monthFromUrl, availableMonths]);

  // Group data by month
  const reservationsByMonth = useMemo(
    () => groupReservationsByMonth(reservations),
    [reservations]
  );
  const expensesByMonth = useMemo(
    () => groupExpensesByMonth(expenses),
    [expenses]
  );

  // Calculate tax for selected month
  const selectedMonthData = useMemo(() => {
    if (!selectedMonth) return null;

    const monthReservations = reservationsByMonth.get(selectedMonth) || [];
    const monthExpenses = expensesByMonth.get(selectedMonth) || [];
    const isPaid = paidMonths.includes(selectedMonth);

    return calculateMonthlyTax(
      selectedMonth,
      monthReservations,
      monthExpenses,
      settings.dependents,
      isPaid
    );
  }, [selectedMonth, reservationsByMonth, expensesByMonth, settings.dependents, paidMonths]);

  // Get all monthly summaries for the list
  const allMonthlyTaxes = useMemo(() => {
    return availableMonths.map((month) => {
      const monthReservations = reservationsByMonth.get(month) || [];
      const monthExpenses = expensesByMonth.get(month) || [];
      const isPaid = paidMonths.includes(month);

      return calculateMonthlyTax(
        month,
        monthReservations,
        monthExpenses,
        settings.dependents,
        isPaid
      );
    });
  }, [availableMonths, reservationsByMonth, expensesByMonth, settings.dependents, paidMonths]);

  const handleCopyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleMarkAsPaid = () => {
    if (selectedMonth) {
      dispatch(markMonthAsPaid(selectedMonth));
    }
  };

  const handleMarkAsUnpaid = () => {
    if (selectedMonth) {
      dispatch(markMonthAsUnpaid(selectedMonth));
    }
  };

  if (availableMonths.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">Taxes</h1>
        </header>

        <div className="px-4 py-6 max-w-md mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">No reservations or expenses yet. Add some to see tax calculations.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">Taxes</h1>
      </header>

      <div className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Month Selector */}
        <div>
          <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
            Select Month
          </label>
          <select
            id="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {getMonthName(month)}
              </option>
            ))}
          </select>
        </div>

        {selectedMonthData && (
          <>
            {/* Tax Calculation Breakdown */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Tax Calculation</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Income (Owner):</span>
                  <span className="font-semibold">R$ {formatCurrency(selectedMonthData.totalIncome)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Expenses:</span>
                  <span className="font-semibold text-red-600">- R$ {formatCurrency(selectedMonthData.totalDeductions)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Liquid Income:</span>
                  <span className="font-bold">R$ {formatCurrency(selectedMonthData.liquidIncome)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Tax Deduction:</span>
                  <span className="font-semibold text-green-600">- R$ {formatCurrency(selectedMonthData.deduction)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Taxable Income:</span>
                  <span className="font-bold">R$ {formatCurrency(selectedMonthData.taxableIncome)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Tax Rate:</span>
                  <span className="font-semibold">{(selectedMonthData.taxRate * 100).toFixed(1)}%</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Tax Owed:</span>
                  <span className="font-bold text-red-600">R$ {formatCurrency(selectedMonthData.taxOwed)}</span>
                </div>

                <div className="flex justify-between py-3 bg-blue-50 -mx-6 px-6 mt-4">
                  <span className="font-bold text-blue-900">Final Profit:</span>
                  <span className="font-bold text-blue-900 text-lg">R$ {formatCurrency(selectedMonthData.profit)}</span>
                </div>
              </div>
            </div>

            {/* IRS Filing Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <h3 className="text-md font-semibold text-gray-900">Prepare for IRS</h3>

              {/* Copy Total Deductions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Deductions
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`R$ ${formatCurrency(selectedMonthData.totalDeductions)}`}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={() => handleCopyToClipboard(
                      formatCurrency(selectedMonthData.totalDeductions),
                      'deductions'
                    )}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {copiedField === 'deductions' ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Copy Reservation Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reservation Details
                </label>
                <div className="space-y-2">
                  <textarea
                    value={formatReservationsForIRS(reservationsByMonth.get(selectedMonth) || [])}
                    readOnly
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono resize-none"
                  />
                  <button
                    onClick={() => handleCopyToClipboard(
                      formatReservationsForIRS(reservationsByMonth.get(selectedMonth) || []),
                      'reservations'
                    )}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {copiedField === 'reservations' ? '✓ Copied' : 'Copy to Clipboard'}
                  </button>
                </div>
              </div>

              {/* Mark as Paid */}
              <div className="pt-4 border-t border-gray-200">
                {selectedMonthData.isPaid ? (
                  <button
                    onClick={handleMarkAsUnpaid}
                    className="w-full px-4 py-3 bg-green-100 text-green-800 rounded-lg font-semibold hover:bg-green-200 transition-colors"
                  >
                    ✓ Taxes Paid
                  </button>
                ) : (
                  <button
                    onClick={handleMarkAsPaid}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Mark as Paid
                  </button>
                )}
              </div>
            </div>

            {/* All Months Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <h3 className="text-md font-semibold text-gray-900">All Months</h3>

              <div className="space-y-2">
                {allMonthlyTaxes.map((monthData) => (
                  <div
                    key={monthData.month}
                    className={`p-3 rounded-lg border ${
                      monthData.isPaid
                        ? 'border-green-200 bg-green-50'
                        : monthData.taxOwed > 0
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{getMonthName(monthData.month)}</div>
                        <div className="text-sm text-gray-600">
                          Tax: R$ {formatCurrency(monthData.taxOwed)}
                        </div>
                      </div>
                      <div className="text-right">
                        {monthData.isPaid ? (
                          <span className="text-green-700 font-semibold text-sm">✓ Paid</span>
                        ) : monthData.taxOwed > 0 ? (
                          <span className="text-yellow-700 font-semibold text-sm">Pending</span>
                        ) : (
                          <span className="text-gray-500 text-sm">No tax</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
