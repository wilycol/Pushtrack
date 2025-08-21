import React from 'react';

interface Kpi {
  title: string;
  value: string | number;
}

interface KPIsProps {
  data: Kpi[];
}

const KPIs: React.FC<KPIsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-2">
      {data.map((kpi) => (
        <div key={kpi.title} className="bg-slate-800/50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-slate-100">{kpi.value}</p>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{kpi.title}</p>
        </div>
      ))}
    </div>
  );
};

export default KPIs;
