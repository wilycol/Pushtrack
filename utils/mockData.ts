import { PushtrackTask, Project, User, PQRType, Prioridad, Estado, Canal, UserRole, Impacto, Area, TaskType } from '../types';

// --- NEW DATASET BASED ON "DEFILY" PROJECT ---

// 1. Generate Users from the provided dataset
const userNames = [
  "Ángela", "Esaú", "Jessy", "José", "Doctor", "Josman", "Javier", "Hernando", 
  "Edgar", "Miguel", "Saúl Guerra", "José Ángel", "José Rosales", "Leidys"
];

const uniqueUserNames = [...new Set(userNames)];

const generateEmail = (name: string) => `${name.toLowerCase().replace(/\s+/g, '.')}@defily.com`;

export const MOCK_USERS: User[] = uniqueUserNames.map((name, index) => {
    let role = UserRole.Colaborador;
    if (name === "Ángela") role = UserRole.Admin;
    if (["José", "Josman", "Doctor", "Miguel"].includes(name)) role = UserRole.Líder;

    return {
        email: generateEmail(name),
        full_name: name,
        whatsapp: `+5730012345${index.toString().padStart(2, '0')}`,
        position: 'Team Member',
        role_global: role,
        is_active: true,
        teams: ['Defily'],
        projects: ['proj-defily'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        trashed_at: null,
        language_preference: 'es',
    };
});

// 2. Generate the Project
export const MOCK_PROJECTS: Project[] = [
    { 
        project_key: 'proj-defily', 
        name: 'Defily', 
        description: 'Proyecto principal para la plataforma Defily.', 
        status: 'Active', 
        owner_email: generateEmail("Ángela"), 
        start_date: '2023-01-01', 
        end_date: null, 
        default_sla_hours: 48, 
        webhook_email: '', 
        webhook_whatsapp: '', 
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString(), 
        trashed_at: null, 
        notification_config: { reminder_frequency_hours: 8 } 
    },
];

// 3. Raw PQR Data
const rawPqrData = [
  { id: "TSK-001", titulo: "Auto Boost On/Off", descripcion: "Habilitar o deshabilitar la función Auto Boost para usuarios desde su perfil o configuración.", owner_name: "Ángela", collaborators: "Esaú, Jessy", department: "Desarrollo Frontend", pqr_type: "Reclamo", priority: "Baja", impact_level: "Alto", created_at: "2025-08-04 22:50:11", sla_due_at: "2025-08-16 22:50:11" },
  { id: "TSK-002", titulo: "Cancelación de suscripción antes del cierre de temporada con opción de cancelar la solicitud mientras esté en proceso", descripcion: "Permitir que el usuario cancele su suscripción antes del cierre de temporada y que pueda revertir la solicitud mientras esté en proceso.", owner_name: "José", collaborators: "Esaú, Doctor", department: "Diseño", pqr_type: "Queja", priority: "Media", impact_level: "Alto", created_at: "2025-08-05 05:50:11", sla_due_at: "2025-08-13 05:50:11" },
  { id: "TSK-003", titulo: "Parar recompensas al solicitar cancelación de suscripción", descripcion: "Detener automáticamente el cálculo y entrega de recompensas cuando un usuario solicita cancelar su suscripción.", owner_name: "Josman", collaborators: "Javier, José, Hernando", department: "Desarrollo Frontend", pqr_type: "Queja", priority: "Baja", impact_level: "Bajo", created_at: "2025-08-09 04:50:11", sla_due_at: "2025-08-28 04:50:11" },
  { id: "TSK-004", titulo: "Ranks", descripcion: "Revisión y actualización del sistema de rangos de usuarios en la plataforma.", owner_name: "Doctor", collaborators: "Edgar, Ángela", department: "Desarrollo Backend", pqr_type: "Queja", priority: "Alta", impact_level: "Medio", created_at: "2025-07-26 12:50:11", sla_due_at: "2025-08-03 12:50:11" },
  { id: "TSK-005", titulo: "Nuevo Dashboard", descripcion: "Diseño e implementación de un panel de control renovado con métricas clave y mejor experiencia de usuario.", owner_name: "Miguel", collaborators: "Saúl Guerra, José Ángel", department: "Desarrollo Solidity / Contratos inteligentes", pqr_type: "Reclamo", priority: "Media", impact_level: "Alto", created_at: "2025-07-25 23:50:11", sla_due_at: "2025-08-14 23:50:11" },
  { id: "TSK-006", titulo: "Marketing/Admin debe poder agregar o eliminar PDF u otros archivos", descripcion: "Funcionalidad para que el equipo de marketing o administración pueda subir o quitar archivos PDF u otros documentos de la plataforma.", owner_name: "Esaú", collaborators: "Miguel, Ángela, Josman", department: "Desarrollo Backend", pqr_type: "Petición", priority: "Alta", impact_level: "Bajo", created_at: "2025-08-07 06:50:11", sla_due_at: "2025-08-26 06:50:11" },
  { id: "TSK-007", titulo: "Ranks", descripcion: "Revisión y actualización del sistema de rangos de usuarios en la plataforma.", owner_name: "Javier", collaborators: "José, Ángela, José Ángel", department: "Diseño", pqr_type: "Sugerencia", priority: "Baja", impact_level: "Medio", created_at: "2025-08-04 20:50:11", sla_due_at: "2025-08-19 20:50:11" },
  { id: "TSK-008", titulo: "New Dashboard", descripcion: "Implementación de un nuevo panel de control con mejoras visuales y funcionales.", owner_name: "José Ángel", collaborators: "Jessy, José Rosales", department: "Desarrollo Solidity / Contratos inteligentes", pqr_type: "Queja", priority: "Alta", impact_level: "Bajo", created_at: "2025-07-31 02:50:11", sla_due_at: "2025-08-17 02:50:11" },
  { id: "TSK-009", titulo: "Cancellation", descripcion: "Optimizar y simplificar el flujo de cancelación de servicios para los usuarios.", owner_name: "José Rosales", collaborators: "Jessy, Hernando, José Ángel", department: "Desarrollo Solidity / Contratos inteligentes", pqr_type: "Reclamo", priority: "Alta", impact_level: "Alto", created_at: "2025-08-04 11:50:11", sla_due_at: "2025-08-20 11:50:11" },
  { id: "TSK-010", titulo: "Auto Boost", descripcion: "Revisión de la configuración y activación/desactivación automática de la función Boost.", owner_name: "Jessy", collaborators: "José Rosales, Hernando", department: "Desarrollo Backend", pqr_type: "Queja", priority: "Media", impact_level: "Alto", created_at: "2025-08-05 10:50:11", sla_due_at: "2025-08-20 10:50:11" },
  { id: "TSK-011", titulo: "Some leaders who had stakes in the past complain they don’t see their LPs", descripcion: "Identificar y resolver la ausencia de LPs en las cuentas de líderes con historial de stake.", owner_name: "Leidys", collaborators: "Jessy, Doctor", department: "QA (CUA)", pqr_type: "Sugerencia", priority: "Baja", impact_level: "Medio", created_at: "2025-07-26 03:50:11", sla_due_at: "2025-08-14 03:50:11" },
  { id: "TSK-012", titulo: "Did we miss those migrated from staking to LP? Need amounts and confirmation", descripcion: "Verificar y confirmar montos de usuarios migrados de staking a LP, asegurando que todos estén correctamente reflejados.", owner_name: "Edgar", collaborators: "José, Miguel", department: "QA (CUA)", pqr_type: "Queja", priority: "Alta", impact_level: "Medio", created_at: "2025-08-08 09:50:11", sla_due_at: "2025-08-18 09:50:11" },
  { id: "TSK-013", titulo: "Communicate to field the payments at creation of season 1", descripcion: "Asegurar la comunicación clara sobre pagos realizados al inicio de la temporada 1, incluyendo todos los bonos y recompensas especificadas.", owner_name: "Saúl Guerra", collaborators: "Esaú, José", department: "QA (CUA)", pqr_type: "Sugerencia", priority: "Baja", impact_level: "Alto", created_at: "2025-08-05 07:50:11", sla_due_at: "2025-08-15 07:50:11" },
  { id: "TSK-014", titulo: "Ensure bonuses and LP rewards are paid accurately and on time", descripcion: "Garantizar la puntualidad y precisión en el pago de bonos y recompensas LP para reforzar la confianza de la comunidad.", owner_name: "Hernando", collaborators: "Esaú, Saúl Guerra, Javier", department: "Diseño", pqr_type: "Queja", priority: "Alta", impact_level: "Bajo", created_at: "2025-07-27 04:50:11", sla_due_at: "2025-08-03 04:50:11" },
  { id: "TSK-015", titulo: "Daily sales", descripcion: "Reporte diario de ventas generadas en la plataforma.", owner_name: "Ángela", collaborators: "Esaú, José Ángel, José Rosales", department: "Desarrollo Solidity / Contratos inteligentes", pqr_type: "Petición", priority: "Alta", impact_level: "Alto", created_at: "2025-08-05 02:50:11", sla_due_at: "2025-08-22 02:50:11" },
  { id: "TSK-016", titulo: "NFT", descripcion: "Monitoreo y control de transacciones y propiedades de NFTs en el sistema.", owner_name: "José", collaborators: "Josman, Jessy", department: "Desarrollo Frontend", pqr_type: "Sugerencia", priority: "Baja", impact_level: "Alto", created_at: "2025-07-28 20:50:11", sla_due_at: "2025-08-18 20:50:11" },
  { id: "TSK-017", titulo: "LP (LP per product)", descripcion: "Desglose y seguimiento de LPs asignados por producto.", owner_name: "Josman", collaborators: "Miguel, José, Ángela", department: "Desarrollo Frontend", pqr_type: "Sugerencia", priority: "Media", impact_level: "Medio", created_at: "2025-08-05 06:50:11", sla_due_at: "2025-08-25 06:50:11" },
  { id: "TSK-018", titulo: "LP renewals", descripcion: "Registro y control de renovaciones de LP.", owner_name: "Doctor", collaborators: "Esaú, Josman", department: "Desarrollo Backend", pqr_type: "Queja", priority: "Media", impact_level: "Bajo", created_at: "2025-08-04 18:50:11", sla_due_at: "2025-08-14 18:50:11" },
  { id: "TSK-019", titulo: "Weekly and period-based summaries for the above metrics", descripcion: "Resumen semanal y por periodos de métricas de ventas, NFTs, LP y renovaciones.", owner_name: "Miguel", collaborators: "José, José Ángel", department: "Desarrollo Solidity / Contratos inteligentes", pqr_type: "Sugerencia", priority: "Alta", impact_level: "Medio", created_at: "2025-07-30 22:50:11", sla_due_at: "2025-08-18 22:50:11" }
];

// 4. Helper functions to map raw data to application types
const toPQRType = (pqrType: string): PQRType => {
    const map: { [key: string]: PQRType } = { 'Petición': PQRType.P, 'Queja': PQRType.Q, 'Reclamo': PQRType.R, 'Sugerencia': PQRType.S };
    return map[pqrType] || PQRType.P;
};

const toPrioridad = (priority: string): Prioridad => {
    const map: { [key: string]: Prioridad } = { 'Alta': Prioridad.Alta, 'Media': Prioridad.Media, 'Baja': Prioridad.Baja };
    return map[priority] || Prioridad.Media;
};

const toImpacto = (impactLevel: string): Impacto => {
    const map: { [key: string]: Impacto } = { 'Alto': Impacto.Alto, 'Medio': Impacto.Medio, 'Bajo': Impacto.Bajo };
    return map[impactLevel] || Impacto.Medio;
};

const toArea = (department: string): Area => {
    if (department.includes('Frontend')) return Area.Frontend;
    if (department.includes('Backend')) return Area.Backend;
    if (department.includes('Solidity')) return Area.Solidity;
    if (department.includes('QA')) return Area.QA;
    if (department.includes('Diseño')) return Area.Diseno;
    return Area.General;
};

const allEstados = Object.values(Estado);
const getRandomEstado = (): Estado => {
    // Filter out 'No Aplica' for random assignment
    const assignableStates = allEstados.filter(s => s !== Estado.NotApplicable);
    return assignableStates[Math.floor(Math.random() * assignableStates.length)];
};

const assignTaskType = (index: number, title: string): TaskType => {
    if (title.toLowerCase().includes('dashboard')) return TaskType.Mejora;
    if (index % 7 === 0) return TaskType.Bug;
    if (index % 5 === 0) return TaskType.ODT;
    return TaskType.PQR;
}

// 5. Generate MOCK_TASKS
export const MOCK_TASKS: PushtrackTask[] = rawPqrData.map((raw, index) => {
    const recibidoEn = new Date(raw.created_at.replace(' ', 'T') + 'Z');
    const venceEn = new Date(raw.sla_due_at.replace(' ', 'T') + 'Z');
    const slaHoras = Math.round((venceEn.getTime() - recibidoEn.getTime()) / (1000 * 60 * 60));
    
    // Randomize update time between created and now, but not after now.
    const now = new Date();
    const maxUpdateDate = now > venceEn ? venceEn : now;
    const updatedAt = new Date(recibidoEn.getTime() + Math.random() * (maxUpdateDate.getTime() - recibidoEn.getTime()));
    
    const owner = MOCK_USERS.find(u => u.full_name === raw.owner_name);
    const collaboratorUsers = raw.collaborators.split(', ').map(name => MOCK_USERS.find(u => u.full_name === name)).filter(Boolean) as User[];
    
    const taskType = assignTaskType(index, raw.titulo);
    
    return {
        id: raw.id,
        project_key: 'proj-defily',
        titulo: raw.titulo,
        descripcion: raw.descripcion,
        informador_email: MOCK_USERS[0].email, // Default to first user
        responsable_email: owner?.email || '',
        colaboradores_emails: collaboratorUsers.map(u => u.email),
        po_email: MOCK_USERS.find(u => u.role_global === UserRole.Admin)?.email || '',
        task_type: taskType,
        pqr_type: taskType === TaskType.PQR ? toPQRType(raw.pqr_type) : PQRType.P,
        prioridad: toPrioridad(raw.priority),
        estado: getRandomEstado(),
        canal: Canal.App, // Default value
        recibido_en: recibidoEn.toISOString(),
        vence_en: venceEn.toISOString(),
        updated_at: updatedAt.toISOString(),
        closed_at: null,
        target_date: null,
        kanban_order: recibidoEn.getTime(),
        sla_horas: slaHoras,
        impacto: toImpacto(raw.impact_level),
        area: toArea(raw.department),
        archivado: false,
        contrato_principal: `CT-2024-${raw.id.slice(-3)}`, // Example contract
        adjuntos: [],
        respuesta_final: '',
        checklist: {}, // Default empty
        auditoria: [{ evento: 'Creación', por: 'Sistema', cuando: recibidoEn.toISOString(), detalle: 'Ticket creado desde dataset inicial.' }],
        comentarios: [],
        trashed_at: null,
        progress: Math.floor(Math.random() * 4) * 25, // 0, 25, 50, 75
        escalation_level: 0,
        first_response_minutes: Math.random() > 0.2 ? Math.floor(Math.random() * (480 - 15 + 1)) + 15 : undefined,
    };
});
export const MOCK_TICKETS = MOCK_TASKS;