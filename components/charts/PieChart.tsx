import React from 'react';

interface PieChartProps {
  data: { label: string; value: number }[];
}

const PieChart: React.FC<PieChartProps> = ({ data }) => {
  const colors = ['#818cf8', '#a78bfa', '#f472b6', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#60a5fa'];
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return <div className="text-center text-sm text-slate-500">No data to display</div>;
  }

  let cumulativePercent = 0;

  const segments = data.map((item, index) => {
    const percent = (item.value / total) * 100;
    const dashArray = `${percent} ${100 - percent}`;
    const dashOffset = 25 - cumulativePercent;
    cumulativePercent += percent;

    return {
      ...item,
      percent,
      color: colors[index % colors.length],
      dashArray,
      dashOffset,
    };
  });

  return (
    <div className="flex flex-col md:flex-row items-center justify-center w-full h-full gap-4 p-2">
      <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
        <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
          {segments.map((segment, index) => (
            <circle
              key={index}
              cx="18"
              cy="18"
              r="15.9155"
              fill="transparent"
              stroke={segment.color}
              strokeWidth="3.8"
              strokeDasharray={segment.dashArray}
              strokeDashoffset={segment.dashOffset}
              role="presentation"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-slate-100">{total}</span>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto max-h-48">
        <ul className="space-y-1 text-xs">
          {segments.map((segment, index) => (
            <li key={index} className="flex items-center">
              <span
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: segment.color }}
              ></span>
              <span className="text-slate-300 font-medium mr-1">{segment.label}:</span>
              <span className="text-slate-100 font-semibold">{segment.value}</span>
              <span className="text-slate-400 ml-1.5">({segment.percent.toFixed(1)}%)</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PieChart;