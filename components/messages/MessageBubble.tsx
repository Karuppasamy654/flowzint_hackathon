import * as React from 'react';
import { format } from 'date-fns';
import { Avatar } from '../ui/avatar';
import { Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TranslationToggle } from './TranslationToggle';

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
  originalText?: string;
  originalLanguage?: string;
  translations?: Record<string, string>;
}

interface MessageBubbleProps {
  message: BubbleMessage;
  currentUserId: string;
  preferredLanguage?: string;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  showAvatar?: boolean;
  showName?: boolean;
}

export function MessageBubble({
  message,
  currentUserId,
  preferredLanguage = 'en',
  isFirstInGroup = true,
  isLastInGroup = true,
  showAvatar = true,
  showName = true,
}: MessageBubbleProps) {
  const isMe = message.sender._id === currentUserId;
  const [showTranslation, setShowTranslation] = React.useState(true);

  const messageTime = React.useMemo(() => {
    try {
      const date = new Date(message.createdAt);
      return format(date, 'h:mm a');
    } catch (e) {
      return '';
    }
  }, [message.createdAt]);

  const isRead = message.readBy.length > 1;

  // Determine translation availability
  const hasTranslation = !isMe && message.translations && message.translations[preferredLanguage];
  const displayText = (hasTranslation && showTranslation)
    ? message.translations?.[preferredLanguage]
    : message.text;

  return (
    <div 
      className={cn(
        'flex items-end gap-2 max-w-[85%] sm:max-w-[70%] animate-in fade-in slide-in-from-bottom-2 duration-300 transition-all',
        isMe ? 'self-end flex-row-reverse' : 'self-start',
        isLastInGroup ? 'mb-3' : 'mb-1'
      )}
    >
      {/* Avatar column placeholder or display */}
      {!isMe && (
        <div className="w-8 shrink-0 flex justify-center">
          {showAvatar ? (
            <Avatar
              src={message.sender.avatarUrl}
              name={message.sender.name}
              color={message.sender.avatarColor}
              size="sm"
              className="border border-white/10 shadow-sm"
            />
          ) : (
            <div className="w-8" /> // Spacer to keep bubbles aligned
          )}
        </div>
      )}

      <div className="flex flex-col space-y-0.5 max-w-full">
        {/* Sender Name (other party only, first message in consecutive group) */}
        {!isMe && showName && (
          <span className="text-[10px] font-semibold text-slate-400 pl-1 mb-0.5">
            {message.sender.name}
          </span>
        )}

        {/* Text bubble */}
        <div
          className={cn(
            'px-4 py-2 text-sm shadow-xl break-words border transition-all duration-200',
            isMe
              ? 'bg-indigo-600 text-white border-indigo-500/20'
              : 'bg-[#131B2E]/60 text-slate-100 border-white/5 backdrop-blur-xs',
            // WhatsApp style corner radiuses
            isMe
              ? (isFirstInGroup && isLastInGroup ? 'rounded-2xl rounded-tr-none' :
                 isFirstInGroup ? 'rounded-2xl rounded-tr-none rounded-br-sm' :
                 isLastInGroup ? 'rounded-2xl rounded-tr-sm rounded-br-none' :
                 'rounded-2xl rounded-r-sm')
              : (isFirstInGroup && isLastInGroup ? 'rounded-2xl rounded-tl-none' :
                 isFirstInGroup ? 'rounded-2xl rounded-tl-none rounded-bl-sm' :
                 isLastInGroup ? 'rounded-2xl rounded-tl-sm rounded-bl-none' :
                 'rounded-2xl rounded-l-sm')
          )}
        >
          <p className="whitespace-pre-line leading-relaxed text-left">{displayText}</p>
          
          <div className="flex items-center justify-end gap-1 mt-1 select-none">
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

        {/* Translation Toggle Link */}
        {hasTranslation && (
          <div className={cn(isMe ? 'self-end' : 'self-start', "px-1")}>
            <TranslationToggle
              originalText={message.originalText}
              originalLanguage={message.originalLanguage}
              isShowingTranslation={showTranslation}
              onToggle={() => setShowTranslation(!showTranslation)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
