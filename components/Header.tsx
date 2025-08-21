import React from 'react';
import { useTranslation } from 'react-i18next';
import { signOut } from 'firebase/auth';
import { auth, ADMIN_EMAIL } from '../services/firebase';
import { TicketIcon, DocumentChartBarIcon, UserGroupIcon, TrashIcon, ChartBarIcon, ViewColumnsIcon } from './icons';
import { Project, User, UserRole, Language, HistoryEvent, ToastType } from '../types';
import LanguageSelector from './LanguageSelector';
import NotificationBell from './NotificationBell';
import AISelector from './AISelector';

type ViewName = 'tasks' | 'projects' | 'teams' | 'trash' | 'reports' | 'kanban';

interface HeaderProps {
  currentView: string;
  selectedProject?: Project | null;
  currentUser: User | null;
  onLanguageChange: (lang: Language) => void;
  history: HistoryEvent[];
  onMarkAllRead: () => void;
  addToast: (message: string, type?: ToastType) => void;
}

const handleNavigate = (view: ViewName) => {
    window.location.hash = `#/${view}`;
};

const NavItem: React.FC<{
  label: string;
  viewName: ViewName;
  currentView: string;
  onClick: () => void;
  icon: React.ElementType;
}> = ({ label, viewName, currentView, onClick, icon: Icon }) => {
  const isActive = currentView === viewName || (currentView === 'dashboard' && viewName === 'tasks');
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
        isActive
          ? 'border-indigo-500 text-indigo-400'
          : 'border-transparent text-slate-400 hover:border-slate-500 hover:text-slate-200'
      }`}
    >
      <Icon className={`me-2 h-5 w-5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
      {label}
    </button>
  );
};


const Header: React.FC<HeaderProps> = ({ currentView, selectedProject, currentUser, onLanguageChange, history, onMarkAllRead, addToast }) => {
  const { t } = useTranslation();
  
  const handleLogout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed:", error);
        addToast('Logout failed. Please try again.', 'error');
    }
  };

  const userRole = currentUser?.email === ADMIN_EMAIL ? 'Admin' : 'User';

  return (
    <header className="bg-[#0F1626] border-b border-[#22304A] sticky top-0 z-20">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <TicketIcon className="h-8 w-8 text-indigo-400" />
            <div className="ms-3">
              <h1 className="text-xl font-bold text-slate-100">Pushtrack</h1>
               {selectedProject && (
                  <p className="text-xs text-slate-400 font-medium">
                    <a href="#/projects" className="hover:underline">{t('header.projectsBreadcrumb')}</a> / {selectedProject.name}
                  </p>
                )}
            </div>
          </div>

          <nav className="hidden md:flex space-x-4">
             <NavItem label={t('header.tasks')} viewName="tasks" currentView={currentView} onClick={() => handleNavigate('tasks')} icon={TicketIcon} />
             <NavItem label={t('header.kanban')} viewName="kanban" currentView={currentView} onClick={() => handleNavigate('kanban')} icon={ViewColumnsIcon} />
             <NavItem label={t('header.projects')} viewName="projects" currentView={currentView} onClick={() => handleNavigate('projects')} icon={DocumentChartBarIcon} />
             <NavItem label={t('header.teams')} viewName="teams" currentView={currentView} onClick={() => handleNavigate('teams')} icon={UserGroupIcon} />
             <NavItem label={t('header.reports')} viewName="reports" currentView={currentView} onClick={() => handleNavigate('reports')} icon={ChartBarIcon} />
             {currentUser?.role_global === UserRole.Admin && (
                <NavItem label={t('header.trash')} viewName="trash" currentView={currentView} onClick={() => handleNavigate('trash')} icon={TrashIcon} />
             )}
          </nav>

          <div className="flex items-center space-x-4">
             <NotificationBell history={history} onMarkAllRead={onMarkAllRead} />
             <LanguageSelector onLanguageChange={onLanguageChange} />
             <AISelector addToast={addToast} />
             <div className="flex items-center gap-3">
                <img src={`https://i.pravatar.cc/32?u=${currentUser?.email}`} alt="User Avatar" className="h-8 w-8 rounded-full ring-2 ring-slate-700" title={currentUser?.full_name || ''} />
                <div className="hidden lg:flex flex-col text-right">
                    <span className="text-sm font-semibold text-slate-200">{currentUser?.full_name}</span>
                    <span className="text-xs text-slate-400">{userRole}</span>
                </div>
                <button onClick={handleLogout} className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700" title="Logout">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0-3-3m0 0 3-3m-3 3H9" /></svg>
                </button>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;