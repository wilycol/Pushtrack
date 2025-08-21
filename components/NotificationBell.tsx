import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { HistoryEvent } from '../types';
import { BellIcon } from './icons';
import { formatDateTime } from '../utils/helpers';

interface NotificationBellProps {
    history: HistoryEvent[];
    onMarkAllRead: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ history, onMarkAllRead }) => {
    const { t } = useTranslation('common');
    const [isOpen, setIsOpen] = useState(false);

    const unreadCount = useMemo(() => history.filter(event => !event.isRead).length, [history]);
    const recentHistory = useMemo(() => history.slice(0, 7), [history]);

    const handleToggle = () => {
        setIsOpen(prev => !prev);
        if (!isOpen) { // If opening
            onMarkAllRead();
        }
    };

    const handleItemClick = (ticketId: string) => {
        window.location.hash = `#/dashboard?ticketId=${ticketId}`;
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={handleToggle}
                className="p-2 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 focus:outline-none"
                title={t('tooltips.notifications') || ''}
            >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center">{unreadCount}</span>
                    </span>
                )}
            </button>
            {isOpen && (
                <div
                    onMouseLeave={() => setIsOpen(false)}
                    className="origin-top-right rtl:origin-top-left absolute end-0 mt-2 w-80 rounded-xl shadow-lg bg-[#1B2437] ring-1 ring-black ring-opacity-5 focus:outline-none z-30"
                >
                    <div className="p-3 border-b border-slate-700">
                        <h3 className="text-sm font-semibold text-slate-100">{t('notifications.title')}</h3>
                    </div>
                    <div className="py-1 max-h-96 overflow-y-auto">
                        {recentHistory.length > 0 ? recentHistory.map(event => (
                            <button
                                key={event.id}
                                onClick={() => handleItemClick(event.ticketId)}
                                className="w-full text-left block px-4 py-3 text-sm transition-colors hover:bg-slate-600"
                            >
                                <p className="text-slate-300 font-medium truncate">{event.text}</p>
                                <p className="text-xs text-slate-500">{formatDateTime(event.when)} by {event.who}</p>
                            </button>
                        )) : (
                           <p className="text-center text-sm text-slate-500 py-4">{t('notifications.noNotifications')}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;