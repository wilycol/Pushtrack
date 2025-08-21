import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ToastType } from "../types";
import ApiKeyModal from './ApiKeyModal'; // Import the new modal

const KEY = "ai.provider";
const OPENAI_KEY_NAME = 'OPENAI_API_KEY';

const providers = [
  { value: "gemini", label: "Gemini" },
  { value: "openai", label: "ChatGPT" },
];

interface AISelectorProps {
  addToast: (message: string, type?: ToastType) => void;
}

export function AISelector({ addToast }: AISelectorProps) {
  const { t } = useTranslation("common");
  const [selectedValue, setSelectedValue] = useState<string>(() => localStorage.getItem(KEY) || "gemini");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getProviderLabel = (value: string) => providers.find(p => p.value === value)?.label || "Gemini";

  const setProviderInStorage = (newProvider: string) => {
      localStorage.setItem(KEY, newProvider);
      window.dispatchEvent(new Event('storage')); // Notify other components/tabs
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value;
    
    // Optimistically update visual state
    setSelectedValue(newProvider);

    if (newProvider === 'openai') {
        if (!localStorage.getItem(OPENAI_KEY_NAME)) {
            setIsModalOpen(true);
        } else {
            setProviderInStorage('openai');
        }
    } else {
        setProviderInStorage('gemini');
    }
  };

  const handleSaveKey = (apiKey: string) => {
      localStorage.setItem(OPENAI_KEY_NAME, apiKey);
      setProviderInStorage('openai');
      setIsModalOpen(false);
      addToast(t('modals.apiKey.success', { provider: 'OpenAI' }), 'success');
  };

  const handleCloseModal = () => {
      // User cancelled, revert to the previous stable provider.
      // This will trigger the storage listener and update the state.
      setProviderInStorage(localStorage.getItem(KEY) || 'gemini');
      setIsModalOpen(false);
  };
  
  // Listen for changes from failover logic or other tabs to keep state consistent.
  const handleStorageChange = useCallback(() => {
    const currentProvider = localStorage.getItem(KEY) || 'gemini';
    if (selectedValue !== currentProvider) {
        setSelectedValue(currentProvider);
    }
  }, [selectedValue]);

  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleStorageChange]);


  return (
    <>
      <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white backdrop-blur-sm">
        <span className="font-semibold">AI:</span>
        <select
          value={selectedValue}
          onChange={handleProviderChange}
          className="appearance-none cursor-pointer rounded-md border-none bg-transparent font-medium text-indigo-400 focus:ring-0 p-0 pr-4"
          aria-label="Select AI Provider"
          style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23818cf8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0 center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.25em 1.25em',
          }}
        >
          {providers.map(p => <option key={p.value} value={p.value} className="bg-slate-800 text-white">{p.label}</option>)}
        </select>
        <span className="text-slate-400">| Powered by {getProviderLabel(selectedValue)}</span>
      </div>
      {isModalOpen && (
          <ApiKeyModal
            providerName="OpenAI"
            onSave={handleSaveKey}
            onClose={handleCloseModal}
          />
      )}
    </>
  );
}

export default AISelector;