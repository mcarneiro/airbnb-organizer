import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { useMemo } from 'react';
import { formatMonth } from '../../utils/taxCalculations';
import { formatCurrency } from '../../utils/currency';
import MonthNavigation from '../../components/MonthNavigation';

export default function ReservationsMonth() {
  const navigate = useNavigate();
  const { month } = useParams<{ month: string }>();
  const reservations = useAppSelector(state => state.reservations.items);
  const dataLoaded = useAppSelector(state => state.app.dataLoaded);

  // Filter reservations for the selected month
  const monthReservations = useMemo(() => {
    if (!month) return [];
    return reservations.filter(r => formatMonth(r.date) === month);
  }, [reservations, month]);

  // Calculate totals
  const totals = useMemo(() => {
    const total = monthReservations.reduce((sum, r) => sum + r.total, 0);
    const nights = monthReservations.reduce((sum, r) => sum + r.nights, 0);
    const ownerAmount = monthReservations.reduce((sum, r) => sum + r.ownerAmount, 0);

    // Calculate occupation rate (assuming 30 days per month)
    const occupationRate = Math.round((nights / 30) * 100);

    return { total, nights, ownerAmount, occupationRate };
  }, [monthReservations]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  if (!month) {
    return null;
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
        <h1 className="text-xl font-bold text-gray-900 flex-1">Reservas</h1>
        <button
          onClick={() => navigate('/reservations/new')}
          className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </header>

      <div className="px-4 max-w-md mx-auto">
        {/* Month Navigation */}
        <MonthNavigation
          currentMonth={month}
          onMonthChange={(newMonth) => navigate(`/reservations/${newMonth}`)}
        />

        <div className="space-y-6 pb-6">
        {/* Loading State */}
        {!dataLoaded && (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-16 bg-gray-200 rounded"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </>
        )}

        {/* Summary and List - only show when data is loaded */}
        {dataLoaded && (
          <>
            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Resumo</h2>

              <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Renda Total</div>
              <div className="text-xl font-bold text-gray-900">
                R$ {formatCurrency(totals.ownerAmount)}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Ocupação</div>
              <div className="text-xl font-bold text-gray-900">{totals.occupationRate}%</div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Reservas</div>
              <div className="text-xl font-bold text-gray-900">{monthReservations.length}</div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Diárias</div>
              <div className="text-xl font-bold text-gray-900">{totals.nights}</div>
            </div>
              </div>
            </div>

            {/* Reservations List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-md font-semibold text-gray-900">Reservas</h3>
          </div>

          {monthReservations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">Nenhuma reserva neste mês</p>
              <button
                onClick={() => navigate('/reservations/new')}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Adicionar uma reserva
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {monthReservations.map((reservation) => (
                <div key={reservation.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-gray-900">
                          {formatDate(reservation.date)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {reservation.nights} {reservation.nights === 1 ? 'diária' : 'diárias'}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium text-gray-900">
                            R$ {formatCurrency(reservation.total)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Proprietário:</span>
                          <span className="font-medium text-blue-600">
                            R$ {formatCurrency(reservation.ownerAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Taxa Admin:</span>
                          <span className="font-medium text-gray-600">
                            R$ {formatCurrency(reservation.adminFee)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
