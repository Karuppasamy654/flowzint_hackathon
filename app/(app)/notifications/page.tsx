'use client';

import * as React from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNotifications } from '@/hooks/useNotifications';
import { useLanguage } from '@/lib/LanguageContext';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { Button } from '@/components/ui/button';
import { Bell, CheckSquare, Loader2 } from 'lucide-react';

export default function NotificationsPage() {
  const { user } = useCurrentUser();
  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications(user?.id);
  const { t } = useLanguage();

  if (!user) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left">
      {/* Header and Bulk Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
        <div className="text-left">
          <h1 className="text-2xl font-display font-semibold text-white leading-tight flex items-center gap-2">
            {t('notifications.title')}
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full select-none animate-pulse">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-400">
            {t('notifications.subtitle')}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={markAllRead}
            className="flex items-center gap-1.5 h-9 font-semibold text-xs rounded-md bg-white/5 hover:bg-white/10 border-white/10 text-slate-300 shrink-0 self-start sm:self-center"
          >
            <CheckSquare className="h-4 w-4" />
            {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      {/* Notifications list loop */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-[#131B2E]/50 border border-dashed border-white/10 p-16 rounded-lg text-center space-y-3 backdrop-blur-md py-20">
            <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-slate-500 mx-auto">
              <Bell className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white">You&apos;re all caught up!</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {t('notifications.emptyDesc')}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationCard
                key={notification._id}
                notification={notification}
                onMarkRead={markOneRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export const dynamic = 'force-dynamic';
