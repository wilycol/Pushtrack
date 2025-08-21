import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PushtrackTask, User, Prioridad, Estado } from '../types';
import { getPriorityStyles, timeUntil, getUserInfo, daysSince } from '../utils/helpers';
import { PaperClipIcon, ChatBubbleBottomCenterTextIcon, EllipsisVerticalIcon, PencilIcon, ArrowsUpDownIcon, TrashIcon, XMarkIcon, CalendarDaysIcon } from './icons';

interface KanbanCardProps {
    ticket: PushtrackTask;
    users: User[];
    isCompact: boolean;
    onEditTicket: (ticket: PushtrackTask) => void;
    onUpdateTicket: (ticketId: string, updates: Partial<PushtrackTask>) => void;
    onSendToTrash: (ticketId: string) => void;
    draggedTicketId: string | null;
    setDraggedTicketId: (id: string | null) => void;
    onTicketMove: (ticketId: string, newStatus: Estado, targetIndex: number) => void;
    unreadTicketIds: Set<string>;
}

const KanbanCardEditor: React.FC<{
    ticket: PushtrackTask;
    users: User[];
    onSave: (updates: Partial<PushtrackTask>) => void;
    onCancel: () => void;
}> = ({ ticket, users, onSave, onCancel }) => {
    const [data, setData] = useState({
        responsable_email: ticket.responsable_email,
        prioridad: ticket.prioridad,
        target_date: ticket.target_date || ''
    });

    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCancel();
            if (e.key === 'Enter' && !e.shiftKey) {
                 e.preventDefault();
                 handleSave();
            }
        };
        const handleClickOutside = (e: MouseEvent) => {
             if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
                handleSave();
            }
        }
        
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const handleSave = () => {
        onSave(data);
    }

    return (
        <div ref={editorRef} className="p-3 space-y-3 bg-slate-700 rounded-xl">
             <div>
                <label className="text-xs font-semibold text-slate-300">Responsable</label>
                <select 
                    value={data.responsable_email} 
                    onChange={e => setData(d => ({...d, responsable_email: e.target.value}))}
                    className="w-full bg-slate-800 border-slate-600 rounded-md text-sm p-1 mt-1"
                >
                    <option value="">Sin asignar</option>
                    {users.map(u => <option key={u.email} value={u.email}>{u.full_name}</option>)}
                </select>
            </div>
            <div>
                 <label className="text-xs font-semibold text-slate-300">Prioridad</label>
                 <div className="flex gap-1 mt-1">
                    {Object.values(Prioridad).map(p => (
                        <button key={p} onClick={() => setData(d => ({...d, prioridad: p}))}
                            className={`flex-1 text-xs p-1 rounded ${data.prioridad === p ? 'bg-indigo-500 text-white' : 'bg-slate-600 hover:bg-slate-500'}`}
                        >{p}</button>
                    ))}
                 </div>
            </div>
            <div>
                 <label className="text-xs font-semibold text-slate-300">Fecha Objetivo</label>
                 <input 
                    type="date"
                    value={data.target_date?.split('T')[0] || ''}
                    onChange={e => setData(d => ({...d, target_date: e.target.value ? new Date(e.target.value).toISOString() : ''}))}
                    className="w-full bg-slate-800 border-slate-600 rounded-md text-sm p-1 mt-1"
                 />
            </div>
        </div>
    );
};


const KanbanCard: React.FC<KanbanCardProps> = (props) => {
    const { ticket, users, isCompact, onEditTicket, onUpdateTicket, onSendToTrash, draggedTicketId, setDraggedTicketId, onTicketMove, unreadTicketIds } = props;
    const { t } = useTranslation('common');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showSavedMsg, setShowSavedMsg] = useState(false);

    const isBeingDragged = draggedTicketId === ticket.id;
    const hasUnread = unreadTicketIds.has(ticket.id);

    const responsable = getUserInfo(ticket.responsable_email, users);
    const priority = getPriorityStyles(ticket.prioridad);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('ticketId', ticket.id);
        e.dataTransfer.effectAllowed = 'move';
        setDraggedTicketId(ticket.id);
    };
    
    const handleDragEnd = () => {
        setDraggedTicketId(null);
    };

    const handleAction = (e: React.MouseEvent, action: () => void) => {
        e.stopPropagation();
        action();
        setIsMenuOpen(false);
    };
    
    const navigateToHistory = () => {
        window.location.hash = `#/tasks?ticketId=${ticket.id}`;
    };

    const handleMove = (newStatus: Estado) => {
        onTicketMove(ticket.id, newStatus, -1); // -1 signifies moving to the end of the column
        setIsMoveModalOpen(false);
    }
    
    const handleEditorSave = (updates: Partial<PushtrackTask>) => {
        onUpdateTicket(ticket.id, updates);
        setIsEditing(false);
        setShowSavedMsg(true);
        setTimeout(() => setShowSavedMsg(false), 2000);
    };

    const UserAvatar: React.FC<{ user: User | null }> = ({ user }) => {
        if (!user) {
            return <div title={t('kanban.card.unassigned') || ''} className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-300">?</div>;
        }
        const initials = user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
        return <div title={user.full_name} className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">{initials}</div>;
    };
    
    const MoveModal = () => (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setIsMoveModalOpen(false)}>
            <div className="bg-[#121A2B] rounded-xl shadow-lg w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h3 className="font-semibold text-slate-100">{t('kanban.moveModal.title')}</h3>
                    <button onClick={() => setIsMoveModalOpen(false)} className="p-1 rounded-full hover:bg-slate-700"><XMarkIcon className="w-5 h-5"/></button>
                </div>
                <div className="p-4 grid grid-cols-2 gap-2">
                    {Object.values(Estado).map(status => (
                        <button 
                            key={status}
                            onClick={() => handleMove(status)}
                            disabled={status === ticket.estado}
                            className="p-2 text-sm text-left rounded-md hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >{t(`enums.status.${status}`)}</button>
                    ))}
                </div>
            </div>
        </div>
    );

    if (isEditing) {
        return <KanbanCardEditor ticket={ticket} users={users} onSave={handleEditorSave} onCancel={() => setIsEditing(false)} />;
    }

    return (
        <>
        <div
            data-ticket-id={ticket.id}
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDoubleClick={() => setIsEditing(true)}
            className={`bg-[#1E293B] rounded-xl p-3 border-2 border-transparent hover:border-indigo-500 cursor-grab active:cursor-grabbing transition-all shadow-md hover:shadow-indigo-500/20 ${isBeingDragged ? 'opacity-50 rotate-3' : 'opacity-100'}`}
        >
            {hasUnread && <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" title={t('notifications.unread') || ''}></div>}
            {showSavedMsg && <div className="absolute top-1 right-1 text-xs bg-green-500/80 text-white px-2 py-0.5 rounded-full animate-pulse">Guardado</div>}
            <div className="flex justify-between items-start">
                <p className="text-sm font-bold text-slate-100 pr-2">{ticket.titulo}</p>
                <div className="relative">
                    <button onClick={(e) => {e.stopPropagation(); setIsMenuOpen(p => !p);}} className="p-1 rounded-full hover:bg-slate-700/50 flex-shrink-0">
                        <EllipsisVerticalIcon className="w-5 h-5 text-slate-400"/>
                    </button>
                    {isMenuOpen && (
                        <div onMouseLeave={() => setIsMenuOpen(false)} className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-[#2a3a52] ring-1 ring-black ring-opacity-5 z-20">
                           <div className="py-1">
                                <button onClick={(e) => handleAction(e, () => onEditTicket(ticket))} className="w-full text-left text-slate-200 flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-600"><PencilIcon className="w-4 h-4"/>{t('kanban.card.edit')}</button>
                                <button onClick={(e) => handleAction(e, () => setIsMoveModalOpen(true))} className="w-full text-left text-slate-200 flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-600"><ArrowsUpDownIcon className="w-4 h-4"/>{t('kanban.card.move')}</button>
                                <button onClick={(e) => handleAction(e, navigateToHistory)} className="w-full text-left text-slate-200 flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-600"><ChatBubbleBottomCenterTextIcon className="w-4 h-4"/>{t('kanban.card.history')}</button>
                                <div className="border-t border-slate-600 my-1"></div>
                                <button onClick={(e) => handleAction(e, () => onSendToTrash(ticket.id))} className="w-full text-left text-red-400 flex items-center gap-2 px-4 py-2 text-sm hover:bg-red-500/10"><TrashIcon className="w-4 h-4"/>{t('kanban.card.delete')}</button>
                           </div>
                        </div>
                    )}
                </div>
            </div>
            
            <p className="text-xs font-mono text-slate-500 mb-2">{ticket.id}</p>

            {!isCompact && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{ticket.descripcion}</p>}
            
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <UserAvatar user={responsable} />
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${priority.bg} ${priority.text}`}>{t(`enums.priority.${ticket.prioridad}` as any)}</span>
                    {ticket.target_date && !isCompact && 
                        <span title={`Target: ${new Date(ticket.target_date).toLocaleDateString()}`} className="text-slate-400 flex items-center gap-1 text-xs">
                           <CalendarDaysIcon className="w-3 h-3"/> {new Date(ticket.target_date).toLocaleDateString('es-ES', {month: 'short', day: 'numeric'})}
                        </span>
                    }
                </div>
                <div className="text-xs text-slate-400 text-right">
                    <p className={`font-semibold ${new Date(ticket.vence_en) < new Date() ? 'text-red-400' : 'text-amber-400'}`}>{timeUntil(ticket.vence_en)}</p>
                    <p>{t('kanban.daysAgo', { count: daysSince(ticket.recibido_en) })}</p>
                </div>
            </div>

        </div>
        {isMoveModalOpen && <MoveModal />}
        </>
    );
};

export default KanbanCard;