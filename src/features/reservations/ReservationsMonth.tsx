import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { useMemo } from 'react';
import { formatMonth, getMonthName, parseMonth } from '../../utils/taxCalculations';
import { formatCurrency } from '../../utils/currency';

export default function ReservationsMonth() {
  const navigate = useNavigate();
  const { month } = useParams<{ month: string }>();
  const reservations = useAppSelector(state => state.reservations.items);

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

  // Navigation functions
  const goToPreviousMonth = () => {
    if (!month) return;
    const currentDate = parseMonth(month);
    const previousMonth = new Date(currentDate);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    navigate(`/reservations/${formatMonth(previousMonth)}`);
  };

  const goToNextMonth = () => {
    if (!month) return;
    const currentDate = parseMonth(month);
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    navigate(`/reservations/${formatMonth(nextMonth)}`);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  if (!month) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Month Navigation */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h1 className="text-lg font-bold text-gray-900 min-w-[200px] text-center">
              {getMonthName(month)}
            </h1>

            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => navigate('/reservations/new')}
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </header>

      <div className="px-4 py-6 max-w-md mx-auto space-y-6">
        {/* Summary Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Summary</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Income</div>
              <div className="text-xl font-bold text-gray-900">
                R$ {formatCurrency(totals.ownerAmount)}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Occupation</div>
              <div className="text-xl font-bold text-gray-900">{totals.occupationRate}%</div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Reservations</div>
              <div className="text-xl font-bold text-gray-900">{monthReservations.length}</div>
            </div>

            <div>
              <div className="text-sm text-gray-600">Nights</div>
              <div className="text-xl font-bold text-gray-900">{totals.nights}</div>
            </div>
          </div>
        </div>

        {/* Reservations List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-md font-semibold text-gray-900">Reservations</h3>
          </div>

          {monthReservations.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No reservations for this month</p>
              <button
                onClick={() => navigate('/reservations/new')}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Add a reservation
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
                          {reservation.nights} {reservation.nights === 1 ? 'night' : 'nights'}
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
                          <span className="text-gray-600">Owner:</span>
                          <span className="font-medium text-blue-600">
                            R$ {formatCurrency(reservation.ownerAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Admin Fee:</span>
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
      </div>
    </div>
  );
}
