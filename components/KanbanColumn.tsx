import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PushtrackTask, Estado, User } from '../types';
import KanbanCard from './KanbanCard';
import { getEstadoStyles } from '../utils/helpers';

interface KanbanColumnProps {
    status: Estado;
    tickets: PushtrackTask[];
    users: User[];
    isCompact: boolean;
    onTicketMove: (ticketId: string, newStatus: Estado, targetIndex: number) => void;
    onEditTicket: (ticket: PushtrackTask) => void;
    onUpdateTicket: (ticketId: string, updates: Partial<PushtrackTask>) => void;
    onSendToTrash: (ticketId: string) => void;
    draggedTicketId: string | null;
    setDraggedTicketId: (id: string | null) => void;
    unreadTicketIds: Set<string>;
}

const KanbanColumn: React.FC<KanbanColumnProps> = (props) => {
    const { status, tickets, onTicketMove, draggedTicketId } = props;
    const { t } = useTranslation('common');
    const [isDragOver, setIsDragOver] = useState(false);
    const estadoStyle = getEstadoStyles(status);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const [wipLimit, setWipLimit] = useState<number | null>(null);

    const isWipExceeded = wipLimit !== null && tickets.length > wipLimit;

    const getDropIndicatorIndex = (e: React.DragEvent<HTMLDivElement>): number => {
        if (!dropZoneRef.current) return tickets.length;
        const cards = Array.from(dropZoneRef.current.querySelectorAll('[data-ticket-id]'));
        const dropY = e.clientY;
        const closest = cards.reduce(
            (acc, child) => {
                const box = child.getBoundingClientRect();
                const offset = dropY - box.top - box.height / 2;
                if (offset < 0 && offset > acc.offset) {
                    return { offset, element: child as HTMLElement };
                }
                return acc;
            },
            { offset: Number.NEGATIVE_INFINITY, element: null as HTMLElement | null }
        );
        return closest.element ? cards.indexOf(closest.element) : tickets.length;
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const ticketId = e.dataTransfer.getData('ticketId');
        if (ticketId) {
            const targetIndex = getDropIndicatorIndex(e);
            onTicketMove(ticketId, status, targetIndex);
        }
        setIsDragOver(false);
    };

    return (
        <div
            className={`w-72 md:w-80 flex-shrink-0 bg-[#121A2B] rounded-2xl flex flex-col h-full transition-colors ${isDragOver ? 'bg-indigo-900/40' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div
                className={`flex justify-between items-center p-4 border-b-4 transition-colors ${isDragOver ? 'border-indigo-500' : 'border-slate-700/50'} ${isWipExceeded ? 'bg-red-500/10 border-red-500/50' : ''}`}
            >
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${estadoStyle.dot}`}></span>
                    <h3 className="font-bold text-slate-100">{t(`enums.status.${status}`, status)}</h3>
                </div>
                <span
                    className={`text-sm font-semibold rounded-full px-2.5 py-0.5 ${isWipExceeded ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'}`}
                    title={isWipExceeded ? 'Work-in-progress limit exceeded' : ''}
                >
                    {tickets.length}
                </span>
            </div>
            <div
                ref={dropZoneRef}
                className="flex-grow p-2 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
            >
                {tickets.map((ticket) => (
                    <KanbanCard
                        key={ticket.id}
                        ticket={ticket}
                        {...props}
                    />
                ))}
            </div>
        </div>
    );
};

export default KanbanColumn;