import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PushtrackTask, Project, User, UserRole, Language, HistoryEvent, ToastMessage, Estado, ChecklistProgress, ToastType } from './types';
import Header from './components/Header';
import { MOCK_TASKS, MOCK_PROJECTS } from './utils/mockData';
import DashboardView from './components/DashboardView';
import ProjectsSection from './components/ProjectsSection';
import TeamsView from './components/TeamsView';
import TrashView from './components/TrashView';
import ReportsDashboard from './components/ReportsDashboard';
import KanbanView from './components/KanbanView';
import useLocalStorage from './utils/localStorage';
import ToastContainer from './components/ToastContainer';

type KanbanState = { id: string; estado: Estado; kanban_order: number };

interface AppProps {
  currentUser: User;
  initialUsers: User[];
}

const App: React.FC<AppProps> = ({ currentUser: initialCurrentUser, initialUsers }) => {
  const { i18n, t } = useTranslation();
  const [location, setLocation] = useState(window.location.hash || '#/tasks');
  
  const [tickets, setTickets] = useState<PushtrackTask[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [currentUser, setCurrentUser] = useState<User | null>(initialCurrentUser);
  
  const [history, setHistory] = useLocalStorage<HistoryEvent[]>('pushtrack_history', []);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    setCurrentUser(initialCurrentUser);
  }, [initialCurrentUser]);


  // Initial data load and persistence reconciliation
  useEffect(() => {
    const savedKanbanState: KanbanState[] = JSON.parse(localStorage.getItem('pushtrack_kanban_state') || '[]');
    const stateMap = new Map(savedKanbanState.map(item => [item.id, item]));

    const reconciledTickets = MOCK_TASKS.map(mockTicket => {
      const savedState = stateMap.get(mockTicket.id);
      if (savedState) {
        // Keep mockTicket.estado (source of truth) but apply user's sorting order.
        return { ...mockTicket, kanban_order: savedState.kanban_order };
      }
      return mockTicket;
    });

    setTickets(reconciledTickets);
    setProjects(MOCK_PROJECTS);
  }, []);

  // Persist Kanban state (order and status) to localStorage on change
  useEffect(() => {
    const kanbanStateToSave: KanbanState[] = tickets.map(({ id, estado, kanban_order }) => ({ id, estado, kanban_order }));
    localStorage.setItem('pushtrack_kanban_state', JSON.stringify(kanbanStateToSave));
  }, [tickets]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const newToast: ToastMessage = {
      id: `toast-${crypto.randomUUID()}`,
      message,
      type,
    };
    // Keep the last 4 toasts + the new one
    setToasts(prev => [...prev.slice(-4), newToast]);
  }, []);

  const addHistoryEventAndToast = useCallback((event: Omit<HistoryEvent, 'id' | 'when' | 'isRead'>, toastMessage: string) => {
    const newEvent: HistoryEvent = {
      ...event,
      id: `evt-${crypto.randomUUID()}`,
      when: new Date().toISOString(),
      isRead: false,
    };
    setHistory(prev => [newEvent, ...prev].slice(0, 50)); // Keep last 50 events

    addToast(toastMessage, 'info');
  }, [setHistory, addToast]);

  const markAllHistoryAsRead = useCallback(() => {
    setHistory(prev => prev.map(event => ({ ...event, isRead: true })));
  }, [setHistory]);


  // Notification Simulation Effect
  useEffect(() => {
    const notificationInterval = setInterval(() => {
        // Using functional updates to get the latest state inside interval
        setTickets(currentTickets => {
            const projectsWithConfig = projects.filter(p => p.notification_config);
            if (projectsWithConfig.length === 0) return currentTickets;
            
            let ticketsChanged = false;
            const updatedTickets = currentTickets.map(ticket => {
                const project = projects.find(p => p.project_key === ticket.project_key);
                // Conditions to check: Active ticket, has a responsible person, project has config
                if (
                    !project?.notification_config ||
                    !ticket.responsable_email ||
                    [Estado.ReleasedClosed, Estado.NotApplicable].includes(ticket.estado) ||
                    ticket.archivado ||
                    ticket.trashed_at
                ) {
                    return ticket;
                }

                const now = new Date();
                const lastNotifDate = ticket.last_notification_sent_at ? new Date(ticket.last_notification_sent_at) : null;
                const escalationLevel = ticket.escalation_level || 0;
                let newTicketState = { ...ticket };

                const hoursSinceLastNotif = lastNotifDate ? (now.getTime() - lastNotifDate.getTime()) / (1000 * 60 * 60) : Infinity;

                // Level 1: Send reminder if frequency has passed and no active escalation
                if (escalationLevel === 0 && (!lastNotifDate || hoursSinceLastNotif >= project.notification_config.reminder_frequency_hours)) {
                    newTicketState.escalation_level = 1;
                    newTicketState.last_notification_sent_at = now.toISOString();
                    const newAudit = {
                        evento: 'Notificación: Recordatorio', por: 'Sistema', cuando: now.toISOString(),
                        detalle: `[AVISO 1 - Email/WhatsApp] Se solicitó actualización al responsable: ${ticket.responsable_email}.`
                    };
                    newTicketState.auditoria = [newAudit, ...(newTicketState.auditoria || [])];
                    ticketsChanged = true;
                } 
                // Level 2: Escalate after 3 hours
                else if (escalationLevel === 1 && hoursSinceLastNotif > 3) {
                    newTicketState.escalation_level = 2;
                    const recipients = [ticket.po_email, ticket.informador_email].filter(Boolean).join(', ');
                    const newAudit = {
                        evento: 'Notificación: Escalamiento Nivel 2', por: 'Sistema', cuando: now.toISOString(),
                        detalle: `[AVISO 2 - Email/WhatsApp] Ticket sin respuesta. Notificado a Líder/Informador: ${recipients}. Se informó al responsable.`
                    };
                    newTicketState.auditoria = [newAudit, ...(newTicketState.auditoria || [])];
                    ticketsChanged = true;
                } 
                // Level 3: Escalate after 24 hours
                else if (escalationLevel === 2 && hoursSinceLastNotif > 24) {
                    newTicketState.escalation_level = 3;
                    const lastChecklistState = Object.entries(ticket.checklist || {})
                        .filter(([, v]) => (v as ChecklistProgress).checked)
                        .map(([k]) => k)
                        .join(', ') || 'Ninguno';
                    const newAudit = {
                        evento: 'Notificación: Escalamiento Nivel 3', por: 'Sistema', cuando: now.toISOString(),
                        detalle: `[AVISO 3 - Email/WhatsApp] Ticket crítico sin respuesta. Notificado a PO/CTO: ${ticket.po_email}. Últimos checks: ${lastChecklistState}.`
                    };
                    newTicketState.auditoria = [newAudit, ...(newTicketState.auditoria || [])];
                    ticketsChanged = true;
                }

                return newTicketState;
            });

            // Only update state if something actually changed
            return ticketsChanged ? updatedTickets : currentTickets;
        });
    }, 60000); // Check every minute for demo purposes

    return () => clearInterval(notificationInterval);
  }, [projects]); // Depend on projects to get the latest configs


  // Set initial language from user preference
  useEffect(() => {
    if (currentUser?.language_preference && currentUser.language_preference !== i18n.language) {
      i18n.changeLanguage(currentUser.language_preference);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Update HTML dir and lang attributes when language changes
  useEffect(() => {
    document.documentElement.dir = i18n.dir();
    document.documentElement.lang = i18n.language;
  }, [i18n, i18n.language]);

  useEffect(() => {
    const handleHashChange = () => {
        setLocation(window.location.hash || '#/tasks');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const pathParts = location.substring(2).split('?')[0].split('/'); // remove '#/' and query params
  const currentView = pathParts[0] || 'tasks';
  const currentKey = pathParts[1] || null;

  const handleCreateProject = (project: Project) => {
    setProjects(prev => [project, ...prev]);
  };
  
  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.project_key === updatedProject.project_key ? updatedProject : p));
  };

  const handleToggleArchiveProject = (projectKey: string) => {
      setProjects(prev => prev.map(p => {
          if (p.project_key === projectKey) {
              const newStatus = p.status === 'Active' ? 'Archived' : 'Active';
              console.log(`Project ${projectKey} status changed to ${newStatus}`);
              return { ...p, status: newStatus, updated_at: new Date().toISOString() };
          }
          return p;
      }));
  };
  
  const handleDuplicateProject = (projectKey: string) => {
    const projectToDuplicate = projects.find(p => p.project_key === projectKey);
    if (projectToDuplicate) {
        const newProject: Project = {
            ...projectToDuplicate,
            trashed_at: null,
            project_key: `PRJ-${String(Math.floor(Math.random() * 1000) + 1).padStart(3, '0')}`,
            name: `${projectToDuplicate.name} (Copia)`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setProjects(prev => [newProject, ...prev]);
        window.location.hash = `#/projects`;
    }
  };

  const handleSendToTrash = (entityType: 'project' | 'ticket' | 'user', id: string) => {
    const trashed_at = new Date().toISOString();
    switch (entityType) {
      case 'project':
        setProjects(prev => prev.map(p => p.project_key === id ? { ...p, trashed_at } : p));
        if (currentKey === id && currentView === 'projects') window.location.hash = '#/projects';
        break;
      case 'ticket':
        setTickets(prev => prev.map(t => t.id === id ? { ...t, trashed_at } : t));
        break;
      case 'user':
        setUsers(prev => prev.map(u => u.email === id ? { ...u, trashed_at } : u));
        break;
    }
  };

  const handleRestoreFromTrash = (entityType: 'project' | 'ticket' | 'user', id: string) => {
    switch (entityType) {
      case 'project':
        setProjects(prev => prev.map(p => p.project_key === id ? { ...p, trashed_at: null } : p));
        break;
      case 'ticket':
        setTickets(prev => prev.map(t => t.id === id ? { ...t, trashed_at: null } : t));
        break;
      case 'user':
        setUsers(prev => prev.map(u => u.email === id ? { ...u, trashed_at: null } : u));
        break;
    }
  };
  
  const handleDeletePermanently = (entityType: 'project' | 'ticket' | 'user', id: string) => {
    switch (entityType) {
        case 'project':
            setProjects(prev => prev.filter(p => p.project_key !== id));
            break;
        case 'ticket':
            setTickets(prev => prev.filter(t => t.id !== id));
            break;
        case 'user':
            setUsers(prev => prev.filter(u => u.email !== id));
            break;
    }
  };
  
  const handleEmptyTrash = () => {
    setProjects(prev => prev.filter(p => !p.trashed_at));
    setTickets(prev => prev.filter(t => !t.trashed_at));
    setUsers(prev => prev.filter(u => !u.trashed_at));
  };


  const handleCreateUser = (user: User) => {
    setUsers(prev => [user, ...prev]);
  };
  
  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.email === updatedUser.email ? updatedUser : u));
    if (updatedUser.email === currentUser?.email) {
      setCurrentUser(updatedUser);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    i18n.changeLanguage(lang);
    if(currentUser){
        // Simulate updating user preference in DB
        const updatedUser = {...currentUser, language_preference: lang };
        handleUpdateUser(updatedUser);
    }
  };

  const activeProjects = projects.filter(p => !p.trashed_at);
  const activeUsers = users.filter(u => !u.trashed_at);
  const activeTickets = tickets.filter(t => !t.trashed_at);
  
  const trashedProjects = projects.filter(p => p.trashed_at);
  const trashedUsers = users.filter(u => u.trashed_at);
  const trashedTickets = tickets.filter(t => t.trashed_at);
  
  const selectedProject = currentView === 'projects' && currentKey ? activeProjects.find(p => p.project_key === currentKey) : null;

  const renderView = () => {
    switch(currentView) {
      case 'projects':
        return <ProjectsSection 
                    projects={activeProjects} 
                    users={activeUsers} 
                    tickets={activeTickets}
                    projectKey={currentKey}
                    onCreateProject={handleCreateProject}
                    onUpdateProject={handleUpdateProject}
                    onToggleArchive={handleToggleArchiveProject}
                    onDuplicate={handleDuplicateProject}
                    onSendToTrash={(id) => handleSendToTrash('project', id)}
                    onUpdateUser={handleUpdateUser}
                />;
      case 'teams':
        return <TeamsView 
                  users={activeUsers} 
                  allUsers={users}
                  projects={activeProjects} 
                  onCreateUser={handleCreateUser} 
                  onUpdateUser={handleUpdateUser} 
                  onSendToTrash={(id) => handleSendToTrash('user', id)}
                />;
      case 'reports':
        return <ReportsDashboard
                  tickets={activeTickets}
                  projects={activeProjects}
                  users={activeUsers}
                />;
      case 'kanban':
        return <KanbanView
                  tickets={activeTickets}
                  projects={activeProjects}
                  users={activeUsers}
                  setTickets={setTickets}
                  onUpdateUser={handleUpdateUser}
                  onSendToTrash={(id) => handleSendToTrash('ticket', id)}
                  currentUser={currentUser}
                  history={history}
                  addHistoryEvent={addHistoryEventAndToast}
                  addToast={addToast}
                />;
      case 'trash':
        if (currentUser?.role_global !== UserRole.Admin) {
            window.location.hash = '#/tasks';
            return null;
        }
        return <TrashView
                  projects={trashedProjects}
                  tickets={trashedTickets}
                  users={trashedUsers}
                  onRestore={handleRestoreFromTrash}
                  onDeletePermanently={handleDeletePermanently}
                  onEmptyTrash={handleEmptyTrash}
                />;
      case 'dashboard': // This is now an alias for tasks
      case 'tasks':
      default:
        return <DashboardView 
                  tickets={activeTickets} 
                  projects={activeProjects} 
                  users={activeUsers} 
                  setTickets={setTickets} 
                  location={location} 
                  onUpdateUser={handleUpdateUser}
                  onSendToTrash={(id) => handleSendToTrash('ticket', id)}
                  currentUser={currentUser}
                  addHistoryEvent={addHistoryEventAndToast}
                  addToast={addToast}
                />;
    }
  };

  return (
    <div className="min-h-screen font-sans text-slate-200">
      <Header 
        currentView={currentView} 
        selectedProject={selectedProject} 
        currentUser={currentUser}
        onLanguageChange={handleLanguageChange}
        history={history}
        onMarkAllRead={markAllHistoryAsRead}
        addToast={addToast}
      />
      <main className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto">
        {renderView()}
      </main>
      <ToastContainer toasts={toasts} setToasts={setToasts} />
    </div>
  );
};

export default App;