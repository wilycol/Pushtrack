import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon } from './icons';

interface ReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  title: string;
}

const ReasonModal: React.FC<ReasonModalProps> = ({ isOpen, onClose, onSubmit, title }) => {
  const { t } = useTranslation('common');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onSubmit(reason);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-[#121A2B] rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-[#22304A]">
          <h2 className="text-lg font-bold text-slate-100">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700">
            <XMarkIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <label htmlFor="reason" className="block text-sm font-medium text-slate-300 mb-2">
              {t('workflow.reason.label')}
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full bg-[#0F1626] border-[#22304A] rounded-md shadow-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={t('workflow.reason.placeholder') || ''}
              autoFocus
            />
          </div>
          <div className="p-4 bg-[#0F1626] border-t border-[#22304A] rounded-b-xl flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-md bg-transparent px-3 py-2 text-sm font-semibold text-slate-200 ring-1 ring-inset ring-slate-700 hover:bg-slate-800">
              {t('modals.cancel')}
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {t('modals.confirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReasonModal;