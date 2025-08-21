import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';
import { GlobeAltIcon } from './icons';

interface LanguageSelectorProps {
    onLanguageChange: (lang: Language) => void;
}

const languages: { code: Language, name: string }[] = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' }
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onLanguageChange }) => {
    const { i18n, t } = useTranslation('common');
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (lang: Language) => {
        onLanguageChange(lang);
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left">
            <div>
                <button
                    type="button"
                    className="inline-flex justify-center items-center w-full rounded-md px-2 py-2 bg-transparent text-sm font-medium text-slate-400 hover:text-slate-100 focus:outline-none"
                    onClick={() => setIsOpen(!isOpen)}
                    title={t('tooltips.toggleLanguage') || ''}
                >
                    <GlobeAltIcon className="h-6 w-6" />
                    <span className="uppercase font-bold mx-2">{i18n.language}</span>
                </button>
            </div>
            {isOpen && (
                <div 
                    onMouseLeave={() => setIsOpen(false)}
                    className="origin-top-right rtl:origin-top-left absolute end-0 mt-2 w-40 rounded-md shadow-lg bg-[#1B2437] ring-1 ring-black ring-opacity-5 focus:outline-none z-30">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        {languages.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => handleSelect(lang.code)}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${i18n.language === lang.code ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-200 hover:bg-slate-600'}`}
                                role="menuitem"
                            >
                                {lang.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;