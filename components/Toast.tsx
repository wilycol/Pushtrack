import React, { useEffect, useState } from 'react';
import { ToastMessage, ToastType } from '../types';
import { InformationCircleIcon, XMarkIcon } from './icons';

interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const toastStyles: Record<ToastType, { bg: string; iconColor: string }> = {
  info: { bg: 'bg-slate-800', iconColor: 'text-blue-400' },
  success: { bg: 'bg-green-800', iconColor: 'text-green-400' },
  error: { bg: 'bg-red-800', iconColor: 'text-red-400' },
};

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isExiting, setIsExiting] = useState(false);
  const styles = toastStyles[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };
  
  const animationClasses = isExiting
    ? 'animate-toast-out'
    : 'animate-toast-in';


  return (
    <div
      className={`max-w-sm w-full ${styles.bg} shadow-lg rounded-xl pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border border-white/10 ${animationClasses}`}
    >
      <div className="p-3">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <InformationCircleIcon className={`h-6 w-6 ${styles.iconColor}`} aria-hidden="true" />
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-slate-100">{toast.message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex rounded-md text-slate-400 hover:text-slate-200 focus:outline-none"
              onClick={handleDismiss}
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
