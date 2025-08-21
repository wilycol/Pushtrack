import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PushtrackTask, FilterState, TaskFormData, Estado, ImportResults, AdjuntoItem, Comentario, Auditoria, PQRType, Prioridad, Canal, Project, User, ProgressUpdate, AIQuestion, Impacto, Area, Mention, HistoryEvent, TaskType, UserRole, ToastType } from '../types';
import TaskList from './PQRSList';
import TaskDetailView from './PQRSDetailView';
import FilterControls from './FilterControls';
import { DocumentMagnifyingGlassIcon, ArrowUturnLeftIcon } from './icons';
import TaskFormModal from './TaskFormModal';
import { exportTicketsToCSV, downloadCSVTemplate } from '../utils/csvUtils';
import ImportSummaryModal from './ImportSummaryModal';
import UserFormModal from './UserFormModal';
import { checklistConfig } from '../utils/checklistConfig';
import AlertModal from './AlertModal';
import { generateAIQuestions } from '../services/geminiService';
import GeminiSummarizer from './GeminiSummarizer';
import { validateTransition } from '../utils/workflow';

interface DashboardViewProps {
    tickets: PushtrackTask[];
    projects: Project[];
    users: User[];
    setTickets: React.Dispatch<React.SetStateAction<PushtrackTask[]>>;
    location: string;
    onUpdateUser: (user: User) => void;
    onSendToTrash: (ticketId: string) => void;
    currentUser: User | null;
    addHistoryEvent: (event: Omit<HistoryEvent, 'id' | 'when' | 'isRead'>, toastMessage: string) => void;
    addToast: (message: string, type: ToastType) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ tickets, projects, users, setTickets, location, onUpdateUser, onSendToTrash, currentUser, addHistoryEvent, addToast }) => {
  const { t } = useTranslation('common');
  const [selectedTicket, setSelectedTicket] = useState<PushtrackTask | null>(null);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<PushtrackTask | null>(null);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [sourceProject, setSourceProject] = useState<string | null>(null);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string } | null>(null);
  
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
      .filter(ticket => filters.estado === 'all' || ticket.estado === filters.estado)
      .filter(ticket => filters.project_key === 'all' || ticket.project_key === filters.project_key)
      .filter(ticket => {
          if (filters.archivado === 'all') return true;
          return ticket.archivado === (filters.archivado === 'true');
      })
      .filter(ticket => {
          if(!filters.criticalSLA) return true;
          return new Date(ticket.vence_en) < new Date() && ticket.estado !== Estado.ReleasedClosed;
      })
      .filter(ticket => {
        const searchTerm = filters.search.toLowerCase();
        if (!searchTerm) return true;
        return (
          ticket.id.toLowerCase().includes(searchTerm) ||
          ticket.titulo.toLowerCase().includes(searchTerm)
        );
      });
  }, [tickets, filters]);

  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const ticketId = params.get('ticketId');
    const sourceProj = params.get('sourceProject');
    setSourceProject(sourceProj);

    if (ticketId) {
        const ticketToSelect = tickets.find(t => t.id === ticketId);
        if (ticketToSelect) {
            setSelectedTicket(ticketToSelect);
        }
    } else if (filteredTickets.length > 0 && !selectedTicket) {
        // Select first ticket in list if none is selected
        setSelectedTicket(filteredTickets[0]);
    } else if (filteredTickets.length === 0) {
        setSelectedTicket(null); // Clear selection if no tickets
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, tickets, filteredTickets]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };
  
  const handleOpenCreateForm = () => {
    setEditingTicket(null);
    setIsTaskFormOpen(true);
  };

  const handleOpenEditForm = (ticket: PushtrackTask) => {
    setEditingTicket(ticket);
    setIsTaskFormOpen(true);
  };

  const handleOpenUserForm = (user: User) => {
    setUserToEdit(user);
    setIsUserFormOpen(true);
  };

  const handleCloseTaskForm = () => {
    setIsTaskFormOpen(false);
    setEditingTicket(null);
  };

  const handleCloseUserForm = () => {
      setIsUserFormOpen(false);
      setUserToEdit(null);
  };

  const handleUserFormSubmit = (user: User) => {
      onUpdateUser(user);
      handleCloseUserForm();
  };
  
  const handleCreateTask = (formData: TaskFormData) => {
    const now = new Date();
    const venceEnDate = new Date(now);
    venceEnDate.setHours(venceEnDate.getHours() + formData.sla_horas);

    const lastIdNumber = tickets.reduce((maxId, t) => {
      const idNum = parseInt(t.id.replace('TSK-', ''), 10);
      return idNum > maxId ? idNum : maxId;
    }, 0);
    const newTicketId = `TSK-${String(lastIdNumber + 1).padStart(3, '0')}`;
    
    const newTicket: PushtrackTask = {
      ...formData,
      id: newTicketId,
      recibido_en: now.toISOString(),
      updated_at: now.toISOString(),
      vence_en: venceEnDate.toISOString(),
      impacto: Impacto.Medio, // Default value
      area: Area.General, // Default value
      archivado: false,
      trashed_at: null,
      auditoria: [
        {
          evento: 'Creación',
          por: currentUser?.full_name || 'Sistema',
          cuando: now.toISOString(),
          detalle: 'Tarea creada',
        },
      ],
      checklist: {},
      respuesta_final: '',
      colaboradores_emails: formData.colaboradores_emails,
      progress: 0,
      progress_history: [],
      ai_questions: [],
      escalation_level: 0,
      closed_at: null,
      kanban_order: now.getTime(),
      target_date: formData.target_date,
    };

    const newTickets = [newTicket, ...tickets];
    setTickets(newTickets);
    setSelectedTicket(newTicket);
    handleCloseTaskForm();

    addHistoryEvent(
      { ticketId: newTicketId, text: `Tarea "${newTicket.titulo}" creada.`, who: currentUser?.full_name || 'System' },
      String(t('notifications.ticketCreated', { ticketId: newTicketId }))
    );
  };
  
  const handleUpdateTask = (ticketId: string, formData: TaskFormData) => {
    const originalTicket = tickets.find(t => t.id === ticketId);
    if (!originalTicket || !currentUser) return;

    // --- Workflow Validation ---
    if (originalTicket.estado !== formData.estado) {
        const validation = validateTransition(originalTicket, originalTicket.estado, formData.estado, currentUser, 'task-form');
        
        if (!validation.isValid) {
            let interpolatedData: Record<string, any> = { ...validation.errorData };

            if (interpolatedData.missingItemKeys) {
                interpolatedData.itemsPendientes = interpolatedData.missingItemKeys.map((key: string) => String(t(key))).join(', ');
                delete interpolatedData.missingItemKeys;
            }
            if (interpolatedData.rol) {
                interpolatedData.rol = String(t(`enums.userRole.${interpolatedData.rol as string}`));
            }
            if (interpolatedData.fromState) {
                interpolatedData.fromState = String(t(`enums.status.${interpolatedData.fromState as string}`));
            }

            setAlertInfo({
                title: String(t('workflow.error.title')),
                message: String(t(validation.errorKey || 'workflow.error.unknown', interpolatedData)),
            });
            return; // Stop the update
        }

        // If valid, proceed and create detailed audit log
        updateTicketInState(ticketId, (ticket) => {
            const newAudit: Auditoria = {
                evento: 'Cambio de Estado',
                por: currentUser?.full_name || 'Sistema',
                cuando: new Date().toISOString(),
                detalle: `Estado cambiado de ${String(t(`enums.status.${ticket.estado}`))} a ${String(t(`enums.status.${formData.estado}`))}.`,
                estado_checklist: validation.isChecklistComplete ? 'Completo' : 'Incompleto',
                es_override_admin: validation.isAdminOverride,
            };
            return {
                ...ticket,
                ...formData,
                updated_at: new Date().toISOString(),
                auditoria: [newAudit, ...ticket.auditoria],
            };
        });

    } else {
        // Just a regular field update, no state change
        updateTicketInState(ticketId, (ticket) => {
            const newAudit: Auditoria = {
                evento: 'Tarea Editada',
                por: currentUser?.full_name || 'Sistema',
                cuando: new Date().toISOString(),
                detalle: `Se actualizaron los detalles de la Tarea.`
            };
            return {
                ...ticket,
                ...formData,
                updated_at: new Date().toISOString(),
                auditoria: [newAudit, ...ticket.auditoria],
            };
        });
    }

    handleCloseTaskForm();
    addHistoryEvent(
      { ticketId: ticketId, text: `Tarea "${formData.titulo}" actualizada.`, who: currentUser?.full_name || 'System' },
      String(t('notifications.ticketUpdated', { ticketId: ticketId }))
    );
  };

  const handleSelectTicket = (ticket: PushtrackTask) => {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    params.set('ticketId', ticket.id);
    window.location.hash = `#/tasks?${params.toString()}`;
    setSelectedTicket(ticket);
  };

  const updateTicketInState = (ticketId: string, updateFn: (ticket: PushtrackTask) => PushtrackTask) => {
      setTickets(prevTickets => prevTickets.map(t => t.id === ticketId ? updateFn(t) : t));
      setSelectedTicket(prevSelected => {
          if (prevSelected && prevSelected.id === ticketId) {
              const updatedTicket = updateFn(prevSelected);
              return updatedTicket;
          }
          return prevSelected;
      });
  };

  const handleChecklistChange = (ticketId: string, checklistItemId: string, isChecked: boolean) => {
    updateTicketInState(ticketId, (ticket) => {
        const newChecklist = {
            ...(ticket.checklist || {}),
            [checklistItemId]: {
                checked: isChecked,
                user: currentUser?.full_name || 'Sistema',
                date: new Date().toISOString()
            }
        };

        const checklistItemConfig = checklistConfig[ticket.estado]?.find(i => i.id === checklistItemId);
        const checklistItemLabel = checklistItemConfig ? String(t(checklistItemConfig.i18nKey)) : checklistItemId;

        const newAudit: Auditoria = {
            evento: 'Checklist Actualizado',
            por: currentUser?.full_name || 'Sistema',
            cuando: new Date().toISOString(),
            detalle: `Ítem "${checklistItemLabel}" fue marcado como ${isChecked ? 'completado' : 'pendiente'}.`
        };
        return { ...ticket, checklist: newChecklist, auditoria: [newAudit, ...ticket.auditoria], updated_at: new Date().toISOString() };
    });
  };

  const handleAddComment = (ticketId: string, commentData: { raw_text: string; mentions: Mention[] }) => {
    updateTicketInState(ticketId, (ticket) => {
        const newComment: Comentario = {
            id: crypto.randomUUID(),
            por: currentUser?.full_name || 'Sistema',
            cuando: new Date().toISOString(),
            ...commentData
        };
        const newAudit: Auditoria = {
            evento: 'Comentario agregado',
            por: currentUser?.full_name || 'Sistema',
            cuando: new Date().toISOString(),
            detalle: `Se añadió un nuevo comentario: "${commentData.raw_text.substring(0, 50)}..."`
        };

        // Simulate Notifications
        commentData.mentions.forEach(mention => {
            console.log(`%c[NOTIFICACIÓN SIMULADA] %cUsuario ${mention.full_name} (${mention.email}) fue mencionado en un comentario en el PQR ${ticketId}.`, 'color: #818CF8; font-weight: bold;', 'color: default;');
        });

        const updatedComentarios = [...(ticket.comentarios || []), newComment];
        return { ...ticket, comentarios: updatedComentarios, auditoria: [newAudit, ...ticket.auditoria], updated_at: new Date().toISOString() };
    });
  };
  
  const handleToggleArchive = (ticketId: string) => {
    updateTicketInState(ticketId, (ticket) => {
        const newArchivedState = !ticket.archivado;
        const newAudit: Auditoria = {
            evento: newArchivedState ? 'Ticket Archivado' : 'Ticket Desarchivado',
            por: currentUser?.full_name || 'Sistema',
            cuando: new Date().toISOString(),
            detalle: `El ticket fue movido ${newArchivedState ? 'a los archivos' : 'a la bandeja de entrada'}.`
        };
        return { ...ticket, archivado: newArchivedState, auditoria: [newAudit, ...ticket.auditoria], updated_at: new Date().toISOString() };
    });
  };

  const handleUpdateProgress = (ticketId: string, progress: number, commentData: { raw_text: string, mentions: Mention[] }) => {
      updateTicketInState(ticketId, (ticket) => {
          const newUpdate: ProgressUpdate = {
              by: currentUser?.full_name || 'Sistema',
              at: new Date().toISOString(),
              progress,
              comment: commentData,
          };
          
          const newAudit: Auditoria = {
              evento: `Progreso actualizado al ${progress}%`,
              por: newUpdate.by,
              cuando: newUpdate.at,
              detalle: `El responsable ha actualizado el progreso del ticket.` + (commentData.raw_text ? ` Comentario: "${commentData.raw_text.substring(0, 50)}..."` : ''),
          };
          
          // Simulate Notifications
          commentData.mentions.forEach(mention => {
            console.log(`%c[NOTIFICACIÓN SIMULADA] %cUsuario ${mention.full_name} (${mention.email}) fue mencionado en una actualización de progreso del PQR ${ticketId}.`, 'color: #818CF8; font-weight: bold;', 'color: default;');
        });

          const history = [...(ticket.progress_history || []), newUpdate];

          return {
              ...ticket,
              progress: progress,
              escalation_level: 0, // Reset escalation on update
              last_notification_sent_at: new Date().toISOString(), // Consider this an update
              progress_history: history,
              auditoria: [newAudit, ...ticket.auditoria],
              updated_at: new Date().toISOString(),
          };
      });
  };

  const handleAdvanceState = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket || !currentUser) return;
    
    // This is a special action from the progress panel, we assume the next logical state.
    const allStatuses = Object.values(Estado);
    const currentIndex = allStatuses.indexOf(ticket.estado);
    const nextState = allStatuses[currentIndex + 1];

    if (!nextState || currentIndex >= allStatuses.indexOf(Estado.ReleasedClosed)) {
       setAlertInfo({ title: "Acción Requerida", message: "Todos los pasos se han completado. Por favor, edita el PQR para moverlo al estado final 'Lanzado / Cerrado' o 'No Aplica' manualmente." });
       handleOpenEditForm(ticket);
       return;
    }

    const validation = validateTransition(ticket, ticket.estado, nextState, currentUser, 'task-form');

    if (!validation.isValid) {
        let missing = [];
        // Customize message based on error type
        if (validation.errorKey === 'workflow.error.checklistIncomplete') {
            const checklistItems = checklistConfig[ticket.estado] || [];
            const missingItems = checklistItems
                .filter(item => !ticket.checklist?.[item.id]?.checked)
                .map(item => `– ${String(t(item.i18nKey))}`);
            missing.push(`${String(t('unifiedPanel.errors.checklistIncomplete'))}\n${missingItems.join('\n')}`);
        } else {
            missing.push(String(t(validation.errorKey || 'workflow.error.unknown')));
        }
        
        setAlertInfo({
            title: String(t('unifiedPanel.errors.cantAdvanceTitle')),
            message: missing.join('\n\n'),
        });
        return;
    }

    // Advance to next state
     updateTicketInState(ticketId, (t) => {
        const newAudit: Auditoria = {
            evento: 'Cambio de Estado',
            por: currentUser?.full_name || 'Sistema',
            cuando: new Date().toISOString(),
            detalle: `Estado cambiado de ${ticket.estado} a ${nextState}.`,
            estado_checklist: validation.isChecklistComplete ? 'Completo' : 'Incompleto',
            es_override_admin: validation.isAdminOverride,
        };
        return {
            ...t,
            estado: nextState,
            progress: 0, // Reset progress for new state
            auditoria: [newAudit, ...t.auditoria],
            updated_at: new Date().toISOString(),
        };
    });
  };
  
  const handleGenerateAIQuestions = async (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    
    try {
        const questions = await generateAIQuestions(ticket);
        updateTicketInState(ticketId, (t) => {
            const newAudit: Auditoria = {
              evento: 'Preguntas de IA generadas',
              por: 'Sistema',
              cuando: new Date().toISOString(),
              detalle: `Se generaron ${questions.length} preguntas nuevas.`
            };
            return {
                ...t,
                ai_questions: [...(t.ai_questions || []), ...questions],
                auditoria: [newAudit, ...t.auditoria],
                updated_at: new Date().toISOString(),
            };
        });
    } catch (e) {
        console.error(e);
        setAlertInfo({ title: String(t('unifiedPanel.errors.aiErrorTitle')), message: String(t('unifiedPanel.errors.aiErrorBody')) });
    }
  };

  const handleAnswerAIQuestion = (ticketId: string, questionId: string, answerData: { raw_text: string; mentions: Mention[] }) => {
      updateTicketInState(ticketId, (ticket) => {
          const questionText = (ticket.ai_questions || []).find(q => q.id === questionId)?.question || 'Pregunta desconocida';
          const newAudit: Auditoria = {
              evento: 'Respuesta a Pregunta de IA',
              por: currentUser?.full_name || 'Sistema',
              cuando: new Date().toISOString(),
              detalle: `Se respondió a la pregunta: "${questionText.substring(0,50)}..."`,
          };

          // Simulate Notifications
          answerData.mentions.forEach(mention => {
            console.log(`%c[NOTIFICACIÓN SIMULADA] %cUsuario ${mention.full_name} (${mention.email}) fue mencionado en una respuesta de IA en el PQR ${ticketId}.`, 'color: #818CF8; font-weight: bold;', 'color: default;');
          });

          return {
              ...ticket,
              ai_questions: (ticket.ai_questions || []).map(q => 
                  q.id === questionId ? { ...q, answer: answerData } : q
              ),
              auditoria: [newAudit, ...ticket.auditoria],
              updated_at: new Date().toISOString(),
          };
      });
  };

  const handleExportCSV = () => {
    exportTicketsToCSV(filteredTickets);
  };
  
  const handleDownloadTemplate = () => {
    downloadCSVTemplate();
  };
  
  const handleInternalSendToTrash = (ticketId: string) => {
    onSendToTrash(ticketId);
    if(selectedTicket?.id === ticketId) {
        setSelectedTicket(null);
    }
  }

  const handleImportCSV = async (file: File) => {
      const text = await file.text();
      const lines = text.trim().split(/\r?\n/);
      const headers = lines[0].split(',').map(h => h.trim());
      const results: ImportResults = { created: 0, errors: [] };
      let currentTickets = [...tickets];
      let maxId = tickets.reduce((max, t) => {
        const idParts = t.id.split('-');
        const idNum = idParts.length > 1 ? parseInt(idParts[1], 10) : 0;
        return Math.max(max, idNum || 0);
      }, 0);

      const requiredHeaders = ["titulo", "descripcion"];
      if (!requiredHeaders.every(h => headers.includes(h))) {
          setImportResults({ created: 0, errors: [{ line: 1, reason: `El CSV debe contener las columnas: ${requiredHeaders.join(', ')}.` }] });
          return;
      }
      
      const getHeaderIndex = (name: string) => headers.indexOf(name);
      const idxTitulo = getHeaderIndex('titulo');
      const idxDescripcion = getHeaderIndex('descripcion');
      
      for (let i = 1; i < lines.length; i++) {
          try {
              if (!lines[i].trim()) continue;
              const cols = lines[i].match(/("([^"]|"")*"|[^,]+)/g) || [];
              const cell = (j: number) => ((cols[j] || "").replace(/^"|"$/g, "").replace(/""/g, '"')).trim();
              
              const titulo = cell(idxTitulo);
              const descripcion = cell(idxDescripcion);

              if (!titulo || !descripcion) {
                  throw new Error("titulo y descripcion son obligatorios.");
              }
              
              maxId++;
              const newTicketId = `TSK-${String(maxId).padStart(3, '0')}`;
              const now = new Date();
              const sla_horas = 24;
              const venceEnDate = new Date(now.getTime() + sla_horas * 3600000);

              const newTicket: PushtrackTask = {
                  id: newTicketId,
                  titulo,
                  descripcion,
                  project_key: projects[0]?.project_key || 'default',
                  informador_email: users[0]?.email || 'default@user.com',
                  responsable_email: '',
                  colaboradores_emails: [],
                  po_email: '',
                  task_type: TaskType.PQR,
                  pqr_type: PQRType.P,
                  prioridad: Prioridad.Media,
                  estado: Estado.Backlog,
                  canal: Canal.Otro,
                  impacto: Impacto.Bajo,
                  area: Area.General,
                  sla_horas,
                  recibido_en: now.toISOString(),
                  vence_en: venceEnDate.toISOString(),
                  updated_at: now.toISOString(),
                  archivado: false,
                  trashed_at: null,
                  adjuntos: [],
                  respuesta_final: '',
                  checklist: {},
                  auditoria: [{ evento: 'Importación – Creado (CSV mínimo)', por: 'Sistema', cuando: now.toISOString(), detalle: 'Ticket creado masivamente.' }],
                  comentarios: [],
                  contrato_principal: '',
                  closed_at: null,
                  target_date: null,
                  kanban_order: now.getTime(),
                  progress: 0,
                  progress_history: [],
                  ai_questions: [],
                  escalation_level: 0,
              };
              currentTickets.unshift(newTicket);
              results.created++;
          } catch (e: any) {
              results.errors.push({ line: i + 1, reason: e.message || "Error desconocido." });
          }
      }

      setTickets(currentTickets);
      setImportResults(results);
  };

  const handleAddAttachment = (ticketId: string, file: File, estado: Estado) => {
    updateTicketInState(ticketId, (ticket) => {
        const newAttachment: AdjuntoItem = {
            url: URL.createObjectURL(file), // This URL is temporary and local to the session
            nombre: file.name,
            tipo_mime: file.type,
            tamano: file.size,
            subido_por: currentUser?.full_name || 'Sistema',
            cuando: new Date().toISOString(),
            estado_adjuntado: estado
        };
        const newAudit: Auditoria = {
            evento: 'Adjunto agregado',
            por: currentUser?.full_name || 'Sistema',
            cuando: new Date().toISOString(),
            detalle: `Se adjuntó el archivo "${file.name}" en el estado ${estado}.`
        };

        return {
            ...ticket,
            adjuntos: [...ticket.adjuntos, newAttachment],
            auditoria: [newAudit, ...ticket.auditoria],
            updated_at: new Date().toISOString(),
        };
    });
  };

  const handleDeleteAttachment = (ticketId: string, url: string) => {
      updateTicketInState(ticketId, (ticket) => {
          const attachmentToDelete = ticket.adjuntos.find(a => a.url === url);
          if (!attachmentToDelete) return ticket;

          const newAudit: Auditoria = {
              evento: 'Adjunto eliminado',
              por: currentUser?.full_name || 'Sistema',
              cuando: new Date().toISOString(),
              detalle: `Se eliminó el archivo adjunto "${attachmentToDelete.nombre}".`
          };
          
          return {
              ...ticket,
              adjuntos: ticket.adjuntos.filter(a => a.url !== url),
              auditoria: [newAudit, ...ticket.auditoria],
              updated_at: new Date().toISOString(),
          };
      });
  };
    
    return (
        <>
            {sourceProject && (
                <div className="mb-4">
                    <a href={`#/projects/${sourceProject}`} className="inline-flex items-center text-sm text-indigo-400 hover:text-indigo-300 font-semibold">
                        <ArrowUturnLeftIcon className="w-4 h-4 mr-2" />
                        {t('dashboard.backToProject')}
                    </a>
                </div>
            )}
            <FilterControls 
              filters={filters} 
              onFilterChange={handleFilterChange}
              onExportCSV={handleExportCSV}
              onImportCSV={handleImportCSV}
              projects={projects}
              onOpenNewPQRForm={handleOpenCreateForm}
            />
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 h-[calc(100vh-20rem)]">
              <div className="lg:col-span-1 xl:col-span-1 h-full flex flex-col gap-6">
                <div className="flex-1 min-h-0">
                    <TaskList 
                    tickets={filteredTickets} 
                    selectedTask={selectedTicket} 
                    onSelectTask={handleSelectTicket}
                    onDownloadTemplate={handleDownloadTemplate}
                    users={users}
                    />
                </div>
                <div className="flex-shrink-0 h-1/3">
                    <GeminiSummarizer ticket={selectedTicket} />
                </div>
              </div>
              <div className="lg:col-span-2 xl:col-span-3 h-full overflow-y-auto bg-[#0F1626] rounded-xl shadow-lg shadow-black/20">
                {selectedTicket ? (
                  <TaskDetailView 
                    ticket={selectedTicket}
                    projects={projects}
                    users={users}
                    onChecklistChange={handleChecklistChange}
                    onToggleArchive={handleToggleArchive}
                    onEditTicket={() => handleOpenEditForm(selectedTicket)}
                    onEditUser={handleOpenUserForm}
                    onAddComment={(data) => handleAddComment(selectedTicket.id, data)}
                    onUpdateProgress={(progress, commentData) => handleUpdateProgress(selectedTicket.id, progress, commentData)}
                    onSendToTrash={handleInternalSendToTrash}
                    onAddAttachment={handleAddAttachment}
                    onDeleteAttachment={handleDeleteAttachment}
                    onAdvanceState={() => handleAdvanceState(selectedTicket.id)}
                    onGenerateAIQuestions={() => handleGenerateAIQuestions(selectedTicket.id)}
                    onAnswerAIQuestion={(qId, ans) => handleAnswerAIQuestion(selectedTicket.id, qId, ans)}
                    addToast={addToast}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
                    <DocumentMagnifyingGlassIcon className="w-24 h-24 mb-4 text-slate-700" />
                    <h2 className="text-xl font-semibold text-slate-400">{t('dashboard.noTicketSelected')}</h2>
                    <p className="max-w-xs">{t('dashboard.selectTicketPrompt')}</p>
                     {tickets.length === 0 && <p className="mt-2">{t('dashboard.createFirstTicket')}</p>}
                  </div>
                )}
              </div>
            </div>
            {isTaskFormOpen && (
              <TaskFormModal 
                isOpen={isTaskFormOpen}
                onClose={handleCloseTaskForm}
                onSubmit={editingTicket ? handleUpdateTask : (_ticketId, formData) => handleCreateTask(formData)}
                ticketToEdit={editingTicket}
                projects={projects}
                users={users}
              />
            )}
            {importResults && (
              <ImportSummaryModal 
                results={importResults}
                onClose={() => setImportResults(null)}
              />
            )}
            {isUserFormOpen && (
              <UserFormModal
                isOpen={isUserFormOpen}
                onClose={handleCloseUserForm}
                onSubmit={handleUserFormSubmit}
                userToEdit={userToEdit}
                projects={projects}
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
        </>
    );
};

export default DashboardView;
