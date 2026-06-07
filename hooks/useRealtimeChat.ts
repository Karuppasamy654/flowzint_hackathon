import { useEffect, useState } from 'react';
import { createBrowserClient } from '../lib/supabase';

export interface ChatMessage {
  _id: string;
  sender: {
    _id: string;
    name: string;
    avatarUrl?: string;
    avatarColor?: string;
  };
  text: string;
  createdAt: string | Date;
  readBy: string[];
}

export function useRealtimeChat(chatId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial chat history
  useEffect(() => {
    if (!chatId) return;

    async function fetchMessages() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/chats/${chatId}`);
        const result = await res.json();
        if (result.success) {
          setMessages(result.data.messages || []);
        } else {
          setError(result.error || 'Failed to load chat conversation');
        }
      } catch (err: any) {
        setError(err.message || 'Error fetching messages');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMessages();
  }, [chatId]);

  // Subscribe to realtime updates for this chat
  useEffect(() => {
    if (!chatId) return;

    const supabase = createBrowserClient();
    const channelName = `chat:${chatId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'new_message' }, (payload: any) => {
        const data = payload.payload;
        if (!data) return;

        setMessages((prev) => {
          // Prevent duplicates if already added locally
          if (prev.some((msg) => msg._id === data.messageId)) return prev;

          const receivedMessage: ChatMessage = {
            _id: data.messageId,
            sender: {
              _id: data.senderId,
              name: data.senderName,
              avatarUrl: data.senderAvatar,
              avatarColor: data.senderColor,
            },
            text: data.text,
            createdAt: data.createdAt,
            readBy: [data.senderId],
          };

          return [...prev, receivedMessage];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // Send a message
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    try {
      const res = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      const sentMsg = result.data;
      
      // Update local state instantly with populated sender details for the sender
      setMessages((prev) => {
        if (prev.some((msg) => msg._id === sentMsg._id)) return prev;
        return [...prev, sentMsg];
      });

      return sentMsg;
    } catch (err: any) {
      console.error('Error in sendMessage:', err);
      throw err;
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    setMessages,
  };
}
