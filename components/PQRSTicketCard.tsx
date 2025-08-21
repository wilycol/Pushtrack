import React from 'react';
import { useTranslation } from 'react-i18next';
import { PushtrackTask, User } from '../types';
import { getPriorityStyles, getEstadoStyles, timeUntil, getSLAStatus, getUserInfo, getTaskTypeInfo } from '../utils/helpers';

interface TaskCardProps {
  task: PushtrackTask;
  isSelected: boolean;
  onSelect: () => void;
  users: User[];
}

const TaskCard: React.FC<TaskCardProps> = ({ task, isSelected, onSelect, users }) => {
  const { t } = useTranslation('common');
  const priority = getPriorityStyles(task.prioridad);
  const estado = getEstadoStyles(task.estado);
  const timeLeft = timeUntil(task.vence_en);
  const slaStatus = getSLAStatus(task.vence_en);
  const responsable = getUserInfo(task.responsable_email, users);
  const taskTypeInfo = getTaskTypeInfo(task.task_type);
  const Icon = taskTypeInfo.icon;
  
  const baseClasses = "block p-4 border-b border-[#22304A] cursor-pointer transition-colors duration-150 ease-in-out";
  const selectedClasses = "bg-indigo-500/10 border-r-4 border-indigo-500";
  const hoverClasses = "hover:bg-[#1B2437]";

  return (
    <div
      onClick={onSelect}
      className={`${baseClasses} ${isSelected ? selectedClasses : hoverClasses}`}
      title={t('tooltips.selectTask', { taskId: task.id }) || ''}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-slate-100 truncate pr-2">{task.titulo}</h3>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priority.bg} ${priority.text}`}>
          {t(`enums.priority.${task.prioridad}` as any)}
        </span>
      </div>
      <p className="text-sm text-slate-400 truncate flex items-center gap-2" title={t(taskTypeInfo.tooltipKey) || ''}>
        <Icon className={`w-4 h-4 ${taskTypeInfo.color}`} />
        <span>{task.id} - {responsable?.full_name || t('pqrCard.unassigned')}</span>
      </p>
      <div className="flex justify-between items-center mt-3 text-xs">
         <div className="flex items-center">
            <span className={`h-2 w-2 rounded-full ${estado.dot} mr-2`}></span>
            <span className="text-slate-400">{t(`enums.status.${task.estado}` as any)}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className={`font-medium ${slaStatus.color}`}>
              {slaStatus.text}
          </span>
          <span className="text-slate-500">{timeLeft}</span>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;