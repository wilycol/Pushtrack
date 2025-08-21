import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Project, UserRole } from '../types';
import UserFormModal from './UserFormModal';
import { PlusCircleIcon, TrashIcon } from './icons';

interface TeamsViewProps {
    users: User[];
    allUsers: User[];
    projects: Project[];
    onCreateUser: (user: User) => void;
    onUpdateUser: (user: User) => void;
    onSendToTrash: (userId: string) => void;
}

const TeamsView: React.FC<TeamsViewProps> = ({ users, allUsers, projects, onCreateUser, onUpdateUser, onSendToTrash }) => {
    const { t } = useTranslation('common');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);

    const handleOpenCreateModal = () => {
        setUserToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (user: User) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setUserToEdit(null);
    };
    
    const handleSubmit = (user: User) => {
        if(userToEdit) {
            onUpdateUser(user);
        } else {
            onCreateUser(user);
        }
    };

    const activeAdmins = allUsers.filter(u => u.role_global === UserRole.Admin && u.is_active && !u.trashed_at).length;

    return (
         <div className="bg-[#0F1626] p-4 sm:p-6 rounded-xl shadow-lg shadow-black/20">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-100">{t('teams.title')}</h2>
                 <button
                    onClick={handleOpenCreateModal}
                    title={t('tooltips.newUser') || ''}
                    className="inline-flex items-center gap-x-2 rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-colors"
                    >
                    <PlusCircleIcon className="-ml-0.5 h-5 w-5" />
                    {t('teams.newUser')}
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#22304A]">
                    <thead className="bg-[#121A2B]">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('teams.headers.name')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('teams.headers.globalRole')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('teams.headers.status')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('teams.headers.projects')}</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">{t('teams.headers.actions')}</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-[#0F1626] divide-y divide-[#22304A]">
                        {users.map((user) => {
                            const isLastAdmin = user.role_global === UserRole.Admin && activeAdmins <= 1;
                            return (
                            <tr key={user.email} onClick={() => handleOpenEditModal(user)} className="hover:bg-[#121A2B] transition-colors cursor-pointer" title={t('tooltips.selectUser', { userName: user.full_name }) || ''}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-semibold text-slate-100">{user.full_name}</div>
                                    <div className="text-xs text-slate-500">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{user.role_global}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                        {user.is_active ? t('teams.statusActive') : t('teams.statusInactive')}
                                    </span>
                                </td>
                                 <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{user.projects.length}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-4">
                                        <button onClick={(e) => { e.stopPropagation(); handleOpenEditModal(user); }} className="text-indigo-400 hover:text-indigo-300" title={t('tooltips.editUser') || ''}>{t('teams.edit')}</button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onSendToTrash(user.email); }}
                                            disabled={isLastAdmin}
                                            title={isLastAdmin ? (t('tooltips.trashUserDisabled') || '') : (t('tooltips.trashUser') || '')}
                                            className={`p-1 rounded-full transition-colors ${isLastAdmin ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:bg-red-500/10 hover:text-red-400'}`}
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
                 {users.length === 0 && <p className="text-center p-8 text-slate-500">{t('teams.noUsers')}</p>}
            </div>
            {isModalOpen && <UserFormModal isOpen={isModalOpen} onClose={handleCloseModal} onSubmit={handleSubmit} projects={projects} userToEdit={userToEdit} />}
        </div>
    );
};

export default TeamsView;