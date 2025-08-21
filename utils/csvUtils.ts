import { PushtrackTask } from '../types';

export const exportTicketsToCSV = (tasks: PushtrackTask[]): void => {
  const headers = [
    "id", "titulo", "task_type", "pqr_type", "descripcion", "canal", "reportado_por", 
    "recibido_en", "asignado_a", "prioridad", "sla_horas", "vence_en", 
    "estado", "respuesta_final", "contrato_principal", "archivado", "adjuntos_urls",
    "proyectoId", "supervisor", "colaboradores"
  ];

  const csvContent = [
    headers.join(','),
    ...tasks.map(task => {
      const adjuntos_urls = task.adjuntos.map(a => a.url).join(';');
      const colaboradores_str = task.colaboradores_emails.join(';');
      const rowData = {
        ...task,
        respuesta_final: task.respuesta_final || '',
        contrato_principal: task.contrato_principal || '',
        adjuntos_urls,
        colaboradores: colaboradores_str,
      };

      const finalRow: Record<string, any> = {};
      headers.forEach(header => {
          finalRow[header] = (rowData as any)[header];
      });

      return headers.map(header => {
        let value = finalRow[header];
        if (value === null || value === undefined) {
          value = '';
        }
        const stringValue = value.toString().replace(/"/g, '""');
        return `"${stringValue}"`;
      }).join(',');
    })
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'Pushtrack_Export.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadCSVTemplate = (): void => {
  const headers = ["titulo", "descripcion"];
  const csvContent = headers.join(',');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'plantilla_pushtrack.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};