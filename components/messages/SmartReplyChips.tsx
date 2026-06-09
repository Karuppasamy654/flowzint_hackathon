'use client';

import * as React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
  };
  text: string;
  createdAt: string | Date;
}

interface SmartReplyChipsProps {
  messages: Message[];
  currentUserId: string;
  requestTitle: string;
  requestDescription: string;
  myRole: 'seeker' | 'helper';
  onSelect: (reply: string) => void;
}

export function SmartReplyChips({
  messages,
  currentUserId,
  requestTitle,
  requestDescription,
  myRole,
  onSelect,
}: SmartReplyChipsProps) {
  const [replies, setReplies] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  // Identify the last message details to know if we should suggest
  const lastMessage = messages[messages.length - 1];
  const lastMessageId = lastMessage?._id;
  const lastSenderId = lastMessage?.sender?._id;
  
  // Only suggest replies if the last message is from the other participant
  const shouldSuggest = lastMessage && lastSenderId !== currentUserId;

  React.useEffect(() => {
    if (!shouldSuggest) {
      setReplies([]);
      return;
    }

    let active = true;

    async function fetchReplies() {
      setIsLoading(true);
      try {
        // Map messages to chatContext
        const chatContext = messages.slice(-8).map((m) => ({
          sender: m.sender._id === currentUserId ? 'me' : 'them',
          text: m.text,
        }));

        const res = await fetch('/api/ai/suggest-replies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatContext,
            requestTitle,
            requestDescription,
            myRole,
          }),
        });

        const result = await res.json();
        if (active && result.success && Array.isArray(result.data)) {
          setReplies(result.data.slice(0, 3));
        }
      } catch (err) {
        console.error('Error fetching smart replies:', err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchReplies();

    return () => {
      active = false;
    };
  }, [lastMessageId, shouldSuggest, currentUserId, requestTitle, requestDescription, myRole, messages]);

  if (!shouldSuggest) return null;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#F0F2F5' }} className="animate-pulse">
        <Loader2 style={{ width: 14, height: 14, color: '#1B6CA8' }} className="animate-spin" />
        <span style={{ fontSize: 13, color: '#8696A0', fontWeight: 500 }}>Generating smart replies...</span>
      </div>
    );
  }

  if (replies.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '6px 16px', background: '#F0F2F5' }}
      className="animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: '#1B6CA8', background: '#EFF6FF', padding: '2px 8px', borderRadius: 4, border: '1px solid #BFDBFE', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.05em', userSelect: 'none' }}>
        <Sparkles style={{ width: 12, height: 12 }} />
        <span>Smart Reply</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {replies.map((reply, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onSelect(reply);
              setReplies([]);
            }}
            style={{
              fontSize: 13, background: 'white', color: '#374151',
              border: '1px solid #E5E7EB', padding: '6px 12px', borderRadius: 999,
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)', cursor: 'pointer',
              maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              fontWeight: 500, transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#1B6CA8';
              (e.currentTarget as HTMLElement).style.color = '#1B6CA8';
              (e.currentTarget as HTMLElement).style.background = '#EFF6FF';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB';
              (e.currentTarget as HTMLElement).style.color = '#374151';
              (e.currentTarget as HTMLElement).style.background = 'white';
            }}
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  );
}
