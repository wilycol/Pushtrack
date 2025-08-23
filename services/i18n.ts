import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Definir las traducciones directamente en el código para evitar problemas de importación
const resources = {
  es: {
    common: {
      "header": {
        "tasks": "Tareas",
        "projects": "Proyectos",
        "teams": "Equipos",
        "reports": "Reportes",
        "kanban": "Kanban",
        "trash": "Papelera",
        "poweredBy": "Powered by Gemini",
        "projectsBreadcrumb": "Proyectos"
      },
      "dashboard": {
        "filter": {
          "searchPlaceholder": "Buscar por ID, título...",
          "critical": "Críticos",
          "import": "Importar CSV",
          "export": "Exportar CSV",
          "newTask": "Nueva Tarea",
          "active": "Activos",
          "archived": "Archivados",
          "allArchived": "Todos (Arch.)",
          "allProjects": "Todos los Proyectos",
          "allTypes": "Todos los Tipos",
          "allPriorities": "Todas las Prioridades",
          "allStates": "Todos los Estados"
        },
        "inboxTitle": "Bandeja de Entrada ({{count}})",
        "noTasks": "No se encontraron tareas con los filtros actuales.",
        "downloadTemplate": "Descargar Plantilla CSV",
        "noTicketSelected": "No hay Tarea Seleccionada",
        "selectTicketPrompt": "Por favor, selecciona una tarea de la lista para ver sus detalles.",
        "createFirstTicket": "Haz clic en \"+ Nueva Tarea\" para comenzar.",
        "backToProject": "Volver al Proyecto"
      },
      "pqrDetail": {
        "assignee": "Responsable",
        "reporter": "Informador",
        "collaborators": "Colaboradores",
        "header": {
          "area": "Área/Depto",
          "createdDate": "F. Creación",
          "lastUpdate": "Últ. Actualización",
          "timeRemaining": "Tiempo Restante",
          "whatsappMenu": {
            "send": "Enviar",
            "sendl": "Enviar Link",
            "copy": "Copiar",
            "genel": "General",
            "sendWhatsApp": "Enviar WhatsApp",
            "sendEmail": "Enviar Email",
            "generateImage": "Generar Imagen",
            "clipboardSuccess": "Copiado al portapapeles",
            "shareError": "Error al compartir"
          }
        },
        "histories": {
          "attachments": "Adjuntos",
          "progress": "Progreso",
          "audit": "Auditoría"
        },
        "checklistForState": "Lista de Verificación para el Estado",
        "attachEvidence": "Adjuntar Evidencia",
        "comments": "Comentarios",
        "noComments": "No hay comentarios aún",
        "addCommentPlaceholder": "Escribe un comentario...",
        "yc": "YC"
      },
      "enums": {
        "priority": {
          "Baja": "Baja",
          "Media": "Media",
          "Alta": "Alta"
        },
        "status": {
          "Lanzado / Cerrado": "Lanzado / Cerrado",
          "En Pruebas": "En Pruebas",
          "En Progreso": "En Progreso",
          "Backlog": "Backlog",
          "En Revisión": "En Revisión",
          "Por Hacer": "Por Hacer",
          "Esperando Cliente": "Esperando Cliente"
        },
        "area": {
          "Frontend": "Frontend"
        },
        "projectStatus": {
          "Active": "Activo"
        }
      },
      "taskTypes": {
        "Bug": "Bug"
      },
      "modals": {
        "modal": {
          "override": {
            "title": "Confirmar Acción"
          }
        },
        "cancel": "Cancelar",
        "confirm": "Confirmar",
        "saveChanges": "Guardar Cambios",
        "pqrForm": {
          "dropzone": "Arrastra archivos aquí o haz clic para seleccionar",
          "dropzoneHint": "Archivos soportados: PDF, DOC, DOCX, JPG, PNG"
        },
        "apiKey": {
          "title": "Configurar Clave API",
          "description": "Ingresa tu clave API para habilitar las funciones avanzadas",
          "label": "Clave API",
          "placeholder": "sk-..."
        }
      },
      "workflow": {
        "reason": {
          "label": "Justificación",
          "placeholder": "Por favor, proporciona una justificación para esta acción..."
        }
      },
      "unifiedPanel": {
        "addCommentPlaceholder": "Agregar comentario...",
        "logProgressBtn": "Registrar Progreso",
        "title": "Panel de Progreso",
        "progressTitle": "Progreso de la Tarea",
        "aiQuestionsTitle": "Preguntas de IA",
        "generateAIBtn": "Generar IA",
        "noAIQuestions": "No hay preguntas de IA disponibles",
        "advanceStateBtn": "Avanzar Estado"
      },
      "checklist": {
        "inprogress": {
          "time": "Registrar tiempo dedicado",
          "log": "Actualizar log de progreso",
          "evidence": "Adjuntar evidencia de trabajo",
          "commits": "Verificar commits realizados",
          "risks": "Identificar riesgos y bloqueos"
        },
        "todo": {
          "reqs": "Revisar requisitos",
          "docs": "Actualizar documentación",
          "assignee": "Asignar responsable",
          "estimate": "Estimar tiempo",
          "leader_validation": "Validación del líder"
        }
      },
      "kanban": {
        "title": "Tablero Kanban",
        "compactView": "Vista Compacta",
        "daysAgo": "días atrás"
      },
      "projects": {
        "list": {
          "title": "Lista de Proyectos",
          "newProject": "Nuevo Proyecto"
        }
      },
      "PROJECTS": {
        "LIST": {
          "HEADERS": {
            "NAME": "Nombre",
            "OWNER": "Propietario",
            "STATUS": "Estado",
            "PQRS": "PQRS",
            "LASTACTIVITY": "Última Actividad"
          }
        }
      },
      "teams": {
        "title": "Gestión de Equipos",
        "newUser": "Nuevo Usuario",
        "statusActive": "Activo",
        "edit": "Editar"
      },
      "TEAMS": {
        "HEADERS": {
          "NAME": "Nombre",
          "GLOBALROLE": "Rol Global",
          "STATUS": "Estado",
          "PROJECTS": "Proyectos"
        }
      },
      "reports": {
        "title": "Reportes y Analytics",
        "history": {
          "viewHistory": "Ver Historial"
        },
        "manageSchedules": "Gestionar Programaciones",
        "newReport": "Nuevo Reporte",
        "filters": {
          "searchPlaceholder": "Buscar reportes...",
          "dateFilterType": "Tipo de Filtro de Fecha:",
          "allProjects": "Todos los Proyectos",
          "allStates": "Todos los Estados",
          "allAssignees": "Todos los Asignados"
        },
        "preconfigured": {
          "pqrByStatus": "PQRS por Estado",
          "slaCompliance": "Cumplimiento SLA",
          "burnDownChart": "Gráfico de Burndown",
          "responseTime": "Tiempo de Respuesta",
          "throughput": "Rendimiento",
          "backlogAging": "Antigüedad del Backlog",
          "loadByAssignee": "Carga por Asignado"
        },
        "filters": {
          "by": "por"
        },
        "burndown": {
          "real": "Real",
          "ideal": "Ideal"
        },
        "pagination": {
          "previous": "Anterior",
          "page": "Página",
          "next": "Siguiente"
        }
      },
      "REPORTS": {
        "QUERIES": {
          "SLA_C": "SLA Cumplido",
          "SLA": "SLA",
          "SLASE": "SLA Sobre Ejecutado",
          "SOMEBOME": "Cumplimiento"
        }
      },
      "trash": {
        "title": "Papelera",
        "retentionPolicy": "Política de Retención: Los elementos se eliminan permanentemente después de 30 días",
        "empty": "La papelera está vacía"
      },
      "Trash": {
        "Tabs": {
          "All": "Todo",
          "Projects": "Proyectos",
          "Tickets": "Tickets",
          "Users": "Usuarios"
        }
      },
      "TRASH": {
        "HEADERS": {
          "ITEM": "Elemento",
          "TYPE": "Tipo",
          "TRASHEDON": "Eliminado el",
          "EXPIRESIN": "Expira en"
        }
      }
    }
  },
  en: {
    common: {
      "header": {
        "tasks": "Tasks",
        "projects": "Projects",
        "teams": "Teams",
        "reports": "Reports",
        "kanban": "Kanban",
        "trash": "Trash",
        "poweredBy": "Gemini",
        "projectsBreadcrumb": "Projects"
      },
      "dashboard": {
        "filter": {
          "searchPlaceholder": "Search by ID, title...",
          "critical": "Critical",
          "import": "Import CSV",
          "export": "Export CSV",
          "newTask": "New Task",
          "active": "Active",
          "archived": "Archived",
          "allArchived": "All (Arch.)",
          "allProjects": "All Projects",
          "allTypes": "All Types",
          "allPriorities": "All Priorities",
          "allStates": "All States"
        },
        "inboxTitle": "Inbox ({{count}})",
        "noTasks": "No tasks found with the current filters.",
        "downloadTemplate": "Download CSV Template",
        "noTicketSelected": "No Task Selected",
        "selectTicketPrompt": "Please select a task from the list to see its details.",
        "createFirstTicket": "Click on \"+ New Task\" to get started.",
        "backToProject": "Back to Project"
      },
      "pqrDetail": {
        "assignee": "Assignee",
        "reporter": "Reporter",
        "collaborators": "Collaborators",
        "header": {
          "area": "Area/Dept",
          "createdDate": "Created Date",
          "lastUpdate": "Last Update",
          "timeRemaining": "Time Remaining",
          "whatsappMenu": {
            "send": "Send",
            "sendl": "Send Link",
            "copy": "Copy",
            "genel": "General",
            "sendWhatsApp": "Send WhatsApp",
            "sendEmail": "Send Email",
            "generateImage": "Generate Image",
            "clipboardSuccess": "Copied to clipboard",
            "shareError": "Share error"
          }
        },
        "histories": {
          "attachments": "Attachments",
          "progress": "Progress",
          "audit": "Audit"
        },
        "checklistForState": "Checklist for State",
        "attachEvidence": "Attach Evidence",
        "comments": "Comments",
        "noComments": "No comments yet",
        "addCommentPlaceholder": "Write a comment...",
        "yc": "YC"
      },
      "enums": {
        "priority": {
          "Baja": "Low",
          "Media": "Medium",
          "Alta": "High"
        },
        "status": {
          "Lanzado / Cerrado": "Released / Closed",
          "En Pruebas": "In Testing",
          "En Progreso": "In Progress",
          "Backlog": "Backlog",
          "En Revisión": "In Review",
          "Por Hacer": "To Do",
          "Esperando Cliente": "Waiting for Client"
        },
        "area": {
          "Frontend": "Frontend"
        },
        "projectStatus": {
          "Active": "Active"
        }
      },
      "taskTypes": {
        "Bug": "Bug"
      },
      "modals": {
        "modal": {
          "override": {
            "title": "Confirm Action"
          }
        },
        "cancel": "Cancel",
        "confirm": "Confirm",
        "saveChanges": "Save Changes",
        "pqrForm": {
          "dropzone": "Drag files here or click to select",
          "dropzoneHint": "Supported files: PDF, DOC, DOCX, JPG, PNG"
        },
        "apiKey": {
          "title": "Configure API Key",
          "description": "Enter your API key to enable advanced features",
          "label": "API Key",
          "placeholder": "sk-..."
        }
      },
      "workflow": {
        "reason": {
          "label": "Justification",
          "placeholder": "Please provide a justification for this action..."
        }
      },
      "unifiedPanel": {
        "addCommentPlaceholder": "Add comment...",
        "logProgressBtn": "Log Progress",
        "title": "Progress Panel",
        "progressTitle": "Task Progress",
        "aiQuestionsTitle": "AI Questions",
        "generateAIBtn": "Generate AI",
        "noAIQuestions": "No AI questions available",
        "advanceStateBtn": "Advance State"
      },
      "checklist": {
        "inprogress": {
          "time": "Log time spent",
          "log": "Update progress log",
          "evidence": "Attach work evidence",
          "commits": "Verify commits made",
          "risks": "Identify risks and blockers"
        },
        "todo": {
          "reqs": "Review requirements",
          "docs": "Update documentation",
          "assignee": "Assign responsible",
          "estimate": "Estimate time",
          "leader_validation": "Leader validation"
        }
      },
      "kanban": {
        "title": "Kanban Board",
        "compactView": "Compact View",
        "daysAgo": "days ago"
      },
      "projects": {
        "list": {
          "title": "Projects List",
          "newProject": "New Project"
        }
      },
      "PROJECTS": {
        "LIST": {
          "HEADERS": {
            "NAME": "Name",
            "OWNER": "Owner",
            "STATUS": "Status",
            "PQRS": "PQRS",
            "LASTACTIVITY": "Last Activity"
          }
        }
      },
      "teams": {
        "title": "Team Management",
        "newUser": "New User",
        "statusActive": "Active",
        "edit": "Edit"
      },
      "TEAMS": {
        "HEADERS": {
          "NAME": "Name",
          "GLOBALROLE": "Global Role",
          "STATUS": "Status",
          "PROJECTS": "Projects"
        }
      },
      "reports": {
        "title": "Reports & Analytics",
        "history": {
          "viewHistory": "View History"
        },
        "manageSchedules": "Manage Schedules",
        "newReport": "New Report",
        "filters": {
          "searchPlaceholder": "Search reports...",
          "dateFilterType": "Date Filter Type:",
          "allProjects": "All Projects",
          "allStates": "All States",
          "allAssignees": "All Assignees"
        },
        "preconfigured": {
          "pqrByStatus": "PQRS by Status",
          "slaCompliance": "SLA Compliance",
          "burnDownChart": "Burndown Chart",
          "responseTime": "Response Time",
          "throughput": "Throughput",
          "backlogAging": "Backlog Aging",
          "loadByAssignee": "Load by Assignee"
        },
        "filters": {
          "by": "by"
        },
        "burndown": {
          "real": "Real",
          "ideal": "Ideal"
        },
        "pagination": {
          "previous": "Previous",
          "page": "Page",
          "next": "Next"
        }
      },
      "REPORTS": {
        "QUERIES": {
          "SLA_C": "SLA Compliant",
          "SLA": "SLA",
          "SLASE": "SLA Over Executed",
          "SOMEBOME": "Compliance"
        }
      },
      "trash": {
        "title": "Trash",
        "retentionPolicy": "Retention Policy: Items are permanently deleted after 30 days",
        "empty": "Trash is empty"
      },
      "Trash": {
        "Tabs": {
          "All": "All",
          "Projects": "Projects",
          "Tickets": "Tickets",
          "Users": "Users"
        }
      },
      "TRASH": {
        "HEADERS": {
          "ITEM": "Item",
          "TYPE": "Type",
          "TRASHEDON": "Trashed On",
          "EXPIRESIN": "Expires In"
        }
      }
    }
  },
  ar: {
    common: {
      "header": {
        "tasks": "المهام",
        "projects": "المشاريع",
        "teams": "الفرق",
        "reports": "التقارير",
        "kanban": "كانبان",
        "trash": "سلة المهملات",
        "poweredBy": "بدعم من Gemini",
        "projectsBreadcrumb": "المشاريع"
      },
      "dashboard": {
        "filter": {
          "searchPlaceholder": "بحث بالمعرف، العنوان...",
          "critical": "الحرجة",
          "import": "استيراد CSV",
          "export": "تصدير CSV",
          "newTask": "مهمة جديدة",
          "active": "النشطة",
          "archived": "المؤرشفة",
          "allArchived": "الكل (المؤرشفة)",
          "allProjects": "كل المشاريع",
          "allTypes": "كل الأنواع",
          "allPriorities": "كل الأولويات",
          "allStates": "كل الحالات"
        },
        "inboxTitle": "صندوق الوارد ({{count}})",
        "noTasks": "لم يتم العثور على مهام بالمرشحات الحالية.",
        "downloadTemplate": "تنزيل قالب CSV",
        "noTicketSelected": "لم يتم تحديد مهمة",
        "selectTicketPrompt": "يرجى تحديد مهمة من القائمة لعرض تفاصيلها.",
        "createFirstTicket": "انقر على \"+ مهمة جديدة\" للبدء.",
        "backToProject": "العودة إلى المشروع"
      },
      "pqrDetail": {
        "assignee": "المسؤول",
        "reporter": "المبلغ",
        "collaborators": "المتعاونون",
        "header": {
          "area": "المنطقة/القسم",
          "createdDate": "تاريخ الإنشاء",
          "lastUpdate": "آخر تحديث",
          "timeRemaining": "الوقت المتبقي",
          "whatsappMenu": {
            "send": "إرسال",
            "sendl": "إرسال الرابط",
            "copy": "نسخ",
            "genel": "عام",
            "sendWhatsApp": "إرسال واتساب",
            "sendEmail": "إرسال البريد الإلكتروني",
            "generateImage": "إنشاء صورة",
            "clipboardSuccess": "تم النسخ إلى الحافظة",
            "shareError": "خطأ في المشاركة"
          }
        },
        "histories": {
          "attachments": "المرفقات",
          "progress": "التقدم",
          "audit": "المراجعة"
        },
        "checklistForState": "قائمة التحقق للحالة",
        "attachEvidence": "إرفاق الأدلة",
        "comments": "التعليقات",
        "noComments": "لا توجد تعليقات بعد",
        "addCommentPlaceholder": "اكتب تعليقاً...",
        "yc": "YC"
      },
      "enums": {
        "priority": {
          "Baja": "منخفضة",
          "Media": "متوسطة",
          "Alta": "عالية"
        },
        "status": {
          "Lanzado / Cerrado": "تم الإطلاق / مغلق",
          "En Pruebas": "قيد الاختبار",
          "En Progreso": "قيد التنفيذ",
          "Backlog": "قائمة الانتظار",
          "En Revisión": "قيد المراجعة",
          "Por Hacer": "للقيام به",
          "Esperando Cliente": "بانتظار العميل"
        },
        "area": {
          "Frontend": "الواجهة الأمامية"
        }
      },
      "taskTypes": {
        "Bug": "خطأ"
      },
      "modals": {
        "modal": {
          "override": {
            "title": "تأكيد الإجراء"
          }
        },
        "cancel": "إلغاء",
        "confirm": "تأكيد",
        "saveChanges": "حفظ التغييرات",
        "pqrForm": {
          "dropzone": "اسحب الملفات هنا أو انقر للاختيار",
          "dropzoneHint": "الملفات المدعومة: PDF, DOC, DOCX, JPG, PNG"
        },
        "apiKey": {
          "title": "تكوين مفتاح API",
          "description": "أدخل مفتاح API لتمكين الميزات المتقدمة",
          "label": "مفتاح API",
          "placeholder": "sk-..."
        }
      },
      "workflow": {
        "reason": {
          "label": "التبرير",
          "placeholder": "يرجى تقديم تبرير لهذا الإجراء..."
        }
      },
      "unifiedPanel": {
        "addCommentPlaceholder": "إضافة تعليق...",
        "logProgressBtn": "تسجيل التقدم",
        "title": "لوحة التقدم",
        "progressTitle": "تقدم المهمة",
        "aiQuestionsTitle": "أسئلة الذكاء الاصطناعي",
        "generateAIBtn": "إنشاء الذكاء الاصطناعي",
        "noAIQuestions": "لا توجد أسئلة ذكاء اصطناعي متاحة",
        "advanceStateBtn": "تقدم الحالة"
      },
      "checklist": {
        "inprogress": {
          "time": "تسجيل الوقت المستغرق",
          "log": "تحديث سجل التقدم",
          "evidence": "إرفاق دليل العمل",
          "commits": "التحقق من الالتزامات المنجزة",
          "risks": "تحديد المخاطر والعقبات"
        },
        "todo": {
          "reqs": "مراجعة المتطلبات",
          "docs": "تحديث الوثائق",
          "assignee": "تعيين المسؤول",
          "estimate": "تقدير الوقت",
          "leader_validation": "تحقق القائد"
        }
      },
      "kanban": {
        "title": "لوحة كانبان",
        "compactView": "عرض مضغوط",
        "daysAgo": "أيام مضت"
      },
      "projects": {
        "list": {
          "title": "قائمة المشاريع",
          "newProject": "مشروع جديد"
        }
      },
      "PROJECTS": {
        "LIST": {
          "HEADERS": {
            "NAME": "الاسم",
            "OWNER": "المالك",
            "STATUS": "الحالة",
            "PQRS": "PQRS",
            "LASTACTIVITY": "آخر نشاط"
          }
        }
      },
      "teams": {
        "title": "إدارة الفرق",
        "newUser": "مستخدم جديد",
        "statusActive": "نشط",
        "edit": "تعديل"
      },
      "TEAMS": {
        "HEADERS": {
          "NAME": "الاسم",
          "GLOBALROLE": "الدور العام",
          "STATUS": "الحالة",
          "PROJECTS": "المشاريع"
        }
      },
      "reports": {
        "title": "التقارير والتحليلات",
        "history": {
          "viewHistory": "عرض السجل"
        },
        "manageSchedules": "إدارة الجداول الزمنية",
        "newReport": "تقرير جديد",
        "filters": {
          "searchPlaceholder": "البحث في التقارير...",
          "dateFilterType": "نوع فلتر التاريخ:",
          "allProjects": "جميع المشاريع",
          "allStates": "جميع الحالات",
          "allAssignees": "جميع المكلفين"
        },
        "preconfigured": {
          "pqrByStatus": "PQRS حسب الحالة",
          "slaCompliance": "الامتثال لـ SLA",
          "burnDownChart": "مخطط Burndown",
          "responseTime": "وقت الاستجابة",
          "throughput": "الإنتاجية",
          "backlogAging": "شيخوخة قائمة الانتظار",
          "loadByAssignee": "الحمل حسب المكلف"
        },
        "filters": {
          "by": "حسب"
        },
        "burndown": {
          "real": "فعلي",
          "ideal": "مثالي"
        },
        "pagination": {
          "previous": "السابق",
          "page": "الصفحة",
          "next": "التالي"
        }
      },
      "REPORTS": {
        "QUERIES": {
          "SLA_C": "متوافق مع SLA",
          "SLA": "SLA",
          "SLASE": "SLA مفرط التنفيذ",
          "SOMEBOME": "الامتثال"
        }
      },
      "trash": {
        "title": "سلة المهملات",
        "retentionPolicy": "سياسة الاحتفاظ: يتم حذف العناصر نهائياً بعد 30 يوماً",
        "empty": "سلة المهملات فارغة"
      },
      "Trash": {
        "Tabs": {
          "All": "الكل",
          "Projects": "المشاريع",
          "Tickets": "التذاكر",
          "Users": "المستخدمين"
        }
      },
      "TRASH": {
        "HEADERS": {
          "ITEM": "العنصر",
          "TYPE": "النوع",
          "TRASHEDON": "تم الحذف في",
          "EXPIRESIN": "ينتهي في"
        }
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'ar'],
    ns: ['common'],
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag', 'querystring', 'cookie'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    initImmediate: false,
    preload: ['es', 'en', 'ar'],
    load: 'languageOnly',
    debug: false,
    returnEmptyString: false,
    returnNull: false,
    returnObjects: true,
    keySeparator: '.',
    nsSeparator: ':',
    saveMissing: false,
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      console.warn(`Missing translation key: ${key} for language: ${lng}`);
      return fallbackValue || key;
    }
  });

export default i18n;
