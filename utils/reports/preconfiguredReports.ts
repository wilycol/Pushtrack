import { ReportDefinition } from '../../types';

export const getPreconfiguredReports = (t: (key: string) => string): ReportDefinition[] => [
  {
    id: 'pre-status',
    name: t('reports.preconfigured.pqrByStatus'),
    widget: 'pie',
    queryId: 'pqr_by_status',
  },
  {
    id: 'pre-sla',
    name: t('reports.preconfigured.slaCompliance'),
    widget: 'kpi',
    queryId: 'sla_compliance',
  },
  {
    id: 'pre-aging',
    name: t('reports.preconfigured.backlogAging'),
    widget: 'bar',
    queryId: 'backlog_aging',
  },
  {
    id: 'pre-load',
    name: t('reports.preconfigured.loadByAssignee'),
    widget: 'bar',
    queryId: 'load_by_assignee',
  },
  {
    id: 'pre-response-time',
    name: t('reports.preconfigured.responseTime'),
    widget: 'kpi',
    queryId: 'first_response_time_avg',
  },
  {
    id: 'pre-throughput',
    name: t('reports.preconfigured.throughput'),
    widget: 'bar',
    queryId: 'throughput',
  },
  {
    id: 'pre-burn-down',
    name: t('reports.preconfigured.burnDownChart'),
    widget: 'line',
    queryId: 'burn_down_chart',
  },
];