import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon } from './icons';

interface ApiKeyModalProps {
  providerName: string;
  onSave: (apiKey: string) => void;
  onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ providerName, onSave, onClose }) => {
  const { t } = useTranslation('common');
  const [apiKey, setApiKey] = useState('');

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-[#121A2B] rounded-xl shadow-2xl shadow-black/30 w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-[#22304A]">
          <h2 className="text-xl font-bold text-slate-100">{t('modals.apiKey.title', { provider: providerName })}</h2>
          <button onClick={onClose} title={t('tooltips.closeModal') || ''} className="p-1 rounded-full hover:bg-slate-700 transition-colors">
            <XMarkIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-400">{t('modals.apiKey.description', { provider: providerName })}</p>
          <div>
            <label htmlFor="api-key-input" className="block text-sm font-medium text-slate-300">{t('modals.apiKey.label')}</label>
            <input
              id="api-key-input"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t('modals.apiKey.placeholder') || ''}
              className="mt-1 block w-full rounded-md shadow-sm sm:text-sm bg-[#0F1626] text-slate-200 border-[#22304A] focus:border-indigo-500 focus:ring-indigo-500"
              autoFocus
            />
          </div>
        </div>
        <div className="flex justify-end items-center gap-3 p-4 bg-[#0F1626] border-t border-[#22304A] rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            title={t('tooltips.cancel') || ''}
            className="rounded-md bg-transparent px-3.5 py-2 text-sm font-semibold text-slate-200 shadow-sm ring-1 ring-inset ring-slate-700 hover:bg-slate-800"
          >
            {t('modals.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!apiKey.trim()}
            title={t('tooltips.saveChanges') || ''}
            className="rounded-md bg-indigo-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('modals.saveChanges')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
