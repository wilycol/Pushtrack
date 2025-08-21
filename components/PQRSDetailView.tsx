import React, { useState, useRef, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';
import { PushtrackTask, Estado, Project, User, AdjuntoItem, Auditoria, Comentario, ProgressUpdate, ToastType, Mention } from '../types';
import { getPriorityStyles, getEstadoStyles, formatDateTime, getProjectInfo, getUserInfo, timeUntil, renderMentionedText, getTaskTypeInfo } from '../utils/helpers';
import { 
    DownloadIcon, WhatsAppIcon, PencilIcon, PaperClipIcon, ClockIcon, TicketIcon, LinkIcon, ShareIcon, CameraIcon, 
    XMarkIcon, InformationCircleIcon, PaperAirplaneIcon, EnvelopeIcon, GlobeAltIcon
} from './icons';
import { checklistConfig } from '../utils/checklistConfig';
import UnifiedProgressPanel from './UnifiedProgressPanel';
import CommentSection from './CommentSection';
import CommentItem from './CommentItem';
import { translateText } from '../services/geminiService';

// Helper function for robust clipboard copying
const copyToClipboard = (text: string, t: (key: string) => string) => {
    // Use modern Clipboard API if available and in a secure context
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => {
                alert(t('pqrDetail.header.whatsappMenu.clipboardSuccess'));
            })
            .catch(err => {
                console.error('Async clipboard API failed:', err);
                prompt(t('pqrDetail.header.whatsappMenu.shareError'), text);
            });
    } else {
        // Fallback to legacy execCommand for non-secure contexts or older browsers
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.top = '-9999px';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (!successful) {
                throw new Error('Copy command was not successful.');
            }
            alert(t('pqrDetail.header.whatsappMenu.clipboardSuccess'));
        } catch (err) {
            console.error('Legacy clipboard failed:', err);
            prompt(t('pqrDetail.header.whatsappMenu.shareError'), text);
        }
    }
};


// Define Props
interface PQRSDetailViewProps {
  ticket: PushtrackTask;
  projects: Project[];
  users: User[];
  onChecklistChange: (ticketId: string, checklistItemId: string, isChecked: boolean) => void;
  onToggleArchive: (ticketId: string) => void;
  onEditTicket: () => void;
  onEditUser: (user: User) => void;
  onAddComment: (data: { raw_text: string; mentions: { email: string; full_name: string }[] }) => void;
  onSendToTrash: (ticketId: string) => void;
  onUpdateProgress: (progress: number, commentData: { raw_text: string, mentions: { email: string, full_name: string }[] }) => void;
  onAddAttachment: (ticketId: string, file: File, estado: Estado) => void;
  onDeleteAttachment: (ticketId: string, url: string) => void;
  onAdvanceState: () => void;
  onGenerateAIQuestions: () => void;
  onAnswerAIQuestion: (questionId: string, answerData: { raw_text: string, mentions: { email: string, full_name: string }[] }) => void;
  addToast: (message: string, type?: ToastType) => void;
}

const ShareModal: React.FC<{
    content: { file: File, text: string, title: string };
    onClose: () => void;
    t: (key: string) => string;
}> = ({ content, onClose, t }) => {
    const { file, text, title } = content;
    const [imageUrl, setImageUrl] = useState('');

    useEffect(() => {
        const url = URL.createObjectURL(file);
        setImageUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const performShare = async () => {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({ files: [file], title, text });
                onClose();
            } catch (error) {
                if ((error as DOMException).name !== 'AbortError') {
                    console.error('Error sharing:', error);
                    // Fallback
                    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                }
            }
        } else {
            // Fallback
            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
            alert('El chat de WhatsApp se ha abierto. Puede arrastrar la imagen de abajo o descargarla para adjuntarla.');
        }
    };
    
    const downloadImage = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative bg-[#121A2B] rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-[#22304A]">
                    <h2 className="text-lg font-bold text-slate-100">Compartir PQR</h2>
                    <button onClick={onClose} title={t('tooltips.closeModal') || ''} className="p-1 rounded-full hover:bg-slate-700"><XMarkIcon className="w-6 h-6 text-slate-400" /></button>
                </div>
                <div className="p-4 overflow-y-auto flex-grow space-y-4">
                    <p className="text-sm text-slate-400">Revisa el contenido y haz clic en "Compartir" para abrir el diálogo de tu dispositivo.</p>
                    {imageUrl && <img src={imageUrl} alt="PQR preview" className="rounded-md border border-slate-700" />}
                    <div className="bg-slate-800/50 p-3 rounded-md">
                        <p className="text-xs text-slate-300 whitespace-pre-wrap">{text}</p>
                    </div>
                </div>
                <div className="p-3 bg-[#0F1626] border-t border-[#22304A] rounded-b-xl flex justify-between items-center gap-3">
                    <button onClick={downloadImage} className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600">Descargar Imagen</button>
                    <div className="flex gap-3">
                        <button onClick={onClose} title={t('tooltips.cancel') || ''} className="rounded-md bg-transparent px-3.5 py-2 text-sm font-semibold text-slate-200 shadow-sm ring-1 ring-inset ring-slate-700 hover:bg-slate-800">{t('modals.cancel')}</button>
                        <button onClick={performShare} className="rounded-md bg-indigo-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400">Compartir</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// Sub-component: PQRDetailHeader
const PQRDetailHeader: React.FC<Pick<PQRSDetailViewProps, 'ticket' | 'projects' | 'users' | 'onEditTicket' | 'onEditUser' | 'addToast'>> = ({ ticket, projects, users, onEditTicket, onEditUser, addToast }) => {
    const { t, i18n } = useTranslation('common');
    const [isMenuOpen, setMenuOpen] = useState(false);
    const headerRef = useRef<HTMLDivElement>(null);
    const [shareContent, setShareContent] = useState<{ file: File, text: string, title: string } | null>(null);
    const [isGeneratingShare, setIsGeneratingShare] = useState(false);

    // Translation State
    const [translatedDescription, setTranslatedDescription] = useState<string | null>(null);
    const [showOriginalDescription, setShowOriginalDescription] = useState(false);
    const [isTranslatingDescription, setIsTranslatingDescription] = useState(false);

    const currentLang = i18n.language;
    const canTranslateDescription = currentLang !== 'es' && !translatedDescription;
    
    // Reset translation when ticket changes
    useEffect(() => {
        setTranslatedDescription(null);
        setShowOriginalDescription(false);
        setIsTranslatingDescription(false);
    }, [ticket.id]);

    const handleTranslateDescription = async () => {
        if (!ticket.descripcion) return;
        setIsTranslatingDescription(true);
        try {
            const translation = await translateText(ticket.descripcion, currentLang);
            setTranslatedDescription(translation);
            setShowOriginalDescription(false);
        } catch (error) {
            console.error("Translation failed:", error);
            addToast(t('tooltips.translationError'), 'error');
        } finally {
            setIsTranslatingDescription(false);
        }
    };
    
    const descriptionToShow = showOriginalDescription ? ticket.descripcion : (translatedDescription || ticket.descripcion);

    const project = getProjectInfo(ticket.project_key, projects);
    const isRealProject = 'project_key' in project;
    const responsable = getUserInfo(ticket.responsable_email, users);
    const informador = getUserInfo(ticket.informador_email, users);
    const colaboradores = ticket.colaboradores_emails.map(email => getUserInfo(email, users)).filter(Boolean) as User[];
    const estadoStyle = getEstadoStyles(ticket.estado);
    const priorityStyle = getPriorityStyles(ticket.prioridad);
    const taskTypeInfo = getTaskTypeInfo(ticket.task_type);
    const TaskTypeIcon = taskTypeInfo.icon;
    const timeRemaining = timeUntil(ticket.vence_en);
    
    const handleProjectNavigation = () => {
        if (isRealProject) {
            window.location.hash = `#/projects/${(project as Project).project_key}`;
        }
    };

    const generatePQRImage = async (): Promise<{blob: Blob | null, pendingItemsText: string[], pendingAIText: string[]}> => {
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.left = '-9999px';
        container.style.width = '550px';
        container.style.padding = '20px';
        container.style.background = '#0F1626';
        container.style.color = '#E2E8F0';
        container.style.fontFamily = 'sans-serif';
        container.style.border = '1px solid #22304A';
        container.style.borderRadius = '8px';

        const checklistItemsForState = checklistConfig[ticket.estado] || [];
        const pendingItems = checklistItemsForState
            .filter(itemConfig => !ticket.checklist?.[itemConfig.id]?.checked)
            .map(item => t(item.i18nKey));
        
        const pendingAIQuestions = (ticket.ai_questions || [])
            .filter(q => !q.answer)
            .map(q => q.question);

        const appLink = window.location.origin + window.location.pathname + `#/dashboard?ticketId=${ticket.id}`;

        container.innerHTML = `
            <h2 style="font-size: 1.25rem; font-weight: bold; color: #E2E8F0; margin-bottom: 4px; border-bottom: 1px solid #334155; padding-bottom: 8px;">${ticket.titulo}</h2>
            <p style="font-size: 0.875rem; color: #94A3B8; margin-bottom: 16px;">${ticket.id} &bull; ${project?.name || 'N/A'}</p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 0.875rem; margin-bottom: 16px;">
                <div><strong>Responsable:</strong> ${responsable?.full_name || 'Sin asignar'}</div>
                <div><strong>Estado:</strong> ${t(`enums.status.${ticket.estado}`, ticket.estado)}</div>
                <div><strong>Prioridad:</strong> ${t(`enums.priority.${ticket.prioridad}`, ticket.prioridad)}</div>
                <div><strong>Vence:</strong> ${formatDateTime(ticket.vence_en)}</div>
            </div>

            <h3 style="font-size: 1.1rem; font-weight: bold; color: #E2E8F0; margin-top: 20px; border-top: 1px solid #22304A; padding-top: 16px;">Checklist Pendiente (${pendingItems.length}/${checklistItemsForState.length})</h3>
            ${pendingItems.length > 0
                ? `<ul style="list-style-type: none; padding-left: 0; margin-top: 8px; font-size: 0.875rem; color: #CBD5E1;">${pendingItems.map(item => `<li style="margin-bottom: 6px; padding: 6px; background: #1E293B; border-radius: 4px; border-left: 3px solid #F59E0B;">${item}</li>`).join('')}</ul>`
                : `<p style="font-size: 0.875rem; color: #4ADE80; margin-top: 8px; font-weight: bold;">¡Checklist completo!</p>`
            }
            ${pendingAIQuestions.length > 0 ? `
            <h3 style="font-size: 1.1rem; font-weight: bold; color: #E2E8F0; margin-top: 16px; border-top: 1px solid #22304A; padding-top: 16px;">Preguntas IA Pendientes</h3>
            <ul style="list-style-type: none; padding-left: 0; margin-top: 8px; font-size: 0.875rem; color: #CBD5E1;">${pendingAIQuestions.map(item => `<li style="margin-bottom: 6px; padding: 6px; background: #1E293B; border-radius: 4px; border-left: 3px solid #6366F1;">${item}</li>`).join('')}</ul>
            ` : ''}
            
            <p style="font-size: 0.875rem; color: #64748B; margin-top: 20px; text-align: center; border-top: 1px solid #22304A; padding-top: 10px;">
                <strong style="color: #94A3B8;">Acceder al PQR:</strong><br/>
                <a href="${appLink}" style="color: #818CF8; text-decoration: none;">${appLink}</a>
            </p>
            <p style="font-size: 0.75rem; color: #64748B; margin-top: 10px; text-align: center;">Generado desde Pushtrack &bull; ${new Date().toLocaleString()}</p>
        `;

        document.body.appendChild(container);
        const canvas = await html2canvas(container, { backgroundColor: '#0F1626', scale: 2 });
        document.body.removeChild(container);

        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        return { blob, pendingItemsText: pendingItems, pendingAIText: pendingAIQuestions };
    };

    const handleDownloadImage = async () => {
        setMenuOpen(false);
        setIsGeneratingShare(true);
        const { blob } = await generatePQRImage();
        if (blob) {
            const link = document.createElement('a');
            link.download = `Pushtrack_PQR_${ticket.id}.png`;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
        }
        setIsGeneratingShare(false);
    };
    
    const handlePrepareShare = async () => {
        setMenuOpen(false);
        setIsGeneratingShare(true);
        
        try {
            const { blob, pendingItemsText, pendingAIText } = await generatePQRImage();
            if (!blob) {
                throw new Error('Failed to generate image blob.');
            }

            const file = new File([blob], `Pushtrack_PQR_${ticket.id}.png`, { type: 'image/png' });
            const url = window.location.href;
            
            const pendingChecklistText = pendingItemsText.length > 0
                ? `\n\n*Checklist Pendiente:*\n- ${pendingItemsText.join('\n- ')}`
                : '\n\n*Checklist completo.*';

            const pendingAITextForMessage = pendingAIText.length > 0
                ? `\n\n*Preguntas IA pendientes:*\n- ${pendingAIText.join('\n- ')}`
                : '';

            const title = `${ticket.id}: ${ticket.titulo}`;
            const text = `*Revisión PQR en Pushtrack*\n*ID:* ${ticket.id}\n*Título:* ${ticket.titulo}${pendingChecklistText}${pendingAITextForMessage}\n\n*Ver detalles:* ${url}`;
            
            setShareContent({ file, text, title });
        } catch (error) {
            console.error("Error generating share content:", error);
            alert("Hubo un error al preparar el contenido para compartir.");
        } finally {
            setIsGeneratingShare(false);
        }
    };


    const handleSendEmail = () => {
        const subject = `PQR: ${ticket.id} - ${ticket.titulo}`;
        const body = `Hola,\n\nPuedes revisar los detalles del PQR en el siguiente enlace:\n${window.location.href}\n\nGracias.`;
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setMenuOpen(false);
    }

    const handleCopyUrl = () => {
         copyToClipboard(window.location.href, t);
         setMenuOpen(false);
    }

    return (
        <>
            {isGeneratingShare && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
                    <div className="bg-slate-800 p-4 rounded-lg flex items-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span className="text-white">Generando vista previa...</span>
                    </div>
                </div>
            )}
            {shareContent && <ShareModal content={shareContent} onClose={() => setShareContent(null)} t={t} />}
            <div ref={headerRef} className="bg-[#121A2B] p-4 rounded-lg border border-[#22304A]">
                {/* Fila 1: Datos principales y badges */}
                <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
                    <div className="flex items-center gap-3">
                        <span className="text-slate-500 font-mono text-sm">{ticket.id}</span>
                        <h1 className="text-lg font-bold text-slate-100">{ticket.titulo}</h1>
                    </div>
                    <div className="flex items-center flex-wrap gap-2 text-xs">
                        {isRealProject ? (
                            <button onClick={handleProjectNavigation} title={t('tooltips.viewProjectDetails') || ''} className="bg-slate-700 px-2 py-0.5 rounded font-semibold text-slate-200 hover:bg-slate-600 transition-colors">
                                {(project as Project).name}
                            </button>
                        ) : (
                            <span className="bg-slate-700 px-2 py-0.5 rounded font-semibold text-slate-400">{project.name}</span>
                        )}
                        <span title={t(taskTypeInfo.tooltipKey) || ''} className={`inline-flex items-center font-semibold px-2 py-0.5 rounded ${getTaskTypeInfo(ticket.task_type).color} ${getPriorityStyles(ticket.prioridad).bg.replace('bg-opacity-20','bg-opacity-40')}`}>
                            <TaskTypeIcon className="h-3 w-3 mr-1.5" />{t(`taskTypes.${ticket.task_type}`)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded font-semibold ${estadoStyle.bg} ${estadoStyle.text}`}>
                            {t(`enums.status.${ticket.estado}`, ticket.estado)}
                        </span>
                        <span className={`inline-flex items-center font-semibold px-2 py-0.5 rounded ${priorityStyle.bg} ${priorityStyle.text}`}>
                            <priorityStyle.icon className="h-3 w-3 mr-1.5" />{t(`enums.priority.${ticket.prioridad}` as any)}
                        </span>
                    </div>
                </div>

                {/* Fila 2: Personas (Responsable, Informador, Colaboradores) */}
                <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 text-sm mt-3 pt-3 border-t border-[#22304A]/50">
                    <div>
                        <dt className="text-xs font-semibold text-slate-500">{t('pqrDetail.assignee')}</dt>
                        <dd className="mt-1 text-slate-200">
                             {responsable ? (
                                <button onClick={() => onEditUser(responsable)} className="hover:underline hover:text-indigo-400 transition-colors text-left" title={t('tooltips.editUser') || ''}>
                                    {responsable.full_name}
                                </button>
                            ) : (
                                <span className="text-slate-500">{t('pqrDetail.unassigned')}</span>
                            )}
                        </dd>
                    </div>
                     <div>
                        <dt className="text-xs font-semibold text-slate-500">{t('pqrDetail.reporter')}</dt>
                        <dd className="mt-1 text-slate-200">
                             {informador ? (
                                <button onClick={() => onEditUser(informador)} className="hover:underline hover:text-indigo-400 transition-colors text-left" title={t('tooltips.editUser') || ''}>
                                    {informador.full_name}
                                </button>
                            ) : (
                                <span className="text-slate-500">{t('pqrDetail.unassigned')}</span>
                            )}
                        </dd>
                    </div>
                     <div>
                        <dt className="text-xs font-semibold text-slate-500">{t('pqrDetail.collaborators')}</dt>
                        <dd className="mt-1 text-slate-300">
                            {colaboradores.length > 0 ? (
                                colaboradores.map((colaborador, index) => (
                                    <React.Fragment key={colaborador.email}>
                                        <button onClick={() => onEditUser(colaborador)} className="hover:underline hover:text-indigo-400 transition-colors" title={t('tooltips.editUser') || ''}>
                                            {colaborador.full_name}
                                        </button>
                                        {index < colaboradores.length - 1 && <span className="text-slate-500">, </span>}
                                    </React.Fragment>
                                ))
                            ) : (
                                <span className="text-slate-500">{t('pqrDetail.na')}</span>
                            )}
                        </dd>
                    </div>
                </dl>


                {/* Fila 3: Información clave */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs text-slate-400 mt-3 pt-3 border-t border-[#22304A]/50">
                    <div><span className="font-semibold">{t('pqrDetail.header.area')}:</span> {t(`enums.area.${ticket.area}`)}</div>
                    <div><span className="font-semibold">{t('pqrDetail.header.createdDate')}:</span> {formatDateTime(ticket.recibido_en)}</div>
                    <div><span className="font-semibold">{t('pqrDetail.header.lastUpdate')}:</span> {formatDateTime(ticket.updated_at)}</div>
                    <div><span className="font-semibold">{t('pqrDetail.header.timeRemaining')}:</span> <span className="font-bold text-amber-400">{timeRemaining}</span></div>
                </div>

                {/* Fila 4: Descripción y acciones */}
                <div className="mt-4 pt-3 border-t border-[#22304A]/50 flex justify-between items-start gap-4">
                    <div className="flex-grow">
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{descriptionToShow}</p>
                        {translatedDescription && (
                            <button onClick={() => setShowOriginalDescription(!showOriginalDescription)} className="text-xs text-indigo-400 hover:underline mt-1">
                                {showOriginalDescription ? t('tooltips.showTranslation') : t('tooltips.showOriginal')}
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {canTranslateDescription && (
                            <button onClick={handleTranslateDescription} disabled={isTranslatingDescription} title={t('tooltips.translateComment') || ''} className="p-2 rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:animate-pulse">
                                <GlobeAltIcon className="w-5 h-5 text-slate-400"/>
                            </button>
                        )}
                        <button onClick={onEditTicket} className="p-2 rounded-full hover:bg-slate-700 transition-colors" title={t('tooltips.editTicket') || ''}>
                            <PencilIcon className="w-5 h-5 text-slate-400"/>
                        </button>
                        <div className="relative">
                            <button onClick={() => setMenuOpen(!isMenuOpen)} className="p-2 rounded-full hover:bg-slate-700 transition-colors" title={t('tooltips.shareTicket') || ''}>
                                <ShareIcon className="w-5 h-5 text-indigo-400"/>
                            </button>
                            {isMenuOpen && (
                                <div onMouseLeave={() => setMenuOpen(false)} className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-[#1B2437] ring-1 ring-black ring-opacity-5 z-10">
                                    <div className="py-1">
                                        <button onClick={handlePrepareShare} title={t('tooltips.shareViaWhatsapp') || ''} className="w-full text-left text-slate-200 flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-600"><WhatsAppIcon className="w-4 h-4 text-green-500"/>{t('pqrDetail.header.whatsappMenu.sendWhatsApp')}</button>
                                        <button onClick={handleSendEmail} title={t('tooltips.shareViaEmail') || ''} className="w-full text-left text-slate-200 flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-600"><EnvelopeIcon className="w-4 h-4"/>{t('pqrDetail.header.whatsappMenu.sendEmail')}</button>
                                        <button onClick={handleCopyUrl} title={t('tooltips.copyURL') || ''} className="w-full text-left text-slate-200 flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-600"><LinkIcon className="w-4 h-4"/>{t('pqrDetail.header.whatsappMenu.copy')}</button>
                                        <button onClick={handleDownloadImage} title={t('tooltips.generateImage') || ''} className="w-full text-left text-slate-200 flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-600"><CameraIcon className="w-4 h-4"/>{t('pqrDetail.header.whatsappMenu.generateImage')}</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// Sub-component: HistoryButtons
const HistoryButtons: React.FC<{ ticket: PushtrackTask; onOpenModal: (type: 'attachments' | 'progress' | 'audit') => void }> = ({ ticket, onOpenModal }) => {
    const { t } = useTranslation('common');
    const attachmentsCount = ticket.adjuntos?.length || 0;
    const progressCount = ticket.progress_history?.length || 0;
    const auditCount = ticket.auditoria?.length || 0;

    const Button: React.FC<{ icon: React.ElementType; label: string; count: number; onClick: () => void, title: string }> = ({ icon: Icon, label, count, onClick, title }) => (
        <button onClick={onClick} title={title} className="flex items-center gap-2 text-sm font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-700/80 px-3 py-2 rounded-md transition-colors">
            <Icon className="w-4 h-4 text-slate-400" />
            {label}
            <span className="text-xs bg-slate-900 text-slate-200 font-semibold px-2 py-0.5 rounded-full">{count}</span>
        </button>
    );

    return (
        <div className="flex flex-wrap items-center gap-3">
            <Button icon={PaperClipIcon} label={t('pqrDetail.histories.attachments')} count={attachmentsCount} onClick={() => onOpenModal('attachments')} title={t('tooltips.viewAttachments') || ''} />
            <Button icon={ClockIcon} label={t('pqrDetail.histories.progress')} count={progressCount} onClick={() => onOpenModal('progress')} title={t('tooltips.viewProgress') || ''} />
            <Button icon={TicketIcon} label={t('pqrDetail.histories.audit')} count={auditCount} onClick={() => onOpenModal('audit')} title={t('tooltips.viewAudit') || ''} />
        </div>
    );
}

// Sub-component: HistoryModal
const HistoryModal: React.FC<{
    modalType: 'attachments' | 'progress' | 'audit';
    ticket: PushtrackTask;
    users: User[];
    onClose: () => void;
    addToast: (message: string, type?: ToastType) => void;
}> = ({ modalType, ticket, users, onClose, addToast }) => {
    const { t } = useTranslation('common');
    const [copyStatus, setCopyStatus] = useState(false);

    const titleMap = {
        attachments: t('pqrDetail.modal.titleAttachments'),
        progress: t('pqrDetail.modal.titleProgress'),
        audit: t('pqrDetail.modal.titleAudit'),
    };

    const getHistoryContent = () => {
      switch (modalType) {
        case 'attachments':
          return ticket.adjuntos?.map(a => `${formatDateTime(a.cuando)} - ${a.nombre} (${(a.tamano/1024).toFixed(1)} KB) subido por ${a.subido_por}`).join('\n') || 'No hay adjuntos.';
        case 'progress':
          return ticket.progress_history?.map(p => `${formatDateTime(p.at)} - ${p.by} actualizó a ${p.progress}%. Comentario: ${p.comment?.raw_text || 'N/A'}`).join('\n') || 'No hay historial de progreso.';
        case 'audit':
          const combined = [
              ...(ticket.auditoria || []).map(a => ({...a, type: 'audit'})),
              ...(ticket.comentarios || []).map(c => ({...c, type: 'comment'}))
          ].sort((a,b) => new Date(b.cuando).getTime() - new Date(a.cuando).getTime());
          return combined.map(item => {
              if (item.type === 'audit') {
                  const a = item as Auditoria;
                  return `${formatDateTime(a.cuando)} - [Sistema] ${a.evento} por ${a.por} - ${a.detalle}`;
              }
              const c = item as Comentario;
              return `${formatDateTime(c.cuando)} - [Comentario] por ${c.por}: ${c.raw_text}`;
          }).join('\n') || 'No hay historial.';
      }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(getHistoryContent());
        setCopyStatus(true);
        setTimeout(() => setCopyStatus(false), 2000);
    };

    const handleDownload = () => {
        const blob = new Blob([getHistoryContent()], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Pushtrack_History_${ticket.id}_${modalType}.txt`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const renderContent = () => {
        if (modalType === 'attachments') {
            return ticket.adjuntos && ticket.adjuntos.length > 0 ? (
                ticket.adjuntos.map(file => (
                    <a href={file.url} key={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-md hover:bg-slate-700/50">
                        <PaperClipIcon className="h-5 w-5 flex-shrink-0 text-slate-400" />
                        <div className="ml-3">
                           <p className="text-sm font-medium text-indigo-400">{file.nombre}</p>
                           <p className="text-xs text-slate-500">{formatDateTime(file.cuando)} - {file.subido_por}</p>
                        </div>
                    </a>
                ))
            ) : <p className="text-slate-500 text-sm text-center py-4">{t('pqrDetail.noAttachments')}</p>;
        }
        if (modalType === 'progress') {
             return ticket.progress_history && ticket.progress_history.length > 0 ? (
                [...ticket.progress_history].reverse().map((entry, index) => (
                    <div key={index} className="py-2">
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>{entry.by}</span>
                            <span>{formatDateTime(entry.at)}</span>
                        </div>
                        <p className="text-sm text-slate-200 mt-1">
                            {entry.comment?.raw_text ? <em>"{renderMentionedText(entry.comment.raw_text, users)}"</em> : 'Sin comentario'} - <span className="font-bold text-green-400">{entry.progress}%</span>
                        </p>
                    </div>
                ))
            ) : <p className="text-slate-500 text-sm text-center py-4">{t('unifiedPanel.noProgressHistory')}</p>;
        }
        if (modalType === 'audit') {
            const combined = [
                ...(ticket.auditoria || []).map(a => ({...a, type: 'audit' as const, date: new Date(a.cuando)})),
                ...(ticket.comentarios || []).map(c => ({...c, type: 'comment' as const, date: new Date(c.cuando)}))
            ].sort((a,b) => b.date.getTime() - a.date.getTime());

            return combined.length > 0 ? (
                combined.map((item, index) => {
                     if (item.type === 'audit') {
                        const auditItem = item;
                        return (
                             <div key={`audit-${index}`} className="py-2 relative pl-6">
                                <div className={`absolute top-3 left-0 h-4 w-4 rounded-full bg-slate-600 flex items-center justify-center`}>
                                   <InformationCircleIcon className="h-3 w-3 text-slate-300"/>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>{auditItem.evento} por <strong>{auditItem.por}</strong></span>
                                    <span>{formatDateTime(auditItem.cuando)}</span>
                                </div>
                                <p className="text-sm text-slate-300 mt-1">{auditItem.detalle}</p>
                            </div>
                        )
                    } else if (item.type === 'comment') {
                        const commentItem = item;
                        return <CommentItem key={commentItem.id} comment={commentItem} users={users} addToast={addToast} variant="timeline"/>
                    }
                    return null;
                })
            ) : <p className="text-slate-500 text-sm text-center py-4">No hay historial de auditoría o comentarios.</p>;
        }
        return null;
    }

    return (
        <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative bg-[#121A2B] rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between p-4 border-b border-[#22304A]">
                    <h2 className="text-lg font-bold text-slate-100">{titleMap[modalType]}</h2>
                    <button onClick={onClose} title={t('tooltips.closeModal') || ''} className="p-1 rounded-full hover:bg-slate-700"><XMarkIcon className="w-6 h-6 text-slate-400" /></button>
                </div>
                <div className="p-4 overflow-y-auto flex-grow space-y-2 divide-y divide-slate-700/50">
                    {renderContent()}
                </div>
                <div className="p-3 bg-[#0F1626] border-t border-[#22304A] rounded-b-xl flex justify-end gap-3">
                    <button onClick={handleCopy} title={t('tooltips.copyHistory') || ''} className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-1 rounded-md bg-slate-700 hover:bg-slate-600">{copyStatus ? t('pqrDetail.modal.copied') : t('pqrDetail.modal.copy')}</button>
                    <button onClick={handleDownload} title={t('tooltips.downloadHistory') || ''} className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-1 rounded-md bg-slate-700 hover:bg-slate-600">{t('pqrDetail.modal.download')}</button>
                </div>
            </div>
        </div>
    );
};


// Main Component
const PQRSDetailView: React.FC<PQRSDetailViewProps> = (props) => {
  const { ticket, onChecklistChange, onUpdateProgress, onAddAttachment, onAdvanceState, onGenerateAIQuestions, onAnswerAIQuestion, onAddComment, users, addToast } = props;
  const { t } = useTranslation('common');
  const [modalHistoryType, setModalHistoryType] = useState<'attachments' | 'progress' | 'audit' | null>(null);

  const checklistItemsForState = checklistConfig[ticket.estado] || [];
  const checklistTitle = t('pqrDetail.checklistForState', { state: t(`enums.status.${ticket.estado}`) });
  
  const renderableChecklistItems = checklistItemsForState.map(itemConfig => ({
      id: itemConfig.id,
      label: t(itemConfig.i18nKey),
      checked: ticket.checklist?.[itemConfig.id]?.checked || false,
  }));
  
  const isTicketActive = ![Estado.ReleasedClosed, Estado.NotApplicable].includes(ticket.estado) && !ticket.archivado;
  
  const usersInProject = useMemo(() => {
    return users.filter(u => u.projects.includes(ticket.project_key));
  }, [users, ticket.project_key]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
        <PQRDetailHeader {...props} />
      
        {isTicketActive && (
            <UnifiedProgressPanel
              ticket={ticket}
              users={props.users}
              usersInProject={usersInProject}
              checklistTitle={checklistTitle}
              checklistItems={renderableChecklistItems}
              onUpdateProgress={onUpdateProgress}
              onChecklistChange={(itemId, isChecked) => onChecklistChange(ticket.id, itemId, isChecked)}
              onAddChecklistAttachment={(file) => onAddAttachment(ticket.id, file, ticket.estado)}
              onAdvanceState={onAdvanceState}
              onGenerateAIQuestions={onGenerateAIQuestions}
              onAnswerAIQuestion={onAnswerAIQuestion}
            />
        )}
        
        {isTicketActive && (
            <CommentSection 
                comments={ticket.comentarios || []}
                onAddComment={onAddComment}
                usersInProject={usersInProject}
                addToast={addToast}
            />
        )}

        <HistoryButtons ticket={ticket} onOpenModal={setModalHistoryType} />

      {modalHistoryType && (
        <HistoryModal 
          modalType={modalHistoryType} 
          ticket={ticket} 
          users={users}
          onClose={() => setModalHistoryType(null)} 
          addToast={addToast}
        />
      )}
    </div>
  );
};

export default PQRSDetailView;