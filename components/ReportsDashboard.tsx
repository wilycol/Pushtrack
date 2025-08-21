import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PushtrackTask, User, Project, ReportDefinition, ReportFilter, Estado, ReportSchedule } from '../types';
import { PlusCircleIcon, CalendarDaysIcon, ClockIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { getPreconfiguredReports } from '../utils/reports/preconfiguredReports';
import ReportCard from './ReportCard';
import ReportBuilderModal from './ReportBuilderModal';
import ScheduleReportModal from './ScheduleReportModal';
import ReportsHistoryView from './ReportsHistoryView';
import ReportModal from './ReportModal';
import * as scheduler from '../utils/reports/reportScheduler';
import { runQuery } from '../utils/reports/queryEngine';
import * as exporter from '../utils/reports/exporter';


interface ReportsDashboardProps {
  tickets: PushtrackTask[];
  users: User[];
  projects: Project[];
}

const REPORTS_PER_PAGE = 4;

const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ tickets, users, projects }) => {
  const { t } = useTranslation('common');
  const [reports, setReports] = useState<ReportDefinition[]>([]);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [view, setView] = useState<'reports' | 'history'>('reports');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [reportToEdit, setReportToEdit] = useState<ReportDefinition | null>(null);
  const [scheduleToEdit, setScheduleToEdit] = useState<ReportSchedule | null>(null);
  const [initialReportId, setInitialReportId] = useState<string | undefined>(undefined);
  const [enlargedReport, setEnlargedReport] = useState<ReportDefinition | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const [filters, setFilters] = useState<ReportFilter>({
    dateRange: { start: null, end: null },
    estado: 'all',
    responsable_email: 'all',
    project_key: 'all',
    search: '',
    dateFilterType: 'created',
  });

  useEffect(() => {
    try {
      const savedReports = localStorage.getItem('pushtrack_reports');
      if (savedReports) {
        setReports(JSON.parse(savedReports));
      } else {
        setReports(getPreconfiguredReports(t));
      }
    } catch (error) {
      console.error("Failed to load reports from localStorage:", error);
      setReports(getPreconfiguredReports(t));
    }
    setSchedules(scheduler.getSchedules());
  }, [t]);

  // Simulation Runner Effect
  useEffect(() => {
    const runScheduledTasks = async () => {
        const dueSchedules = scheduler.checkAndRunSchedules();
        if (dueSchedules.length > 0) {
            console.log(`[Scheduler] Found ${dueSchedules.length} due schedules to run.`);
            for (const schedule of dueSchedules) {
                console.log(`[Scheduler] Running: ${schedule.name}`);
                for (const reportId of schedule.reportIds) {
                    const reportDef = reports.find(r => r.id === reportId);
                    if (reportDef) {
                        const reportData = runQuery(reportDef, tickets, users, projects, filters, t);
                        try {
                            switch (schedule.format) {
                                case 'csv': await exporter.exportToCSV(reportDef, reportData, t, filters, 'scheduled'); break;
                                case 'json': await exporter.exportToJSON(reportDef, reportData, filters, 'scheduled'); break;
                                case 'xlsx': await exporter.exportToXLSX(reportDef, reportData, t, filters, 'scheduled'); break;
                                case 'pdf': 
                                    // For PDF, we can't generate from a DOM element, so we log it without content.
                                    // A more advanced implementation might use a server-side renderer.
                                    console.log(`[Scheduler] PDF export for "${reportDef.name}" logged without content.`);
                                    break;
                            }
                        } catch (e) {
                            console.error(`[Scheduler] Error exporting report ${reportDef.name}:`, e);
                        }
                    }
                }
                scheduler.updateLastRun(schedule.id);
            }
            // Refresh state to reflect new lastRunAt
            setSchedules(scheduler.getSchedules());
        }
    };
    const interval = setInterval(runScheduledTasks, 60000); // Check every minute
    return () => clearInterval(interval);
}, [reports, tickets, users, projects, filters, t]);


  useEffect(() => {
    try {
      localStorage.setItem('pushtrack_reports', JSON.stringify(reports));
    } catch (error) {
      console.error("Failed to save reports to localStorage:", error);
    }
  }, [reports]);

  const allReportDefinitions = useMemo(() => {
    return [...getPreconfiguredReports(t), ...reports.filter(r => !r.id.startsWith('pre-'))];
  }, [reports, t]);

  const totalPages = Math.ceil(reports.length / REPORTS_PER_PAGE);
  const paginatedReports = reports.slice(currentPage * REPORTS_PER_PAGE, (currentPage + 1) * REPORTS_PER_PAGE);

  useEffect(() => {
      if (currentPage >= totalPages && totalPages > 0) {
          setCurrentPage(totalPages - 1);
      }
  }, [totalPages, currentPage]);


  const handleOpenBuilder = (report?: ReportDefinition) => {
    setReportToEdit(report || null);
    setIsBuilderOpen(true);
  };
  
  const handleOpenScheduler = (report?: ReportDefinition) => {
    setScheduleToEdit(null);
    setInitialReportId(report?.id);
    setIsSchedulerOpen(true);
  };

  const handleSaveReport = (report: ReportDefinition) => {
    if (reportToEdit) {
      setReports(prev => prev.map(r => (r.id === report.id ? report : r)));
    } else {
      setReports(prev => [...prev, report]);
    }
    setIsBuilderOpen(false);
    setReportToEdit(null);
  };

  const handleSaveSchedule = (schedule: ReportSchedule) => {
    scheduler.saveSchedule(schedule);
    setSchedules(scheduler.getSchedules()); // Refresh state
  };
  
  const handleDeleteSchedule = (id: string) => {
    scheduler.deleteSchedule(id);
    setSchedules(scheduler.getSchedules());
  };
  
  const handleToggleSchedule = (id: string, active: boolean) => {
      const schedule = schedules.find(s => s.id === id);
      if(schedule) {
          scheduler.saveSchedule({...schedule, active});
          setSchedules(scheduler.getSchedules());
      }
  };
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFilters(prev => ({
          ...prev,
          dateRange: {
              ...prev.dateRange,
              [name]: value ? value : null
          }
      }));
  };
  
  const activeScheduledReportIds = useMemo(() => {
    return new Set(
        schedules.filter(s => s.active).flatMap(s => s.reportIds)
    );
  }, [schedules]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <h1 className="text-3xl font-bold text-slate-100">{view === 'reports' ? t('reports.title') : t('reports.history.title')}</h1>
          <div className="flex items-center gap-2">
            <button
                onClick={() => setView(view === 'reports' ? 'history' : 'reports')}
                className="inline-flex items-center gap-x-2 rounded-md bg-slate-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600"
                >
                <ClockIcon className="h-5 w-5" />
                {view === 'reports' ? t('reports.history.viewHistory') : t('reports.history.backToReports')}
            </button>
            <button
              onClick={() => handleOpenScheduler()}
              className="inline-flex items-center gap-x-2 rounded-md bg-slate-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600"
            >
              <CalendarDaysIcon className="h-5 w-5" />
              {t('reports.manageSchedules')}
            </button>
            <button
              onClick={() => handleOpenBuilder()}
              className="inline-flex items-center gap-x-2 rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400"
            >
              <PlusCircleIcon className="h-5 w-5" />
              {t('reports.newReport')}
            </button>
          </div>
        </div>
        
        {view === 'reports' && (
            <div className="bg-[#0F1626] p-4 rounded-xl shadow-lg border border-[#22304A] space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input
                        name="search"
                        type="text"
                        placeholder={t('reports.filters.searchPlaceholder') || ''}
                        value={filters.search}
                        onChange={handleFilterChange}
                        className="w-full bg-[#121A2B] border border-[#22304A] rounded-md text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-500 lg:col-span-2"
                    />
                     <input
                        name="start"
                        type="date"
                        value={filters.dateRange.start || ''}
                        onChange={handleDateChange}
                        className="w-full bg-[#121A2B] border border-[#22304A] rounded-md text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                     <input
                        name="end"
                        type="date"
                        value={filters.dateRange.end || ''}
                        onChange={handleDateChange}
                        className="w-full bg-[#121A2B] border border-[#22304A] rounded-md text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2 bg-[#121A2B] border border-[#22304A] rounded-md px-3">
                        <label htmlFor="dateFilterType" className="text-sm text-slate-400 shrink-0">{t('reports.filters.dateFilterType')}:</label>
                        <select id="dateFilterType" name="dateFilterType" value={filters.dateFilterType} onChange={handleFilterChange} className="w-full bg-transparent border-0 text-sm text-slate-200 focus:ring-0">
                            <option value="created">{t('reports.filters.byCreationDate')}</option>
                            <option value="closed">{t('reports.filters.byClosingDate')}</option>
                        </select>
                    </div>
                     <select name="project_key" value={filters.project_key} onChange={handleFilterChange} className="bg-[#121A2B] border border-[#22304A] rounded-md text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="all">{t('reports.filters.allProjects')}</option>
                        {projects.map(p => <option key={p.project_key} value={p.project_key}>{p.name}</option>)}
                    </select>
                    <select name="estado" value={filters.estado} onChange={handleFilterChange} className="bg-[#121A2B] border border-[#22304A] rounded-md text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="all">{t('reports.filters.allStates')}</option>
                        {Object.values(Estado).map(e => <option key={e} value={e}>{t(`enums.status.${e}`)}</option>)}
                    </select>
                    <select name="responsable_email" value={filters.responsable_email} onChange={handleFilterChange} className="bg-[#121A2B] border border-[#22304A] rounded-md text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500">
                        <option value="all">{t('reports.filters.allAssignees')}</option>
                        {users.map(u => <option key={u.email} value={u.email}>{u.full_name}</option>)}
                    </select>
                </div>
            </div>
        )}
        
        {view === 'reports' ? (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-4">
                  {paginatedReports.map(report => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      tickets={tickets}
                      users={users}
                      projects={projects}
                      filters={filters}
                      onEdit={() => handleOpenBuilder(report)}
                      onSchedule={() => handleOpenScheduler(report)}
                      onEnlarge={() => setEnlargedReport(report)}
                      isScheduled={activeScheduledReportIds.has(report.id)}
                    />
                  ))}
                </div>
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-4">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                            disabled={currentPage === 0}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600 disabled:opacity-50"
                        >
                            <ChevronLeftIcon className="h-4 w-4" />
                            {t('reports.pagination.previous')}
                        </button>
                        <span className="text-sm font-medium text-slate-400">
                            {t('reports.pagination.page', { current: currentPage + 1, total: totalPages })}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={currentPage >= totalPages - 1}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600 disabled:opacity-50"
                        >
                            {t('reports.pagination.next')}
                            <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </>
        ) : (
            <ReportsHistoryView allReports={allReportDefinitions} />
        )}

      </div>
      {isBuilderOpen && (
        <ReportBuilderModal
          isOpen={isBuilderOpen}
          onClose={() => setIsBuilderOpen(false)}
          onSave={handleSaveReport}
          reportToEdit={reportToEdit}
        />
      )}
      {isSchedulerOpen && (
        <ScheduleReportModal
          isOpen={isSchedulerOpen}
          onClose={() => {
            setIsSchedulerOpen(false);
            setScheduleToEdit(null);
            setInitialReportId(undefined);
          }}
          onSave={handleSaveSchedule}
          onDelete={handleDeleteSchedule}
          onToggle={handleToggleSchedule}
          schedules={schedules}
          allReports={allReportDefinitions}
          scheduleToEdit={scheduleToEdit}
          initialReportId={initialReportId}
          setScheduleToEdit={setScheduleToEdit}
        />
      )}
      {enlargedReport && (
        <ReportModal
            isOpen={!!enlargedReport}
            onClose={() => setEnlargedReport(null)}
            report={enlargedReport}
            tickets={tickets}
            users={users}
            projects={projects}
            filters={filters}
        />
      )}
    </>
  );
};

export default ReportsDashboard;