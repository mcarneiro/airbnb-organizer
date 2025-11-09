import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addExpense, updateExpense } from '../../store/expensesSlice';
import { ExpenseCategory } from '../../types';
import { formatMonth } from '../../utils/taxCalculations';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'IPTU',
  'Condomínio',
  'Luz',
  'Internet',
  'Gas',
  'Manutenção',
];

export default function NewExpense() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { month, id } = useParams<{ month?: string; id?: string }>();
  const expenses = useAppSelector(state => state.expenses.items);

  // Check if we're editing an existing expense
  const isEditMode = !!id;
  const existingExpense = isEditMode ? expenses.find(e => e.id === id) : null;

  const [formData, setFormData] = useState({
    amount: '',
    category: '' as ExpenseCategory | '',
    notes: '',
  });

  // Pre-fill form when editing
  useEffect(() => {
    if (existingExpense) {
      setFormData({
        amount: existingExpense.amount.toString(),
        category: existingExpense.category || '',
        notes: existingExpense.notes || '',
      });
    }
  }, [existingExpense]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditMode && existingExpense) {
      // Edit mode: update existing expense
      const updatedExpense = {
        id: existingExpense.id,
        date: existingExpense.date,
        amount: parseFloat(formData.amount),
        category: formData.category || undefined,
        notes: formData.notes || undefined,
      };

      dispatch(updateExpense(updatedExpense));

      // Navigate back to expenses list for this expense's month
      const expenseMonth = formatMonth(existingExpense.date);
      navigate(`/expenses/${expenseMonth}`);
    } else {
      // Create mode: add new expense
      if (!month) return;

      // Create date from month parameter (first day of month)
      const [year, monthNum] = month.split('-');
      const expenseDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);

      const expense = {
        id: crypto.randomUUID(),
        date: expenseDate,
        amount: parseFloat(formData.amount),
        category: formData.category || undefined,
        notes: formData.notes || undefined,
      };

      dispatch(addExpense(expense));

      // Navigate back to expenses list for this month
      navigate(`/expenses/${month}`);
    }
  };

  const isFormValid = formData.amount;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => {
            if (isEditMode && existingExpense) {
              navigate(`/expenses/${formatMonth(existingExpense.date)}`);
            } else {
              navigate('/expenses');
            }
          }}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          {isEditMode ? 'Editar Despesa' : 'Nova Despesa'}
        </h1>
      </header>

      <div className="px-4 py-6 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Input */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Valor (R$)
            </label>
            <input
              type="number"
              id="amount"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ex: 150.00"
              required
            />
          </div>

          {/* Category Select */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Categoria (opcional)
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione uma categoria</option>
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Notes Input */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Observações (opcional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Adicione detalhes, especialmente para itens de manutenção..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isEditMode ? 'Salvar Alterações' : 'Adicionar Despesa'}
          </button>
        </form>
      </div>
    </div>
  );
}
