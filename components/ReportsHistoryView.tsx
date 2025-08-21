import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportHistoryEntry, ReportDefinition } from '../types';
import { getHistory, clearHistory } from '../utils/reports/reportHistory';
import { formatDateTime } from '../utils/helpers';
import { DownloadIcon, TrashIcon, ArrowPathIcon } from './icons';

interface ReportsHistoryViewProps {
    allReports: ReportDefinition[];
}

const ReportsHistoryView: React.FC<ReportsHistoryViewProps> = ({ allReports }) => {
    const { t } = useTranslation('common');
    const [history, setHistory] = useState<ReportHistoryEntry[]>([]);
    const [filters, setFilters] = useState({ date: '', reportId: 'all' });
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    useEffect(() => {
        setHistory(getHistory());
    }, []);

    const filteredHistory = useMemo(() => {
        return history.filter(entry => {
            const entryDate = entry.when.split('T')[0];
            const dateMatch = !filters.date || entryDate === filters.date;
            const reportMatch = filters.reportId === 'all' || entry.reportId === filters.reportId;
            return dateMatch && reportMatch;
        });
    }, [history, filters]);

    const handleClearHistory = () => {
        clearHistory();
        setHistory([]);
        setIsConfirmModalOpen(false);
    };
    
    const handleReDownload = (entry: ReportHistoryEntry) => {
        const byteCharacters = atob(entry.fileContentBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: entry.mimeType });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = entry.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-[#0F1626] p-4 sm:p-6 rounded-xl shadow-lg shadow-black/20">
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
                    <div className="bg-[#121A2B] rounded-lg shadow-xl p-6 w-full max-w-sm">
                        <h3 className="text-lg font-bold text-slate-100">{t('reports.history.clearConfirmTitle')}</h3>
                        <p className="text-sm text-slate-400 mt-2">{t('reports.history.clearConfirmBody')}</p>
                        <div className="mt-4 flex justify-end gap-2">
                            <button onClick={() => setIsConfirmModalOpen(false)} className="px-3 py-1.5 text-sm rounded-md bg-slate-700 hover:bg-slate-600">{t('modals.cancel')}</button>
                            <button onClick={handleClearHistory} className="px-3 py-1.5 text-sm rounded-md bg-red-600 hover:bg-red-500">{t('modals.confirm')}</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={filters.date}
                        onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                        title={t('reports.history.filterByDate') || ''}
                        className="bg-[#121A2B] border border-[#22304A] rounded-md text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <select
                        value={filters.reportId}
                        onChange={(e) => setFilters(prev => ({ ...prev, reportId: e.target.value }))}
                        title={t('reports.history.filterByReport') || ''}
                        className="bg-[#121A2B] border border-[#22304A] rounded-md text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                        <option value="all">{t('reports.history.allReports')}</option>
                        {allReports.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                <button
                    onClick={() => setIsConfirmModalOpen(true)}
                    className="inline-flex items-center gap-x-1.5 rounded-md bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20"
                >
                    <ArrowPathIcon className="h-4 w-4" />
                    {t('reports.history.clearHistory')}
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#22304A]">
                    <thead className="bg-[#121A2B]">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('reports.history.headers.date')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('reports.history.headers.report')}</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">{t('reports.history.headers.format')}</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('reports.history.headers.triggeredBy')}</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">{t('reports.history.headers.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-[#0F1626] divide-y divide-[#22304A]">
                        {filteredHistory.length > 0 ? filteredHistory.map(entry => (
                            <tr key={entry.id}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{formatDateTime(entry.when)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-100">{entry.reportName}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-slate-300 uppercase">{entry.format}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-400 capitalize">{t(`reports.history.triggered.${entry.triggeredBy}`)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-right">
                                    <button onClick={() => handleReDownload(entry)} className="inline-flex items-center gap-x-1 text-sm font-semibold text-indigo-400 hover:text-indigo-300">
                                        <DownloadIcon className="h-4 w-4" />
                                        {t('reports.history.reDownload')}
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="text-center py-10 text-slate-500">
                                    {t('reports.history.noHistory')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReportsHistoryView;
