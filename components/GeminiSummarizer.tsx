import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { summarizeText, FAILOVER_KEY_MISSING } from '../services/geminiService';
import { SparklesIcon } from './icons';
import { PushtrackTask } from '../types';

interface GeminiSummarizerProps {
  ticket: PushtrackTask | null;
}

const GeminiSummarizer: React.FC<GeminiSummarizerProps> = ({ ticket }) => {
  const { t } = useTranslation('common');
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const ticketId = ticket?.id;
  const ticketDescription = ticket?.descripcion;

  const fetchSummary = useCallback(async () => {
    if (!ticketDescription) {
      setSummary(t('gemini.noDescription'));
      return;
    }
    setIsLoading(true);
    setError('');
    setSummary('');

    try {
      const result = await summarizeText(ticketDescription);
      setSummary(result);
    } catch (e: any) {
      if (e.message === FAILOVER_KEY_MISSING) {
        setError(t('gemini.failoverGuidance'));
      } else {
        setError(t('gemini.error'));
        console.error(e);
      }
    } finally {
      setIsLoading(false);
    }
  }, [ticketDescription, t]);

  useEffect(() => {
    if (ticketId) {
      fetchSummary();
    } else {
      setSummary('');
      setError('');
      setIsLoading(false);
    }
  }, [ticketId, fetchSummary]);


  return (
    <div className="bg-[#0F1626] border border-[#22304A] rounded-xl shadow-lg shadow-black/20 h-full flex flex-col">
       <div className="p-4 border-b border-[#22304A]">
          <h2 className="text-lg font-bold text-slate-100 flex items-center">
            <SparklesIcon className="w-5 h-5 mr-2 text-indigo-400" />
            {t('gemini.analysisTitle')}
          </h2>
      </div>
      <div className="flex-grow p-4 min-h-[100px] text-sm text-slate-300 relative overflow-y-auto">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0F1626]/70 backdrop-blur-sm">
            <div className="flex items-center space-x-2 text-slate-400">
                <svg className="animate-spin h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{t('gemini.analyzing')}</span>
            </div>
          </div>
        )}
        {!ticket && !isLoading && (
            <div className="text-center text-slate-500 h-full flex flex-col justify-center items-center">
                <p>{t('dashboard.noTicketSelected')}</p>
            </div>
        )}
        {error && <p className="text-amber-400 text-center">{error}</p>}
        {ticket && summary && <p className="leading-relaxed">{summary}</p>}
      </div>
       <div className="p-3 border-t border-[#22304A]">
        <button 
          onClick={fetchSummary}
          disabled={isLoading || !ticket?.descripcion}
          title={t('tooltips.regenerateSummary') || ''}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? t('gemini.generating') : t('gemini.regenerate')}
        </button>
       </div>
    </div>
  );
};

export default GeminiSummarizer;