import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Project, User, ProjectStatus, UserRole } from '../types';
import { XMarkIcon } from './icons';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: Project) => void;
  users: User[];
  projectToEdit?: Project | null;
}

const statusOptions: { value: ProjectStatus, label: string }[] = [
    { value: 'Propuesto', label: 'Propuesto' },
    { value: 'Active', label: 'Activo' },
    { value: 'On Hold', label: 'En Espera' },
    { value: 'Archived', label: 'Archivado' },
];

const ProjectFormModal: React.FC<ProjectFormModalProps> = ({ isOpen, onClose, onSubmit, users, projectToEdit }) => {
  const { t } = useTranslation('common');
  const [formData, setFormData] = useState({
      name: '',
      description: '',
      owner_email: '',
      start_date: '',
      end_date: '',
      default_sla_hours: 24,
      status: 'Propuesto' as ProjectStatus,
      reminder_frequency_hours: 8,
  });
  
  const [error, setError] = useState('');

  useEffect(() => {
    if (projectToEdit) {
      setFormData({
        name: projectToEdit.name,
        description: projectToEdit.description,
        owner_email: projectToEdit.owner_email,
        start_date: projectToEdit.start_date ? new Date(projectToEdit.start_date).toISOString().split('T')[0] : '',
        end_date: projectToEdit.end_date ? new Date(projectToEdit.end_date).toISOString().split('T')[0] : '',
        default_sla_hours: projectToEdit.default_sla_hours,
        status: projectToEdit.status,
        reminder_frequency_hours: projectToEdit.notification_config?.reminder_frequency_hours || 8,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        owner_email: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        default_sla_hours: 24,
        status: 'Propuesto',
        reminder_frequency_hours: 8,
      });
    }
  }, [projectToEdit, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({...prev, [name]: value}));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.owner_email) {
      setError('Nombre del proyecto y Owner son obligatorios.');
      return;
    }
    setError('');
    
    const newProject: Project = {
        project_key: projectToEdit?.project_key || `PRJ-${String(Math.floor(Math.random() * 900) + 100)}`,
        name: formData.name,
        description: formData.description,
        owner_email: formData.owner_email,
        status: formData.status,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : new Date().toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        default_sla_hours: Number(formData.default_sla_hours),
        notification_config: {
            reminder_frequency_hours: Number(formData.reminder_frequency_hours),
        },
        created_at: projectToEdit?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        webhook_email: projectToEdit?.webhook_email || '',
        webhook_whatsapp: projectToEdit?.webhook_whatsapp || '',
        trashed_at: projectToEdit?.trashed_at || null,
    };
    
    onSubmit(newProject);
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-[#121A2B] rounded-xl shadow-2xl shadow-black/30 w-full max-w-3xl">
        <div className="flex items-center justify-between p-4 border-b border-[#22304A]">
          <h2 className="text-xl font-bold text-slate-100">{projectToEdit ? t('modals.projectForm.editTitle') : t('modals.projectForm.newTitle')}</h2>
          <button onClick={onClose} title={t('tooltips.closeModal') || ''} className="p-1 rounded-full hover:bg-slate-700 transition-colors">
            <XMarkIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300">{t('modals.projectForm.name')}</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full rounded-md shadow-sm sm:text-sm bg-[#0F1626] text-slate-200 border-[#22304A] focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
              <div>
                <label htmlFor="owner_email" className="block text-sm font-medium text-slate-300">{t('modals.projectForm.owner')}</label>
                <select name="owner_email" id="owner_email" value={formData.owner_email} onChange={handleInputChange} className="mt-1 block w-full rounded-md shadow-sm sm:text-sm bg-[#0F1626] text-slate-200 border-[#22304A] focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">{t('modals.projectForm.selectOwner')}</option>
                    {users.filter(u => u.role_global === UserRole.Admin || u.role_global === UserRole.Líder).map(user => <option key={user.email} value={user.email}>{user.full_name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-300">{t('modals.projectForm.description')}</label>
              <textarea name="description" id="description" value={formData.description} onChange={handleInputChange} rows={3} className="mt-1 block w-full rounded-md shadow-sm sm:text-sm bg-[#0F1626] text-slate-200 border-[#22304A] focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-slate-300">{t('modals.projectForm.startDate')}</label>
                    <input type="date" name="start_date" id="start_date" value={formData.start_date} onChange={handleInputChange} className="mt-1 block w-full rounded-md shadow-sm sm:text-sm bg-[#0F1626] text-slate-200 border-[#22304A] focus:border-indigo-500 focus:ring-indigo-500" />
                 </div>
                 <div>
                    <label htmlFor="end_date" className="block text-sm font-medium text-slate-300">{t('modals.projectForm.endDate')}</label>
                    <input type="date" name="end_date" id="end_date" value={formData.end_date} onChange={handleInputChange} className="mt-1 block w-full rounded-md shadow-sm sm:text-sm bg-[#0F1626] text-slate-200 border-[#22304A] focus:border-indigo-500 focus:ring-indigo-500" />
                 </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="default_sla_hours" className="block text-sm font-medium text-slate-300">{t('modals.projectForm.defaultSLA')}</label>
                    <input type="number" name="default_sla_hours" id="default_sla_hours" value={formData.default_sla_hours} onChange={handleInputChange} className="mt-1 block w-full rounded-md shadow-sm sm:text-sm bg-[#0F1626] text-slate-200 border-[#22304A] focus:border-indigo-500 focus:ring-indigo-500" />
                 </div>
                 <div>
                    <label htmlFor="reminder_frequency_hours" className="block text-sm font-medium text-slate-300">Frecuencia de Recordatorio (horas)</label>
                    <input type="number" name="reminder_frequency_hours" id="reminder_frequency_hours" value={formData.reminder_frequency_hours} onChange={handleInputChange} min="1" className="mt-1 block w-full rounded-md shadow-sm sm:text-sm bg-[#0F1626] text-slate-200 border-[#22304A] focus:border-indigo-500 focus:ring-indigo-500" />
                 </div>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-300">{t('modals.projectForm.status')}</label>
               <select name="status" id="status" value={formData.status} onChange={handleInputChange} className="mt-1 block w-full rounded-md shadow-sm sm:text-sm bg-[#0F1626] text-slate-200 border-[#22304A] focus:border-indigo-500 focus:ring-indigo-500">
                  {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          {error && <p className="text-xs text-red-500 mt-2">{t('modals.projectForm.ownerError')}</p>}
          <div className="flex justify-end items-center gap-3 pt-4">
            <button type="button" onClick={onClose} title={t('tooltips.cancel') || ''} className="rounded-md bg-transparent px-3.5 py-2 text-sm font-semibold text-slate-200 shadow-sm ring-1 ring-inset ring-slate-700 hover:bg-slate-800">{t('modals.cancel')}</button>
            <button type="submit" title={projectToEdit ? t('tooltips.saveChanges') : t('tooltips.create') || ''} className="rounded-md bg-indigo-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400">{projectToEdit ? t('modals.saveChanges') : t('modals.projectForm.createProject')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectFormModal;