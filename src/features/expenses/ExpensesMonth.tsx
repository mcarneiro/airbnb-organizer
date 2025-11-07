import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { useMemo } from 'react';
import { formatMonth } from '../../utils/taxCalculations';
import { formatCurrency } from '../../utils/currency';
import MonthNavigation from '../../components/MonthNavigation';

export default function ExpensesMonth() {
  const navigate = useNavigate();
  const { month } = useParams<{ month: string }>();
  const expenses = useAppSelector(state => state.expenses.items);

  // Filter expenses for the selected month
  const monthExpenses = useMemo(() => {
    if (!month) return [];
    return expenses.filter(e => formatMonth(e.date) === month);
  }, [expenses, month]);

  // Calculate total
  const total = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [monthExpenses]);

  // Group by category
  const byCategory = useMemo(() => {
    const grouped = new Map<string, number>();
    monthExpenses.forEach(expense => {
      const current = grouped.get(expense.category) || 0;
      grouped.set(expense.category, current + expense.amount);
    });
    return grouped;
  }, [monthExpenses]);

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
        <h1 className="text-xl font-bold text-gray-900 flex-1">Expenses</h1>
        <button
          onClick={() => navigate('/expenses/new')}
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
        {/* Summary Card */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Summary</h2>

          <div>
            <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
            <div className="text-3xl font-bold text-red-600">
              R$ {formatCurrency(total)}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {monthExpenses.length} {monthExpenses.length === 1 ? 'expense' : 'expenses'}
            </div>
          </div>

          {/* Category Breakdown */}
          {byCategory.size > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">By Category</h3>
              <div className="space-y-2">
                {Array.from(byCategory.entries()).map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{category}</span>
                    <span className="font-semibold text-gray-900">
                      R$ {formatCurrency(amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-md font-semibold text-gray-900">Expenses</h3>
          </div>

          {monthExpenses.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No expenses for this month</p>
              <button
                onClick={() => navigate('/expenses/new')}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Add an expense
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {monthExpenses.map((expense) => (
                <div key={expense.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-gray-900">
                          {formatDate(expense.date)}
                        </span>
                        <span className="text-sm px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                          {expense.category}
                        </span>
                      </div>

                      {expense.notes && (
                        <div className="mt-1 text-sm text-gray-600">
                          {expense.notes}
                        </div>
                      )}

                      <div className="mt-2">
                        <span className="font-bold text-red-600">
                          R$ {formatCurrency(expense.amount)}
                        </span>
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
    </div>
  );
}
