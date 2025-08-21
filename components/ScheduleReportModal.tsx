import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ReportSchedule, ReportDefinition } from '../types';
import { XMarkIcon, PencilIcon, TrashIcon, PowerIcon, PlusCircleIcon, CalendarDaysIcon } from './icons';

interface ScheduleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: ReportSchedule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  schedules: ReportSchedule[];
  allReports: ReportDefinition[];
  scheduleToEdit: ReportSchedule | null;
  initialReportId?: string;
  setScheduleToEdit: (schedule: ReportSchedule | null) => void;
}

const ScheduleForm: React.FC<{
    onSave: (schedule: ReportSchedule) => void;
    onCancel: () => void;
    allReports: ReportDefinition[];
    scheduleToEdit: ReportSchedule | null;
    initialReportId?: string;
}> = ({ onSave, onCancel, allReports, scheduleToEdit, initialReportId }) => {
    const { t } = useTranslation('common');
    const [formData, setFormData] = useState({
        name: '',
        frequency: 'daily' as 'daily' | 'weekly' | 'monthly',
        time: '09:00',
        recipients: '',
        format: 'pdf' as 'csv' | 'json' | 'xlsx' | 'pdf',
        reportIds: [] as string[],
    });

    useEffect(() => {
        if (scheduleToEdit) {
            setFormData({
                name: scheduleToEdit.name,
                frequency: scheduleToEdit.frequency,
                time: scheduleToEdit.time,
                recipients: scheduleToEdit.recipients.join(', '),
                format: scheduleToEdit.format,
                reportIds: scheduleToEdit.reportIds,
            });
        } else {
            setFormData(prev => ({
                ...prev,
                name: '',
                frequency: 'daily',
                time: '09:00',
                recipients: '',
                format: 'pdf',
                reportIds: initialReportId ? [initialReportId] : []
            }));
        }
    }, [scheduleToEdit, initialReportId]);

    const handleReportSelection = (reportId: string, checked: boolean) => {
        setFormData(prev => {
            const newReportIds = checked
                ? [...prev.reportIds, reportId]
                : prev.reportIds.filter(id => id !== reportId);
            return { ...prev, reportIds: newReportIds };
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newSchedule: ReportSchedule = {
            id: scheduleToEdit?.id || `sch-${crypto.randomUUID()}`,
            name: formData.name,
            frequency: formData.frequency,
            time: formData.time,
            recipients: formData.recipients.split(',').map(e => e.trim()).filter(Boolean),
            format: formData.format,
            reportIds: formData.reportIds,
            active: scheduleToEdit?.active ?? true,
        };
        onSave(newSchedule);
        onCancel(); // Close form after saving
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700 space-y-4">
            <h3 className="text-lg font-semibold text-slate-100">{scheduleToEdit ? t('reports.scheduler.formTitleEdit') : t('reports.scheduler.formTitleNew')}</h3>
            <input
                type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder={t('reports.scheduler.namePlaceholder') || ''} required
                className="w-full bg-[#0F1626] border-[#22304A] rounded-md text-slate-200"
            />
            <div className="grid grid-cols-2 gap-4">
                <select value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value as any})} className="bg-[#0F1626] border-[#22304A] rounded-md text-slate-200">
                    <option value="daily">{t('reports.scheduler.frequencyOptions.daily')}</option>
                    <option value="weekly">{t('reports.scheduler.frequencyOptions.weekly')}</option>
                    <option value="monthly">{t('reports.scheduler.frequencyOptions.monthly')}</option>
                </select>
                <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="bg-[#0F1626] border-[#22304A] rounded-md text-slate-200"/>
            </div>
            <textarea
                value={formData.recipients} onChange={e => setFormData({...formData, recipients: e.target.value})}
                placeholder={t('reports.scheduler.recipientsPlaceholder') || ''} rows={2}
                className="w-full bg-[#0F1626] border-[#22304A] rounded-md text-slate-200"
            />
            <select value={formData.format} onChange={e => setFormData({...formData, format: e.target.value as any})} className="w-full bg-[#0F1626] border-[#22304A] rounded-md text-slate-200">
                <option value="pdf">PDF</option>
                <option value="xlsx">XLSX (Excel)</option>
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
            </select>
             <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">{t('reports.scheduler.reportsToInclude')}</label>
                <div className="max-h-32 overflow-y-auto space-y-1 bg-[#0F1626] p-2 rounded-md border border-[#22304A]">
                    {allReports.map(report => (
                        <div key={report.id} className="flex items-center">
                            <input type="checkbox" id={`report-${report.id}`} checked={formData.reportIds.includes(report.id)} onChange={e => handleReportSelection(report.id, e.target.checked)} className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500"/>
                            <label htmlFor={`report-${report.id}`} className="ml-2 text-sm text-slate-300">{report.name}</label>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="px-3 py-2 text-sm rounded-md bg-slate-700 hover:bg-slate-600">{t('modals.cancel')}</button>
                <button type="submit" className="px-3 py-2 text-sm rounded-md bg-indigo-500 hover:bg-indigo-400">{scheduleToEdit ? t('reports.scheduler.saveSchedule') : t('reports.scheduler.createSchedule')}</button>
            </div>
        </form>
    );
};


const ScheduleReportModal: React.FC<ScheduleReportModalProps> = (props) => {
    const { isOpen, onClose, onSave, onDelete, onToggle, schedules, allReports, scheduleToEdit, initialReportId, setScheduleToEdit } = props;
    const { t } = useTranslation('common');
    const [isFormVisible, setIsFormVisible] = useState(false);

    useEffect(() => {
        if (scheduleToEdit || initialReportId || schedules.length === 0) {
            setIsFormVisible(true);
        } else {
            setIsFormVisible(false);
        }
    }, [scheduleToEdit, initialReportId, schedules, isOpen]);
    
    if (!isOpen) return null;

    const handleEditClick = (schedule: ReportSchedule) => {
        setScheduleToEdit(schedule);
        setIsFormVisible(true);
    };

    const handleNewClick = () => {
        setScheduleToEdit(null);
        setIsFormVisible(true);
    };
    
    const handleFormCancel = () => {
        setScheduleToEdit(null);
        if(!initialReportId && schedules.length > 0) {
            setIsFormVisible(false);
        } else {
            onClose();
        }
    };
    
    const getFrequencyText = (freq: 'daily' | 'weekly' | 'monthly') => {
        const key = `reports.scheduler.frequencyOptions.${freq}`;
        return t(key);
    };


  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-[#121A2B] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#22304A]">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2"><CalendarDaysIcon className="w-5 h-5"/>{t('reports.scheduler.title')}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700"><XMarkIcon className="w-6 h-6 text-slate-400" /></button>
        </div>

        <div className="p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-base font-semibold text-slate-200">{t('reports.scheduler.existing')}</h3>
                <button onClick={handleNewClick} className="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300">
                    <PlusCircleIcon className="w-4 h-4" /> {t('reports.scheduler.formTitleNew')}
                </button>
            </div>
            
            {schedules.length > 0 ? (
                <ul className="space-y-2">
                    {schedules.map(s => (
                        <li key={s.id} className="bg-slate-800/50 p-2 rounded-md flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-slate-100">{s.name}</p>
                                <p className="text-xs text-slate-400">{getFrequencyText(s.frequency)} @ {s.time} &bull; {s.reportIds.length} reports</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => onToggle(s.id, !s.active)} title={s.active ? 'Deactivate' : 'Activate'}>
                                    <PowerIcon className={`w-5 h-5 ${s.active ? 'text-green-500' : 'text-slate-500'}`} />
                                </button>
                                <button onClick={() => handleEditClick(s)} className="p-1 rounded-md hover:bg-slate-700"><PencilIcon className="w-4 h-4 text-slate-300"/></button>
                                <button onClick={() => onDelete(s.id)} className="p-1 rounded-md hover:bg-slate-700"><TrashIcon className="w-4 h-4 text-red-400"/></button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-sm text-slate-500 text-center py-4">{t('reports.scheduler.noSchedules')}</p>}
        </div>
        
        {isFormVisible && (
            <ScheduleForm
                onSave={onSave}
                onCancel={handleFormCancel}
                allReports={allReports}
                scheduleToEdit={scheduleToEdit}
                initialReportId={initialReportId}
            />
        )}
      </div>
    </div>
  );
};

export default ScheduleReportModal;