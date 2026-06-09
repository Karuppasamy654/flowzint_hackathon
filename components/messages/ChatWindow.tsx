'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useRealtimeChat } from '../../hooks/useRealtimeChat';
import { MessageBubble } from './MessageBubble';
import { PinnedContextCard } from './PinnedContextCard';
import { RatingModal } from './RatingModal';
import { Avatar } from '../ui/avatar';
import { Button } from '../ui/button';
import { toast } from '@/components/ui/toast';
import { ArrowLeft, CheckCircle, Send, Loader2, ChevronDown, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmartReplyChips } from './SmartReplyChips';
import { ConflictResolver } from './ConflictResolver';
import { getLanguageName } from '@/lib/languages';
import { format, isToday, isYesterday } from 'date-fns';

interface ChatWindowProps {
  chatId: string;
  currentUserId: string;
}

export function ChatWindow({ chatId, currentUserId }: ChatWindowProps) {
  const router = useRouter();
  const { messages, isLoading, error, sendMessage } = useRealtimeChat(chatId);
  const [inputText, setInputText] = React.useState('');
  const [isSending, setIsSending] = React.useState(false);
  const [chatMeta, setChatMeta] = React.useState<any>(null);
  const [isRatingOpen, setIsRatingOpen] = React.useState(false);
  const [showScrollButton, setShowScrollButton] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Fetch full details (seeker, helper, request details) to show in Header
  React.useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch(`/api/chats/${chatId}`);
        const result = await res.json();
        if (result.success) {
          setChatMeta(result.data);
        }
      } catch (e) {
        console.error('Failed to load chat metadata:', e);
      }
    }
    loadMeta();
  }, [chatId]);

  // Scroll helpers
  const scrollToBottom = (smooth = false) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'instant',
      });
    }
  };

  // On initial load: scroll instantly to bottom
  React.useEffect(() => {
    if (!isLoading) {
      setTimeout(() => scrollToBottom(false), 50);
    }
  }, [isLoading]);

  // On new message: scroll smoothly only if near bottom
  React.useEffect(() => {
    if (messages.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom <= 200) {
      scrollToBottom(true);
    } else {
      setShowScrollButton(true);
    }
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollButton(distFromBottom > 200);
  };

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customText ?? inputText).trim();
    if (!textToSend || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(textToSend);
      if (!customText) setInputText('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleSmartReplySelect = (reply: string) => {
    handleSend(undefined, reply);
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input not supported in this browser.');
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText((prev) => prev ? `${prev} ${transcript}` : transcript);
    };
    recognition.onerror = () => {
      setIsRecording(false);
      toast.error('Voice input failed. Please try again.');
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const handleResolveSubmit = async (rating: number, feedback: string) => {
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Help request marked resolved!', {
          description: 'Thank you for rating your helper.',
        });
        setChatMeta((prev: any) => ({
          ...prev,
          status: 'resolved',
          seekerRating: rating,
          seekerFeedback: feedback,
        }));
      } else {
        toast.error(result.error || 'Failed to resolve request');
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not submit resolve request.');
    }
  };

  const getDayLabel = (dateStr: string | Date) => {
    try {
      const date = new Date(dateStr);
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
      if (diffDays < 7) return format(date, 'EEEE'); // e.g. Monday
      return format(date, 'd MMM yyyy');
    } catch (e) {
      return '';
    }
  };

  if (isLoading || !chatMeta || !chatMeta.seeker || !chatMeta.helper) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B6CA8]" />
        <p className="text-sm text-gray-500 font-medium">Connecting to chat...</p>
      </div>
    );
  }

  const otherUser = chatMeta.seeker._id === currentUserId ? chatMeta.helper : chatMeta.seeker;
  const isSeeker = chatMeta.seeker._id === currentUserId;
  const isResolved = chatMeta.status === 'resolved';

  // WhatsApp style consecutive message grouping (2 min window)
  const analyzedMessages = messages.map((msg, idx) => {
    const prevMsg = messages[idx - 1];
    const nextMsg = messages[idx + 1];

    const isMe = msg.sender._id === currentUserId;
    const prevSenderId = prevMsg?.sender?._id;
    const nextSenderId = nextMsg?.sender?._id;

    const prevTimeDiff = prevMsg
      ? Math.abs(new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime())
      : Infinity;
    const nextTimeDiff = nextMsg
      ? Math.abs(new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime())
      : Infinity;

    const isGroupedWithPrev = prevSenderId === msg.sender._id && prevTimeDiff < 2 * 60 * 1000;
    const isGroupedWithNext = nextSenderId === msg.sender._id && nextTimeDiff < 2 * 60 * 1000;

    return {
      ...msg,
      isMe,
      isFirstInGroup: !isGroupedWithPrev,
      isLastInGroup: !isGroupedWithNext,
      showAvatar: !isMe && !isGroupedWithNext,
      showName: !isMe && !isGroupedWithPrev,
    };
  });

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-64px)] overflow-hidden rounded-lg bg-white border border-gray-200 shadow-sm relative">
      
      {/* ── Header (WhatsApp style) ── */}
      <div
        style={{ background: '#F0F2F5', borderBottom: '1px solid rgba(0,0,0,0.08)' }}
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/messages')}
            className="md:hidden p-1 rounded-full hover:bg-black/5 text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <Avatar
            src={otherUser.avatarUrl}
            name={otherUser.name}
            color={otherUser.avatarColor}
            size="md"
          />

          <div>
            <div className="flex items-center gap-2">
              <h4 style={{ color: '#111B21', fontSize: 15, fontWeight: 500, lineHeight: 1 }}>
                {otherUser.name}
              </h4>
              {chatMeta.seeker.preferredLanguage !== chatMeta.helper.preferredLanguage && (
                <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-semibold">
                  🌐 Auto-translate
                </span>
              )}
            </div>
            <p style={{ color: '#54656F', fontSize: 12, marginTop: 2 }}>
              {otherUser.location || 'HelpNet User'}
              {chatMeta.seeker.preferredLanguage !== chatMeta.helper.preferredLanguage && (
                <span className="ml-1 text-[10px] text-gray-400">
                  ({getLanguageName(otherUser.preferredLanguage)} → {getLanguageName(chatMeta[isSeeker ? 'seeker' : 'helper'].preferredLanguage)})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action button */}
        {isSeeker && !isResolved && (
          <Button
            size="sm"
            onClick={() => setIsRatingOpen(true)}
            className="bg-emerald-600 text-white hover:bg-emerald-700 h-8 font-semibold rounded-md flex items-center gap-1 text-xs shrink-0"
          >
            <CheckCircle className="h-4 w-4" />
            Resolve
          </Button>
        )}
        {isResolved && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1 select-none">
            <CheckCircle className="h-3.5 w-3.5" />
            Resolved
          </span>
        )}
      </div>

      {/* ── Scrollable Messages Area ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ background: '#F0F2F5', flex: 1, overflowY: 'auto', position: 'relative' }}
        className="flex flex-col"
      >
        {/* Pinned context card at top */}
        {chatMeta.request && (
          <div className="px-4 pt-3 pb-1 shrink-0">
            <div style={{
              background: 'white',
              borderLeft: '4px solid #1B6CA8',
              borderRadius: 4,
              padding: '10px 14px',
              boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
            }}>
              <p style={{ fontSize: 11, color: '#1B6CA8', fontWeight: 600, marginBottom: 4 }}>Help request</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#111B21', marginBottom: 4 }}>{chatMeta.request.title}</p>
              <div className="flex flex-wrap gap-2">
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px',
                  background: '#EFF6FF', color: '#1B6CA8', borderRadius: 4,
                  textTransform: 'capitalize'
                }}>{chatMeta.request.category}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                  background: chatMeta.request.urgency === 'urgent' ? '#FEF2F2' : '#FFFBEB',
                  color: chatMeta.request.urgency === 'urgent' ? '#DC2626' : '#92400E',
                  textTransform: 'capitalize',
                }}>{chatMeta.request.urgency}</span>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 flex flex-col px-0 py-2">
          {analyzedMessages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div style={{
                background: 'rgba(255,255,255,0.85)', color: '#54656F',
                fontSize: 12, padding: '6px 14px', borderRadius: 8,
                boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
              }}>
                This is the beginning of your conversation. Say hello! 👋
              </div>
            </div>
          ) : (
            analyzedMessages.map((message, idx) => {
              const prevMessage = analyzedMessages[idx - 1];
              const showDaySeparator =
                !prevMessage ||
                new Date(message.createdAt).toDateString() !== new Date(prevMessage.createdAt).toDateString();

              return (
                <React.Fragment key={message._id}>
                  {showDaySeparator && (
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
                      <span style={{
                        background: 'rgba(255,255,255,0.85)', color: '#54656F',
                        fontSize: 12, padding: '5px 12px', borderRadius: 8,
                        boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                      }}>
                        {getDayLabel(message.createdAt)}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={message}
                    currentUserId={currentUserId}
                    preferredLanguage={isSeeker
                      ? chatMeta.seeker.preferredLanguage
                      : chatMeta.helper.preferredLanguage}
                    isFirstInGroup={message.isFirstInGroup}
                    isLastInGroup={message.isLastInGroup}
                    showAvatar={message.showAvatar}
                    showName={message.showName}
                  />
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* ↓ New message pill */}
        {showScrollButton && (
          <button
            type="button"
            onClick={() => {
              scrollToBottom(true);
              setShowScrollButton(false);
            }}
            style={{
              position: 'sticky', bottom: 12, left: '50%', transform: 'translateX(-50%)',
              background: '#1B6CA8', color: 'white', fontSize: 13, fontWeight: 600,
              padding: '6px 16px', borderRadius: 999, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', zIndex: 10,
              border: 'none', width: 'fit-content', margin: '0 auto',
            }}
          >
            <ChevronDown style={{ width: 14, height: 14 }} />
            New message
          </button>
        )}
      </div>

      {/* ── Input Footer ── */}
      <div style={{ background: '#F0F2F5', borderTop: 'none' }} className="shrink-0">
        {/* Conflict Resolver */}
        {!isResolved && messages.length >= 4 && (
          <ConflictResolver
            messages={messages}
            currentUserId={currentUserId}
            requestTitle={chatMeta.request?.title || ''}
            myRole={isSeeker ? 'seeker' : 'helper'}
            onUseSuggestion={(text) => {
              setInputText(text);
              document.getElementById('chat-input-field')?.focus();
            }}
          />
        )}

        {/* Smart Reply Chips */}
        {!isResolved && (
          <SmartReplyChips
            messages={messages}
            currentUserId={currentUserId}
            requestTitle={chatMeta.request?.title || ''}
            requestDescription={chatMeta.request?.description || ''}
            myRole={isSeeker ? 'seeker' : 'helper'}
            onSelect={handleSmartReplySelect}
          />
        )}

        <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Voice input button */}
          <button
            type="button"
            onClick={toggleVoiceInput}
            disabled={isResolved}
            title={isRecording ? 'Stop recording' : 'Voice input'}
            style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: isRecording ? '#DC2626' : 'rgba(255,255,255,0.6)',
              border: `1px solid ${isRecording ? '#FCA5A5' : '#E5E7EB'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: isResolved ? 'not-allowed' : 'pointer',
              opacity: isResolved ? 0.4 : 1,
              transition: 'background 0.15s',
            }}
          >
            {isRecording
              ? <MicOff style={{ width: 16, height: 16, color: 'white' }} />
              : <Mic style={{ width: 16, height: 16, color: '#6B7280' }} />
            }
          </button>

          <textarea
            id="chat-input-field"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isResolved ? 'This chat is resolved' : isRecording ? '🎤 Listening...' : 'Type a message…'}
            disabled={isResolved || isSending}
            rows={1}
            style={{
              flex: 1,
              background: isRecording ? '#FEF2F2' : '#FFFFFF',
              color: '#111B21',
              border: isRecording ? '1px solid #FECACA' : 'none',
              borderRadius: 24,
              padding: '10px 16px',
              fontSize: 15,
              outline: 'none',
              minHeight: 44,
              maxHeight: 120,
              overflowY: 'auto',
              resize: 'none',
              lineHeight: 1.4,
              fontFamily: 'inherit',
              transition: 'background 0.2s, border-color 0.2s',
            }}
            className="placeholder:text-[#8696A0] disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isResolved || isSending || !inputText.trim()}
            style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#1B6CA8', color: 'white', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
              opacity: (isResolved || !inputText.trim()) ? 0.5 : 1,
              transition: 'background 0.15s',
            }}
            onMouseOver={(e) => { if (!isResolved && inputText.trim()) (e.currentTarget as HTMLElement).style.background = '#145089'; }}
            onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.background = '#1B6CA8'; }}
          >
            {isSending ? (
              <Loader2 style={{ width: 20, height: 20 }} className="animate-spin" />
            ) : (
              <Send style={{ width: 20, height: 20 }} />
            )}
          </button>
        </div>
      </div>

      {/* Rating modal */}
      {isSeeker && chatMeta && (
        <RatingModal
          open={isRatingOpen}
          onOpenChange={setIsRatingOpen}
          helperName={chatMeta.helper.name}
          onSubmit={handleResolveSubmit}
        />
      )}
    </div>
  );
}
