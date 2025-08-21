import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AdjuntoItem } from '../types';
import { TrashIcon, ArrowUpTrayIcon, PaperClipIcon } from './icons';

interface AttachmentManagerProps {
    attachments?: AdjuntoItem[];
    onAddAttachment: (file: File) => void;
    onDeleteAttachment?: (url: string) => void;
    variant?: 'full' | 'dropzone';
}

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const AttachmentManager: React.FC<AttachmentManagerProps> = ({ attachments = [], onAddAttachment, onDeleteAttachment, variant = 'full' }) => {
    const { t } = useTranslation('common');
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragIn = useCallback((e: React.DragEvent) => {
        handleDrag(e);
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragOver(true);
        }
    }, [handleDrag]);
    
    const handleDragOut = useCallback((e: React.DragEvent) => {
        handleDrag(e);
        setIsDragOver(false);
    }, [handleDrag]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        handleDrag(e);
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            files.forEach(file => onAddAttachment(file));
            e.dataTransfer.clearData();
        }
    }, [handleDrag, onAddAttachment]);
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach(file => onAddAttachment(file));
        }
        // Reset input to allow selecting the same file again
        e.target.value = '';
    };

    const handleDropzoneClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div>
            <div 
                onClick={handleDropzoneClick}
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDragIn}
                onDrop={handleDrop}
                title={t('tooltips.uploadAttachment') || ''}
                className={`relative block w-full rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer
                    ${isDragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-[#22304A] hover:border-slate-500'}`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.doc,.docx,.md,.py,.js,.obj,.fbx"
                    className="hidden"
                    onChange={handleFileSelect}
                />
                <div className="flex flex-col items-center">
                    <ArrowUpTrayIcon className="mx-auto h-10 w-10 text-slate-400" />
                    <span className="mt-2 block text-sm font-semibold text-slate-200">
                        {t('modals.pqrForm.dropzone')}
                    </span>
                    <span className="block text-xs text-slate-500">{t('modals.pqrForm.dropzoneHint')}</span>
                </div>
            </div>

            {variant === 'full' && attachments.length > 0 && (
                <div className="mt-4 space-y-3">
                    {attachments.map((file) => (
                        <div key={file.url} className="flex items-center justify-between rounded-md bg-[#0F1626] border border-[#22304A] p-3">
                            <div className="flex min-w-0 items-center">
                                <PaperClipIcon className="h-5 w-5 flex-shrink-0 text-slate-400" aria-hidden="true" />
                                <div className="ml-3 min-w-0 flex-1">
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="truncate text-sm font-medium text-indigo-400 hover:text-indigo-300">
                                        {file.nombre}
                                    </a>
                                    <p className="text-xs text-slate-500">{formatFileSize(file.tamano)}</p>
                                </div>
                            </div>
                            <div className="ml-4 flex-shrink-0">
                                {onDeleteAttachment && (
                                    <button
                                        onClick={() => onDeleteAttachment(file.url)}
                                        className="p-1 rounded-full text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                        title={t('tooltips.deleteAttachment') || ''}
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AttachmentManager;