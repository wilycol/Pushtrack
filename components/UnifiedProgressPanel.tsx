import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PushtrackTask, User, Mention } from '../types';
import Checklist from './Checklist';
import AIQuestions from './AIQuestions';
import { SparklesIcon, ChatBubbleBottomCenterTextIcon, PencilIcon } from './icons';
import MentionTextarea from './MentionTextarea';

interface RenderableChecklistItem {
    id: string;
    label: string;
    checked: boolean;
}

interface UnifiedProgressPanelProps {
    ticket: PushtrackTask;
    users: User[];
    usersInProject: User[];
    checklistTitle: string;
    checklistItems: RenderableChecklistItem[];
    onUpdateProgress: (progress: number, commentData: { raw_text: string, mentions: Mention[] }) => void;
    onChecklistChange: (itemId: string, isChecked: boolean) => void;
    onAddChecklistAttachment: (file: File) => void;
    onAdvanceState: () => void;
    onGenerateAIQuestions: () => void;
    onAnswerAIQuestion: (questionId: string, answerData: { raw_text: string, mentions: Mention[] }) => void;
}

const UnifiedProgressPanel: React.FC<UnifiedProgressPanelProps> = (props) => {
    const { 
        ticket, users, usersInProject, checklistTitle, checklistItems, onUpdateProgress, onChecklistChange, onAddChecklistAttachment,
        onAdvanceState, onGenerateAIQuestions, onAnswerAIQuestion
    } = props;
    
    const { t } = useTranslation('common');
    const [manualProgress, setManualProgress] = useState(ticket.progress || 0);
    const [commentData, setCommentData] = useState<{ raw_text: string; mentions: Mention[] }>({ raw_text: '', mentions: [] });
    const commentRef = useRef<HTMLDivElement>(null);
    const checklistRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        setManualProgress(ticket.progress || 0);
    }, [ticket.progress]);

    const handleLogProgress = () => {
        onUpdateProgress(manualProgress, commentData);
        setCommentData({ raw_text: '', mentions: [] });
    };

    const isChecklistComplete = checklistItems.every(item => item.checked);
    const areCriticalQuestionsAnswered = (ticket.ai_questions || []).filter(q => q.is_critical).every(q => q.answer);
    const canAdvanceState = manualProgress === 100 && isChecklistComplete && areCriticalQuestionsAnswered;

    const getProgressBarColor = (p: number): string => {
        if (p < 40) return 'bg-red-500';
        if (p < 80) return 'bg-amber-500';
        return 'bg-green-500';
    };

    const handleActionClick = (ref: React.RefObject<HTMLElement>) => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if(ref === commentRef) {
            ref.current?.querySelector<HTMLElement>('[contenteditable="true"]')?.focus();
        }
    };

    const checklistProgress = useMemo(() => {
        if (checklistItems.length === 0) return 100;
        const completed = checklistItems.filter(item => item.checked).length;
        return (completed / checklistItems.length) * 100;
    }, [checklistItems]);


    return (
        <div className="bg-[#121A2B] border border-[#22304A] rounded-lg">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b border-[#22304A]">
                 <h2 className="text-lg font-bold text-slate-100">{t('unifiedPanel.title')}</h2>
                 <div className="flex items-center gap-2">
                    <button onClick={() => handleActionClick(commentRef)} title={t('tooltips.addProgressComment') || ''} className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                        <PencilIcon className="h-5 w-5"/>
                    </button>
                    <button onClick={() => handleActionClick(checklistRef)} title={t('tooltips.updateChecklist') || ''} className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                        <ChatBubbleBottomCenterTextIcon className="h-5 w-5"/>
                    </button>
                 </div>
            </div>
            
            <div className="p-4 sm:p-6 space-y-8">
                {/* Progress Section */}
                <div>
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="text-base font-semibold text-slate-200">{t('unifiedPanel.progressTitle')}</h3>
                        <span className="text-xl font-bold text-slate-100">{manualProgress}%</span>
                     </div>
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                        <div 
                            className={`h-2.5 rounded-full transition-all duration-300 ${getProgressBarColor(manualProgress)}`}
                            style={{ width: `${manualProgress}%` }}
                        ></div>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        step="25"
                        value={manualProgress}
                        onChange={(e) => setManualProgress(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-transparent appearance-none cursor-pointer mt-4 range-thumb:bg-indigo-500"
                    />

                    <div className="mt-4" ref={commentRef}>
                        <MentionTextarea
                            users={usersInProject}
                            initialValue={commentData.raw_text}
                            onSave={setCommentData}
                            placeholder={t('unifiedPanel.addCommentPlaceholder')}
                        />
                    </div>
                     <button onClick={handleLogProgress} title={t('tooltips.logProgress') || ''} className="mt-3 w-full rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400">
                        {t('unifiedPanel.logProgressBtn')}
                    </button>
                </div>

                {/* Checklist Section */}
                <div ref={checklistRef}>
                    <Checklist 
                        title={checklistTitle}
                        items={checklistItems}
                        onToggle={onChecklistChange}
                        onAddAttachment={onAddChecklistAttachment}
                    />
                </div>
                

                {/* AI Questions Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-bold text-slate-100 flex items-center">
                             <SparklesIcon className="w-5 h-5 mr-2 text-indigo-400" />
                            {t('unifiedPanel.aiQuestionsTitle')}
                        </h3>
                        <button onClick={onGenerateAIQuestions} title={t('tooltips.generateAIQuestions') || ''} className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">
                            {t('unifiedPanel.generateAIBtn')}
                        </button>
                    </div>
                    {(ticket.ai_questions && ticket.ai_questions.length > 0) ? (
                        <AIQuestions 
                            questions={ticket.ai_questions} 
                            onAnswer={onAnswerAIQuestion}
                            usersInProject={usersInProject}
                        />
                    ) : (
                        <div className="text-center py-6 border-2 border-dashed border-slate-700 rounded-lg">
                            <p className="text-sm text-slate-500">{t('unifiedPanel.noAIQuestions')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Action */}
            <div className="p-4 bg-[#0F1626]/50 border-t border-[#22304A] rounded-b-lg">
                <button 
                    onClick={onAdvanceState}
                    disabled={!canAdvanceState}
                    title={t('tooltips.advanceState') || ''}
                    className="w-full rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:text-slate-400 transition-colors"
                >
                    {t('unifiedPanel.advanceStateBtn')}
                </button>
            </div>
        </div>
    );
};

export default UnifiedProgressPanel;