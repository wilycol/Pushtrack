

import { Prioridad, Estado, PQRType, Canal, Project, User, TaskType } from '../types';
import { ClockIcon, EnvelopeIcon, PaperAirplaneIcon, PhoneIcon, QuestionMarkCircleIcon, SparklesIcon, TagIcon, TicketIcon, UserGroupIcon, ChatBubbleBottomCenterTextIcon, DocumentChartBarIcon, Cog6ToothIcon, ExclamationTriangleIcon, BellIcon } from '../components/icons';
import React from 'react';


export const formatDateTime = (isoString: string): string => {
  if (!isoString) return 'N/A';
  // Format to DD/MM/YYYY, HH:mm
  return new Date(isoString).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const daysSince = (isoString: string): number => {
    if (!isoString) return 0;
    const now = new Date();
    const pastDate = new Date(isoString);
    const diffMs = now.getTime() - pastDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

export const timeUntil = (isoString: string): string => {
    const now = new Date();
    const futureDate = new Date(isoString);
    const diffMs = futureDate.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffHours / 24);

    if (diffHours < 0) {
        return `Vencido por ${Math.abs(diffHours)}h`;
    }
    if (diffHours < 24) {
        return `Vence en ${diffHours}h`;
    }
    return `Vence en ${diffDays}d`;
};

export const timeToExpire = (isoString: string | null): string => {
    if (!isoString) return 'N/A';
    const TRASH_RETENTION_DAYS = 30;
    const trashedDate = new Date(isoString);
    const expiryDate = new Date(trashedDate.getTime() + TRASH_RETENTION_DAYS * 24 * 3600 * 1000);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();

    if (diffMs <= 0) {
        return 'Expira ahora';
    }

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
        return `${diffDays}d ${diffHours}h`;
    }
    if (diffHours > 0) {
        return `${diffHours}h`;
    }
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffMinutes}m`;
};


export const getSLAStatus = (isoString: string): { text: string; color: string; badgeBg: string; } => {
    const now = new Date();
    const futureDate = new Date(isoString);
    const diffMs = futureDate.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0) {
        return { text: 'SLA Vencido', color: 'text-red-400', badgeBg: 'bg-red-500/20' };
    }
    if (diffHours <= 4) {
        return { text: 'Vence Pronto', color: 'text-amber-400', badgeBg: 'bg-amber-500/20' };
    }
    return { text: 'En Tiempo', color: 'text-green-400', badgeBg: 'bg-green-500/20' };
};


export const getPriorityStyles = (priority: Prioridad): { bg: string, text: string, icon: React.ElementType } => {
  switch (priority) {
    case Prioridad.Alta:
      return { bg: 'bg-red-500/20', text: 'text-red-400', icon: PaperAirplaneIcon };
    case Prioridad.Media:
      return { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: ClockIcon };
    case Prioridad.Baja:
      return { bg: 'bg-green-500/20', text: 'text-green-400', icon: TagIcon };
    default:
      return { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: QuestionMarkCircleIcon };
  }
};

export const getEstadoStyles = (estado: Estado): { bg: string, text: string, dot: string } => {
  switch (estado) {
    case Estado.Backlog:
      return { bg: 'bg-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-500' };
    case Estado.ToDo:
      return { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500' };
    case Estado.InProgress:
      return { bg: 'bg-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-500' };
    case Estado.Review:
        return { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' };
    case Estado.Test:
        return { bg: 'bg-cyan-500/20', text: 'text-cyan-400', dot: 'bg-cyan-500' };
    case Estado.WaitingForClient:
      return { bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-500' };
    case Estado.ReleasedClosed:
      return { bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-500' };
    case Estado.NotApplicable:
      return { bg: 'bg-slate-600/30', text: 'text-slate-500', dot: 'bg-slate-600' };
    default:
      return { bg: 'bg-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-400' };
  }
};

export const getPQRTypeInfo = (pqrType: PQRType): { text: string, icon: React.ElementType } => {
    switch(pqrType){
        case PQRType.P:
            return { text: 'Petición', icon: PaperAirplaneIcon };
        case PQRType.Q:
            return { text: 'Queja', icon: ChatBubbleBottomCenterTextIcon };
        case PQRType.R:
            return { text: 'Reclamo', icon: UserGroupIcon };
        case PQRType.S:
            return { text: 'Sugerencia', icon: SparklesIcon };
    }
};

export const getTaskTypeInfo = (taskType: TaskType): { i18nKey: string, icon: React.ElementType, color: string, tooltipKey: string } => {
    switch(taskType){
        case TaskType.PQR:
            return { i18nKey: 'taskTypes.PQR', icon: TicketIcon, color: 'text-blue-400', tooltipKey: 'taskTypeTooltips.PQR' };
        case TaskType.ODT:
            return { i18nKey: 'taskTypes.ODT', icon: Cog6ToothIcon, color: 'text-slate-400', tooltipKey: 'taskTypeTooltips.ODT' };
        case TaskType.Bug:
            return { i18nKey: 'taskTypes.Bug', icon: ExclamationTriangleIcon, color: 'text-red-400', tooltipKey: 'taskTypeTooltips.Bug' };
        case TaskType.Mejora:
            return { i18nKey: 'taskTypes.Mejora', icon: SparklesIcon, color: 'text-purple-400', tooltipKey: 'taskTypeTooltips.Mejora' };
        case TaskType.Alerta:
            return { i18nKey: 'taskTypes.Alerta', icon: BellIcon, color: 'text-amber-400', tooltipKey: 'taskTypeTooltips.Alerta' };
        default:
            return { i18nKey: 'taskTypes.PQR', icon: TicketIcon, color: 'text-slate-400', tooltipKey: 'taskTypeTooltips.PQR' };
    }
};

export const getCanalInfo = (canal: Canal): { text: string, icon: React.ElementType } => {
    switch(canal){
        case Canal.App:
            return { text: 'App', icon: TicketIcon };
        case Canal.Email:
            return { text: 'Email', icon: EnvelopeIcon };
        case Canal.WhatsApp:
            return { text: 'WhatsApp', icon: ChatBubbleBottomCenterTextIcon };
        case Canal.Otro:
            return { text: 'Otro', icon: PhoneIcon };
    }
};

export const getProjectInfo = (project_key: string, projects: Project[]): Project | { name: string } => {
    return projects.find(p => p.project_key === project_key) || { name: 'Sin Proyecto' };
};

export const getUserInfo = (email: string, users: User[]): User | null => {
    return users.find(u => u.email === email) || null;
};


export const renderMentionedText = (rawText: string, users: User[]): React.ReactNode => {
    if (!rawText) return '';
    const mentionRegex = /@\{([^|}]+)\|([^}]+)\}/g;
    const parts = rawText.split(mentionRegex);

    return React.createElement(
        React.Fragment,
        null,
        ...parts.map((part, index) => {
            // Every 3rd part is the full match, 1st is email, 2nd is name
            if (index % 3 === 1) {
                const userEmail = parts[index];
                const userName = parts[index + 1];
                const userInfo = getUserInfo(userEmail, users);
                
                return React.createElement('span', {
                    key: `mention-${index}`,
                    className: "bg-indigo-500/30 text-indigo-300 font-semibold px-1 rounded-sm mx-0.5",
                    title: `Usuario: ${userInfo?.full_name || userName}\nRol: ${userInfo?.role_global || 'N/A'}\nEmail: ${userEmail}`
                }, `@${userName}`);
            }
            if (index % 3 === 2) return null; // This is the name part, already handled
            if (index % 3 === 0) {
                 // Regular text part
                 return part.split(/(\n)/).map((line, lineIndex) => 
                    line === '\n' ? React.createElement('br', { key: `br-${index}-${lineIndex}` }) : line
                 );
            }
            return null;
        })
    );
};