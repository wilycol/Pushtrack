import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Project, UserRole } from '../types';
import { XMarkIcon } from './icons';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: User) => void;
  projects: Project[];
  userToEdit?: User | null;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSubmit, projects, userToEdit }) => {
  const { t } = useTranslation('common');
  const [formData, setFormData] = useState({
      full_name: '',
      email: '',
      whatsapp: '',
      position: '',
      role_global: UserRole.Colaborador,
      is_active: true,
  });

  const [assignedProjectKeys, setAssignedProjectKeys] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
      if(userToEdit) {
          setFormData({
              full_name: userToEdit.full_name,
              email: userToEdit.email,
              whatsapp: userToEdit.whatsapp,
              position: userToEdit.position,
              role_global: userToEdit.role_global,
              is_active: userToEdit.is_active,
          });
          setAssignedProjectKeys(userToEdit.projects || []);
      } else {
          setFormData({
              full_name: '',
              email: '',
              whatsapp: '',
              position: '',
              role_global: UserRole.Colaborador,
              is_active: true,
          });
          setAssignedProjectKeys([]);
      }
  }, [userToEdit, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({...prev, [name]: checked}));
    } else {
        setFormData(prev => ({...prev, [name]: value}));
    }
  };

  const handleProjectAssignmentChange = (projectKey: string, isChecked: boolean) => {
      setAssignedProjectKeys(prevKeys => {
          if (isChecked) {
              return [...prevKeys, projectKey];
          } else {
              return prevKeys.filter(key => key !== projectKey);
          }
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim()) {
      setError(t('modals.userForm.nameAndEmailError'));
      return;
    }
    setError('');

    const updatedUser: User = {
        ...(userToEdit || { created_at: new Date().toISOString(), teams: [], trashed_at: null }),
        ...formData,
        projects: assignedProjectKeys,
        updated_at: new Date().toISOString(),
    };

    onSubmit(updatedUser);
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-[#121A2B] rounded-xl shadow-2xl shadow-black/30 w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-[#22304A]">
          <h2 className="text-xl font-bold text-slate-100">{userToEdit ? t('modals.userForm.editTitle') : t('modals.userForm.newTitle')}</h2>
          <button onClick={onClose} title={t('tooltips.closeModal') || ''} className="p-1 rounded-full hover:bg-slate-700 transition-colors">
            <XMarkIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-slate-300">{t('modals.userForm.fullName')}</label>
            <input type="text" name="full_name" id="full_name" value={formData.full_name} onChange={handleInputChange} className="mt-1 block w-full rounded-md shadow-sm sm:text-sm bg-[#0F1626] text-slate-200 border-[#22304A] focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300">{t('modals.userForm.email')}</label>
            <input type="email" name="email" id="email" value={formData.email} disabled={!!userToEdit} onChange={handleInputChange} className="mt-1 block w-full rounded-md shadow-sm sm:text-sm bg-[#0F1626] text-slate-200 border-[#22304A] focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-slate-800 disabled:text-slate-500" />
          </div>
           <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-slate-300">{t('modals.userForm.whatsapp')}</label>
            <input type="text" name="whatsapp" id="whatsapp" value={formData.whatsapp} onChange={handleInputChange} className="mt-1 block w-full rounded-md shadow-sm sm:text-sm bg-[#0F1626] text-slate-200 border-[#22304A] focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
          <div>
            <label htmlFor="position" className="block text-sm font-medium text-slate-300">{t('modals.userForm.position')}</label>
            <input type="text" name="position" id="position" value={formData.position} onChange={handleInputChange} className="mt-1 block w-full rounded-md shadow-sm sm:text-sm bg-[#0F1626] text-slate-200 border-[#22304A] focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
          <div className="flex justify-between items-center">
             <div>
                <label htmlFor="role_global" className="block text-sm font-medium text-slate-300">{t('modals.userForm.globalRole')}</label>
                <select name="role_global" id="role_global" value={formData.role_global} onChange={handleInputChange} className="mt-1 block w-full rounded-md shadow-sm sm:text-sm bg-[#0F1626] text-slate-200 border-[#22304A] focus:border-indigo-500 focus:ring-indigo-500">
                {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
             </div>
             <div className="relative flex items-start pt-6">
                <div className="flex h-6 items-center">
                <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500"
                />
                </div>
                <div className="ml-3 text-sm leading-6">
                <label htmlFor="is_active" className="font-medium text-slate-300">
                    {t('modals.userForm.activeUser')}
                </label>
                </div>
            </div>
          </div>
           
          {userToEdit && (
              <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-2">{t('modals.userForm.assignProjects')}</h3>
                  <div className="bg-[#0F1626] border border-[#22304A] rounded-md max-h-32 overflow-y-auto p-3 space-y-2">
                      {projects.length > 0 ? (
                          projects.map(p => (
                            <div key={p.project_key} className="relative flex items-start">
                                <div className="flex h-6 items-center">
                                    <input
                                        id={`project-${p.project_key}`}
                                        name="project-assignment"
                                        type="checkbox"
                                        checked={assignedProjectKeys.includes(p.project_key)}
                                        onChange={(e) => handleProjectAssignmentChange(p.project_key, e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                                    />
                                </div>
                                <div className="ml-3 text-sm leading-6">
                                    <label htmlFor={`project-${p.project_key}`} className="font-medium text-slate-300 cursor-pointer">
                                        {p.name}
                                    </label>
                                </div>
                            </div>
                          ))
                      ) : <p className="text-xs text-slate-500 text-center p-2">{t('modals.userForm.noProjects')}</p>}
                  </div>
              </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-[#22304A] mt-4">
            <button type="button" onClick={onClose} title={t('tooltips.cancel') || ''} className="rounded-md bg-transparent px-3.5 py-2 text-sm font-semibold text-slate-200 shadow-sm ring-1 ring-inset ring-slate-700 hover:bg-slate-800">{t('modals.cancel')}</button>
            <button type="submit" title={userToEdit ? t('tooltips.saveChanges') : t('tooltips.create') || ''} className="rounded-md bg-indigo-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400">{userToEdit ? t('modals.saveChanges') : t('modals.userForm.createUser')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;