import React, { useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportDefinition, PushtrackTask, User, Project, ReportFilter } from '../types';
import { PencilIcon, DocumentChartBarIcon, DownloadIcon, ClockIcon, MagnifyingGlassPlusIcon } from './icons';
import { runQuery } from '../utils/reports/queryEngine';
import * as exporter from '../utils/reports/exporter';
import BarChart from './charts/BarChart';
import KPIs from './charts/KPIs';
import PieChart from './charts/PieChart';
import LineChart from './charts/LineChart';

interface ReportCardProps {
  report: ReportDefinition;
  tickets: PushtrackTask[];
  users: User[];
  projects: Project[];
  filters: ReportFilter;
  onEdit: () => void;
  onSchedule: () => void;
  onEnlarge: () => void;
  isScheduled: boolean;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, tickets, users, projects, filters, onEdit, onSchedule, onEnlarge, isScheduled }) => {
  const { t } = useTranslation('common');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const reportData = useMemo(() => {
    return runQuery(report, tickets, users, projects, filters, t);
  }, [report, tickets, users, projects, filters, t]);

  const handleExport = async (format: 'csv' | 'json' | 'xlsx' | 'pdf') => {
    setIsExportMenuOpen(false);
    if (!reportData) return;

    switch (format) {
      case 'csv':
        await exporter.exportToCSV(report, reportData, t, filters, 'manual');
        break;
      case 'json':
        await exporter.exportToJSON(report, reportData, filters, 'manual');
        break;
      case 'xlsx':
        await exporter.exportToXLSX(report, reportData, t, filters, 'manual');
        break;
      case 'pdf':
        await exporter.exportToPDF(report, cardRef.current, filters, 'manual');
        break;
    }
  };

  const renderWidget = () => {
    if (!reportData || (Array.isArray(reportData) && reportData.length === 0)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
          <DocumentChartBarIcon className="w-12 h-12 mb-2" />
          <p className="text-sm font-medium">{t('reports.card.noData')}</p>
        </div>
      );
    }
    
    switch (report.widget) {
      case 'bar':
        return <BarChart data={reportData} />;
      case 'pie':
        return <PieChart data={reportData} />;
      case 'kpi':
        return <KPIs data={reportData} />;
      case 'line':
        return <LineChart data={reportData} />;
      default:
        return <p className="text-center text-sm text-amber-400">{t('reports.card.unsupported')}</p>;
    }
  };

  return (
    <div ref={cardRef} className="bg-[#111213] rounded-2xl border border-white/5 shadow-lg p-4 flex flex-col h-80">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          {isScheduled && <span title={t('tooltips.reportScheduled') || ''}><ClockIcon className="w-4 h-4 text-indigo-400" /></span>}
          <h3 className="text-base font-semibold text-slate-100">{report.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEnlarge} title={t('tooltips.enlargeReport') || ''} className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <MagnifyingGlassPlusIcon className="w-4 h-4" />
          </button>
          <button onClick={onEdit} className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <PencilIcon className="w-4 h-4" />
          </button>
          <div className="relative">
            <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
              <DownloadIcon className="w-4 h-4" />
            </button>
            {isExportMenuOpen && (
              <div 
                onMouseLeave={() => setIsExportMenuOpen(false)}
                className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-[#1B2437] ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <button onClick={() => handleExport('csv')} className="w-full text-left text-slate-200 block px-4 py-2 text-sm hover:bg-slate-600">{t('reports.card.exportCSV')}</button>
                  <button onClick={() => handleExport('json')} className="w-full text-left text-slate-200 block px-4 py-2 text-sm hover:bg-slate-600">{t('reports.card.exportJSON')}</button>
                  <button onClick={() => handleExport('xlsx')} className="w-full text-left text-slate-200 block px-4 py-2 text-sm hover:bg-slate-600">{t('reports.card.exportXLSX')}</button>
                  <button onClick={() => handleExport('pdf')} className="w-full text-left text-slate-200 block px-4 py-2 text-sm hover:bg-slate-600">{t('reports.card.exportPDF')}</button>
                  <div className="border-t border-slate-700 my-1"></div>
                  <button onClick={onSchedule} className="w-full text-left text-slate-200 block px-4 py-2 text-sm hover:bg-slate-600">{t('reports.card.schedule')}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex-grow min-h-0 flex items-center justify-center">
        {renderWidget()}
      </div>
    </div>
  );
};

export default ReportCard;