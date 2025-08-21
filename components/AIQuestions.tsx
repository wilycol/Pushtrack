import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AIQuestion, User, Mention } from '../types';
import MentionTextarea from './MentionTextarea';
import { renderMentionedText } from '../utils/helpers';

interface AIQuestionsProps {
    questions: AIQuestion[];
    onAnswer: (questionId: string, answerData: { raw_text: string; mentions: Mention[] }) => void;
    usersInProject: User[];
}

const AIQuestions: React.FC<AIQuestionsProps> = ({ questions = [], onAnswer, usersInProject }) => {
    const { t } = useTranslation('common');
    const [answers, setAnswers] = useState<Record<string, { raw_text: string; mentions: Mention[] }>>({});

    const handleAnswerChange = (id: string, data: { raw_text: string; mentions: Mention[] }) => {
        setAnswers(prev => ({ ...prev, [id]: data }));
    };

    const handleSave = (id: string) => {
        if (answers[id]?.raw_text.trim()) {
            onAnswer(id, answers[id]);
            setAnswers(prev => {
                const newAnswers = { ...prev };
                delete newAnswers[id];
                return newAnswers;
            });
        }
    };

    return (
        <div className="space-y-4">
            {questions.map(q => (
                <div key={q.id} className={`p-4 rounded-lg ${q.is_critical ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-slate-700/30'}`}>
                    <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-slate-300">{q.question}</p>
                        {q.is_critical && (
                            <span className="ml-2 flex-shrink-0 text-xs font-bold text-amber-400 uppercase">{t('unifiedPanel.criticalQuestion')}</span>
                        )}
                    </div>
                    {q.answer ? (
                        <div className="mt-2 text-sm text-slate-200 bg-slate-800/50 p-2 rounded-md whitespace-pre-wrap italic">"{renderMentionedText(q.answer.raw_text, usersInProject)}"</div>
                    ) : (
                        <div className="mt-2 flex items-center gap-2">
                             <div className="flex-grow">
                                <MentionTextarea
                                    users={usersInProject}
                                    initialValue={answers[q.id]?.raw_text || ''}
                                    onSave={(data) => handleAnswerChange(q.id, data)}
                                    placeholder={t('unifiedPanel.answerPlaceholder')}
                                />
                            </div>
                            <button
                                onClick={() => handleSave(q.id)}
                                disabled={!answers[q.id]?.raw_text.trim()}
                                title={t('tooltips.saveAnswer') || ''}
                                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed self-start"
                            >
                                {t('unifiedPanel.saveAnswerBtn')}
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default AIQuestions;