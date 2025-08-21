

import React, { useState } from 'react';
import { Project, User, PushtrackTask } from '../types';
import ProjectList from './ProjectList';
import ProjectDetailView from './ProjectDetailView';
import ProjectFormModal from './ProjectFormModal';
import UserFormModal from './UserFormModal';

interface ProjectsSectionProps {
    projects: Project[];
    users: User[];
    tickets: PushtrackTask[];
    projectKey: string | null;
    onCreateProject: (project: Project) => void;
    onUpdateProject: (project: Project) => void;
    onToggleArchive: (projectKey: string) => void;
    onDuplicate: (projectKey: string) => void;
    onSendToTrash: (projectKey: string) => void;
    onUpdateUser: (user: User) => void;
}

const ProjectsSection: React.FC<ProjectsSectionProps> = (props) => {
    const { 
        projectKey, projects, users, tickets, 
        onCreateProject, onUpdateProject, onToggleArchive, onDuplicate, onSendToTrash,
        onUpdateUser
    } = props;
    
    const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [isUserFormOpen, setIsUserFormOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);


    const handleOpenCreateProjectForm = () => {
        setProjectToEdit(null);
        setIsProjectFormOpen(true);
    };

    const handleOpenEditProjectForm = (project: Project) => {
        setProjectToEdit(project);
        setIsProjectFormOpen(true);
    };
    
    const handleCloseProjectForm = () => {
        setIsProjectFormOpen(false);
        setProjectToEdit(null);
    };
    
    const handleSubmitProjectForm = (project: Project) => {
        if(projectToEdit) {
            onUpdateProject(project);
        } else {
            onCreateProject(project);
        }
    };
    
    const handleOpenUserForm = (user: User) => {
        setUserToEdit(user);
        setIsUserFormOpen(true);
    };

    const handleCloseUserForm = () => {
        setIsUserFormOpen(false);
        setUserToEdit(null);
    };

    const selectedProject = projectKey ? projects.find(p => p.project_key === projectKey) : null;

    return (
        <>
            {selectedProject ? (
                <ProjectDetailView 
                    project={selectedProject}
                    users={users}
                    tickets={tickets}
                    onEdit={() => handleOpenEditProjectForm(selectedProject)}
                    onEditUser={handleOpenUserForm}
                />
            ) : (
                <ProjectList 
                    projects={projects}
                    tickets={tickets}
                    users={users}
                    onNewProject={handleOpenCreateProjectForm}
                    onEditProject={handleOpenEditProjectForm}
                    onToggleArchive={onToggleArchive}
                    onDuplicateProject={onDuplicate}
                    onSendProjectToTrash={onSendToTrash}
                />
            )}
             {isProjectFormOpen && (
              <ProjectFormModal 
                isOpen={isProjectFormOpen}
                onClose={handleCloseProjectForm}
                onSubmit={handleSubmitProjectForm}
                users={users}
                projectToEdit={projectToEdit}
              />
            )}
             {isUserFormOpen && (
                <UserFormModal 
                    isOpen={isUserFormOpen}
                    onClose={handleCloseUserForm}
                    onSubmit={onUpdateUser}
                    projects={projects}
                    userToEdit={userToEdit}
                />
             )}
        </>
    );
};

export default ProjectsSection;