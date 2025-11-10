import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { addReservation, updateReservation, deleteReservation } from '../../store/reservationsSlice';
import { formatCurrency } from '../../utils/currency';
import { formatMonth } from '../../utils/taxCalculations';

export default function NewReservation() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { month, id } = useParams<{ month?: string; id?: string }>();
  const settings = useAppSelector(state => state.settings.settings);
  const reservations = useAppSelector(state => state.reservations.items);

  // Check if we're editing an existing reservation
  const isEditMode = !!id;
  const existingReservation = isEditMode ? reservations.find(r => r.id === id) : null;

  // Calculate initial date based on month parameter
  const getInitialDate = (): string => {
    if (existingReservation) {
      // Edit mode: use existing date
      const date = existingReservation.date;
      const year = date.getFullYear();
      const monthNum = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${monthNum}-${day}`;
    }

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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (existingReservation) {
      const date = existingReservation.date;
      const year = date.getFullYear();
      const monthNum = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${monthNum}-${day}`;

      setFormData({
        date: dateString,
        nights: existingReservation.nights.toString(),
        total: existingReservation.total.toString(),
      });
    }
  }, [existingReservation]);

  const handleDelete = () => {
    if (!existingReservation) return;

    dispatch(deleteReservation(existingReservation.id));

    // Navigate back to reservations list for this reservation's month
    const reservationMonth = formatMonth(existingReservation.date);
    navigate(`/reservations/${reservationMonth}`);
  };

  // Calculate splits directly from form data
  const total = parseFloat(formData.total) || 0;
  const ownerAmount = total * settings.ownerSplit;
  const adminFee = total * settings.adminSplit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse date as local date to avoid timezone issues
    const [year, monthNum, day] = formData.date.split('-').map(Number);
    const localDate = new Date(year, monthNum - 1, day);

    if (isEditMode && existingReservation) {
      // Edit mode: update existing reservation
      const updatedReservation = {
        id: existingReservation.id,
        date: localDate,
        nights: parseInt(formData.nights),
        total: parseFloat(formData.total),
        ownerAmount,
        adminFee,
      };

      dispatch(updateReservation(updatedReservation));

      // Navigate back to reservations list for this reservation's month
      const reservationMonth = formatMonth(localDate);
      navigate(`/reservations/${reservationMonth}`);
    } else {
      // Create mode: add new reservation
      const reservation = {
        id: crypto.randomUUID(),
        date: localDate,
        nights: parseInt(formData.nights),
        total: parseFloat(formData.total),
        ownerAmount,
        adminFee,
      };

      dispatch(addReservation(reservation));

      // Navigate back to the month page
      if (month) {
        navigate(`/reservations/${month}`);
      } else {
        navigate('/');
      }
    }
  };

  const isFormValid = formData.date && formData.nights && formData.total;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => {
            if (isEditMode && existingReservation) {
              navigate(`/reservations/${formatMonth(existingReservation.date)}`);
            } else {
              navigate('/');
            }
          }}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">
          {isEditMode ? t('reservations.edit') : t('reservations.new')}
        </h1>
      </header>

      <div className="px-4 py-6 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Input */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
              {t('reservations.checkinDate')}
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
              {t('reservations.numberOfNights')}
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
              {t('reservations.totalAmount')}
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
              <h3 className="text-sm font-semibold text-blue-900">{t('reservations.distribution')}</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">{t('reservations.owner')} ({(settings.ownerSplit * 100).toFixed(0)}%):</span>
                  <span className="font-semibold text-blue-900">
                    R$ {formatCurrency(ownerAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">{t('reservations.admin')} ({(settings.adminSplit * 100).toFixed(0)}%):</span>
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
            {isEditMode ? t('reservations.saveButton') : t('reservations.addButton')}
          </button>

          {/* Delete Button - Only in Edit Mode */}
          {isEditMode && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              {t('reservations.removeButton')}
            </button>
          )}
        </form>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t('reservations.confirmRemove')}</h3>
              <p className="text-sm text-gray-600 mb-6">
                {t('reservations.removeWarning')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  {t('reservations.yesRemove')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
