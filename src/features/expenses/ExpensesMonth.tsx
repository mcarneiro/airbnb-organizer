import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatMonth } from '../../utils/taxCalculations';
import { formatCurrency } from '../../utils/currency';
import MonthNavigation from '../../components/MonthNavigation';
import { addExpense } from '../../store/expensesSlice';

export default function ExpensesMonth() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { month } = useParams<{ month: string }>();
  const expenses = useAppSelector(state => state.expenses.items);
  const dataLoaded = useAppSelector(state => state.app.dataLoaded);

  // Filter expenses for the selected month
  const monthExpenses = useMemo(() => {
    if (!month) return [];
    return expenses.filter(e => formatMonth(e.date) === month);
  }, [expenses, month]);

  // Calculate total
  const total = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [monthExpenses]);

  // Get previous month's expenses
  const previousMonthExpenses = useMemo(() => {
    if (!month) return [];

    // Parse current month
    const [year, monthNum] = month.split('-').map(Number);

    // Calculate previous month
    let prevYear = year;
    let prevMonth = monthNum - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }

    const previousMonth = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

    return expenses.filter(e => formatMonth(e.date) === previousMonth);
  }, [expenses, month]);

  // Replicate expenses from previous month
  const handleReplicateExpenses = () => {
    if (!month || previousMonthExpenses.length === 0) return;

    // Parse current month to create date (first day of month)
    const [year, monthNum] = month.split('-').map(Number);
    const expenseDate = new Date(year, monthNum - 1, 1);

    // Create new expenses with current month's date
    previousMonthExpenses.forEach((expense) => {
      const newExpense = {
        id: crypto.randomUUID(),
        date: expenseDate,
        amount: expense.amount,
        category: expense.category,
        notes: expense.notes,
      };
      dispatch(addExpense(newExpense));
    });
  };

  if (!month) {
    return null;
  }

  return (
    <div className="bg-gray-50">
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
        <h1 className="text-xl font-bold text-gray-900 flex-1">{t('expenses.title')}</h1>
        <button
          onClick={() => navigate(`/expenses/new/${month}`)}
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
          onMonthChange={(newMonth) => navigate(`/expenses/${newMonth}`)}
        />

        <div className="space-y-6 pb-6">
        {/* Loading State */}
        {!dataLoaded && (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
              <h2 className="text-lg font-semibold text-gray-900">{t('expenses.summary')}</h2>

              <div>
                <div className="text-sm text-gray-600 mb-1">{t('expenses.totalExpenses')}</div>
                <div className="text-3xl font-bold text-red-600">
                  R$ {formatCurrency(total)}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {monthExpenses.length} {t('expenses.expense', { count: monthExpenses.length })}
                </div>
              </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-md font-semibold text-gray-900">{t('expenses.title')}</h3>
          </div>

          {monthExpenses.length === 0 ? (
            <div className="px-6 py-12 text-center space-y-4">
              <p className="text-gray-500">{t('expenses.noExpenses')}</p>
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => navigate(`/expenses/new/${month}`)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t('expenses.addExpense')}
                </button>
                {previousMonthExpenses.length > 0 && (
                  <>
                    <span className="text-gray-400 text-sm">{t('expenses.or')}</span>
                    <button
                      onClick={handleReplicateExpenses}
                      className="text-green-600 hover:text-green-700 font-medium flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {t('expenses.replicateFromPrevious', { count: previousMonthExpenses.length })}
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {monthExpenses.map((expense) => (
                <button
                  key={expense.id}
                  onClick={() => navigate(`/expenses/edit/${expense.id}`)}
                  className="w-full px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-red-600">
                      R$ {formatCurrency(expense.amount)}
                    </span>
                    {expense.category && (
                      <span className="text-sm px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                        {expense.category}
                      </span>
                    )}
                  </div>

                  {expense.notes && (
                    <div className="mt-1 text-sm text-gray-600">
                      {expense.notes}
                    </div>
                  )}
                </button>
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
