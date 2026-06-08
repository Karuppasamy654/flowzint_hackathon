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
import { ArrowLeft, CheckCircle, Send, ShieldCheck, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SmartReplyChips } from './SmartReplyChips';
import { getLanguageName } from '@/lib/languages';
import { format } from 'date-fns';

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
  const [isOtherUserTyping, setIsOtherUserTyping] = React.useState(false);
  const [showScrollButton, setShowScrollButton] = React.useState(false);

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

  // Auto scroll to bottom
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Monitor loading completion to trigger first scroll
  React.useEffect(() => {
    if (!isLoading) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isLoading]);

  // Auto scroll when typing indicator toggles
  React.useEffect(() => {
    if (isOtherUserTyping) {
      setTimeout(scrollToBottom, 50);
    }
  }, [isOtherUserTyping]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isUp = el.scrollHeight - el.scrollTop - el.clientHeight > 200;
    setShowScrollButton(isUp);
  };

  const triggerMockReply = (userText: string, otherUser: any) => {
    const cleaned = userText.toLowerCase();
    let replyText = "Hello! I am reading your messages and heading over now. Don't worry!";
    
    if (cleaned.includes('urgent') || cleaned.includes('emergency') || cleaned.includes('hurt') || cleaned.includes('leak') || cleaned.includes('broken')) {
      replyText = "I see this is urgent! I've grabbed my tools and first aid kit and am heading out the door now. Hang tight!";
    } else if (cleaned.includes('where') || cleaned.includes('location') || cleaned.includes('address') || cleaned.includes('place')) {
      replyText = `I see your location is listed in ${chatMeta?.request?.location || 'the neighborhood'}. I am nearby and will arrive shortly.`;
    } else if (cleaned.includes('thank') || cleaned.includes('thanks') || cleaned.includes('thx')) {
      replyText = "You're very welcome! Neighbors help neighbors. Glad I could support you today.";
    } else if (cleaned.includes('bring') || cleaned.includes('tool') || cleaned.includes('need') || cleaned.includes('supplies')) {
      replyText = "I'm bringing my standard tools and supplies. Let me know if there's anything specific you want me to bring!";
    } else {
      const defaults = [
        "Understood! I am on it and will coordinate with you as soon as I arrive.",
        "I am heading over to help you now. Let me know if there are any specific entry instructions!",
        "Got your message. I am packing up and should be there in about 5 to 10 minutes."
      ];
      replyText = defaults[Math.floor(Math.random() * defaults.length)];
    }

    // Start typing status after 800ms
    setTimeout(() => {
      setIsOtherUserTyping(true);
      
      // Post mock helper reply after another 2.2s
      setTimeout(async () => {
        setIsOtherUserTyping(false);
        try {
          await fetch(`/api/chats/${chatId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: replyText,
              senderId: otherUser._id
            })
          });
        } catch (err) {
          console.error('Failed to post mock reply:', err);
        }
      }, 2200);
      
    }, 800);
  };

  const handleSend = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    
    const textToSend = customText ? customText.trim() : inputText.trim();
    if (!textToSend || isSending) return;

    setIsSending(true);
    try {
      await sendMessage(textToSend);
      if (!customText) {
        setInputText('');
      }

      // Auto-reply in Mock DB Mode
      if (process.env.NEXT_PUBLIC_USE_MOCK_DB === 'true' && otherUser) {
        triggerMockReply(textToSend, otherUser);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleSmartReplySelect = (reply: string) => {
    handleSend(undefined, reply);
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
        // Re-load meta to reflect status change
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
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return format(date, 'MMMM d, yyyy');
      }
    } catch (e) {
      return '';
    }
  };

  if (isLoading || !chatMeta || !chatMeta.seeker || !chatMeta.helper) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm text-slate-400 font-medium">Connecting to chat...</p>
      </div>
    );
  }

  const otherUser = chatMeta.seeker._id === currentUserId ? chatMeta.helper : chatMeta.seeker;
  const isSeeker = chatMeta.seeker._id === currentUserId;
  const isResolved = chatMeta.status === 'resolved';

  // WhatsApp style consecutive message grouping calculation
  const analyzedMessages = messages.map((msg, idx) => {
    const prevMsg = messages[idx - 1];
    const nextMsg = messages[idx + 1];

    const isMe = msg.sender._id === currentUserId;
    const prevSenderId = prevMsg?.sender?._id;
    const nextSenderId = nextMsg?.sender?._id;

    const isPrevConsecutive = prevSenderId === msg.sender._id;
    const isNextConsecutive = nextSenderId === msg.sender._id;

    const prevTimeDiff = prevMsg ? Math.abs(new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) : Infinity;
    const nextTimeDiff = nextMsg ? Math.abs(new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime()) : Infinity;

    const isGroupedWithPrev = isPrevConsecutive && prevTimeDiff < 3 * 60 * 1000;
    const isGroupedWithNext = isNextConsecutive && nextTimeDiff < 3 * 60 * 1000;

    const isFirstInGroup = !isGroupedWithPrev;
    const isLastInGroup = !isGroupedWithNext;

    return {
      ...msg,
      isMe,
      isFirstInGroup,
      isLastInGroup,
      showAvatar: !isMe && isLastInGroup,
      showName: !isMe && isFirstInGroup,
    };
  });

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-64px)] bg-[#131B2E]/50 border border-white/10 rounded-lg overflow-hidden backdrop-blur-md text-white relative">
      {/* Header section */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#131B2E]/70 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/messages')}
            className="md:hidden p-1 hover:bg-white/5 rounded-full"
          >
            <ArrowLeft className="h-5 w-5 text-slate-300" />
          </button>
          
          <Avatar
            src={otherUser.avatarUrl}
            name={otherUser.name}
            color={otherUser.avatarColor}
            size="sm"
            className="border border-white/10"
          />
          
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white leading-none">{otherUser.name}</h4>
              {chatMeta.seeker.preferredLanguage !== chatMeta.helper.preferredLanguage && (
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold">
                  🌐 Auto-translate
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate">
              {otherUser.location}
              {chatMeta.seeker.preferredLanguage !== chatMeta.helper.preferredLanguage && (
                <span className="ml-1 text-[9px] text-slate-500 font-normal">
                  ({getLanguageName(otherUser.preferredLanguage)} &rarr; {getLanguageName(chatMeta[isSeeker ? 'seeker' : 'helper'].preferredLanguage)})
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
            className="bg-emerald-600 text-white hover:bg-emerald-700 h-8 font-semibold rounded-md flex items-center gap-1 text-xs shrink-0 transition-colors"
          >
            <CheckCircle className="h-4 w-4" />
            Resolve Request
          </Button>
        )}

        {isResolved && (
          <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-500/20 px-3 py-1 rounded-full shrink-0 flex items-center gap-1 select-none">
            <CheckCircle className="h-3.5 w-3.5 fill-emerald-500 text-white" />
            Resolved
          </span>
        )}
      </div>

      {/* Scrollable messages and context container */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col bg-[#0B0F1A]/30 relative" 
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {/* Context Card */}
        {chatMeta.request && (
          <div className="shrink-0 mb-2">
            <PinnedContextCard request={chatMeta.request} />
          </div>
        )}

        {/* Messages loop */}
        <div className="flex-1 flex flex-col space-y-1 justify-end">
          {analyzedMessages.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-500 font-medium">
              This is the beginning of your conversation.
            </div>
          ) : (
            analyzedMessages.map((message, idx) => {
              const prevMessage = analyzedMessages[idx - 1];
              const showDaySeparator = !prevMessage || 
                new Date(message.createdAt).toDateString() !== new Date(prevMessage.createdAt).toDateString();

              return (
                <React.Fragment key={message._id}>
                  {showDaySeparator && (
                    <div className="flex justify-center my-4 animate-in fade-in duration-300">
                      <span className="bg-[#1e293b]/60 border border-white/5 text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 py-1 rounded-full shadow-sm">
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

          {/* Typing Indicator Bubble */}
          {isOtherUserTyping && (
            <div className="flex items-start gap-2.5 max-w-[85%] sm:max-w-[70%] self-start animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="w-8 shrink-0 flex justify-center">
                <Avatar
                  src={otherUser.avatarUrl}
                  name={otherUser.name}
                  color={otherUser.avatarColor}
                  size="sm"
                  className="border border-white/10"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-[10px] font-semibold text-slate-400 pl-1">
                  {otherUser.name}
                </span>
                <div className="flex items-center gap-2 bg-[#131B2E]/60 text-slate-300 px-4 py-3 rounded-lg rounded-tl-none border border-white/5 backdrop-blur-xs select-none">
                  <div className="flex space-x-1.5 items-center h-2">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDuration: '0.8s', animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDuration: '0.8s', animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDuration: '0.8s', animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 ml-1">typing...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ↓ New message float indicator */}
        {showScrollButton && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-full shadow-lg border border-indigo-500/30 flex items-center gap-1.5 animate-bounce active:scale-95 transition-all cursor-pointer"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            New message
          </button>
        )}
      </div>

      {/* Message input footer */}
      <div className="border-t border-white/10 bg-[#131B2E]/70 shrink-0">
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
        
        <div className="p-3">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              id="chat-input-field"
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isResolved ? "This chat is resolved" : "Type a message..."}
              disabled={isResolved || isSending}
              className="flex-1 h-10 px-4 py-2 bg-[#0B0F1A]/70 border border-white/10 rounded-md text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:bg-[#0B0F1A]/30 disabled:cursor-not-allowed text-white"
            />
            <Button
              type="submit"
              disabled={isResolved || isSending || !inputText.trim()}
              className="h-10 w-10 flex items-center justify-center p-0 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shrink-0 disabled:opacity-50 transition-colors"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4.5 w-4.5" />
              )}
            </Button>
          </form>
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
