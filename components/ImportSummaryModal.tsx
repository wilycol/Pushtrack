import React from 'react';
import { useTranslation } from 'react-i18next';
import { ImportResults } from '../types';
import { XMarkIcon } from './icons';

interface ImportSummaryModalProps {
  results: ImportResults;
  onClose: () => void;
}

const ImportSummaryModal: React.FC<ImportSummaryModalProps> = ({ results, onClose }) => {
  const { t } = useTranslation('common');
  const hasErrors = results.errors.length > 0;

  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-[#121A2B] rounded-xl shadow-2xl shadow-black/30 w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-[#22304A]">
          <h2 className="text-xl font-bold text-slate-100">{t('modals.importSummary.title')}</h2>
          <button onClick={onClose} title={t('tooltips.closeModal') || ''} className="p-1 rounded-full hover:bg-slate-700 transition-colors">
            <XMarkIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>
        <div className="p-6">
          <div className="flex items-center p-4 mb-4 text-sm text-blue-300 bg-blue-500/20 rounded-lg" role="alert">
            <svg className="flex-shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z"/>
            </svg>
            <span className="sr-only">Info</span>
            <div>
              <span className="font-medium">{t('modals.importSummary.completed')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 text-center">
            <div className="bg-[#0F1626] p-4 rounded-lg">
              <p className="text-3xl font-bold text-green-400">{results.created}</p>
              <p className="text-sm text-slate-400">{t('modals.importSummary.created')}</p>
            </div>
          </div>
          
          {hasErrors && (
            <div className="mt-6">
              <h3 className="font-semibold text-red-400 mb-2">{t('modals.importSummary.errorsFound', { count: results.errors.length })}</h3>
              <div className="bg-[#0F1626] border border-red-500/30 rounded-lg max-h-40 overflow-y-auto p-3">
                <ul className="divide-y divide-slate-700">
                  {results.errors.map((err, index) => (
                    <li key={index} className="py-2 text-sm">
                      <span className="font-mono text-slate-500 mr-2">{t('modals.importSummary.line', { line: err.line })}</span>
                      <span className="text-red-400">{err.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-[#0F1626] border-t border-[#22304A] rounded-b-xl text-right">
           <button onClick={onClose} title={t('tooltips.closeModal') || ''} className="rounded-md bg-indigo-500 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400">
            {t('modals.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportSummaryModal;