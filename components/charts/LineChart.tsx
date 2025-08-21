import React from 'react';
import { useTranslation } from 'react-i18next';

interface DataPoint {
  date: string;
  [key: string]: number | string;
}

interface Series {
    key: string;
    name: string;
    color: string;
    dashed?: boolean;
}

interface LineChartProps {
  data: DataPoint[];
}

const LineChart: React.FC<LineChartProps> = ({ data }) => {
  const { t } = useTranslation('common');
  
  const series: Series[] = [
    { key: 'Real', name: t('reports.burndown.real'), color: '#ef4444' }, // Red
    { key: 'Ideal', name: t('reports.burndown.ideal'), color: '#4b5563', dashed: true }, // Gray
  ];
  
  if (!data || data.length < 2) {
    return <div className="text-center text-sm text-slate-500">Not enough data to draw a line.</div>;
  }

  const width = 500;
  const height = 200;
  const margin = { top: 10, right: 10, bottom: 40, left: 30 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const allValues = data.flatMap(d => series.map(s => d[s.key] as number));
  const yMax = Math.max(...allValues, 0);
  const xMax = data.length - 1;

  const xScale = (index: number) => (index / xMax) * chartWidth;
  const yScale = (value: number) => chartHeight - (value / yMax) * chartHeight;

  const linePath = (seriesKey: string) => {
    let path = `M ${xScale(0)},${yScale(data[0][seriesKey] as number)}`;
    for (let i = 1; i < data.length; i++) {
      path += ` L ${xScale(i)},${yScale(data[i][seriesKey] as number)}`;
    }
    return path;
  };

  const yAxisLabels = Array.from({ length: 5 }, (_, i) => {
    const value = (yMax / 4) * i;
    return {
      value: Math.round(value),
      y: yScale(value),
    };
  });
  
  const xAxisLabels = data.length > 7
    ? [data[0], data[Math.floor(data.length / 2)], data[data.length - 1]]
    : data;

  return (
    <div className="w-full h-full flex flex-col items-center p-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Y-axis grid lines */}
          {yAxisLabels.map(label => (
            <line
              key={`grid-${label.value}`}
              x1="0"
              x2={chartWidth}
              y1={label.y}
              y2={label.y}
              stroke="#22304A"
              strokeWidth="1"
            />
          ))}

          {/* Lines */}
          {series.map(s => (
            <path
              key={s.key}
              d={linePath(s.key)}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeDasharray={s.dashed ? '4 4' : 'none'}
            />
          ))}
          
          {/* Y-axis labels */}
          {yAxisLabels.map(label => (
            <text
              key={`label-y-${label.value}`}
              x="-5"
              y={label.y}
              dy="0.32em"
              textAnchor="end"
              fontSize="10"
              fill="#94a3b8"
            >
              {label.value}
            </text>
          ))}
          
          {/* X-axis labels */}
          {xAxisLabels.map((d, i) => {
             const actualIndex = data.findIndex(item => item.date === d.date);
             return (
              <text
                key={`label-x-${i}`}
                x={xScale(actualIndex)}
                y={chartHeight + 15}
                dy="0.71em"
                textAnchor="middle"
                fontSize="10"
                fill="#94a3b8"
              >
                {new Date(d.date + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
              </text>
            )
          })}
        </g>
      </svg>
      <div className="flex items-center justify-center space-x-4 mt-2 text-xs">
        {series.map(s => (
            <div key={s.name} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-1.5" style={{backgroundColor: s.color}}></div>
                <span className="text-slate-300">{s.name}</span>
            </div>
        ))}
      </div>
    </div>
  );
};

export default LineChart;