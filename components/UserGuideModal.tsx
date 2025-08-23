import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, QuestionMarkCircleIcon } from './icons';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [guideContent, setGuideContent] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Cargar el contenido de la guía de usuario
      fetch('/docs/user-guides/USER-GUIDE-complete-manual.html')
        .then(response => response.text())
        .then(html => {
          // Extraer solo el contenido del body
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const bodyContent = doc.body.innerHTML;
          setGuideContent(bodyContent);
        })
        .catch(error => {
          console.error('Error loading user guide:', error);
          setGuideContent(`
            <div style="padding: 2rem; text-align: center;">
              <h2>📚 Guía de Usuario Pushtrack</h2>
              <p>La guía de usuario no está disponible en este momento.</p>
              <p>Por favor, contacta al administrador del sistema.</p>
            </div>
          `);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-[#0f172a] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-7xl sm:w-full">
          {/* Header */}
          <div className="bg-[#1e293b] px-6 py-4 border-b border-gray-700 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <QuestionMarkCircleIcon className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">
                {t('userGuide.title', 'Guía de Usuario')}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[80vh] overflow-y-auto">
            <div 
              dangerouslySetInnerHTML={{ __html: guideContent }}
              className="user-guide-content"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuideModal;
