export enum PQRType {
  P = 'Petición',
  Q = 'Queja',
  R = 'Reclamo',
  S = 'Sugerencia'
}

export enum TaskType {
  PQR = 'PQR',
  ODT = 'ODT',
  Bug = 'Bug',
  Mejora = 'Mejora',
  Alerta = 'Alerta'
}

export enum Canal {
  Email = 'Email',
  WhatsApp = 'WhatsApp',
  App = 'App',
  Otro = 'Otro'
}

export enum Prioridad {
  Alta = 'Alta',
  Media = 'Media',
  Baja = 'Baja'
}

export enum Estado {
    Backlog = 'Backlog',
    ToDo = 'Por Hacer',
    InProgress = 'En Progreso',
    Review = 'En Revisión',
    Test = 'En Pruebas',
    WaitingForClient = 'Esperando Cliente',
    ReleasedClosed = 'Lanzado / Cerrado',
    NotApplicable = 'No Aplica',
}

export enum Impacto {
  Critico = 'Crítico',
  Alto = 'Alto',
  Medio = 'Medio',
  Bajo = 'Bajo',
}

export enum Area {
  Backend = 'Backend',
  Frontend = 'Frontend',
  Solidity = 'Solidity',
  QA = 'QA',
  Diseno = 'Diseño',
  General = 'General'
}


export interface Auditoria {
  evento: string;
  por: string;
  cuando: string; // ISO date string
  detalle: string;
  estado_checklist?: 'Completo' | 'Incompleto' | 'N/A';
  es_override_admin?: boolean;
  method?: 'task' | 'menu' | 'drag';
}

export interface ChecklistItemConfig {
  id: string; 
  i18nKey: string; 
}

export interface ChecklistProgress {
  checked: boolean;
  user?: string;
  date?: string; 
}

export interface AdjuntoItem {
  url: string;
  nombre: string;
  tipo_mime: string;
  tamano: number; // bytes
  subido_por: string;
  cuando: string; // ISO date string
  estado_adjuntado?: Estado; // The state when the attachment was added
}

export interface Mention {
  email: string;
  full_name: string;
}

export interface Comentario {
  id: string;
  por: string;
  cuando: string; // ISO date string
  raw_text: string;
  mentions: Mention[];
}

export interface ProgressUpdate {
  by: string;
  at: string; // ISO date string
  progress: number;
  comment: {
    raw_text: string;
    mentions: Mention[];
  };
}

export interface AIQuestion {
  id: string;
  question: string;
  answer: {
    raw_text: string;
    mentions: Mention[];
  } | null;
  is_critical: boolean;
}

export interface TaskFormData {
  titulo: string;
  descripcion: string;
  project_key: string;
  informador_email: string;
  responsable_email: string;
  colaboradores_emails: string[];
  po_email: string;
  estado: Estado;
  prioridad: Prioridad;
  task_type: TaskType;
  pqr_type: PQRType;
  canal: Canal;
  sla_horas: number;
  adjuntos: AdjuntoItem[];
  comentarios: Comentario[];
  contrato_principal: string;
  target_date: string | null;
}

export interface PushtrackTask {
  id: string; 
  project_key: string;
  
  titulo: string;
  descripcion: string;
  
  // Roles
  informador_email: string;
  responsable_email: string;
  colaboradores_emails: string[];
  po_email: string;
  
  // Metadata
  task_type: TaskType;
  pqr_type: PQRType;
  prioridad: Prioridad;
  estado: Estado;
  canal: Canal;
  impacto: Impacto;
  area: Area;
  
  // Dates & SLA
  recibido_en: string; 
  vence_en: string; 
  sla_horas: number;
  updated_at: string;
  closed_at: string | null;
  target_date: string | null;

  // Kanban
  kanban_order: number;

  // Other
  archivado: boolean;
  contrato_principal: string;
  trashed_at: string | null;
  
  // New fields for progress and escalation
  progress?: number; // 0-100
  last_notification_sent_at?: string;
  escalation_level?: number; // 0: none, 1: reminder sent, 2: leader notified, 3: PO notified
  first_response_minutes?: number;

  // Complex
  adjuntos: AdjuntoItem[];
  respuesta_final?: string;
  checklist: Record<string, ChecklistProgress>;
  auditoria: Auditoria[];
  comentarios: Comentario[];
  progress_history?: ProgressUpdate[];
  ai_questions?: AIQuestion[];
}


export interface FilterState {
  task_type: 'all' | TaskType;
  prioridad: 'all' | Prioridad;
  estado: 'all' | Estado;
  search: string;
  archivado: 'all' | 'true' | 'false';
  project_key: 'all' | string;
  criticalSLA: boolean;
  dateRange: { start: string | null; end: string | null };
  dateFilterType: 'created' | 'closed';
}

export interface ImportResults {
  created: number;
  errors: { line: number; reason: string }[];
}

export type ProjectStatus = "Propuesto" | "Active" | "Archived" | "On Hold";

export interface Project {
  project_key: string;
  name: string;
  description: string;
  status: ProjectStatus;
  owner_email: string;
  start_date: string;
  end_date: string | null;
  default_sla_hours: number;
  webhook_whatsapp: string;
  webhook_email: string;
  notification_config?: {
    reminder_frequency_hours: number;
  };
  created_at: string;
  updated_at: string;
  trashed_at: string | null;
}

export interface ProjectKPIs {
    total: number;
    abiertos: number;
    cerrados: number;
    noAplica: number;
    slaVencido: number;
}

export enum UserRole {
    Admin = 'Admin',
    Líder = 'Líder',
    Colaborador = 'Colaborador',
    Client = 'Client',
    Viewer = 'Viewer'
}

export type Language = 'en' | 'es' | 'ar';

export interface User {
  email: string;
  full_name: string;
  whatsapp: string;
  position: string;
  role_global: UserRole;
  is_active: boolean;
  teams: string[];
  projects: string[];
  created_at: string;
  updated_at: string;
  trashed_at: string | null;
  language_preference?: Language;
}

// --- History & Notifications ---
export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface HistoryEvent {
  id: string;
  ticketId: string;
  text: string;
  who: string;
  when: string; // ISO date string
  isRead: boolean;
}

// --- Kanban View Types ---
export interface DropTarget {
  column: Estado;
  index: number;
}

export interface TransitionValidationResult {
    isValid: boolean;
    requiresReason: boolean;
    errorKey?: string;
    errorData?: Record<string, any>;
    reasonTitleKey: string;
    isAdminOverride: boolean;
    isChecklistComplete: boolean;
}


// --- Report Module Types ---

export type WidgetType = 'kpi' | 'bar' | 'line' | 'pie' | 'table';

export interface ReportFilter {
  dateRange: { start: string | null; end: string | null };
  estado: 'all' | Estado;
  responsable_email: 'all' | string;
  project_key: 'all' | string;
  search: string;
  dateFilterType: 'created' | 'closed';
}

export type PredefinedQueryId =
  | 'pqr_by_status'
  | 'sla_compliance'
  | 'backlog_aging'
  | 'load_by_assignee'
  | 'first_response_time_avg'
  | 'throughput'
  | 'burn_down_chart';

export interface BurndownParams {
  estado: Estado;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  soloHabiles: boolean;
  alcance: 'baseline' | 'dynamic';
}

export interface ReportDefinition {
  id: string;
  name: string;
  widget: WidgetType;
  queryId: PredefinedQueryId;
  burndownParams?: BurndownParams;
}

export interface ReportSchedule {
  id: string;
  name: string;
  reportIds: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  recipients: string[];
  format: 'csv' | 'json' | 'xlsx' | 'pdf';
  active: boolean;
  lastRunAt?: string; // ISO Date string
}

export interface ReportHistoryEntry {
  id: string; // Unique ID for the run
  reportId: string;
  reportName: string;
  when: string; // ISO date string of execution
  filters: ReportFilter;
  format: 'csv' | 'json' | 'xlsx' | 'pdf';
  status: 'completed' | 'failed';
  fileName: string;
  triggeredBy: 'manual' | 'scheduled';
  fileContentBase64: string; // Base64 encoded file content for re-download
  mimeType: string;
}