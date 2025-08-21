import { PushtrackTask, ReportFilter, PredefinedQueryId, User, Project, Estado, ReportDefinition } from '../../types';

type BarChartData = { label: string; value: number }[];
type KpiData = { title: string; value: string | number }[];
type LineChartData = { date: string, [key: string]: number | string }[];

const applyFilters = (tickets: PushtrackTask[], filters: ReportFilter): PushtrackTask[] => {
    const searchLower = filters.search.toLowerCase();

    return tickets.filter(ticket => {
        // Date filter
        const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
        if(startDate) startDate.setHours(0,0,0,0);
        const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;
        if(endDate) endDate.setHours(23,59,59,999);
        let ticketDate: Date | null = null;
        
        if (filters.dateFilterType === 'created') {
            ticketDate = new Date(ticket.recibido_en);
        } else { // 'closed'
            // For closed tickets, updated_at is used as a proxy for closed_at
            if (ticket.estado === Estado.ReleasedClosed || ticket.estado === Estado.NotApplicable) {
                ticketDate = new Date(ticket.updated_at);
            } else {
                // If filtering by closed date, non-closed tickets are excluded
                return false;
            }
        }

        if (startDate && (!ticketDate || ticketDate < startDate)) return false;
        if (endDate && (!ticketDate || ticketDate > endDate)) return false;

        // Other filters
        if (filters.estado !== 'all' && ticket.estado !== filters.estado) return false;
        if (filters.responsable_email !== 'all' && ticket.responsable_email !== filters.responsable_email) return false;
        if (filters.project_key !== 'all' && ticket.project_key !== filters.project_key) return false;

        // Search filter
        if (searchLower) {
            const inTitle = ticket.titulo.toLowerCase().includes(searchLower);
            const inDescription = ticket.descripcion.toLowerCase().includes(searchLower);
            if (!inTitle && !inDescription) return false;
        }

        return true;
    });
};


const calculatePqrByStatus = (tickets: PushtrackTask[]): BarChartData => {
  const statusCounts = tickets.reduce((acc, ticket) => {
    const statusLabel = ticket.estado || "DESCONOCIDO";
    acc[statusLabel] = (acc[statusLabel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(statusCounts)
    .map(([status, count]) => ({ label: status, value: count }))
    .sort((a, b) => b.value - a.value);
};

const calculateSlaCompliance = (tickets: PushtrackTask[], t: (key: string) => string): KpiData => {
  const now = new Date();
  let onTimeClosed = 0;
  let lateClosed = 0;
  let openOverdue = 0;

  tickets.forEach(ticket => {
    const dueAt = new Date(ticket.vence_en);
    if (ticket.estado === Estado.ReleasedClosed) {
      // Use updated_at as closed_at
      const closedAt = new Date(ticket.updated_at);
      if (closedAt <= dueAt) {
        onTimeClosed++;
      } else {
        lateClosed++;
      }
    } else if (ticket.estado !== Estado.NotApplicable) {
      // Ticket is open
      if (now > dueAt) {
        openOverdue++;
      }
    }
  });

  const totalClosed = onTimeClosed + lateClosed;
  const compliance = totalClosed > 0 ? Math.round((onTimeClosed / totalClosed) * 100) + '%' : 'N/A';

  return [
    { title: t('reports.queries.sla_compliance_on_time_closed'), value: onTimeClosed },
    { title: t('reports.queries.sla_compliance_late_closed'), value: lateClosed },
    { title: t('reports.queries.sla_compliance_open_overdue'), value: openOverdue },
    { title: t('reports.queries.sla_compliance_compliance'), value: compliance },
  ];
};


const calculateBacklogAging = (tickets: PushtrackTask[]): BarChartData => {
    const now = new Date().getTime();
    const buckets = {
        '0-2d': 0,
        '3-7d': 0,
        '8-14d': 0,
        '15-30d': 0,
        '30d+': 0,
    };
    
    tickets.filter(t => t.estado !== Estado.ReleasedClosed && t.estado !== Estado.NotApplicable).forEach(ticket => {
        const receivedAt = new Date(ticket.recibido_en).getTime();
        const ageInDays = (now - receivedAt) / (1000 * 3600 * 24);
        if (ageInDays <= 2) buckets['0-2d']++;
        else if (ageInDays <= 7) buckets['3-7d']++;
        else if (ageInDays <= 14) buckets['8-14d']++;
        else if (ageInDays <= 30) buckets['15-30d']++;
        else buckets['30d+']++;
    });

    return Object.entries(buckets).map(([age, count]) => ({ label: age, value: count }));
};

const calculateLoadByAssignee = (tickets: PushtrackTask[], users: User[]): BarChartData => {
  const openTickets = tickets.filter(t => t.estado !== Estado.ReleasedClosed && t.estado !== Estado.NotApplicable);
  const loadCounts = openTickets.reduce((acc, ticket) => {
    const email = ticket.responsable_email || 'Unassigned';
    acc[email] = (acc[email] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(loadCounts).map(([email, count]) => {
    const user = users.find(u => u.email === email);
    return { label: user?.full_name || email, value: count };
  }).sort((a,b) => b.value - a.value);
};

const calculateFirstResponseTimeAvg = (tickets: PushtrackTask[]): KpiData => {
    const ticketsWithResponseTime = tickets.filter(t => typeof t.first_response_minutes === 'number');
    if (ticketsWithResponseTime.length === 0) {
        return [{ title: 'Avg Response', value: 'N/A' }];
    }

    const totalMinutes = ticketsWithResponseTime.reduce((sum, t) => sum + t.first_response_minutes!, 0);
    const avgMinutes = totalMinutes / ticketsWithResponseTime.length;

    if (avgMinutes < 60) {
        return [{ title: 'Avg Response', value: `${Math.round(avgMinutes)} min` }];
    } else {
        const hours = Math.floor(avgMinutes / 60);
        const minutes = Math.round(avgMinutes % 60);
        return [{ title: 'Avg Response', value: `${hours}h ${minutes}m` }];
    }
};

const calculateThroughput = (tickets: PushtrackTask[]): BarChartData => {
    const closedTickets = tickets.filter(t => t.estado === Estado.ReleasedClosed);

    const groupedByDay = closedTickets.reduce((acc, ticket) => {
        const closingDate = new Date(ticket.updated_at).toISOString().split('T')[0];
        acc[closingDate] = (acc[closingDate] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(groupedByDay)
        .map(([date, count]) => ({ label: date, value: count }))
        .sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime());
};

// --- START: Burn Down Chart Logic ---

const normalizeDate = (isoString: string): Date => {
    const d = new Date(isoString);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

const enumerateDays = (startStr: string, endStr: string, { onlyBusiness }: { onlyBusiness: boolean }): Date[] => {
    const days: Date[] = [];
    const current = new Date(startStr + 'T00:00:00Z');
    const end = new Date(endStr + 'T00:00:00Z');
    
    while (current <= end) {
        const dayOfWeek = current.getUTCDay(); // Sunday = 0, Saturday = 6
        if (!onlyBusiness || (dayOfWeek !== 0 && dayOfWeek !== 6)) {
            days.push(new Date(current));
        }
        current.setUTCDate(current.getUTCDate() + 1);
    }
    return days;
};

const sum = (xs: (number | string)[]): number => xs.reduce<number>((a, b) => a + (Number(b) || 0), 0);
const round = (x: number): number => Math.round((x + Number.EPSILON) * 100) / 100;

// Calculates the total work done on a ticket up to a specific day.
// This adapts the user's `worklog` spec to the app's `progress_history` model.
const workDoneUntil = (ticket: PushtrackTask, day: Date): number => {
    const estimatedHours = Number(ticket.sla_horas) || 0;

    // A ticket is considered 100% done if it's in a closed state by the given day.
    const isClosed = (ticket.estado === Estado.ReleasedClosed || ticket.estado === Estado.NotApplicable) && normalizeDate(ticket.updated_at) <= day;
    if (isClosed) {
        return estimatedHours;
    }
    
    // Find the latest progress update on or before the given day.
    const lastProgressUpdate = (ticket.progress_history || [])
        .filter(p => normalizeDate(p.at) <= day)
        .sort((a,b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        [0]; // Get the most recent one
        
    if (lastProgressUpdate) {
        const progressPercentage = Number(lastProgressUpdate.progress) || 0;
        return estimatedHours * (progressPercentage / 100);
    }

    // If no progress and not closed, no work is considered done.
    return 0;
};


const calculateBurnDownChart = (allTickets: PushtrackTask[], report: ReportDefinition): LineChartData => {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const params = report.burndownParams || {
        estado: Estado.InProgress,
        from: fourteenDaysAgo.toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
        soloHabiles: true,
        alcance: 'baseline',
    };

    const days = enumerateDays(params.from, params.to, { onlyBusiness: params.soloHabiles });
    if (days.length < 2) return [];

    const sprintStartDay = days[0];
    const sprintEndDay = days[days.length - 1];

    // The scope should include tickets that were likely in the target state during the sprint.
    // We infer this if their current state is the target state or a subsequent one,
    // and they existed during the sprint timeframe.
    const allStatuses = Object.values(Estado);
    const targetStateIndex = allStatuses.indexOf(params.estado);
    
    // A ticket couldn't have been in the sprint if its state is before the target state.
    if (targetStateIndex === -1) return [];
    
    const relevantStates = allStatuses.slice(targetStateIndex);

    // Tickets that are potentially in scope. They must exist before the sprint ends
    // and be in a relevant state.
    const potentialScope = allTickets.filter(t => 
        normalizeDate(t.recibido_en) <= sprintEndDay &&
        relevantStates.includes(t.estado)
    );
    
    // Baseline scope is fixed at the start of the sprint
    const baselineScope = potentialScope.filter(t => normalizeDate(t.recibido_en) <= sprintStartDay);
    
    const totalHoras = sum(baselineScope.map(t => t.sla_horas));
    if (totalHoras === 0) return [];

    const real = days.map(day => {
        const dailyScope = (params.alcance === 'dynamic')
            // Dynamic scope includes tickets created up to the current day of the sprint
            ? potentialScope.filter(t => normalizeDate(t.recibido_en) <= day)
            : baselineScope;
            
        const dailyTotalHoras = (params.alcance === 'dynamic') ? sum(dailyScope.map(t => t.sla_horas)) : totalHoras;

        const workDone = sum(dailyScope.map(t => workDoneUntil(t, day)));
        const remaining = dailyTotalHoras - workDone;

        return round(Math.max(0, remaining));
    });

    const N = days.length;
    // Ideal line is always based on the initial baseline total to show scope creep
    const ideal = days.map((_, i) => round(totalHoras * (1 - (i / (N - 1)))));

    return days.map((d, i) => ({
        date: d.toISOString().split('T')[0],
        Real: real[i],
        Ideal: ideal[i],
    }));
};
// --- END: Burn Down Chart Logic ---


export const runQuery = (
  report: ReportDefinition,
  allTickets: PushtrackTask[],
  allUsers: User[],
  allProjects: Project[],
  filters: ReportFilter,
  t: (key: string) => string
): any => {
  const tickets = applyFilters(allTickets, filters);

  switch (report.queryId) {
    case 'pqr_by_status':
      return calculatePqrByStatus(tickets);
    case 'sla_compliance':
      return calculateSlaCompliance(tickets, t);
    case 'backlog_aging':
      return calculateBacklogAging(tickets);
    case 'load_by_assignee':
      return calculateLoadByAssignee(tickets, allUsers);
    case 'first_response_time_avg':
       return calculateFirstResponseTimeAvg(tickets);
    case 'throughput':
       return calculateThroughput(tickets);
    case 'burn_down_chart':
        // Burndown ignores dashboard filters and uses its own parameters
        return calculateBurnDownChart(allTickets, report);
    default:
      return null;
  }
};