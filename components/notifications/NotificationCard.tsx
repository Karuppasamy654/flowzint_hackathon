'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { toast } from '@/components/ui/toast';
import { formatDistanceToNow } from 'date-fns';
import {
  HelpCircle,
  MessageSquare,
  CheckCircle,
  Star,
  Clock,
  Check,
  ChevronRight,
  Hand,
  Loader2,
} from 'lucide-react';
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

  // Icon configurations
  const config = {
    new_match: {
      icon: Hand,
      bgColor: 'bg-blue-50 text-blue-600 border-blue-100',
      actionLabel: 'Accept Request',
    },
    request_accepted: {
      icon: CheckCircle,
      bgColor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      actionLabel: 'Open Chat',
    },
    message: {
      icon: MessageSquare,
      bgColor: 'bg-purple-50 text-purple-600 border-purple-100',
      actionLabel: 'Reply',
    },
    rating_received: {
      icon: Star,
      bgColor: 'bg-amber-50 text-amber-600 border-amber-100',
      actionLabel: 'View Ratings',
    },
    request_expired: {
      icon: Clock,
      bgColor: 'bg-gray-50 text-gray-500 border-gray-100',
      actionLabel: 'Request Again',
    },
  }[notification.type] || {
    icon: HelpCircle,
    bgColor: 'bg-gray-50 text-gray-500 border-gray-100',
    actionLabel: 'View details',
  };

  const IconComponent = config.icon;

  return (
    <div
      onClick={handleMarkRead}
      className={cn(
        'flex flex-col sm:flex-row items-start gap-4 p-4 rounded-lg border transition-all duration-150 relative cursor-pointer',
        notification.read
          ? 'bg-white border-border/60 hover:bg-gray-50/40'
          : 'bg-blue-50/20 border-primary/20 shadow-xs hover:bg-blue-50/30'
      )}
    >
      {/* Read indicator dot */}
      {!notification.read && (
        <span className="absolute top-4 left-4 h-2 w-2 bg-primary rounded-full animate-pulse" />
      )}

      {/* Main Content Layout */}
      <div className={cn("flex gap-3 items-start w-full", !notification.read ? "pl-4" : "")}>
        {/* Rounded Icon */}
        <div className={cn('p-2.5 rounded-md border shrink-0', config.bgColor)}>
          <IconComponent className="h-5 w-5" />
        </div>

        {/* Content details */}
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between mb-0.5">
            <h4 className="text-sm font-bold text-gray-800 leading-tight">
              {notification.title}
            </h4>
            <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
              {relativeTime}
            </span>
          </div>

          <p className="text-xs text-gray-500 leading-relaxed pr-6">{notification.body}</p>

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
                      : 'text-gray-200'
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
                  ? 'bg-primary text-white hover:bg-primary-hover border border-transparent'
                  : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-700'
              )}
            >
              {isActing ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  Accepting...
                </>
              ) : (
                config.actionLabel
              )}
            </Button>

            {!notification.read && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleMarkRead}
                className="h-8 px-3 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100/60 font-semibold text-xs flex items-center gap-1"
              >
                <Check className="h-3.5 w-3.5" />
                Mark read
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
