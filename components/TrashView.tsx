import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Project, PushtrackTask, User, UserRole } from '../types';
import { formatDateTime, timeToExpire } from '../utils/helpers';
import { ArrowUturnLeftIcon, TrashIcon, ExclamationTriangleIcon, XMarkIcon } from './icons';

type TrashedItem = 
    | { type: 'Proyecto', data: Project }
    | { type: 'Tarea', data: PushtrackTask }
    | { type: 'Usuario', data: User }

interface TrashViewProps {
    projects: Project[];
    tickets: PushtrackTask[];
    users: User[];
    onRestore: (entityType: 'project' | 'ticket' | 'user', id: string) => void;
    onDeletePermanently: (entityType: 'project' | 'ticket' | 'user', id: string) => void;
    onEmptyTrash: () => void;
}

const EmptyTrashModal: React.FC<{onClose: () => void, onConfirm: () => void}> = ({onClose, onConfirm}) => {
    const { t } = useTranslation('common');
    const [confirmText, setConfirmText] = useState('');
    const [isChecked, setIsChecked] = useState(false);
    const canConfirm = confirmText === t('trash.modal.confirmText') && isChecked;

    return (
         <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative bg-[#121A2B] rounded-xl shadow-2xl shadow-black/30 w-full max-w-lg">
                <div className="flex items-start p-4 border-b border-red-500/30">
                     <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3 flex-shrink-0" />
                    <div>
                        <h2 className="text-xl font-bold text-slate-100">{t('trash.modal.title')}</h2>
                        <p className="text-sm text-slate-400 mt-1">{t('trash.modal.body')}</p>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                   <p className="text-sm text-slate-300">{t('trash.modal.prompt')} <strong className="text-red-400">{t('trash.modal.confirmText')}</strong></p>
                    <input 
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={t('trash.modal.placeholder') || ''}
                        className="w-full bg-[#0F1626] border-[#22304A] rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm text-slate-200 placeholder:text-slate-500 text-center font-bold tracking-widest"
                    />
                    <div className="relative flex items-start">
                        <div className="flex h-6 items-center">
                          <input
                            id="confirmation-check"
                            name="confirmation-check"
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setIsChecked(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-red-600 focus:ring-red-500 cursor-pointer"
                          />
                        </div>
                        <div className="ml-3 text-sm leading-6">
                          <label htmlFor="confirmation-check" className="font-medium text-slate-300 cursor-pointer">
                            {t('trash.modal.checkboxLabel')}
                          </label>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-[#0F1626] border-t border-[#22304A] rounded-b-xl flex justify-end gap-3">
                    <button onClick={onClose} title={t('tooltips.cancel') || ''} className="rounded-md bg-transparent px-3.5 py-2 text-sm font-semibold text-slate-200 shadow-sm ring-1 ring-inset ring-slate-700 hover:bg-slate-800">{t('modals.cancel')}</button>
                    <button onClick={onConfirm} disabled={!canConfirm} title={t('tooltips.confirmEmptyTrash') || ''} className="rounded-md bg-red-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed">{t('trash.emptyTrash')}</button>
                </div>
            </div>
         </div>
    );
};


const TrashView: React.FC<TrashViewProps> = ({ projects, tickets, users, onRestore, onDeletePermanently, onEmptyTrash }) => {
    const { t } = useTranslation('common');
    const [activeTab, setActiveTab] = useState<'all' | 'projects' | 'tickets' | 'users'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Force re-render every minute to update countdowns
    const [, setTime] = useState(Date.now());
    useEffect(() => {
        const interval = setInterval(() => setTime(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    const allItems: TrashedItem[] = useMemo(() => [
        ...projects.map(p => ({ type: 'Proyecto', data: p } as TrashedItem)),
        ...tickets.map(t => ({ type: 'Tarea', data: t } as TrashedItem)),
        ...users.map(u => ({ type: 'Usuario', data: u } as TrashedItem)),
    ].sort((a,b) => new Date(b.data.trashed_at!).getTime() - new Date(a.data.trashed_at!).getTime()), [projects, tickets, users]);

    const filteredItems = useMemo(() => {
        if (activeTab === 'all') return allItems;
        if (activeTab === 'projects') return allItems.filter(item => item.type === 'Proyecto');
        if (activeTab === 'tickets') return allItems.filter(item => item.type === 'Tarea');
        if (activeTab === 'users') return allItems.filter(item => item.type === 'Usuario');
        return [];
    }, [allItems, activeTab]);

    const handleRestore = (item: TrashedItem) => {
        if (item.type === 'Proyecto') {
            onRestore('project', (item.data as Project).project_key);
        } else if (item.type === 'Tarea') {
            onRestore('ticket', (item.data as PushtrackTask).id);
        } else if (item.type === 'Usuario') {
            onRestore('user', (item.data as User).email);
        }
    };

    const handleDelete = (item: TrashedItem) => {
        let name: string;
        let id: string;
        let type: 'project' | 'ticket' | 'user';

        if (item.type === 'Proyecto') {
            const project = item.data as Project;
            name = project.name;
            id = project.project_key;
            type = 'project';
        } else if (item.type === 'Tarea') {
            const ticket = item.data as PushtrackTask;
            name = ticket.titulo;
            id = ticket.id;
            type = 'ticket';
        } else { // Usuario
            const user = item.data as User;
            name = user.full_name;
            id = user.email;
            type = 'user';
        }
        
        if(window.confirm(`¿Estás seguro de que quieres eliminar permanentemente '${name}'? Esta acción no se puede deshacer.`)){
            onDeletePermanently(type, id);
        }
    };
    
    const handleConfirmEmpty = () => {
        onEmptyTrash();
        setIsModalOpen(false);
    };

    return (
        <div className="bg-[#0F1626] p-4 sm:p-6 rounded-xl shadow-lg shadow-black/20">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-100">{t('trash.title')}</h2>
                {allItems.length > 0 &&
                    <button onClick={() => setIsModalOpen(true)} title={t('tooltips.emptyTrash') || ''} className="inline-flex items-center gap-x-2 rounded-md bg-red-600/80 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500">
                        <ExclamationTriangleIcon className="-ml-0.5 h-5 w-5" />
                        {t('trash.emptyTrash')}
                    </button>
                }
            </div>

            <p className="text-sm text-slate-400 mb-4">{t('trash.retentionPolicy')}</p>

            <div className="border-b border-[#22304A]">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {(['all', 'projects', 'tickets', 'users'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                                activeTab === tab
                                ? 'border-indigo-500 text-indigo-400'
                                : 'border-transparent text-slate-400 hover:border-slate-500 hover:text-slate-200'
                            }`}
                        >
                           {t(`trash.tabs.${tab}` as const)}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="overflow-x-auto mt-4">
                <table className="min-w-full divide-y divide-[#22304A]">
                    <thead className="bg-[#121A2B]">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('trash.headers.item')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('trash.headers.type')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('trash.headers.trashedOn')}</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">{t('trash.headers.expiresIn')}</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-[#0F1626] divide-y divide-[#22304A]">
                        {filteredItems.map((item, index) => {
                            const data = item.data;
                            let name: string;
                            let subtext: string;

                            if (item.type === 'Proyecto') {
                                const project = data as Project;
                                name = project.name;
                                subtext = project.project_key;
                            } else if (item.type === 'Tarea') {
                                const ticket = data as PushtrackTask;
                                name = ticket.titulo;
                                subtext = ticket.id;
                            } else {
                                const user = data as User;
                                name = user.full_name;
                                subtext = user.email;
                            }

                            return(
                                <tr key={`${item.type}-${subtext}-${index}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-slate-100">{name}</div>
                                        <div className="text-xs text-slate-500">{subtext}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{item.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{formatDateTime(data.trashed_at!)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-400">{timeToExpire(data.trashed_at)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleRestore(item)} title={t('tooltips.restoreItem') || ''} className="text-indigo-400 hover:text-indigo-300 mr-4 inline-flex items-center"><ArrowUturnLeftIcon className="h-4 w-4 mr-1"/>{t('trash.actions.restore')}</button>
                                        <button onClick={() => handleDelete(item)} title={t('tooltips.deletePermanently') || ''} className="text-red-500 hover:text-red-400 inline-flex items-center"><TrashIcon className="h-4 w-4 mr-1"/>{t('trash.actions.delete')}</button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                 {filteredItems.length === 0 && <p className="text-center p-8 text-slate-500">{t('trash.empty')}</p>}
            </div>
            {isModalOpen && <EmptyTrashModal onClose={() => setIsModalOpen(false)} onConfirm={handleConfirmEmpty} />}
        </div>
    );
}

export default TrashView;