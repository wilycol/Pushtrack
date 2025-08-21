import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExclamationTriangleIcon } from './icons';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  closeButtonText?: string;
}

const AlertModal: React.FC<AlertModalProps> = ({ isOpen, onClose, title, message, closeButtonText = 'Entendido' }) => {
  const { t } = useTranslation('common');
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" aria-labelledby="alert-modal-title" role="dialog" aria-modal="true">
      <div className="relative bg-[#121A2B] rounded-xl shadow-2xl shadow-black/30 w-full max-w-md">
        <div className="flex items-start p-4 border-b border-amber-500/30">
          <ExclamationTriangleIcon className="h-6 w-6 text-amber-400 mr-3 flex-shrink-0" />
          <div>
            <h2 id="alert-modal-title" className="text-xl font-bold text-slate-100">{title}</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{message}</p>
        </div>
        <div className="p-4 bg-[#0F1626] border-t border-[#22304A] rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            title={t('tooltips.gotIt') || ''}
            className="rounded-md bg-indigo-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            {closeButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;