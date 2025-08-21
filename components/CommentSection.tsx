import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Comentario, User, ToastType } from '../types';
import { PaperAirplaneIcon } from './icons';
import MentionTextarea from './MentionTextarea';
import CommentItem from './CommentItem';

interface CommentSectionProps {
    comments: Comentario[];
    onAddComment: (data: { raw_text: string; mentions: { email: string; full_name: string }[] }) => void;
    usersInProject: User[];
    addToast: (message: string, type?: ToastType) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ comments, onAddComment, usersInProject, addToast }) => {
    const { t } = useTranslation('common');
    const [commentData, setCommentData] = useState<{ raw_text: string; mentions: { email: string; full_name: string }[] }>({ raw_text: '', mentions: [] });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (commentData.raw_text.trim()) {
            onAddComment(commentData);
            setCommentData({ raw_text: '', mentions: [] });
        }
    };

    return (
        <div className="bg-[#0F1626] border border-[#22304A] rounded-lg p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">{t('pqrDetail.comments')}</h2>
            
            {/* Comment List */}
            <div className="space-y-4 max-h-72 overflow-y-auto pr-2 mb-4">
                {comments.length > 0 ? (
                    [...comments].sort((a, b) => new Date(b.cuando).getTime() - new Date(a.cuando).getTime()).map(comment => (
                        <CommentItem 
                            key={comment.id}
                            comment={comment}
                            users={usersInProject}
                            addToast={addToast}
                        />
                    ))
                ) : (
                    <p className="text-center text-sm text-slate-500 py-4">{t('pqrDetail.noComments')}</p>
                )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSubmit} className="mt-4 flex items-start space-x-3">
                <div className="flex-shrink-0">
                     <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{t('pqrDetail.you')}</span>
                    </div>
                </div>
                <div className="min-w-0 flex-1">
                     <MentionTextarea
                        users={usersInProject}
                        initialValue={commentData.raw_text}
                        onSave={(data) => setCommentData(data)}
                        placeholder={t('pqrDetail.addCommentPlaceholder')}
                     />
                </div>
                 <button
                    type="submit"
                    className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors disabled:opacity-50"
                    disabled={!commentData.raw_text.trim()}
                    title={t('tooltips.sendComment') || ''}
                >
                    <PaperAirplaneIcon className="h-5 w-5" aria-hidden="true" />
                </button>
            </form>
        </div>
    );
};

export default CommentSection;