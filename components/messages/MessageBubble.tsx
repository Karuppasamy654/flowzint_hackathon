import * as React from 'react';
import { format } from 'date-fns';
import { Avatar } from '../ui/avatar';
import { Check, CheckCheck } from 'lucide-react';
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
      return format(new Date(message.createdAt), 'HH:mm');
    } catch (e) {
      return '';
    }
  }, [message.createdAt]);

  const isRead = message.readBy.length > 1;

  const hasTranslation = !isMe && message.translations && message.translations[preferredLanguage];
  const displayText = hasTranslation && showTranslation
    ? message.translations?.[preferredLanguage]
    : message.text;

  // WhatsApp border-radius
  const myRadius = isFirstInGroup && isLastInGroup ? '8px 8px 0 8px'
    : isFirstInGroup ? '8px 8px 0 8px'
    : isLastInGroup ? '8px 8px 0 8px'
    : '8px 8px 0 8px';

  const theirRadius = isFirstInGroup && isLastInGroup ? '0 8px 8px 8px'
    : isFirstInGroup ? '0 8px 8px 8px'
    : isLastInGroup ? '0 8px 8px 8px'
    : '0 8px 8px 8px';

  const verticalGap = isLastInGroup ? 8 : 2;

  return (
    <div
      style={{
        display: 'flex',
        padding: `2px 16px`,
        marginBottom: verticalGap,
        justifyContent: isMe ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        gap: isMe ? 0 : 6,
      }}
    >
      {/* Avatar for other user */}
      {!isMe && (
        <div style={{ width: 32, flexShrink: 0, alignSelf: 'flex-end' }}>
          {showAvatar ? (
            <Avatar
              src={message.sender.avatarUrl}
              name={message.sender.name}
              color={message.sender.avatarColor}
              size="sm"
            />
          ) : (
            <div style={{ width: 32 }} />
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '65%' }}>
        {/* Sender name (other user, first in group) */}
        {!isMe && showName && (
          <span style={{ fontSize: 11, fontWeight: 600, color: '#1B6CA8', paddingLeft: 4, marginBottom: 2 }}>
            {message.sender.name}
          </span>
        )}

        {/* Bubble */}
        <div
          style={{
            background: isMe ? '#DCF8C6' : '#FFFFFF',
            color: '#111B21',
            borderRadius: isMe ? myRadius : theirRadius,
            padding: '8px 12px',
            boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
            display: 'inline-block',
            position: 'relative',
            wordBreak: 'break-word',
          }}
        >
          {/* Message text */}
          <p style={{ fontSize: 15, lineHeight: 1.4, whiteSpace: 'pre-wrap', margin: 0, color: '#111B21' }}>
            {displayText}
          </p>

          {/* Time & read receipt — float right inside bubble */}
          <div style={{
            float: 'right',
            marginLeft: 8,
            marginTop: 4,
            fontSize: 11,
            color: 'rgba(0,0,0,0.45)',
            whiteSpace: 'nowrap',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}>
            <span>{messageTime}</span>
            {isMe && (
              isRead
                ? <CheckCheck style={{ width: 14, height: 14, color: '#53BDEB' }} />
                : <Check style={{ width: 14, height: 14, color: 'rgba(0,0,0,0.45)' }} />
            )}
          </div>
          {/* Clearfix so float doesn't overflow */}
          <div style={{ clear: 'both' }} />
        </div>

        {/* Translation Toggle */}
        {hasTranslation && (
          <div style={{ paddingLeft: isMe ? 0 : 4, alignSelf: isMe ? 'flex-end' : 'flex-start' }}>
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
