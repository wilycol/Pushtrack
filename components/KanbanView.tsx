import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PushtrackTask, FilterState, TaskFormData, Estado, Project, User, HistoryEvent, Auditoria, ToastType, TransitionValidationResult } from '../types';
import KanbanColumn from './KanbanColumn';
import TaskFormModal from './TaskFormModal';
import FilterControls from './FilterControls';
import AlertModal from './AlertModal';
import ReasonModal from './ReasonModal';
import { validateTransition } from '../utils/workflow';


interface KanbanViewProps {
    tickets: PushtrackTask[];
    projects: Project[];
    users: User[];
    setTickets: React.Dispatch<React.SetStateAction<PushtrackTask[]>>;
    onUpdateUser: (user: User) => void;
    onSendToTrash: (ticketId: string) => void;
    currentUser: User | null;
    history: HistoryEvent[];
    addHistoryEvent: (event: Omit<HistoryEvent, 'id' | 'when' | 'isRead'>, toastMessage: string) => void;
    addToast: (message: string, type: ToastType) => void;
}

const columnOrder: Estado[] = [
    Estado.Backlog,
    Estado.ToDo,
    Estado.InProgress,
    Estado.Review,
    Estado.Test,
    Estado.WaitingForClient,
    Estado.ReleasedClosed,
    Estado.NotApplicable,
];

const KanbanView: React.FC<KanbanViewProps> = (props) => {
    const { tickets, projects, users, setTickets, onUpdateUser, onSendToTrash, currentUser, history, addHistoryEvent, addToast } = props;
    const { t } = useTranslation('common');
    const [isCompact, setIsCompact] = useState(false);
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<PushtrackTask | null>(null);
    const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);
    const [alertInfo, setAlertInfo] = useState<{ title: string; message: string } | null>(null);
    const [moveRequest, setMoveRequest] = useState<{ ticketId: string; newStatus: Estado; targetIndex: number; title: string; validation: TransitionValidationResult; } | null>(null);

    const [filters, setFilters] = useState<FilterState>({
        task_type: 'all',
        prioridad: 'all',
        estado: 'all',
        search: '',
        archivado: 'false',
        project_key: 'all',
        criticalSLA: false,
        dateRange: { start: null, end: null },
        dateFilterType: 'created',
    });
    
    const filteredTickets = useMemo(() => {
        return tickets
            .filter(ticket => !ticket.trashed_at)
            .filter(ticket => filters.task_type === 'all' || ticket.task_type === filters.task_type)
            .filter(ticket => filters.prioridad === 'all' || ticket.prioridad === filters.prioridad)
            .filter(ticket => filters.project_key === 'all' || ticket.project_key === filters.project_key)
            .filter(ticket => filters.archivado === 'all' || ticket.archivado === (filters.archivado === 'true'))
            .filter(ticket => !filters.criticalSLA || (new Date(ticket.vence_en) < new Date() && ticket.estado !== Estado.ReleasedClosed))
            .filter(ticket => {
                const searchTerm = filters.search.toLowerCase();
                if (!searchTerm) return true;
                return ticket.id.toLowerCase().includes(searchTerm) || ticket.titulo.toLowerCase().includes(searchTerm);
            });
    }, [tickets, filters]);

    const ticketsByStatus = useMemo(() => {
        const grouped = columnOrder.reduce((acc, status) => {
            acc[status] = [];
            return acc;
        }, {} as Record<Estado, PushtrackTask[]>);

        const sortedTickets = [...filteredTickets].sort((a,b) => a.kanban_order - b.kanban_order);

        sortedTickets.forEach(ticket => {
            if (grouped[ticket.estado]) {
                grouped[ticket.estado].push(ticket);
            }
        });
        return grouped;
    }, [filteredTickets]);
    
    const unreadTicketIds = useMemo(() => {
        return new Set(history.filter(h => !h.isRead).map(h => h.ticketId));
    }, [history]);

    const handleFilterChange = (newFilters: Partial<FilterState>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const updateTicketInState = useCallback((ticketId: string, updateFn: (ticket: PushtrackTask) => PushtrackTask) => {
        setTickets(prevTickets => prevTickets.map(t => t.id === ticketId ? updateFn(t) : t));
    }, [setTickets]);

    const performTicketMove = useCallback((ticketId: string, newStatus: Estado, targetIndex: number, validation: TransitionValidationResult, reason?: string) => {
        const ticketsInNewCol = ticketsByStatus[newStatus];

        const orderBefore = ticketsInNewCol[targetIndex - 1]?.kanban_order;
        const orderAfter = ticketsInNewCol[targetIndex]?.kanban_order;
        
        let newOrder: number;
        if (orderBefore !== undefined && orderAfter !== undefined) {
            newOrder = (orderBefore + orderAfter) / 2;
        } else if (orderBefore !== undefined) {
            newOrder = orderBefore + 1000;
        } else if (orderAfter !== undefined) {
            newOrder = orderAfter / 2;
        } else {
            newOrder = Date.now();
        }
        
        let originalStatus: Estado | undefined;
        updateTicketInState(ticketId, (ticketToUpdate) => {
            originalStatus = ticketToUpdate.estado;
            const now = new Date().toISOString();
            
            let detalle = `Movido de ${originalStatus} a ${newStatus}.`;
            if (reason) detalle += ` Motivo: ${reason}`;
            if (validation.isAdminOverride) detalle += ` ${t('workflow.audit.adminOverride')}`;
            
            const newAudit: Auditoria = {
                evento: 'Movimiento (Kanban)',
                por: currentUser?.full_name || 'Sistema',
                cuando: now,
                detalle,
                es_override_admin: validation.isAdminOverride,
                estado_checklist: validation.isChecklistComplete ? 'Completo' : 'Incompleto',
                method: 'drag',
            };
            
            const isClosing = [Estado.ReleasedClosed, Estado.NotApplicable].includes(newStatus);

            return { 
                ...ticketToUpdate, 
                estado: newStatus, 
                kanban_order: newOrder,
                closed_at: isClosing && !ticketToUpdate.closed_at ? now : ticketToUpdate.closed_at,
                updated_at: now, 
                auditoria: [newAudit, ...ticketToUpdate.auditoria] 
            };
        });
        
        if (originalStatus && originalStatus !== newStatus) {
            addHistoryEvent(
                { ticketId, text: String(t('notifications.ticketMovedText', { ticketId, from: t(`enums.status.${originalStatus}`), to: t(`enums.status.${newStatus}`) })), who: currentUser?.full_name || 'System' },
                String(t('notifications.ticketMoved', { ticketId }))
            );
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ticketsByStatus, updateTicketInState, currentUser, addHistoryEvent, t]);


    const handleTicketMove = useCallback((ticketId: string, newStatus: Estado, targetIndex: number) => {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket || !currentUser) return;
    
        const finalIndex = targetIndex === -1 ? ticketsByStatus[newStatus].length : targetIndex;

        // This handles reordering within the same column
        if (ticket.estado === newStatus) {
             const validation: TransitionValidationResult = { isValid: true, requiresReason: false, isAdminOverride: false, isChecklistComplete: true, reasonTitleKey: '' };
             performTicketMove(ticketId, newStatus, finalIndex, validation);
             return;
        }

        const validation = validateTransition(ticket, ticket.estado, newStatus, currentUser, 'kanban');

        if (!validation.isValid) {
            if (validation.errorKey) {
                let interpolatedData: Record<string, any> = { ...validation.errorData };
                
                if (interpolatedData.missingItemKeys) {
                    interpolatedData.itemsPendientes = interpolatedData.missingItemKeys.map((key: string) => t(key)).join(', ');
                    delete interpolatedData.missingItemKeys;
                }
                if (interpolatedData.rol) {
                    interpolatedData.rol = t(`enums.userRole.${interpolatedData.rol as string}`);
                }
                if (interpolatedData.fromState) {
                    interpolatedData.fromState = t(`enums.status.${interpolatedData.fromState as string}`);
                }
                
                addToast(String(t(validation.errorKey, interpolatedData)), 'error');
            } else {
                addToast(String(t('workflow.error.unknown')), 'error');
            }
            setDraggedTicketId(null);
            return;
        }

        if (validation.requiresReason) {
            setMoveRequest({ ticketId, newStatus, targetIndex: finalIndex, title: String(t(validation.reasonTitleKey)), validation });
        } else {
            performTicketMove(ticketId, newStatus, finalIndex, validation);
        }
    }, [tickets, currentUser, ticketsByStatus, performTicketMove, t, addToast]);
    
    const handleReasonSubmit = (reason: string) => {
        if (moveRequest) {
            const { ticketId, newStatus, targetIndex, validation } = moveRequest;
            performTicketMove(ticketId, newStatus, targetIndex, validation, reason);
            setMoveRequest(null);
        }
    };

    const handleTicketUpdate = (ticketId: string, updates: Partial<PushtrackTask>) => {
        updateTicketInState(ticketId, (ticketToUpdate) => {
             const newAudit: Auditoria = {
                evento: 'Actualización Rápida (Kanban)',
                por: currentUser?.full_name || 'Sistema',
                cuando: new Date().toISOString(),
                detalle: `Se actualizaron los detalles desde el tablero Kanban.`
            };
            return {...ticketToUpdate, ...updates, updated_at: new Date().toISOString(), auditoria: [newAudit, ...ticketToUpdate.auditoria]};
        });
    };

    const handleOpenEditForm = (ticket: PushtrackTask) => {
        setEditingTicket(ticket);
        setIsTaskFormOpen(true);
    };

    const handleFormSubmit = (ticketId: string, formData: TaskFormData) => {
        if(editingTicket) {
             handleTicketUpdate(ticketId, formData);
        }
        setIsTaskFormOpen(false);
    };

    return (
        <>
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-[#0F1626] p-4 rounded-xl shadow-lg border border-[#22304A]">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-100">{t('kanban.title')}</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="flex items-center cursor-pointer">
                            <span className="text-sm font-medium text-slate-300 mr-3">{t('kanban.compactView')}</span>
                            <div className="relative">
                                <input type="checkbox" checked={isCompact} onChange={() => setIsCompact(!isCompact)} className="sr-only" />
                                <div className="block bg-slate-700 w-14 h-8 rounded-full"></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isCompact ? 'translate-x-6 bg-indigo-400' : ''}`}></div>
                            </div>
                        </label>
                    </div>
                </div>
                <FilterControls
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    projects={projects}
                />

                <div className="flex gap-4 overflow-x-auto p-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
                    {columnOrder.map(status => (
                        <KanbanColumn
                            key={status}
                            status={status}
                            tickets={ticketsByStatus[status]}
                            users={users}
                            isCompact={isCompact}
                            onTicketMove={handleTicketMove}
                            onEditTicket={handleOpenEditForm}
                            onUpdateTicket={handleTicketUpdate}
                            onSendToTrash={onSendToTrash}
                            draggedTicketId={draggedTicketId}
                            setDraggedTicketId={setDraggedTicketId}
                            unreadTicketIds={unreadTicketIds}
                        />
                    ))}
                </div>
            </div>
            {isTaskFormOpen && (
              <TaskFormModal 
                isOpen={isTaskFormOpen}
                onClose={() => setIsTaskFormOpen(false)}
                onSubmit={handleFormSubmit}
                ticketToEdit={editingTicket}
                projects={projects}
                users={users}
              />
            )}
             {alertInfo && (
                <AlertModal
                    isOpen={!!alertInfo}
                    onClose={() => setAlertInfo(null)}
                    title={alertInfo.title}
                    message={alertInfo.message}
                    closeButtonText={t('modals.alert.close')}
                />
            )}
            {moveRequest && (
                <ReasonModal
                    isOpen={!!moveRequest}
                    onClose={() => setMoveRequest(null)}
                    onSubmit={handleReasonSubmit}
                    title={moveRequest.title}
                />
            )}
        </>
    );
};

export default KanbanView;