'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { toast } from '@/components/ui/toast';
import { useLanguage } from '@/lib/LanguageContext';
import { formatDistanceToNow } from 'date-fns';
import { HelpCircle, MessageSquare, CheckCircle, Star, Clock, Check, Hand, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NotificationItem {
  _id: string;
  recipient: string;
  type: 'new_match' | 'request_accepted' | 'message' | 'rating_received' | 'request_expired';
  title: string;
  body: string;
  meta: Record<string, any>;
  read: boolean;
  createdAt: string | Date;
}

interface NotificationCardProps {
  notification: NotificationItem;
  onMarkRead: (id: string) => void;
}

export function NotificationCard({ notification, onMarkRead }: NotificationCardProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [isActing, setIsActing] = React.useState(false);

  const relativeTime = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });
    } catch (e) {
      return '';
    }
  }, [notification.createdAt]);

  const handleMarkRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.read) return;
    onMarkRead(notification._id);
  };

  const handleActionClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkRead(notification._id);

    const { type, meta } = notification;

    if (type === 'new_match' && meta?.requestId) {
      // Direct accept action in notification card
      setIsActing(true);
      try {
        const res = await fetch(`/api/requests/${meta.requestId}/accept`, {
          method: 'POST',
        });
        const result = await res.json();
        if (result.success) {
          toast.success('Request accepted!', {
            description: 'Live chat is now open.',
          });
          router.push(`/messages/${result.data.chat._id}`);
        } else {
          toast.error(result.error || 'Failed to accept request. It may have already been accepted.');
          // Redirect to notifications to refresh/view details
          router.push('/notifications');
        }
      } catch (err) {
        console.error(err);
        toast.error('An error occurred while accepting request.');
      } finally {
        setIsActing(false);
      }
    } else if ((type === 'request_accepted' || type === 'message') && meta?.chatId) {
      router.push(`/messages/${meta.chatId}`);
    } else if (type === 'rating_received') {
      router.push('/profile');
    } else if (type === 'request_expired') {
      router.push('/request');
    }
  };

  const config = ({
    new_match:        { icon: Hand,         actionLabel: t('notifications.acceptRequest') },
    request_accepted: { icon: CheckCircle,  actionLabel: t('notifications.openChat') },
    message:          { icon: MessageSquare,actionLabel: t('notifications.reply') },
    rating_received:  { icon: Star,         actionLabel: t('notifications.viewRatings') },
    request_expired:  { icon: Clock,        actionLabel: t('notifications.requestAgain') },
  } as Record<string, { icon: any; actionLabel: string }>)[notification.type] ?? { icon: HelpCircle, actionLabel: 'View' };

  const IconComponent = config.icon;

  return (
    <div
      onClick={handleMarkRead}
      className={cn(
        'flex flex-col sm:flex-row items-start gap-4 p-4 rounded-lg border transition-all duration-150 relative cursor-pointer backdrop-blur-md',
        notification.read
          ? 'bg-[#131B2E]/40 border-white/5 hover:bg-[#131B2E]/60'
          : 'bg-indigo-500/5 border-indigo-500/20 hover:bg-indigo-500/10'
      )}
    >
      {/* Read indicator dot */}
      {!notification.read && (
        <span className="absolute top-4 left-4 h-2 w-2 bg-indigo-400 rounded-full animate-pulse" />
      )}

      {/* Main Content Layout */}
      <div className={cn("flex gap-3 items-start w-full", !notification.read ? "pl-4" : "")}>
        {/* Rounded Icon */}
        <div className={cn('p-2.5 rounded-md border shrink-0', {
          'new_match': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          'request_accepted': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          'message': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
          'rating_received': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          'request_expired': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
        }[notification.type] || 'bg-slate-500/10 text-slate-400 border-slate-500/20')}>
          <IconComponent className="h-5 w-5" />
        </div>

        {/* Content details */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between mb-0.5">
            <h4 className="text-sm font-bold text-white leading-tight">
              {notification.title}
            </h4>
            <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap ml-2">
              {relativeTime}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed pr-6">{notification.body}</p>

          {/* Rating stars inline showcase for rating_received notifications */}
          {notification.type === 'rating_received' && notification.meta?.rating && (
            <div className="flex gap-0.5 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-3.5 w-3.5',
                    i < notification.meta.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-700'
                  )}
                />
              ))}
            </div>
          )}

          {/* Action trigger button */}
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              disabled={isActing}
              onClick={handleActionClick}
              className={cn(
                'h-8 px-4 rounded-md font-semibold text-xs transition-colors flex items-center justify-center',
                notification.type === 'new_match'
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 border border-transparent'
                  : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300'
              )}
            >
              {isActing ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  {t('common.loading')}
                </>
              ) : (
                config.actionLabel
              )}
            </Button>

            {!notification.read && (
              <Button size="sm" variant="ghost" onClick={handleMarkRead}
                className="h-8 px-3 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 font-semibold text-xs flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />
                {t('notifications.markRead')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
