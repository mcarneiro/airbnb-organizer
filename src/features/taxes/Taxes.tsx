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
import MonthNavigation from '../../components/MonthNavigation';

export default function Taxes() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { month: monthFromUrl } = useParams<{ month?: string }>();
  const reservations = useAppSelector(state => state.reservations.items);
  const expenses = useAppSelector(state => state.expenses.items);
  const settings = useAppSelector(state => state.settings.settings);
  const paidMonths = useAppSelector(state => state.taxes.paidMonths);
  const dataLoaded = useAppSelector(state => state.app.dataLoaded);

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

  // Show empty state only when data is loaded and there are no months
  if (dataLoaded && availableMonths.length === 0) {
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
          <h1 className="text-xl font-bold text-gray-900">Impostos</h1>
        </header>

        <div className="px-4 max-w-md mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma reserva ou despesa ainda. Adicione algumas para ver os cálculos de impostos.</p>
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
        <h1 className="text-xl font-bold text-gray-900">Impostos</h1>
      </header>

      <div className="px-4 max-w-md mx-auto">
        {/* Month Navigation */}
        <MonthNavigation
          currentMonth={selectedMonth}
          onMonthChange={(newMonth) => navigate(`/taxes/${newMonth}`)}
        />

        <div className="space-y-6 pb-6">
        {/* Loading State */}
        {!dataLoaded && (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </>
        )}

        {dataLoaded && selectedMonthData && (
          <>
            {/* Tax Calculation Breakdown */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Cálculo de Imposto</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Renda Total (Proprietário):</span>
                  <span className="font-semibold">R$ {formatCurrency(selectedMonthData.totalIncome)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total de Despesas:</span>
                  <span className="font-semibold text-red-600">- R$ {formatCurrency(selectedMonthData.totalDeductions)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Renda Líquida:</span>
                  <span className="font-bold">R$ {formatCurrency(selectedMonthData.liquidIncome)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Dedução Fiscal:</span>
                  <span className="font-semibold text-green-600">- R$ {formatCurrency(selectedMonthData.deduction)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Renda Tributável:</span>
                  <span className="font-bold">R$ {formatCurrency(selectedMonthData.taxableIncome)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Alíquota:</span>
                  <span className="font-semibold">{(selectedMonthData.taxRate * 100).toFixed(1)}%</span>
                </div>

                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Imposto Devido:</span>
                  <span className="font-bold text-red-600">R$ {formatCurrency(selectedMonthData.taxOwed)}</span>
                </div>

                <div className="flex justify-between py-3 bg-blue-50 -mx-6 px-6 mt-4">
                  <span className="font-bold text-blue-900">Lucro Final:</span>
                  <span className="font-bold text-blue-900 text-lg">R$ {formatCurrency(selectedMonthData.profit)}</span>
                </div>
              </div>
            </div>

            {/* IRS Filing Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <h3 className="text-md font-semibold text-gray-900">Preparar para Declaração</h3>

              {/* Copy Total Income */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Renda Total
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={`R$ ${formatCurrency(selectedMonthData.totalIncome)}`}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                  <button
                    onClick={() => handleCopyToClipboard(
                      formatCurrency(selectedMonthData.totalIncome),
                      'income'
                    )}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {copiedField === 'income' ? '✓' : 'Copiar'}
                  </button>
                </div>
              </div>

              {/* Copy Total Deductions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total de Deduções
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
                    {copiedField === 'deductions' ? '✓' : 'Copiar'}
                  </button>
                </div>
              </div>

              {/* Copy Reservation Details */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detalhes das Reservas
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
                    {copiedField === 'reservations' ? '✓ Copiado' : 'Copiar'}
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
                    ✓ Imposto Pago
                  </button>
                ) : (
                  <button
                    onClick={handleMarkAsPaid}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Marcar como Pago
                  </button>
                )}
              </div>
            </div>

            {/* All Months Summary */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <h3 className="text-md font-semibold text-gray-900">Todos os Meses</h3>

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
                          Imposto: R$ {formatCurrency(monthData.taxOwed)}
                        </div>
                      </div>
                      <div className="text-right">
                        {monthData.isPaid ? (
                          <span className="text-green-700 font-semibold text-sm">✓ Pago</span>
                        ) : monthData.taxOwed > 0 ? (
                          <span className="text-yellow-700 font-semibold text-sm">Pendente</span>
                        ) : (
                          <span className="text-gray-500 text-sm">Sem imposto</span>
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
    </div>
  );
}
