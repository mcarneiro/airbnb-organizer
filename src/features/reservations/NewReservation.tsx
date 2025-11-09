import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addReservation } from '../../store/reservationsSlice';
import { formatCurrency } from '../../utils/currency';
import { formatMonth } from '../../utils/taxCalculations';

export default function NewReservation() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { month } = useParams<{ month: string }>();
  const settings = useAppSelector(state => state.settings.settings);

  // Calculate initial date based on month parameter
  const getInitialDate = (): string => {
    if (!month) return '';

    const now = new Date();
    const currentMonth = formatMonth(now);

    if (month === currentMonth) {
      // Current month: use today's date
      const year = now.getFullYear();
      const monthNum = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${monthNum}-${day}`;
    } else {
      // Past or future month: use first day of that month
      const [year, monthNum] = month.split('-');
      return `${year}-${monthNum}-01`;
    }
  };

  const [formData, setFormData] = useState({
    date: getInitialDate(),
    nights: '',
    total: '',
  });

  // Calculate splits directly from form data
  const total = parseFloat(formData.total) || 0;
  const ownerAmount = total * settings.ownerSplit;
  const adminFee = total * settings.adminSplit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create reservation object
    const reservation = {
      id: crypto.randomUUID(),
      date: new Date(formData.date),
      nights: parseInt(formData.nights),
      total: parseFloat(formData.total),
      ownerAmount,
      adminFee,
    };

    // Dispatch to Redux
    dispatch(addReservation(reservation));

    // Navigate back to the month page
    if (month) {
      navigate(`/reservations/${month}`);
    } else {
      navigate('/');
    }
  };

  const isFormValid = formData.date && formData.nights && formData.total;

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
        <h1 className="text-xl font-bold text-gray-900">New Reservation</h1>
      </header>

      <div className="px-4 py-6 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Input */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              Check-in Date
            </label>
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Nights Input */}
          <div>
            <label htmlFor="nights" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Nights
            </label>
            <input
              type="number"
              id="nights"
              min="1"
              value={formData.nights}
              onChange={(e) => setFormData({ ...formData, nights: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 3"
              required
            />
          </div>

          {/* Total Amount Input */}
          <div>
            <label htmlFor="total" className="block text-sm font-medium text-gray-700 mb-2">
              Total Amount (R$)
            </label>
            <input
              type="number"
              id="total"
              min="0"
              step="0.01"
              value={formData.total}
              onChange={(e) => setFormData({ ...formData, total: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 1500.00"
              required
            />
          </div>

          {/* Calculated Splits */}
          {formData.total && (
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <h3 className="text-sm font-semibold text-blue-900">Calculated Amounts</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Owner ({(settings.ownerSplit * 100).toFixed(0)}%):</span>
                  <span className="font-semibold text-blue-900">
                    R$ {formatCurrency(ownerAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Admin ({(settings.adminSplit * 100).toFixed(0)}%):</span>
                  <span className="font-semibold text-blue-900">
                    R$ {formatCurrency(adminFee)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Add Reservation
          </button>
        </form>
      </div>
    </div>
  );
}
