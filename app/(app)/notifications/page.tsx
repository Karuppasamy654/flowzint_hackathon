'use client';

import * as React from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { Button } from '@/components/ui/button';
import { Bell, CheckSquare, Loader2 } from 'lucide-react';

export default function NotificationsPage() {
  const { user } = useCurrentUser();
  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications(user?.id);

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
          <h1 className="text-2xl font-display font-semibold text-gray-900 leading-tight flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full select-none animate-pulse">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500">
            Keep track of help requests matching your skills, messages, and feedback.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={markAllRead}
            className="flex items-center gap-1.5 h-9 font-semibold text-xs rounded-md hover:bg-gray-50 border-gray-200 text-gray-700 shrink-0 self-start sm:self-center"
          >
            <CheckSquare className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Notifications list loop */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="bg-white p-16 rounded-lg border border-border border-dashed text-center space-y-3 text-gray-400 py-20">
            <div className="h-14 w-14 bg-gray-50 border border-border/70 rounded-full flex items-center justify-center text-gray-400 mx-auto">
              <Bell className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-gray-800">You&apos;re all caught up!</h4>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                No notifications to display. We will notify you when neighbors request matching skills or open chats.
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
