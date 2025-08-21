import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Project, User, PushtrackTask } from '../types';
import { formatDateTime, getUserInfo } from '../utils/helpers';
import { PlusCircleIcon, EllipsisVerticalIcon, TrashIcon } from './icons';

interface ProjectListProps {
    projects: Project[];
    tickets: PushtrackTask[];
    users: User[];
    onNewProject: () => void;
    onEditProject: (project: Project) => void;
    onToggleArchive: (projectKey: string) => void;
    onDuplicateProject: (projectKey: string) => void;
    onSendProjectToTrash: (projectKey: string) => void;
}

const ActionsMenu: React.FC<{ 
    project: Project; 
    onEdit: () => void; 
    onToggleArchive: () => void; 
    onDuplicate: () => void;
    onSendToTrash: () => void;
    canSendToTrash: boolean;
}> = 
({ project, onEdit, onToggleArchive, onDuplicate, onSendToTrash, canSendToTrash }) => {
    const { t } = useTranslation('common');
    const [isOpen, setIsOpen] = useState(false);
    
    const handleActionClick = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left">
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className="p-2 rounded-full hover:bg-slate-700" title={t('tooltips.projectActions') || ''}>
                <EllipsisVerticalIcon className="h-5 w-5 text-slate-400" />
            </button>
            {isOpen && (
                 <div
                    onMouseLeave={() => setIsOpen(false)}
                    className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-[#1B2437] ring-1 ring-black ring-opacity-5 z-10"
                >
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        <a href={`#/projects/${project.project_key}`} onClick={(e) => e.stopPropagation()} title={t('tooltips.viewProjectDetails') || ''} className="text-slate-200 block px-4 py-2 text-sm hover:bg-slate-600 w-full text-left" role="menuitem">{t('projects.list.actionsMenu.view')}</a>
                        <button onClick={(e) => handleActionClick(e, onEdit)} title={t('tooltips.editProject') || ''} className="text-slate-200 block px-4 py-2 text-sm hover:bg-slate-600 w-full text-left" role="menuitem">{t('projects.list.actionsMenu.edit')}</button>
                        <button onClick={(e) => handleActionClick(e, onToggleArchive)} title={project.status === 'Active' ? t('tooltips.archiveProject') || '' : t('tooltips.restoreProject') || ''} className="text-slate-200 block px-4 py-2 text-sm hover:bg-slate-600 w-full text-left" role="menuitem">
                            {project.status === 'Active' ? t('projects.list.actionsMenu.archive') : t('projects.list.actionsMenu.restore')}
                        </button>
                        <button onClick={(e) => handleActionClick(e, onDuplicate)} title={t('tooltips.duplicateProject') || ''} className="text-slate-200 block px-4 py-2 text-sm hover:bg-slate-600 w-full text-left" role="menuitem">{t('projects.list.actionsMenu.duplicate')}</button>
                        <div className="border-t border-slate-600 my-1"></div>
                        <button 
                            onClick={(e) => handleActionClick(e, onSendToTrash)} 
                            title={!canSendToTrash ? t('tooltips.trashProjectDisabled') || '' : t('tooltips.trashProject') || ''}
                            className={`w-full text-left px-4 py-2 text-sm flex items-center ${canSendToTrash ? 'text-red-400 hover:bg-red-500/10' : 'text-slate-500 cursor-not-allowed'}`} 
                            role="menuitem"
                            disabled={!canSendToTrash}
                        >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            {t('projects.list.actionsMenu.sendToTrash')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


const ProjectList: React.FC<ProjectListProps> = ({ projects, tickets, users, onNewProject, onEditProject, onToggleArchive, onDuplicateProject, onSendProjectToTrash }) => {
    const { t } = useTranslation('common');
    const handleRowClick = (projectKey: string) => {
        window.location.hash = `#/projects/${projectKey}`;
    };

    return (
        <div className="bg-[#0F1626] p-4 sm:p-6 rounded-xl shadow-lg shadow-black/20">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-100">{t('projects.list.title')}</h2>
                <button
                    onClick={onNewProject}
                    title={t('tooltips.newProject') || ''}
                    className="inline-flex items-center gap-x-2 rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-colors"
                >
                    <PlusCircleIcon className="-ml-0.5 h-5 w-5" />
                    {t('projects.list.newProject')}
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#22304A]">
                    <thead className="bg-[#121A2B]">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('projects.list.headers.name')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('projects.list.headers.owner')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('projects.list.headers.status')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('projects.list.headers.pqrs')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('projects.list.headers.lastActivity')}</th>
                            <th scope="col" className="relative px-6 py-3 text-center text-xs font-medium text-slate-400 uppercase tracking-wider">{t('projects.list.headers.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-[#0F1626] divide-y divide-[#22304A]">
                        {projects.map((project) => {
                            const pqrCount = tickets.filter(t => t.project_key === project.project_key).length;
                            const canSendToTrash = pqrCount === 0 && project.status === 'Archived';

                            return (
                                <tr key={project.project_key} onClick={() => handleRowClick(project.project_key)} className="hover:bg-[#121A2B] cursor-pointer transition-colors" title={t('tooltips.selectProject', { projectName: project.name }) || ''}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-slate-100">{project.name}</div>
                                        <div className="text-xs text-slate-500">{project.project_key}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{getUserInfo(project.owner_email, users)?.full_name || project.owner_email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${project.status === 'Active' ? 'bg-green-500/20 text-green-400' : project.status === 'On Hold' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                            {project.status === 'Propuesto' ? t('enums.projectStatus.Propuesto') : project.status === 'Active' ? t('enums.projectStatus.Active') : project.status === 'On Hold' ? t('enums.projectStatus.On Hold') : t('enums.projectStatus.Archived')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-slate-300">{pqrCount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                        {formatDateTime(project.updated_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                       <div className="flex items-center justify-center space-x-2">
                                            <ActionsMenu
                                                project={project}
                                                onEdit={() => onEditProject(project)}
                                                onToggleArchive={() => onToggleArchive(project.project_key)}
                                                onDuplicate={() => onDuplicateProject(project.project_key)}
                                                onSendToTrash={() => onSendProjectToTrash(project.project_key)}
                                                canSendToTrash={canSendToTrash}
                                            />
                                       </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {projects.length === 0 && <p className="text-center p-8 text-slate-500">{t('projects.list.noProjects')}</p>}
            </div>
        </div>
    );
};

export default ProjectList;