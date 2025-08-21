import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportDefinition, WidgetType, PredefinedQueryId, BurndownParams, Estado } from '../types';
import { XMarkIcon, ChartBarIcon, ChartPieIcon, TableCellsIcon, DocumentChartBarIcon, PresentationChartLineIcon } from './icons';

interface ReportBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (report: ReportDefinition) => void;
  reportToEdit?: ReportDefinition | null;
}

const queryWidgetCompatibility: Record<PredefinedQueryId, WidgetType[]> = {
    'pqr_by_status': ['bar', 'pie'],
    'sla_compliance': ['kpi'],
    'backlog_aging': ['bar'],
    'load_by_assignee': ['bar'],
    'first_response_time_avg': ['kpi'],
    'throughput': ['bar'],
    'burn_down_chart': ['line'],
};


const ReportBuilderModal: React.FC<ReportBuilderModalProps> = ({ isOpen, onClose, onSave, reportToEdit }) => {
  const { t } = useTranslation('common');
  const [name, setName] = useState('');
  const [widget, setWidget] = useState<WidgetType>('bar');
  const [queryId, setQueryId] = useState<PredefinedQueryId>('pqr_by_status');
  
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [burndownParams, setBurndownParams] = useState<BurndownParams>({
      estado: Estado.InProgress,
      from: fourteenDaysAgo.toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0],
      soloHabiles: true,
      alcance: 'baseline',
  });
  
  const [isDateRangeValid, setIsDateRangeValid] = useState(true);

  useEffect(() => {
    if (reportToEdit) {
      setName(reportToEdit.name);
      setWidget(reportToEdit.widget);
      setQueryId(reportToEdit.queryId);
      if (reportToEdit.burndownParams) {
          setBurndownParams(reportToEdit.burndownParams);
      }
    } else {
      setName('');
      setQueryId('pqr_by_status');
      setWidget(queryWidgetCompatibility['pqr_by_status'][0]);
       setBurndownParams({
          estado: Estado.InProgress,
          from: fourteenDaysAgo.toISOString().split('T')[0],
          to: new Date().toISOString().split('T')[0],
          soloHabiles: true,
          alcance: 'baseline',
      });
    }
  }, [reportToEdit, isOpen]);
  
  useEffect(() => {
    if(queryId === 'burn_down_chart') {
        const fromDate = new Date(burndownParams.from);
        const toDate = new Date(burndownParams.to);
        const diffTime = toDate.getTime() - fromDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);
        setIsDateRangeValid(diffDays >= 1);
    } else {
        setIsDateRangeValid(true);
    }
  }, [burndownParams, queryId]);


  useEffect(() => {
    const compatibleWidgets = queryWidgetCompatibility[queryId];
    if (!compatibleWidgets.includes(widget)) {
        setWidget(compatibleWidgets[0]);
    }
  }, [queryId, widget]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newQueryId = e.target.value as PredefinedQueryId;
      setQueryId(newQueryId);
  };
  
  const handleBurndownParamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;
      setBurndownParams(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value,
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !isDateRangeValid) return;

    const newReport: ReportDefinition = {
      id: reportToEdit?.id || `custom-${crypto.randomUUID()}`,
      name,
      widget,
      queryId,
      ...(queryId === 'burn_down_chart' && { burndownParams }),
    };
    onSave(newReport);
  };

  if (!isOpen) return null;

  const queries: { id: PredefinedQueryId; name: string }[] = [
      { id: 'pqr_by_status', name: t('reports.queries.pqr_by_status') },
      { id: 'sla_compliance', name: t('reports.queries.sla_compliance') },
      { id: 'backlog_aging', name: t('reports.queries.backlog_aging') },
      { id: 'load_by_assignee', name: t('reports.queries.load_by_assignee') },
      { id: 'first_response_time_avg', name: t('reports.queries.first_response_time_avg') },
      { id: 'throughput', name: t('reports.queries.throughput')},
      { id: 'burn_down_chart', name: t('reports.queries.burn_down_chart')},
  ];
  
  const allWidgets: { id: WidgetType; name: string, icon: React.ElementType }[] = [
      { id: 'kpi', name: t('reports.builder.widgetTypes.kpi'), icon: DocumentChartBarIcon },
      { id: 'bar', name: t('reports.builder.widgetTypes.bar'), icon: ChartBarIcon },
      { id: 'pie', name: t('reports.builder.widgetTypes.pie'), icon: ChartPieIcon },
      { id: 'line', name: t('reports.builder.widgetTypes.line'), icon: PresentationChartLineIcon },
      { id: 'table', name: t('reports.builder.widgetTypes.table'), icon: TableCellsIcon },
  ];

  const availableWidgets = allWidgets.filter(w => queryWidgetCompatibility[queryId]?.includes(w.id));
  const inputClass = "mt-1 block w-full bg-[#0F1626] border-[#22304A] rounded-md shadow-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500";


  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-[#121A2B] rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-[#22304A]">
          <h2 className="text-lg font-bold text-slate-100">
            {reportToEdit ? t('reports.builder.editTitle') : t('reports.builder.newTitle')}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700">
            <XMarkIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label htmlFor="report-name" className="block text-sm font-medium text-slate-300">{t('reports.builder.name')}</label>
            <input
              id="report-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder={t('reports.builder.namePlaceholder') || ''} className={inputClass} required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">{t('reports.builder.query')}</label>
            <select value={queryId} onChange={handleQueryChange} className={inputClass}>
                {queries.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300">{t('reports.builder.widgetType')}</label>
             <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                {availableWidgets.map(w => {
                    const Icon = w.icon;
                    const isSelected = widget === w.id;
                    return (
                        <button key={w.id} type="button" onClick={() => setWidget(w.id)}
                            className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-colors ${isSelected ? 'bg-indigo-500/10 border-indigo-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}
                        >
                            <Icon className={`w-6 h-6 mb-1 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`}/>
                            <span className={`text-xs font-semibold ${isSelected ? 'text-indigo-300' : 'text-slate-300'}`}>{w.name}</span>
                        </button>
                    );
                })}
            </div>
          </div>

          {queryId === 'burn_down_chart' && (
              <div className="p-3 bg-slate-800/30 rounded-lg space-y-4 border border-slate-700">
                 <h4 className="font-semibold text-slate-200">Parámetros del Burndown</h4>
                  <div>
                      <label className="text-sm text-slate-400">Estado a graficar</label>
                      <select name="estado" value={burndownParams.estado} onChange={handleBurndownParamChange} className={inputClass}>
                          {Object.values(Estado).map(e => <option key={e} value={e}>{t(`enums.status.${e}`)}</option>)}
                      </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <div>
                          <label className="text-sm text-slate-400">Desde</label>
                          <input type="date" name="from" value={burndownParams.from} onChange={handleBurndownParamChange} className={inputClass}/>
                      </div>
                      <div>
                          <label className="text-sm text-slate-400">Hasta</label>
                          <input type="date" name="to" value={burndownParams.to} onChange={handleBurndownParamChange} className={inputClass}/>
                      </div>
                  </div>
                   {!isDateRangeValid && <p className="text-xs text-red-400">El rango del sprint debe ser de al menos 2 días.</p>}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="soloHabiles" name="soloHabiles" checked={burndownParams.soloHabiles} onChange={handleBurndownParamChange} className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500"/>
                        <label htmlFor="soloHabiles" className="text-sm text-slate-300">Solo días hábiles</label>
                    </div>
                     <div className="flex gap-4">
                        <label className="flex items-center gap-1 text-sm text-slate-300">
                            <input type="radio" name="alcance" value="baseline" checked={burndownParams.alcance === 'baseline'} onChange={handleBurndownParamChange}/> Baseline
                        </label>
                         <label className="flex items-center gap-1 text-sm text-slate-300">
                            <input type="radio" name="alcance" value="dynamic" checked={burndownParams.alcance === 'dynamic'} onChange={handleBurndownParamChange}/> Dinámico
                        </label>
                    </div>
                  </div>
              </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="rounded-md bg-transparent px-3 py-2 text-sm font-semibold text-slate-200 ring-1 ring-inset ring-slate-700 hover:bg-slate-800">
              {t('modals.cancel')}
            </button>
            <button type="submit" disabled={!isDateRangeValid} className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 disabled:bg-slate-600 disabled:cursor-not-allowed">
              {reportToEdit ? t('modals.saveChanges') : t('reports.builder.createReport')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportBuilderModal;