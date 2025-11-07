import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { YearOverYearData } from '../utils/yoyCalculations';
import { formatCurrency } from '../utils/currency';

interface YearOverYearChartProps {
  data: YearOverYearData[];
  currentYear: number | null;
  previousYear: number | null;
}

export default function YearOverYearChart({ data, currentYear, previousYear }: YearOverYearChartProps) {
  // If no data, show empty state
  if (data.length === 0 || !currentYear) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 flex items-center justify-center h-64">
        <p className="text-gray-500 text-sm">No data available for year-over-year comparison</p>
      </div>
    );
  }

  const currentYearKey = `year${currentYear}`;
  const previousYearKey = previousYear ? `year${previousYear}` : null;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold text-gray-900 mb-2">{payload[0].payload.monthName}</p>
          {payload.map((entry: any, index: number) => {
            const year = entry.dataKey.replace('year', '');
            const isCurrent = entry.dataKey === currentYearKey;
            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className={isCurrent ? 'font-medium text-gray-900' : 'text-gray-600'}>
                  {year}: R$ {formatCurrency(entry.value)}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Year over Year</h2>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            {/* Hidden Y-axis to set domain */}
            <YAxis domain={[0, 'dataMax']} hide />

            {/* Tooltip */}
            <Tooltip content={<CustomTooltip />} />

            {/* Previous year area (gray) */}
            {previousYearKey && (
              <Area
                type="monotone"
                dataKey={previousYearKey}
                stroke="#9ca3af"
                strokeWidth={2}
                fill="#e5e7eb"
                fillOpacity={0.3}
              />
            )}

            {/* Current year area (blue) */}
            <Area
              type="monotone"
              dataKey={currentYearKey}
              stroke="#3b82f6"
              strokeWidth={2}
              fill="#60a5fa"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm font-medium text-gray-900">{currentYear}</span>
        </div>
        {previousYear && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-sm text-gray-600">{previousYear}</span>
          </div>
        )}
      </div>
    </div>
  );
}
