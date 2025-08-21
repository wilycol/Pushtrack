import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TaskFormData, PQRType, TaskType, Canal, Prioridad, Estado, PushtrackTask, AdjuntoItem, Project, User } from '../types';
import { formatDateTime } from '../utils/helpers';
import { XMarkIcon } from './icons';
import AttachmentManager from './AttachmentManager';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticketId: string, formData: TaskFormData) => void;
  ticketToEdit?: PushtrackTask | null;
  projects: Project[];
  users: User[];
}

const getInitialFormData = (projects: Project[], ticket?: PushtrackTask | null): TaskFormData => {
    if (ticket) {
        return {
            titulo: ticket.titulo,
            descripcion: ticket.descripcion,
            project_key: ticket.project_key,
            informador_email: ticket.informador_email,
            responsable_email: ticket.responsable_email,
            colaboradores_emails: ticket.colaboradores_emails,
            po_email: ticket.po_email,
            estado: ticket.estado,
            prioridad: ticket.prioridad,
            task_type: ticket.task_type,
            pqr_type: ticket.pqr_type,
            canal: ticket.canal,
            sla_horas: ticket.sla_horas,
            adjuntos: ticket.adjuntos,
            comentarios: ticket.comentarios || [],
            contrato_principal: ticket.contrato_principal,
            target_date: ticket.target_date,
        };
    }
    return {
        titulo: '',
        descripcion: '',
        project_key: projects.length > 0 ? projects[0].project_key : '',
        informador_email: '',
        responsable_email: '',
        colaboradores_emails: [],
        po_email: '',
        estado: Estado.Backlog,
        prioridad: Prioridad.Media,
        task_type: TaskType.PQR,
        pqr_type: PQRType.P,
        canal: Canal.App,
        sla_horas: 24,
        adjuntos: [],
        comentarios: [],
        contrato_principal: '',
        target_date: null,
    };
};

type FormErrors = { [key: string]: string };

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSubmit, ticketToEdit, projects, users }) => {
  const { t } = useTranslation('common');
  const [formData, setFormData] = useState<TaskFormData>(getInitialFormData(projects, ticketToEdit));
  const [colaboradoresStr, setColaboradoresStr] = useState(ticketToEdit?.colaboradores_emails.join(', ') || '');
  const [errors, setErrors] = useState<FormErrors>({});
  
  const isEditing = !!ticketToEdit;

  useEffect(() => {
    setFormData(getInitialFormData(projects, ticketToEdit));
    setColaboradoresStr(ticketToEdit?.colaboradores_emails.join(', ') || '');
  }, [ticketToEdit, isOpen, projects]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    let processedValue: string | number = value;
    if (name === 'sla_horas') {
        processedValue = value ? parseInt(value, 10) : 0;
    }

    setFormData(prev => ({ ...prev, [name]: processedValue as any }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const dueDatePreview = useMemo(() => {
    if (formData.sla_horas > 0) {
      const now = new Date();
      const dueDate = new Date(now);
      dueDate.setHours(now.getHours() + formData.sla_horas);
      return formatDateTime(dueDate.toISOString());
    }
    return 'N/A';
  }, [formData.sla_horas]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.titulo.trim()) newErrors.titulo = t('modals.pqrForm.titleError');
    if (!formData.descripcion.trim()) newErrors.descripcion = t('modals.pqrForm.descriptionError');
    if (!formData.project_key) newErrors.project_key = t('modals.pqrForm.projectError');
    if (!formData.responsable_email) newErrors.responsable_email = t('modals.pqrForm.assigneeError');
    if (!formData.sla_horas || formData.sla_horas < 1) {
      newErrors.sla_horas = t('modals.pqrForm.slaError');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
        const finalFormData = {
            ...formData,
            colaboradores_emails: colaboradoresStr.split(',').map(s => s.trim()).filter(Boolean),
        };
        onSubmit(ticketToEdit?.id || '', finalFormData);
    }
  };

  const handleAddAttachment = (file: File) => {
      const newAttachment: AdjuntoItem = {
          url: URL.createObjectURL(file),
          nombre: file.name,
          tipo_mime: file.type,
          tamano: file.size,
          subido_por: 'Usuario Actual', // Placeholder
          cuando: new Date().toISOString(),
      };
      setFormData(prev => ({ ...prev, adjuntos: [...prev.adjuntos, newAttachment] }));
  };

  const handleDeleteAttachment = (url: string) => {
      setFormData(prev => ({ ...prev, adjuntos: prev.adjuntos.filter(a => a.url !== url)}));
  };

  if (!isOpen) return null;

  const inputClasses = (hasError: boolean) => 
    `mt-1 block w-full rounded-md shadow-sm sm:text-sm bg-[#0F1626] text-slate-200 placeholder:text-slate-500 ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-[#22304A] focus:border-indigo-500 focus:ring-indigo-500'}`;
  
  const UserSelect: React.FC<{name: 'informador_email' | 'responsable_email' | 'po_email', label: string}> = ({name, label}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-300">{label}</label>
        <select id={name} name={name} value={formData[name] as string} onChange={handleInputChange} className={inputClasses(!!errors[name])}>
            <option value="">Seleccionar usuario...</option>
            {users.map(u => <option key={u.email} value={u.email}>{u.full_name}</option>)}
        </select>
        {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]}</p>}
    </div>
  );


  return (
    <div className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm flex items-center justify-center" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="relative bg-[#121A2B] rounded-xl shadow-2xl shadow-black/30 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#22304A]">
          <h2 id="modal-title" className="text-xl font-bold text-slate-100">{isEditing ? t('modals.pqrForm.editTitle', { id: ticketToEdit?.id }) : t('modals.pqrForm.newTitle')}</h2>
          <button onClick={onClose} title={t('tooltips.closeModal') || ''} className="p-1 rounded-full hover:bg-slate-700 transition-colors">
            <XMarkIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Form Body */}
        <form id="pqr-form" onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Column 1 */}
            <div className="space-y-4">
              <div>
                <label htmlFor="titulo" className="block text-sm font-medium text-slate-300">{t('modals.pqrForm.title')}</label>
                <input type="text" id="titulo" name="titulo" value={formData.titulo} onChange={handleInputChange} className={inputClasses(!!errors.titulo)} required />
                {errors.titulo && <p className="mt-1 text-xs text-red-500">{errors.titulo}</p>}
              </div>

                <div>
                    <label htmlFor="project_key" className="block text-sm font-medium text-slate-300">{t('modals.pqrForm.project')}</label>
                    <select id="project_key" name="project_key" value={formData.project_key} onChange={handleInputChange} className={inputClasses(!!errors.project_key)}>
                        <option value="">Seleccionar proyecto...</option>
                        {projects.map(p => <option key={p.project_key} value={p.project_key}>{p.name}</option>)}
                    </select>
                     {errors.project_key && <p className="mt-1 text-xs text-red-500">{errors.project_key}</p>}
                </div>
              
                <UserSelect name="responsable_email" label={t('modals.pqrForm.assignee')} />
                <UserSelect name="informador_email" label={t('modals.pqrForm.reporter')} />
                <UserSelect name="po_email" label={t('modals.pqrForm.po_cto')} />

              <div>
                  <label htmlFor="colaboradores" className="block text-sm font-medium text-slate-300">{t('modals.pqrForm.collaborators')}</label>
                  <input type="text" id="colaboradores" name="colaboradores_emails" value={colaboradoresStr} onChange={(e) => setColaboradoresStr(e.target.value)} className={inputClasses(false)} />
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-4">
              <div>
                <label htmlFor="estado" className="block text-sm font-medium text-slate-300">{t('modals.pqrForm.status')}</label>
                <select id="estado" name="estado" value={formData.estado} onChange={handleInputChange} className={inputClasses(false)}>
                  {Object.values(Estado).map(e => <option key={e} value={e}>{t(`enums.status.${e}`)}</option>)}
                </select>
              </div>
               <div>
                <label htmlFor="prioridad" className="block text-sm font-medium text-slate-300">{t('modals.pqrForm.priority')}</label>
                <select id="prioridad" name="prioridad" value={formData.prioridad} onChange={handleInputChange} className={inputClasses(false)}>
                  {Object.values(Prioridad).map(p => <option key={p} value={p}>{t(`enums.priority.${p}`)}</option>)}
                </select>
              </div>
                <div>
                    <label htmlFor="task_type" className="block text-sm font-medium text-slate-300">{t('modals.pqrForm.taskType')}</label>
                    <select id="task_type" name="task_type" value={formData.task_type} onChange={handleInputChange} className={inputClasses(false)}>
                    {Object.values(TaskType).map(tt => <option key={tt} value={tt}>{t(`taskTypes.${tt}`)}</option>)}
                    </select>
                </div>
                {formData.task_type === TaskType.PQR && (
                <div>
                    <label htmlFor="pqr_type" className="block text-sm font-medium text-slate-300">{t('modals.pqrForm.type')}</label>
                    <select id="pqr_type" name="pqr_type" value={formData.pqr_type} onChange={handleInputChange} className={inputClasses(false)}>
                    {Object.values(PQRType).map(tVal => <option key={tVal} value={tVal}>{t(`enums.tipo.${tVal}`)}</option>)}
                    </select>
                </div>
                )}
              <div>
                <label htmlFor="canal" className="block text-sm font-medium text-slate-300">{t('modals.pqrForm.channel')}</label>
                <select id="canal" name="canal" value={formData.canal} onChange={handleInputChange} className={inputClasses(false)}>
                  {Object.values(Canal).map(c => <option key={c} value={c}>{t(`enums.canal.${c}`)}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="sla_horas" className="block text-sm font-medium text-slate-300">{t('modals.pqrForm.sla')}</label>
                <input type="number" id="sla_horas" name="sla_horas" value={formData.sla_horas} onChange={handleInputChange} min="1" className={inputClasses(!!errors.sla_horas)} required />
                {errors.sla_horas && <p className="mt-1 text-xs text-red-600">{errors.sla_horas}</p>}
                {!isEditing && <p className="mt-1 text-xs text-slate-500">{t('modals.pqrForm.dueDate', { date: dueDatePreview })}</p>}
              </div>
              <div>
                  <label htmlFor="contrato_principal" className="block text-sm font-medium text-slate-300">{t('modals.pqrForm.mainContract')}</label>
                  <input type="text" id="contrato_principal" name="contrato_principal" value={formData.contrato_principal} onChange={handleInputChange} className={inputClasses(false)} />
              </div>

            </div>
          </div>

          {/* Full-width description */}
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-slate-300">{t('modals.pqrForm.description')}</label>
            <textarea id="descripcion" name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows={4} className={inputClasses(!!errors.descripcion)} required ></textarea>
            {errors.descripcion && <p className="mt-1 text-xs text-red-600">{errors.descripcion}</p>}
          </div>

          <AttachmentManager 
            attachments={formData.adjuntos}
            onAddAttachment={handleAddAttachment}
            onDeleteAttachment={handleDeleteAttachment}
          />

        </form>

        {/* Footer */}
        <div className="flex justify-end items-center gap-3 p-4 bg-[#0F1626] border-t border-[#22304A] rounded-b-xl">
          <button type="button" onClick={onClose} title={t('tooltips.cancel') || ''} className="w-full sm:w-auto rounded-md bg-transparent px-3.5 py-2 text-sm font-semibold text-slate-200 shadow-sm ring-1 ring-inset ring-slate-700 hover:bg-slate-800">
            {t('modals.cancel')}
          </button>
          <button type="submit" form="pqr-form" title={isEditing ? t('tooltips.saveChanges') : t('tooltips.create') || ''} className="w-full sm:w-auto rounded-md bg-indigo-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500">
            {isEditing ? t('modals.saveChanges') : t('modals.pqrForm.saveTask')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskFormModal;