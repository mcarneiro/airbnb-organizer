import { formatMonth, getMonthName, parseMonth } from '../utils/taxCalculations';

interface MonthNavigationProps {
  currentMonth: string;
  onMonthChange: (month: string) => void;
}

export default function MonthNavigation({ currentMonth, onMonthChange }: MonthNavigationProps) {
  const goToPreviousMonth = () => {
    const currentDate = parseMonth(currentMonth);
    const previousMonth = new Date(currentDate);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    onMonthChange(formatMonth(previousMonth));
  };

  const goToNextMonth = () => {
    const currentDate = parseMonth(currentMonth);
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    onMonthChange(formatMonth(nextMonth));
  };

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <button
        onClick={goToPreviousMonth}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>

      <h2 className="text-lg font-bold text-gray-900 min-w-[200px] text-center capitalize">
        {getMonthName(currentMonth)}
      </h2>

      <button
        onClick={goToNextMonth}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
