import React from 'react';

interface BarChartProps {
  data: { label: string; value: number }[];
}

const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const maxValue = Math.max(...data.map(item => item.value), 0);
  const colors = ['#818cf8', '#a78bfa', '#f472b6', '#fb923c', '#facc15', '#4ade80'];

  return (
    <div className="space-y-3 p-2">
      {data.map((item, index) => (
        <div key={item.label} className="flex items-center text-sm" role="group" aria-label={`${item.label}: ${item.value}`}>
          <div className="w-2/5 text-slate-300 font-medium pr-2 text-right" title={item.label}>
            {item.label}
          </div>
          <div className="w-3/5 flex items-center">
            <div className="flex-grow bg-slate-700 rounded-full h-4 relative">
              <div
                className="h-4 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%`,
                  backgroundColor: colors[index % colors.length],
                }}
                role="progressbar"
                aria-valuenow={item.value}
                aria-valuemin={0}
                aria-valuemax={maxValue}
              ></div>
            </div>
            <div className="w-10 text-right text-slate-100 font-semibold pl-2">
              {item.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BarChart;