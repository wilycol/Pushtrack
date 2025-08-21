import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Project, User, PushtrackTask, Estado } from '../types';
import { formatDateTime, getUserInfo } from '../utils/helpers';
import { ArrowUturnLeftIcon, PencilIcon, UserGroupIcon, TicketIcon, Cog6ToothIcon } from './icons';
import TaskList from './PQRSList'; 

interface ProjectDetailViewProps {
    project: Project;
    users: User[];
    tickets: PushtrackTask[];
    onEdit: () => void;
    onEditUser: (user: User) => void;
}

const KPICard: React.FC<{ title: string; value: number | string; className?: string }> = ({ title, value, className }) => (
    <div className={`bg-[#0F1626] p-4 rounded-lg border border-[#22304A] ${className}`}>
        <p className="text-3xl font-bold text-slate-100">{value}</p>
        <p className="text-sm font-medium text-slate-400">{title}</p>
    </div>
);

const DetailItem: React.FC<{label: string, value: string | React.ReactNode}> = ({label, value}) => (
    <div className="col-span-1">
        <dt className="font-medium text-slate-400">{label}</dt>
        <dd className="mt-1 text-slate-200">{value || <span className="text-slate-500">No especificada</span>}</dd>
    </div>
);


const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({ project, users, tickets, onEdit, onEditUser }) => {
    const { t } = useTranslation('common');
    const [activeTab, setActiveTab] = useState('equipo');

    const projectTasks = useMemo(() => {
        return tickets.filter(t => t.project_key === project.project_key);
    }, [tickets, project.project_key]);

    const kpis = useMemo(() => {
        return {
            total: projectTasks.length,
            abiertos: projectTasks.filter(t => [Estado.ToDo, Estado.InProgress, Estado.Review, Estado.Test, Estado.WaitingForClient].includes(t.estado)).length,
            cerrados: projectTasks.filter(t => t.estado === Estado.ReleasedClosed).length,
            noAplica: projectTasks.filter(t => t.estado === Estado.NotApplicable).length,
            slaVencido: projectTasks.filter(t => new Date(t.vence_en) < new Date() && t.estado !== Estado.ReleasedClosed).length,
        };
    }, [projectTasks]);

    const owner = getUserInfo(project.owner_email, users);
    
    // In a real app, team members would be a dedicated field in the project. Here we simulate it.
    const teamMembers = users.filter(u => u.projects.includes(project.project_key));

    const handleBackClick = (e: React.MouseEvent) => {
        e.preventDefault();
        window.location.hash = '#/projects';
    };

    const TabButton: React.FC<{tabName: string; label: string; icon: React.ElementType;}> = ({tabName, label, icon: Icon}) => (
        <button onClick={() => setActiveTab(tabName)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tabName ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
            }`}
        >
            <Icon className="w-5 h-5 mr-2" />
            {label}
        </button>
    );

    const handlePqrSelect = (task: PushtrackTask) => {
        window.location.hash = `#/tasks?ticketId=${task.id}&sourceProject=${project.project_key}`;
    };

    const getStatusLabel = (status: Project['status']) => {
        switch(status) {
            case "Propuesto": return t('enums.projectStatus.Propuesto');
            case "Active": return t('enums.projectStatus.Active');
            case "On Hold": return t('enums.projectStatus.On Hold');
            case "Archived": return t('enums.projectStatus.Archived');
            default: return status;
        }
    }
    
    const getStatusColor = (status: Project['status']) => {
        switch(status) {
            case "Propuesto": return 'bg-cyan-500/20 text-cyan-400';
            case "Active": return 'bg-green-500/20 text-green-400';
            case "On Hold": return 'bg-amber-500/20 text-amber-400';
            case "Archived": return 'bg-slate-500/20 text-slate-400';
            default: return 'bg-slate-500/20 text-slate-400';
        }
    }

    const ownerDisplay = owner ? (
        <button type="button" onClick={() => onEditUser(owner)} title={t('tooltips.editUser') || ''} className="text-slate-200 hover:text-indigo-400 hover:underline text-left">
            {owner.full_name}
        </button>
    ) : (
        <span className="text-slate-500">{project.owner_email || 'No asignado'}</span>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <button onClick={handleBackClick} title={t('tooltips.backToProjects') || ''} className="flex items-center text-sm text-indigo-400 hover:text-indigo-300 mb-2">
                        <ArrowUturnLeftIcon className="w-4 h-4 mr-2" />
                        {t('projects.detail.back')}
                    </button>
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-bold text-slate-100">{project.name}</h2>
                         <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(project.status)}`}>
                            {getStatusLabel(project.status)}
                        </span>
                    </div>
                    <p className="text-slate-500 font-mono text-xs mt-1 cursor-pointer" title={t('projects.detail.copyKey') || ''} onClick={() => navigator.clipboard.writeText(project.project_key)}>{project.project_key}</p>
                </div>
                <button onClick={onEdit} title={t('tooltips.editProjectDetail') || ''} className="inline-flex items-center gap-x-2 rounded-md bg-slate-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-600">
                    <PencilIcon className="-ml-0.5 h-5 w-5" />
                    {t('projects.detail.edit')}
                </button>
            </div>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                 <KPICard title={t('projects.detail.kpis.total')} value={kpis.total} />
                 <KPICard title={t('projects.detail.kpis.open')} value={kpis.abiertos} className="text-blue-400" />
                 <KPICard title={t('projects.detail.kpis.closed')} value={kpis.cerrados} className="text-green-400" />
                 <KPICard title={t('projects.detail.kpis.overdue')} value={kpis.slaVencido} className="text-red-400" />
                 <KPICard title={t('projects.detail.kpis.na')} value={kpis.noAplica} className="text-slate-500" />
            </div>

            {/* Tabs */}
             <div className="bg-[#0F1626] p-6 rounded-xl border border-[#22304A]">
                <div className="border-b border-slate-700 mb-4">
                    <nav className="flex space-x-2" aria-label="Tabs">
                        <TabButton tabName="equipo" label={t('projects.detail.tabs.team')} icon={UserGroupIcon} />
                        <TabButton tabName="pqrs" label={t('projects.detail.tabs.tasks')} icon={TicketIcon} />
                        <TabButton tabName="config" label={t('projects.detail.tabs.config')} icon={Cog6ToothIcon} />
                    </nav>
                </div>
                
                <div>
                    {activeTab === 'equipo' && (
                        <div>
                            {/* Team member list */}
                            <ul className="divide-y divide-slate-700/50">
                                {teamMembers.map(user => (
                                    <li key={user.email} onClick={() => onEditUser(user)} title={t('tooltips.editUser') || ''} className="flex items-center justify-between py-3 hover:bg-slate-800/50 -mx-4 px-4 rounded-md cursor-pointer transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-slate-100">{user.full_name}</p>
                                            <p className="text-sm text-slate-400">{user.email}</p>
                                        </div>
                                        <span className="text-xs font-semibold text-slate-500">{user.position}</span>
                                    </li>
                                ))}
                            </ul>
                             {teamMembers.length === 0 && <p className="text-center p-8 text-slate-500">{t('projects.detail.noTeamMembers')}</p>}
                        </div>
                    )}
                     {activeTab === 'pqrs' && (
                        <div className="h-[500px]">
                            <TaskList 
                                tickets={projectTasks}
                                users={users}
                                onSelectTask={handlePqrSelect}
                                selectedTask={null}
                                onDownloadTemplate={()=>{}}
                            />
                        </div>
                    )}
                     {activeTab === 'config' && (
                        <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6 text-sm">
                            <DetailItem label={t('projects.detail.config.owner')} value={ownerDisplay} />
                            <DetailItem label={t('projects.detail.config.defaultSLA')} value={`${project.default_sla_hours} horas`} />
                             <DetailItem label="Frecuencia de Recordatorios" value={`${project.notification_config?.reminder_frequency_hours || 'N/A'} horas`} />
                            <DetailItem label={t('projects.detail.config.startDate')} value={project.start_date ? formatDateTime(project.start_date) : t('projects.detail.config.notSet')} />
                            <DetailItem label={t('projects.detail.config.endDate')} value={project.end_date ? formatDateTime(project.end_date) : t('projects.detail.config.notSet')} />
                            <div className="col-span-full md:col-span-3">
                                <dt className="font-medium text-slate-400">{t('projects.detail.config.description')}</dt>
                                <dd className="mt-1 text-slate-200 whitespace-pre-wrap">{project.description || <span className="text-slate-500">{t('projects.detail.config.notSet')}</span>}</dd>
                            </div>
                        </dl>
                    )}
                </div>
             </div>
        </div>
    );
};

export default ProjectDetailView;