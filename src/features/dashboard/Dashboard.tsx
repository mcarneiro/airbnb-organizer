import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { useMemo } from 'react';
import { formatMonth } from '../../utils/taxCalculations';
import { formatCurrency } from '../../utils/currency';

export default function Dashboard() {
  const navigate = useNavigate();
  const reservations = useAppSelector(state => state.reservations.items);

  // Calculate current month and next 3 months data
  const monthsData = useMemo(() => {
    const now = new Date();
    const months = [];

    // Generate data for current month and next 2 months (3 total)
    for (let i = 0; i < 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = formatMonth(date);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

      // Filter reservations for this month
      const monthReservations = reservations.filter(r => formatMonth(r.date) === monthKey);

      // Calculate totals
      const income = monthReservations.reduce((sum, r) => sum + r.ownerAmount, 0);
      const nights = monthReservations.reduce((sum, r) => sum + r.nights, 0);
      const occupation = Math.round((nights / 30) * 100);

      months.push({
        key: monthKey,
        name: monthName,
        shortName: date.toLocaleDateString('pt-BR', { month: 'long' }),
        income,
        nights,
        occupation,
        count: monthReservations.length,
      });
    }

    return months;
  }, [reservations]);

  const currentMonth = monthsData[0];
  const nextMonths = monthsData.slice(1);

  const hasPendingTaxes = true; // TODO: Calculate from tax data

  const handleMonthClick = (monthKey: string) => {
    navigate(`/reservations/${monthKey}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Settings */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={() => navigate('/settings')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      <div className="px-4 py-6 space-y-6 max-w-md mx-auto">
        {/* Tax Notification Bar */}
        {hasPendingTaxes && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded-r-lg">
            <p className="text-sm text-yellow-800 font-medium">
              Notification for the taxes ready to be paid
            </p>
          </div>
        )}

        {/* Current Month Card - Clickable */}
        <button
          onClick={() => handleMonthClick(currentMonth.key)}
          className="w-full bg-white rounded-lg shadow-sm p-6 space-y-4 text-left hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-semibold text-gray-900 capitalize">{currentMonth.shortName}</h2>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-3xl font-bold text-gray-900">
                R$ {formatCurrency(currentMonth.income)}
              </span>
            </div>

            <div className="text-sm text-gray-600">
              {currentMonth.count} {currentMonth.count === 1 ? 'reservation' : 'reservations'} · {currentMonth.nights} nights · {currentMonth.occupation}% occupation
            </div>
          </div>
        </button>

        {/* Next Months Preview - Clickable Rows */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h3 className="text-md font-semibold text-gray-900">NEXT UP</h3>

          <div className="space-y-2">
            {nextMonths.map((month) => (
              <button
                key={month.key}
                onClick={() => handleMonthClick(month.key)}
                className="w-full flex justify-between items-center py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-sm font-medium text-gray-700 capitalize">{month.shortName}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    R$ {formatCurrency(month.income)} | {month.occupation}%
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* YoY Chart Placeholder */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Year over Year</h3>
          <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-sm">Chart coming soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
