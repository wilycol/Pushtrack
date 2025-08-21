import React from 'react';
import { useTranslation } from 'react-i18next';
import { PushtrackTask, User } from '../types';
import TaskCard from './PQRSTicketCard';

interface TaskListProps {
  tickets: PushtrackTask[];
  selectedTask: PushtrackTask | null;
  onSelectTask: (task: PushtrackTask) => void;
  onDownloadTemplate: () => void;
  users: User[];
}

const TaskList: React.FC<TaskListProps> = ({ tickets, selectedTask, onSelectTask, onDownloadTemplate, users }) => {
  const { t } = useTranslation('common');
  return (
    <div className="bg-[#0F1626] rounded-xl shadow-lg shadow-black/20 h-full flex flex-col">
      <div className="p-4 border-b border-[#22304A]">
        <h2 className="text-lg font-bold text-slate-100">{t('dashboard.inboxTitle', { count: tickets.length })}</h2>
      </div>
      <div className="overflow-y-auto h-full">
        {tickets.length > 0 ? (
          tickets.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={selectedTask?.id === task.id}
              onSelect={() => onSelectTask(task)}
              users={users}
            />
          ))
        ) : (
          <div className="text-center p-8 text-slate-500 flex flex-col items-center justify-center h-full">
            <p className="mb-4">{t('dashboard.noTasks')}</p>
            <button 
              onClick={onDownloadTemplate}
              title={t('tooltips.downloadCSVTemplate') || ''}
              className="rounded-md bg-slate-700 px-3.5 py-2 text-sm font-semibold text-slate-200 shadow-sm hover:bg-slate-600"
            >
              {t('dashboard.downloadTemplate')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;