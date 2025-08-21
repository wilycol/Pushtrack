import React from 'react';
import { useTranslation } from 'react-i18next';
import AttachmentManager from './AttachmentManager';

interface RenderableChecklistItem {
    id: string;
    label: string;
    checked: boolean;
}

interface ChecklistProps {
  title: string;
  items: RenderableChecklistItem[];
  onToggle: (id: string, checked: boolean) => void;
  onAddAttachment: (file: File) => void;
}

const Checklist: React.FC<ChecklistProps> = ({ title, items = [], onToggle, onAddAttachment }) => {
  const { t } = useTranslation('common');
  const completedItems = items.filter(item => item.checked).length;
  const totalItems = items.length;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="bg-[#0F1626] border border-[#22304A] rounded-lg p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4">
        <h3 className="text-base font-bold text-slate-100">{title}</h3>
        <span className="text-sm font-medium text-slate-400 mt-1 sm:mt-0">{completedItems} de {totalItems} completados</span>
      </div>
      
      <div className="w-full bg-slate-700 rounded-full h-2 mb-5">
        <div 
          className="bg-indigo-500 h-2 rounded-full transition-all duration-500 ease-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="relative flex items-start">
            <div className="flex h-6 items-center">
              <input
                id={`checklist-item-${item.id}`}
                name={`checklist-item-${item.id}`}
                type="checkbox"
                checked={item.checked}
                onChange={(e) => onToggle(item.id, e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
              />
            </div>
            <div className="ml-3 text-sm leading-6">
              <label htmlFor={`checklist-item-${item.id}`} className={`font-medium ${item.checked ? 'text-slate-500 line-through' : 'text-slate-300'} cursor-pointer`}>
                {item.label}
              </label>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-[#22304A]">
        <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('pqrDetail.attachEvidence')}</h4>
        <AttachmentManager
          onAddAttachment={onAddAttachment}
          variant="dropzone"
        />
      </div>
    </div>
  );
};

export default Checklist;
