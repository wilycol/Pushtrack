import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportDefinition, PushtrackTask, User, Project, ReportFilter } from '../types';
import { XMarkIcon, DocumentChartBarIcon } from './icons';
import { runQuery } from '../utils/reports/queryEngine';
import BarChart from './charts/BarChart';
import KPIs from './charts/KPIs';
import PieChart from './charts/PieChart';
import LineChart from './charts/LineChart';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportDefinition;
  tickets: PushtrackTask[];
  users: User[];
  projects: Project[];
  filters: ReportFilter;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, report, tickets, users, projects, filters }) => {
  const { t } = useTranslation('common');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const reportData = useMemo(() => {
    return runQuery(report, tickets, users, projects, filters, t);
  }, [report, tickets, users, projects, filters, t]);

  const renderWidget = () => {
    if (!reportData || (Array.isArray(reportData) && reportData.length === 0)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500">
          <DocumentChartBarIcon className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium">{t('reports.card.noData')}</p>
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
        return <p className="text-center text-amber-400">{t('reports.card.unsupported')}</p>;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div
        className="relative bg-[#121A2B] rounded-xl shadow-2xl w-full max-w-3xl flex flex-col h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#22304A]">
          <h2 id="report-modal-title" className="text-lg font-bold text-slate-100">{report.name}</h2>
          <button onClick={onClose} title={t('tooltips.closeModal') || ''} className="p-1 rounded-full hover:bg-slate-700">
            <XMarkIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <div className="p-6 flex-grow min-h-0 flex items-center justify-center">
          {renderWidget()}
        </div>
      </div>
    </div>
  );
};

export default ReportModal;