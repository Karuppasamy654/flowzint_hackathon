import * as React from 'react';
import { format } from 'date-fns';
import { Avatar } from '../ui/avatar';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BubbleMessage {
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

interface MessageBubbleProps {
  message: BubbleMessage;
  currentUserId: string;
}

export function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
  const isMe = message.sender._id === currentUserId;
  const messageTime = React.useMemo(() => {
    try {
      const date = new Date(message.createdAt);
      return format(date, 'h:mm a');
    } catch (e) {
      return '';
    }
  }, [message.createdAt]);

  const isRead = message.readBy.length > 1;

  return (
    <div className={cn('flex items-start gap-2.5 max-w-[85%] sm:max-w-[70%] animate-in fade-in slide-in-from-bottom-2 duration-300', isMe ? 'self-end flex-row-reverse' : 'self-start')}>
      {/* Avatar for the other party */}
      {!isMe && (
        <Avatar
          src={message.sender.avatarUrl}
          name={message.sender.name}
          color={message.sender.avatarColor}
          size="sm"
          className="mt-0.5 shrink-0 border border-white/10"
        />
      )}

      <div className="flex flex-col space-y-1">
        {/* Sender Name (other party only) */}
        {!isMe && (
          <span className="text-[10px] font-semibold text-slate-400 pl-1">
            {message.sender.name}
          </span>
        )}

        {/* Text bubble */}
        <div
          className={cn(
            'px-4 py-2 text-sm rounded-lg shadow-2xl break-words border',
            isMe
              ? 'bg-indigo-600 text-white rounded-tr-none border-indigo-500/20'
              : 'bg-[#131B2E]/60 text-slate-100 rounded-tl-none border-white/5 backdrop-blur-xs'
          )}
        >
          <p className="whitespace-pre-line leading-relaxed text-left">{message.text}</p>
          
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className={cn('text-[9px] font-medium leading-none block', isMe ? 'text-indigo-200/70' : 'text-slate-400')}>
              {messageTime}
            </span>
            {isMe && (
              <span className="text-indigo-200">
                {isRead ? (
                  <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Check className="h-3.5 w-3.5 text-indigo-300" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
