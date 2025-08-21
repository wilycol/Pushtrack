PushTrack – Lógica Unificada y Extendida para Movimientos de Tareas y Kanban
Versión: 1.1 (Extendida) • Fecha: 20/08/2025
Este documento sustituye completamente cualquier lógica previa. Define con detalle el flujo de estados, permisos por rol, validación de checklist, arrastre y suelta (drag & drop), auditoría, API, UX, pruebas y métricas. Sirve como fuente de verdad para desarrollo (frontend y backend), QA y producto.
0. Alcance y Objetivos
• Unificar la lógica en las tres vías de cambio de estado: (a) Ficha Task, (b) Menú de 3 puntos en Kanban, (c) Drag & Drop en Kanban.
• Garantizar trazabilidad completa con un modelo de auditoría único.
• Implementar validaciones server-side (autorización/rol y checklist) y una UX consistente (modales/notificaciones/snapback).
• Proveer contrato de API, catálogo de mensajes i18n, pruebas mínimas y métricas de seguimiento.
1. Glosario y Definiciones
Task: entidad unificada. Tipos: PQR, ODT, Bug, Mejora/Feature, Alerta.
Roles del sistema: Administrador (Admin), Líder (Informador/Gatekeeper), Colaborador (Responsable).
Checklist: lista de verificación asociada al estado de ORIGEN desde el cual se pretende avanzar.
Override: movimiento que ignora bloqueo por checklist (solo Admin) y queda marcado en historial.
Skip/Salto: avanzar cruzando >1 estado en un solo movimiento (solo Admin).
Métodos de movimiento (method): 'task' (edición en ficha), 'menu' (menú de 3 puntos), 'drag' (drag&drop en Kanban).
2. Máquina de Estados (State Machine)
Flujo principal (lineal y ordenado):
Backlog → Por Hacer → En Progreso → En Revisión → En Pruebas → Esperando Cliente → Lanzado/Cerrado
Estado especial de cierre: 'No Aplica' (NA). Puede alcanzarse desde cualquier estado por Líder/Admin con justificación.
Regla General: avanzar un (1) estado a la vez. Saltos múltiples prohibidos, excepto por Admin con justificación y registro de skipPath.
3. Permisos por Rol – Visión General
Acción	Administrador	Líder	Colaborador	Checklist	Justificación
Avanzar 1 paso	Sí	Sí	No	Líder: 100% requerido; Admin: puede anular	Admin solo si override
Retroceder 1 paso	Sí	Sí	Sí	N/A	Obligatoria para todos
Saltar estados (>1)	Sí	No	No	Admin puede anular	Obligatoria
Mover a “No Aplica”	Sí	Sí	No	N/A	Obligatoria
Reordenar en misma columna	Sí	Sí	Sí	N/A	No
4. Reglas Detalladas de Movimiento
4.1 Avanzar (forward):
• Líder: permitido solo si el checklist del estado de origen está 100% completo.
• Colaborador: prohibido (snapback + notificación).
• Administrador: permitido aunque el checklist esté incompleto; requiere marcar override y proporcionar justificación (modal).
4.2 Retroceder (back):
• Permitido para Admin/Líder/Colaborador, siempre con justificación (modal).
4.3 Saltar estados:
• Solo Admin: permite pasar de un estado a otro no contiguo. Debe registrarse skipPath (lista de estados intermedios omitidos). Exige justificación.
4.4 'No Aplica' (NA):
• Cierre excepcional. Solo Líder/Admin. Justificación obligatoria y etiqueta closedAs=NO_APLICA.
4.5 Reordenar en la misma columna:
• Cambio de prioridad visual. Permitido para todos. No escribe entrada de auditoría de transición (solo orden).
5. Checklist por Estado – Modelo y Validación
Validación: para avanzar DESDE un estado X, debe estar completo el checklist asociado a X (hard-blocking).
Estado	Objetivo del Checklist	Ejemplos de Ítems (por tipo de Task)
Por Hacer	Asegurar definición clara	Criterios de aceptación definidos; Alcance; Estimación; Enlaces a specs
En Progreso	Ejecución completa	Código/artefactos listos; Evidencias mínimas; Unit tests pasados
En Revisión	Calidad de revisión	Code review realizado; Estándares cumplidos; Sonar/linters OK
En Pruebas	Calidad verificada	Casos QA ejecutados; Evidencias adjuntas; Bugs críticos resueltos
Esperando Cliente	Entrega/feedback	Build entregado; Notas de versión; Feedback recibido o SLA cumplido
6. Vías de Cambio de Estado y Comportamiento de UI
6.1 Ficha Task (edición directa): campo 'Estado' editable.
• Al guardar, invoca POST /tasks/{id}/move con method='task'. Aplica las mismas validaciones que Kanban.
6.2 Menú de 3 puntos en Kanban: opciones Editar / Mover / Historial.
• 'Mover' abre selector de estados contiguos (por defecto) y permite No Aplica si el rol lo habilita.
• Invoca POST /tasks/{id}/move con method='menu'.
6.3 Drag & Drop en Kanban:
• Drag start: mostrar ghost, resaltar columnas válidas. 
• Drag over: bloquear columnas inválidas (cursor not-allowed); no permitir drop si viola reglas.
• Drop:
   - Si requiere justificación → mostrar modal antes de confirmar.
   - Si inválido → snapback + toast con i18n.
   - Si override Admin → modal especial (reason obligatorio).
• Invoca POST /tasks/{id}/move con method='drag'.
7. Algoritmo de Validación (server-side, común a todas las vías)
function validateMove(user, task, fromState, toState, method, payload) {
  assertAuthorized(user); // rol vigente
  const dir = direction(fromState, toState); // forward | back | same
  const isSkip = skipCount(fromState, toState) > 1;

  if (dir === 'same') return {ok: true, type: 'reorder'};

  // Regla de rol
  if (dir === 'forward') {
    if (user.rol === 'Colaborador') return block('move.block.role');
    if (user.rol === 'Líder') {
      if (!checklistComplete(task, fromState)) return block('move.block.checklist', missingItems(task, fromState));
    }
    // Admin: permitido; si checklist incompleto => override obligatorio
    if (user.rol === 'Admin' && !checklistComplete(task, fromState)) requireOverride(payload);
  }

  if (dir === 'back') requireJustification(payload);

  if (isSkip) {
    if (user.rol !== 'Admin') return block('move.block.skip');
    requireJustification(payload);
    payload.skipPath = computeSkipPath(fromState, toState);
  }

  if (toState === 'No Aplica' && user.rol === 'Colaborador') return block('move.block.role');
  if (toState === 'No Aplica') requireJustification(payload);

  return {ok: true, dir, isSkip};
}
8. Auditoría / Historial – Esquema y Ejemplos
8.1 Esquema de registro (todas las vías deben escribir este formato):
{
  "timestamp": "2025-08-20T14:35:22Z",
  "taskId": "PQR-124",
  "userId": "u-001",
  "userName": "Juan Pérez",
  "rol": "Líder",
  "method": "drag",
  "fromState": "En Progreso",
  "toState": "En Revisión",
  "direction": "forward",
  "type": "Bug",
  "checklistStatus": "complete",
  "override": false,
  "overrideReason": null,
  "skipPath": [],
  "justification": null,
  "i18nKey": "move.success.forward"
}
8.2 Ejemplo – Retroceso del Colaborador (requiere justificación):
{
  "timestamp": "2025-08-20T16:02:10Z",
  "taskId": "ODT-288",
  "userId": "u-007",
  "userName": "María López",
  "rol": "Colaborador",
  "method": "menu",
  "fromState": "En Progreso",
  "toState": "Por Hacer",
  "direction": "back",
  "type": "ODT",
  "checklistStatus": "n/a",
  "override": false,
  "skipPath": [],
  "justification": "Faltan insumos del cliente",
  "i18nKey": "move.success.back"
}
8.3 Ejemplo – Override del Admin con salto múltiple:
{
  "timestamp": "2025-08-20T17:45:09Z",
  "taskId": "PQR-005",
  "userId": "u-000",
  "userName": "Ángela",
  "rol": "Admin",
  "method": "drag",
  "fromState": "En Revisión",
  "toState": "Lanzado/Cerrado",
  "direction": "forward",
  "type": "PQR",
  "checklistStatus": "incomplete",
  "override": true,
  "overrideReason": "Orden prioritaria del cliente (corte de mes)",
  "skipPath": ["En Pruebas", "Esperando Cliente"],
  "justification": "Cierre urgente solicitado por PO/CTO",
  "i18nKey": "move.success.forward"
}
9. Catálogo de Notificaciones (i18n)
Mensajes (ES):
move.success.forward = "Movida a {toState}."
move.success.back    = "Devuelta a {toState}. Motivo registrado."
move.block.role      = "Tu rol ({rol}) no puede realizar este movimiento."
move.block.checklist = "Para avanzar desde {fromState}, completa el checklist: {itemsPendientes}."
move.block.skip      = "No puedes saltar estados. Avanza paso a paso."
modal.justification.title = "Se requiere justificación"
modal.override.title      = "Override de administrador"
reason.placeholder        = "Describe el motivo…"

10. API – Contratos y Códigos de Error
10.1 Endpoint unificado de movimiento:
POST /tasks/{id}/move
Headers: Authorization: Bearer <token>
Body: {
  "toState": "En Revisión" | "En Pruebas" | ..., 
  "method": "task" | "menu" | "drag",
  "justification": "string (opcional/según regla)",
  "override": true|false (solo Admin),
  "overrideReason": "string (si override)",
  "skipPath": ["En Revisión","En Pruebas"] (si Admin salta)
}
200 OK { ok: true, task: {...}, auditEntry: {...} }
400 BAD_REQUEST { code: "CHECKLIST_INCOMPLETE", missing: [...] }
403 FORBIDDEN { code: "ROLE_NOT_ALLOWED" }
409 CONFLICT { code: "INVALID_TRANSITION" }

10.2 Reordenar en columna:
POST /tasks/{id}/reorder
Body: { "newIndex": 3 }
200 OK { ok: true }
10.3 Evento en tiempo real (socket):
event: "task:moved"
payload: { auditEntry: {...}, task: {...minimal...} }
11. UX – Drag & Drop Detallado
• Mostrar placeholder en columna destino; mantener altura para evitar saltos visuales.
• Drop inválido: animación de snapback 150–250ms + toast (5s).
• Modal de justificación/override bloquea la confirmación; el drop se finaliza al enviar el motivo.
• Accesibilidad: mover con teclado (← → para cambiar columna; ↑ ↓ para reordenar). Narrar cambios con aria-live polite.
12. Sincronización y Consistencia
• Fuente de verdad: backend. Frontend usa optimista con rollback si el POST falla.
• Suscribirse a 'task:moved' para refrescar Task Board, Kanban y Reportes sin recargar.
• Evitar condiciones de carrera: el backend valida versión/etag de la Task para impedir overwrites.
• Offline: si POST falla por red, reintentar exponencial con toasts informativos.
13. Seguridad
• Validación de permisos SIEMPRE server-side.
• Registrar userId/rol en auditoría; no almacenar datos sensibles innecesarios.
• Limitar tamaño de 'justification' y sanitizar HTML.
• Rate limit por IP/usuario para evitar abuso de movimientos masivos.
14. Pruebas
Unit: validación de transición por rol; checklist; override; skipPath.
Integration: endpoint /move con DB y auditoría; socket emitido.
E2E: escenarios por rol x dirección x método (task/menu/drag).
Criterios de aceptación (ejemplos):
CA-001: Líder avanza de En Progreso→En Revisión con checklist completo => OK, auditoría escrita.
CA-002: Líder avanza con checklist incompleto => 400 CHECKLIST_INCOMPLETE, toast explicativo.
CA-003: Colaborador intenta avanzar => 403 ROLE_NOT_ALLOWED, snapback + toast.
CA-004: Admin avanza con override => OK + auditoría overrideReason.
CA-005: Retroceso (cualquiera) sin justificación => modal obligatorio.
CA-006: Drag intenta salto por Líder => bloqueado con move.block.skip.
CA-007: Admin salta estados => OK con skipPath registrado.
CA-008: Reordenar en columna => OK sin auditoría de transición.

15. Telemetría y KPIs
• % de movimientos por rol/método/dirección.
• # de intentos bloqueados por checklist/rol/salto.
• # de overrides de Admin (tendencia).
• Tiempo medio desde 'En Progreso'→'Lanzado/Cerrado'.
• Errores API / tasa de reintentos.
• SLA de latencia de movimiento < 400ms p95 backend.
16. Plan de Migración
1) Feature flag: 'kanbanUnifiedMoves'.
2) Mapear estados actuales al flujo estándar.
3) Backfill de auditoría si se detectan huecos críticos.
4) Activar en staging; ejecutar pruebas y smoke tests.
5) Desplegar a producción; monitorear KPIs 72h; retirar lógica anterior.
17. Requisitos No Funcionales
• Soporte: Chrome/Edge/Firefox (últimas 2 versiones).
• Kanban con 500+ tarjetas debe mantener 60fps en scroll; drag sin jank visible.
• Móvil: drag & drop por long-press (>250ms) + vibración háptica (si disponible).
18. Diagrama de Flujo (texto)
Colaborador (Responsable) --solicita--> Líder (Informador)
Líder --valida checklist--> Avanza 1 paso
Cualquiera --detecta problema--> Retrocede (requiere motivo)
Admin --override/skip--> Avanza o cierra (No Aplica)
Todos --reordenan--> misma columna (prioridad visual)
19. Apéndice A – Enumeraciones
States:
- Backlog, Por Hacer, En Progreso, En Revisión, En Pruebas, Esperando Cliente, Lanzado/Cerrado, No Aplica

Roles:
- Admin, Líder, Colaborador

Error codes:
- ROLE_NOT_ALLOWED, CHECKLIST_INCOMPLETE, INVALID_TRANSITION, JUSTIFICATION_REQUIRED

Methods:
- task, menu, drag
20. Prompt para Google Studio (reemplaza todo lo anterior)
Implementa esta lógica unificada exactamente como se describe arriba. Usa un único endpoint /tasks/{id}/move para Task, menú y drag; aplica validación por rol y checklist; exige justificación en retrocesos/saltos/No Aplica; permite override solo a Admin (con justificación) y registra auditoría con el esquema provisto. Añade mensajes i18n, UX de drag con bloqueo/snapback/modales, sockets de 'task:moved', pruebas unitarias/e2e y métricas.

Anexo – Ejemplos de Auditoría y Diagrama Visual
Este anexo complementa la lógica unificada con ejemplos concretos de auditoría por tipo de movimiento y un diagrama visual del flujo.
Diagrama Visual del Flujo (roles y estados)
 
El diagrama ilustra: (1) solicitud del Colaborador al Líder, (2) validación de checklist y avance de un paso, (3) intervención del Administrador con override/saltos cuando sea necesario.
Ejemplos de Auditoría por Tipo de Movimiento
Avance 1 paso por Líder (checklist completo, método drag)
{
  "timestamp": "2025-08-20T14:35:22Z",
  "taskId": "TASK-124",
  "userId": "u-015",
  "userName": "José",
  "rol": "Líder",
  "method": "drag",
  "fromState": "En Progreso",
  "toState": "En Revisión",
  "direction": "forward",
  "type": "Bug",
  "checklistStatus": "complete",
  "override": false,
  "overrideReason": null,
  "skipPath": [],
  "justification": null,
  "i18nKey": "move.success.forward"
}
Avance 1 paso por Admin con override (checklist incompleto, método menu)
{
  "timestamp": "2025-08-20T15:01:09Z",
  "taskId": "TASK-090",
  "userId": "u-001",
  "userName": "Ángela",
  "rol": "Admin",
  "method": "menu",
  "fromState": "En Progreso",
  "toState": "En Revisión",
  "direction": "forward",
  "type": "PQR",
  "checklistStatus": "incomplete",
  "override": true,
  "overrideReason": "Corte de mes; bloqueo temporal de cliente",
  "skipPath": [],
  "justification": "Aprobado por PO/CTO",
  "i18nKey": "move.success.forward"
}
Retroceso por Colaborador (requiere justificación, método task)
{
  "timestamp": "2025-08-20T16:10:41Z",
  "taskId": "TASK-288",
  "userId": "u-021",
  "userName": "María",
  "rol": "Colaborador",
  "method": "task",
  "fromState": "En Progreso",
  "toState": "Por Hacer",
  "direction": "back",
  "type": "ODT",
  "checklistStatus": "n/a",
  "override": false,
  "overrideReason": null,
  "skipPath": [],
  "justification": "Faltan insumos del cliente",
  "i18nKey": "move.success.back"
}
Retroceso por Líder (con justificación, método drag)
{
  "timestamp": "2025-08-20T17:02:30Z",
  "taskId": "TASK-305",
  "userId": "u-015",
  "userName": "José",
  "rol": "Líder",
  "method": "drag",
  "fromState": "En Revisión",
  "toState": "En Progreso",
  "direction": "back",
  "type": "Mejora",
  "checklistStatus": "n/a",
  "override": false,
  "overrideReason": null,
  "skipPath": [],
  "justification": "Cambios solicitados en code review",
  "i18nKey": "move.success.back"
}
Salto de estados por Admin (con skipPath y justificación, método drag)
{
  "timestamp": "2025-08-20T18:22:11Z",
  "taskId": "TASK-005",
  "userId": "u-001",
  "userName": "Ángela",
  "rol": "Admin",
  "method": "drag",
  "fromState": "En Revisión",
  "toState": "Lanzado/Cerrado",
  "direction": "forward",
  "type": "PQR",
  "checklistStatus": "incomplete",
  "override": true,
  "overrideReason": "Hotfix urgente en producción",
  "skipPath": ["En Pruebas", "Esperando Cliente"],
  "justification": "Aprobado por PO/CTO",
  "i18nKey": "move.success.forward"
}
Mover a "No Aplica" por Líder (con justificación, método menu)
{
  "timestamp": "2025-08-20T19:05:50Z",
  "taskId": "TASK-411",
  "userId": "u-015",
  "userName": "José",
  "rol": "Líder",
  "method": "menu",
  "fromState": "Por Hacer",
  "toState": "No Aplica",
  "direction": "forward",
  "type": "Alerta",
  "checklistStatus": "n/a",
  "override": false,
  "overrideReason": null,
  "skipPath": [],
  "justification": "Solicitud cancelada por el cliente",
  "i18nKey": "move.success.forward"
}
Reordenar dentro de la misma columna (sin transición de estado)
{
  "timestamp": "2025-08-20T19:20:00Z",
  "taskId": "TASK-222",
  "userId": "u-021",
  "userName": "María",
  "rol": "Colaborador",
  "method": "drag",
  "fromState": "En Progreso",
  "toState": "En Progreso",
  "direction": "same",
  "type": "Bug",
  "checklistStatus": "n/a",
  "override": false,
  "overrideReason": null,
  "skipPath": [],
  "justification": null,
  "i18nKey": "reorder.success"
}