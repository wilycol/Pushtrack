import { Estado, ChecklistItemConfig } from '../types';

export const checklistConfig: Record<Estado, ChecklistItemConfig[]> = {
    [Estado.Backlog]: [
        { id: 'backlog_desc', i18nKey: 'checklist.backlog.desc' },
        { id: 'backlog_justify', i18nKey: 'checklist.backlog.justify' },
        { id: 'backlog_refs', i18nKey: 'checklist.backlog.refs' },
        { id: 'backlog_stakeholders', i18nKey: 'checklist.backlog.stakeholders' },
        { id: 'backlog_viability', i18nKey: 'checklist.backlog.viability' },
    ],
    [Estado.ToDo]: [
        { id: 'todo_reqs', i18nKey: 'checklist.todo.reqs' },
        { id: 'todo_docs', i18nKey: 'checklist.todo.docs' },
        { id: 'todo_assignee', i18nKey: 'checklist.todo.assignee' },
        { id: 'todo_estimate', i18nKey: 'checklist.todo.estimate' },
        { id: 'todo_leader_validation', i18nKey: 'checklist.todo.leader_validation' },
    ],
    [Estado.InProgress]: [
        { id: 'inprogress_time', i18nKey: 'checklist.inprogress.time' },
        { id: 'inprogress_log', i18nKey: 'checklist.inprogress.log' },
        { id: 'inprogress_evidence', i18nKey: 'checklist.inprogress.evidence' },
        { id: 'inprogress_commits', i18nKey: 'checklist.inprogress.commits' },
        { id: 'inprogress_risks', i18nKey: 'checklist.inprogress.risks' },
    ],
    [Estado.Review]: [
        { id: 'review_verify', i18nKey: 'checklist.review.verify' },
        { id: 'review_feedback', i18nKey: 'checklist.review.feedback' },
        { id: 'review_adjustments', i18nKey: 'checklist.review.adjustments' },
        { id: 'review_confirm', i18nKey: 'checklist.review.confirm' },
    ],
    [Estado.Test]: [
        { id: 'test_unit', i18nKey: 'checklist.test.unit' },
        { id: 'test_integration', i18nKey: 'checklist.test.integration' },
        { id: 'test_results', i18nKey: 'checklist.test.results' },
        { id: 'test_evidence', i18nKey: 'checklist.test.evidence' },
        { id: 'test_validation', i18nKey: 'checklist.test.validation' },
    ],
    [Estado.WaitingForClient]: [
        { id: 'waiting_delivery', i18nKey: 'checklist.waiting.delivery' },
        { id: 'waiting_feedback', i18nKey: 'checklist.waiting.feedback' },
        { id: 'waiting_improvements', i18nKey: 'checklist.waiting.improvements' },
        { id: 'waiting_approval', i18nKey: 'checklist.waiting.approval' },
    ],
    [Estado.ReleasedClosed]: [
        { id: 'closed_satisfaction', i18nKey: 'checklist.closed.satisfaction' },
        { id: 'closed_docs', i18nKey: 'checklist.closed.docs' },
        { id: 'closed_invoice', i18nKey: 'checklist.closed.invoice' },
        { id: 'closed_archive', i18nKey: 'checklist.closed.archive' },
    ],
    [Estado.NotApplicable]: [
        { id: 'na_justify', i18nKey: 'checklist.na.justify' },
        { id: 'na_notify', i18nKey: 'checklist.na.notify' },
        { id: 'na_archive', i18nKey: 'checklist.na.archive' },
        { id: 'na_close', i18nKey: 'checklist.na.close' },
    ],
};
