import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Comentario, User, ToastType } from '../types';
import { formatDateTime, renderMentionedText } from '../utils/helpers';
import { translateText } from '../services/geminiService';
import { GlobeAltIcon, ChatBubbleBottomCenterTextIcon } from './icons';

interface CommentItemProps {
    comment: Comentario;
    users: User[];
    addToast: (message: string, type?: ToastType) => void;
    variant?: 'default' | 'timeline';
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, users, addToast, variant = 'default' }) => {
    const { t, i18n } = useTranslation('common');
    const [translatedText, setTranslatedText] = useState<string | null>(null);
    const [showOriginal, setShowOriginal] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);

    const currentLang = i18n.language;
    const canTranslate = currentLang !== 'es' && !translatedText;

    const handleTranslate = async () => {
        setIsTranslating(true);
        try {
            const translation = await translateText(comment.raw_text, currentLang);
            setTranslatedText(translation);
            setShowOriginal(false);
        } catch (error) {
            console.error("Translation failed:", error);
            addToast(t('tooltips.translationError'), 'error');
        } finally {
            setIsTranslating(false);
        }
    };

    const textToShow = showOriginal ? comment.raw_text : (translatedText || comment.raw_text);

    if (variant === 'timeline') {
        return (
             <div className="py-2 relative pl-6">
                <div className="absolute top-3 left-0 h-4 w-4 rounded-full bg-slate-600 flex items-center justify-center">
                   <ChatBubbleBottomCenterTextIcon className="h-3 w-3 text-slate-300"/>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>Comentario de <strong>{comment.por}</strong></span>
                     <div className="flex items-center gap-2">
                        {canTranslate && (
                            <button onClick={handleTranslate} disabled={isTranslating} title={t('tooltips.translateComment') || ''} className="p-1 rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:animate-pulse">
                                <GlobeAltIcon className="w-4 h-4 text-slate-400"/>
                            </button>
                        )}
                        <span>{formatDateTime(comment.cuando)}</span>
                    </div>
                </div>
                <div className="text-sm text-slate-300 mt-1 italic">"{renderMentionedText(textToShow, users)}"</div>
                 {translatedText && (
                     <button onClick={() => setShowOriginal(!showOriginal)} className="text-xs text-indigo-400 hover:underline mt-1">
                        {showOriginal ? t('tooltips.showTranslation') : t('tooltips.showOriginal')}
                     </button>
                )}
            </div>
        );
    }
    
    // Default variant
    return (
        <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-300">{comment.por.substring(0, 2)}</span>
                </div>
            </div>
            <div className="flex-1 bg-slate-800/50 rounded-lg px-4 py-2">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-200">{comment.por}</p>
                    <div className="flex items-center gap-2">
                         {canTranslate && (
                            <button onClick={handleTranslate} disabled={isTranslating} title={t('tooltips.translateComment') || ''} className="p-1 rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:animate-pulse">
                                <GlobeAltIcon className="w-4 h-4 text-slate-400"/>
                            </button>
                        )}
                        <time dateTime={comment.cuando} className="text-xs text-slate-500">
                            {formatDateTime(comment.cuando)}
                        </time>
                    </div>
                </div>
                <div className="mt-1 text-sm text-slate-300 whitespace-pre-wrap">
                    {renderMentionedText(textToShow, users)}
                </div>
                {translatedText && (
                     <button onClick={() => setShowOriginal(!showOriginal)} className="text-xs text-indigo-400 hover:underline mt-1">
                        {showOriginal ? t('tooltips.showTranslation') : t('tooltips.showOriginal')}
                     </button>
                )}
            </div>
        </div>
    );
};

export default CommentItem;