import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QuestionMarkCircleIcon } from './icons';
import UserGuideModal from './UserGuideModal';

const HelpButton: React.FC = () => {
  const { t } = useTranslation();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const openGuide = () => {
    setIsGuideOpen(true);
  };

  const closeGuide = () => {
    setIsGuideOpen(false);
  };

  return (
    <>
      <button
        onClick={openGuide}
        className="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors duration-200"
        title={t('help.openGuide', 'Abrir Guía de Usuario')}
      >
        <QuestionMarkCircleIcon className="w-5 h-5 mr-2" />
        {t('help.guide', 'Ayuda')}
      </button>

      <UserGuideModal 
        isOpen={isGuideOpen} 
        onClose={closeGuide} 
      />
    </>
  );
};

export default HelpButton;
