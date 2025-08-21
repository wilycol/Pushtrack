import { PushtrackTask, Estado, UserRole, User, TransitionValidationResult } from '../types';
import { checklistConfig } from './checklistConfig';

// The main linear progression of states
const columnOrder: Estado[] = [
    Estado.Backlog,
    Estado.ToDo,
    Estado.InProgress,
    Estado.Review,
    Estado.Test,
    Estado.WaitingForClient,
    Estado.ReleasedClosed,
];

export const validateTransition = (
    ticket: PushtrackTask,
    from: Estado,
    to: Estado,
    user: User | null,
    view: 'kanban' | 'task-form' | 'menu'
): TransitionValidationResult => {
    
    const userRole = user?.role_global;

    const defaultResponse: TransitionValidationResult = {
        isValid: false,
        requiresReason: false,
        errorKey: 'workflow.error.unknown',
        reasonTitleKey: '',
        errorData: {},
        isAdminOverride: false,
        isChecklistComplete: true, // Assume true until checked
    };
    
    if (!userRole) {
        return { ...defaultResponse, errorKey: 'workflow.error.noUser' };
    }

    // Rule: Cannot move from a terminal state
    if ([Estado.ReleasedClosed, Estado.NotApplicable].includes(from)) {
        return { ...defaultResponse, errorKey: 'workflow.error.fromTerminal' };
    }
    
    // Rule: Moving to "Not Applicable" is a special case
    if (to === Estado.NotApplicable) {
        // Only Admin and Leader can do this.
        if ([UserRole.Admin, UserRole.Líder].includes(userRole)) {
            // It always requires a reason.
            return { ...defaultResponse, isValid: true, requiresReason: true, reasonTitleKey: 'workflow.reason.notApplicable', isChecklistComplete: true };
        } else {
             return { ...defaultResponse, errorKey: 'move.block.role', errorData: { rol: userRole } };
        }
    }

    const fromIndex = columnOrder.indexOf(from);
    const toIndex = columnOrder.indexOf(to);

    if (fromIndex === -1 || toIndex === -1) {
        return { ...defaultResponse, errorKey: 'workflow.error.invalidState' };
    }

    const isForward = toIndex > fromIndex;
    const isBackward = toIndex < fromIndex;
    const isSkip = Math.abs(toIndex - fromIndex) > 1;

    // --- ROLE-BASED RULES ---

    // Rule: Collaborator
    if (userRole === UserRole.Colaborador) {
        if (isForward) {
            return { ...defaultResponse, errorKey: 'move.block.role', errorData: { rol: userRole } };
        }
        if (isSkip) { // Collaborators cannot skip states, forward or backward.
            return { ...defaultResponse, errorKey: 'move.block.skip' };
        }
        if (isBackward) { // This now only applies to non-skip backward moves.
            return { ...defaultResponse, isValid: true, requiresReason: true, reasonTitleKey: 'workflow.reason.backwardMove', isChecklistComplete: true };
        }
    }

    // Rule: Leader
    if (userRole === UserRole.Líder) {
         if (isSkip) { // Leaders cannot skip states, forward or backward.
             return { ...defaultResponse, errorKey: 'move.block.skip' };
         }
         if (isBackward) {
             return { ...defaultResponse, isValid: true, requiresReason: true, reasonTitleKey: 'workflow.reason.backwardMove', isChecklistComplete: true };
         }
         if (isForward) {
            const checklistItemsForState = checklistConfig[from] || [];
            const missingItemKeys = checklistItemsForState
                .filter(item => !ticket.checklist?.[item.id]?.checked)
                .map(item => item.i18nKey);

            if (missingItemKeys.length > 0) {
                 return { 
                    ...defaultResponse, 
                    errorKey: 'move.block.checklist', 
                    errorData: { fromState: from, missingItemKeys: missingItemKeys }, 
                    isChecklistComplete: false 
                };
            }
         }
    }

    // Rule: Admin
    if (userRole === UserRole.Admin) {
        if (isBackward || (isSkip && isForward)) {
            return { ...defaultResponse, isValid: true, requiresReason: true, reasonTitleKey: isSkip ? 'workflow.reason.jumpMove' : 'workflow.reason.backwardMove', isChecklistComplete: true };
        }
        if (isForward) {
            const checklistItemsForState = checklistConfig[from] || [];
            const isChecklistComplete = checklistItemsForState.every(item => ticket.checklist?.[item.id]?.checked);
            
            if (!isChecklistComplete && view === 'kanban') { // Override only available on Kanban
                 return { ...defaultResponse, isValid: true, isAdminOverride: true, requiresReason: true, isChecklistComplete: false, reasonTitleKey: 'modals.modal.override.title' };
            }
            if (!isChecklistComplete && view !== 'kanban') {
                return { ...defaultResponse, errorKey: 'workflow.error.checklistIncompleteAdminRequired', isChecklistComplete: false };
            }
        }
    }
    
    if (![UserRole.Admin, UserRole.Líder, UserRole.Colaborador].includes(userRole)) {
        return { ...defaultResponse, errorKey: 'workflow.error.permissionDenied' };
    }


    // If we passed all checks, the move is valid.
    return { ...defaultResponse, isValid: true, isChecklistComplete: true };
};