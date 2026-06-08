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
      <div className="flex items-center gap-2 py-2.5 px-4 animate-pulse">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
        <span className="text-xs text-slate-400 font-medium">Generating smart replies...</span>
      </div>
    );
  }

  if (replies.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2.5 px-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 mr-1 uppercase tracking-wider shrink-0 select-none">
        <Sparkles className="h-3 w-3 fill-indigo-400/35" />
        <span>Smart Reply</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {replies.map((reply, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onSelect(reply);
              // Hide suggestions immediately after selection
              setReplies([]);
            }}
            className="text-xs bg-[#0F172A] hover:bg-[#1E293B] text-slate-200 border border-white/10 px-3.5 py-1.5 rounded-full transition-all active:scale-95 text-left font-medium max-w-[250px] truncate cursor-pointer shadow-sm hover:border-indigo-500/30"
          >
            {reply}
          </button>
        ))}
      </div>
    </div>
  );
}
