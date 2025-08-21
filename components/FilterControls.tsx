import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FilterState, TaskType, Prioridad, Estado, Project } from '../types';

interface FilterControlsProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onExportCSV?: () => void;
  onImportCSV?: (file: File) => void;
  projects: Project[];
  onOpenNewPQRForm?: () => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({ filters, onFilterChange, onExportCSV, onImportCSV, projects, onOpenNewPQRForm }) => {
  const { t } = useTranslation('common');
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    onFilterChange({ [e.target.name]: e.target.value });
  };
  
  const handleImportClick = () => {
    importInputRef.current?.click();
  };
  
  const handleCriticalToggle = () => {
    onFilterChange({ criticalSLA: !filters.criticalSLA });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onImportCSV) {
        onImportCSV(file);
        e.target.value = ''; // Reset for re-uploading the same file
      }
  };

  const FilterSelect: React.FC<{
    name: keyof FilterState;
    value: string;
    options: { value: string; label: string }[];
  }> = ({ name, value, options }) => (
    <select
      name={name}
      value={value}
      onChange={handleInputChange}
      className="w-full sm:w-auto bg-[#121A2B] border border-[#22304A] rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-200"
    >
      {options.map(opt => <option key={opt.value} value={opt.value} className="bg-[#121A2B] text-slate-200">{opt.label}</option>)}
    </select>
  );

  return (
    <div className="bg-[#0F1626] p-4 rounded-xl shadow-lg shadow-black/20 space-y-4">
       <div className="flex flex-col md:flex-row gap-4 items-center">
         <div className="w-full md:flex-grow">
           <input
             type="text"
             name="search"
             placeholder={t('dashboard.filter.searchPlaceholder') || ''}
             value={filters.search}
             onChange={handleInputChange}
             className="w-full bg-[#121A2B] border-[#22304A] rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-200 placeholder:text-slate-500"
           />
         </div>
         <div className="flex items-center gap-2">
            <button
                onClick={handleCriticalToggle}
                title={t('tooltips.criticalFilter') || ''}
                className={`text-sm font-semibold px-3 py-2 rounded-md transition-colors ${
                    filters.criticalSLA
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
            >
                {t('dashboard.filter.critical')}
            </button>
            {onImportCSV && (
              <>
                <input type="file" ref={importInputRef} onChange={handleFileSelect} className="hidden" accept=".csv" />
                <button onClick={handleImportClick} title={t('tooltips.importCSV') || ''} className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600">{t('dashboard.filter.import')}</button>
              </>
            )}
            {onExportCSV && <button onClick={onExportCSV} title={t('tooltips.exportCSV') || ''} className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600">{t('dashboard.filter.export')}</button>}
            {onOpenNewPQRForm && (
              <button
                onClick={onOpenNewPQRForm}
                title={t('tooltips.newTask') || ''}
                className="inline-flex items-center gap-x-2 rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-colors"
              >
                {t('dashboard.filter.newTask')}
              </button>
            )}
         </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
          <FilterSelect
            name="archivado"
            value={filters.archivado}
            options={[
                { value: 'false', label: t('dashboard.filter.active') },
                { value: 'true', label: t('dashboard.filter.archived') },
                { value: 'all', label: t('dashboard.filter.allArchived') },
            ]}
          />
          <FilterSelect
            name="project_key"
            value={filters.project_key}
            options={[
              { value: 'all', label: t('dashboard.filter.allProjects') },
              ...projects.map(p => ({ value: p.project_key, label: p.name })),
            ]}
          />
          <FilterSelect
            name="task_type"
            value={filters.task_type}
            options={[
              { value: 'all', label: t('dashboard.filter.allTypes') },
              ...Object.values(TaskType).map(tt => ({ value: tt, label: t(`taskTypes.${tt}`) })),
            ]}
          />
          <FilterSelect
            name="prioridad"
            value={filters.prioridad}
            options={[
              { value: 'all', label: t('dashboard.filter.allPriorities') },
              ...Object.values(Prioridad).map(p => ({ value: p, label: t(`enums.priority.${p}`) })),
            ]}
          />
          <FilterSelect
            name="estado"
            value={filters.estado}
            options={[
              { value: 'all', label: t('dashboard.filter.allStates') },
              ...Object.values(Estado).map(e => ({ value: e, label: t(`enums.status.${e}`) })),
            ]}
          />
        </div>
    </div>
  );
};

export default FilterControls;