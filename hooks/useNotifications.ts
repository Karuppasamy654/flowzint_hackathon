import { useEffect, useState } from 'react';
import { createBrowserClient } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/toast';

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

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  const syncNotifications = async () => {
    if (!userId) return;
    try {
      const res = await fetch('/api/notifications');
      const result = await res.json();
      if (result.success) {
        setNotifications(result.data || []);
        const unread = (result.data || []).filter((n: any) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error syncing notifications:', error);
    }
  };

  // Fetch initial notifications
  useEffect(() => {
    if (userId) {
      syncNotifications();
    }
  }, [userId]);

  // Subscribe to real-time notification events
  useEffect(() => {
    if (!userId) return;

    const supabase = createBrowserClient();
    const channelName = `notifications:${userId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: '*' }, (payload: any) => {
        const data = payload.payload;
        if (!data) return;

        // Visual alerts using Toast notifications
        if (payload.event === 'new_match') {
          toast.info('Someone needs your help!', {
            description: `${data.seekerName} needs help with ${data.category}.`,
            actionLabel: 'View matches',
            onAction: () => {
              router.push('/notifications');
            },
          });
        } else if (payload.event === 'request_accepted') {
          toast.success('Request Accepted!', {
            description: `${data.helperName} accepted your request!`,
            actionLabel: 'Open Chat',
            onAction: () => {
              router.push(`/messages/${data.chatId}`);
            },
          });
        } else if (payload.event === 'message') {
          toast.message(`New message from ${data.senderName}`, {
            description: data.text,
            actionLabel: 'Reply',
            onAction: () => {
              router.push(`/messages/${data.chatId}`);
            },
          });
        } else if (payload.event === 'rating_received') {
          toast.info('Feedback Received', {
            description: `${data.seekerName} rated their experience.`,
            actionLabel: 'View Profile',
            onAction: () => {
              router.push('/profile');
            },
          });
        } else {
          toast.info(data.title || 'New Notification', {
            description: data.body || 'You have received an update.',
          });
        }

        // Fetch latest list to ensure sync
        syncNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'PATCH' });
      const result = await res.json();
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications read:', error);
    }
  };

  const markOneRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
      const result = await res.json();
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark single notification read:', error);
    }
  };

  return {
    unreadCount,
    notifications,
    markAllRead,
    markOneRead,
    syncNotifications,
  };
}
