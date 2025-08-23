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
          "timeRemaining": "Tiempo Restante"
        },
        "histories": {
          "attachments": "Adjuntos",
          "progress": "Progreso",
          "audit": "Auditoría"
        }
      },
      "enums": {
        "priority": {
          "Baja": "Baja",
          "Media": "Media",
          "Alta": "Alta"
        },
        "status": {
          "Lanzado / Cerrado": "Lanzado / Cerrado",
          "En Pruebas": "En Pruebas"
        },
        "area": {
          "Frontend": "Frontend"
        }
      },
      "taskTypes": {
        "Bug": "Bug"
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
          "timeRemaining": "Time Remaining"
        },
        "histories": {
          "attachments": "Attachments",
          "progress": "Progress",
          "audit": "Audit"
        }
      },
      "enums": {
        "priority": {
          "Baja": "Low",
          "Media": "Medium",
          "Alta": "High"
        },
        "status": {
          "Lanzado / Cerrado": "Released / Closed",
          "En Pruebas": "In Testing"
        },
        "area": {
          "Frontend": "Frontend"
        }
      },
      "taskTypes": {
        "Bug": "Bug"
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
          "timeRemaining": "الوقت المتبقي"
        },
        "histories": {
          "attachments": "المرفقات",
          "progress": "التقدم",
          "audit": "المراجعة"
        }
      },
      "enums": {
        "priority": {
          "Baja": "منخفضة",
          "Media": "متوسطة",
          "Alta": "عالية"
        },
        "status": {
          "Lanzado / Cerrado": "تم الإطلاق / مغلق",
          "En Pruebas": "قيد الاختبار"
        },
        "area": {
          "Frontend": "الواجهة الأمامية"
        }
      },
      "taskTypes": {
        "Bug": "خطأ"
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
