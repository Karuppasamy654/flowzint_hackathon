'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Minus, Send, X, Sparkles } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

type Message = { role: 'user' | 'model'; parts: { text: string }[] };

const QUICK_ACTIONS = [
  { label: '🔍 Find me a helper', prompt: 'Find someone who can help me with web development' },
  { label: '📋 Show open requests', prompt: 'Show me open help requests that need helpers' },
  { label: '✍️ Help me write a request', prompt: 'Help me write a clear help request for my situation.' },
  { label: '🤖 What can you do?', prompt: 'What can you help me with?' },
];

export function ChatAssistant() {
  const { user } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setHasUnread(false);
  };

  const handleSend = async (customPrompt?: string) => {
    const text = customPrompt || input.trim();
    if (!text || isTyping) return;
    if (messages.length > 0) setShowQuickActions(false);

    const userMessage: Message = { role: 'user', parts: [{ text }] };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages.slice(-20) as Message[]);
    if (!customPrompt) setInput('');
    setIsTyping(true);
    setShowQuickActions(false);

    try {
      const res = await fetch('/api/ai/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          userContext: {
            name: user?.name,
            skills: user?.skills,
            hasActiveRequest: false,
            hasActiveChat: false,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.reply) {
        setMessages((prev) => ([...prev, { role: 'model' as const, parts: [{ text: data.reply }] }].slice(-20) as Message[]));
        if (!isOpen) setHasUnread(true);
      } else {
        setMessages((prev) => ([...prev, { role: 'model' as const, parts: [{ text: "I'm having trouble connecting right now. Please try again." }] }].slice(-20) as Message[]));
      }
    } catch {
      setMessages((prev) => ([...prev, { role: 'model' as const, parts: [{ text: "I'm having trouble connecting right now. Please try again." }] }].slice(-20) as Message[]));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={toggleOpen}
        className="fixed bottom-20 md:bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/30 transition-transform hover:scale-105 active:scale-95"
        title="Ask HelpNet AI"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        {!isOpen && hasUnread && (
          <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full bg-red-500 ring-2 ring-[#0B0F1A]" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-36 md:bottom-24 right-6 z-50 flex flex-col w-[360px] h-[520px] max-h-[65vh] max-w-[calc(100vw-3rem)] rounded-2xl border border-white/10 bg-[#0D1224] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600/90 to-violet-600/90 px-4 py-3.5 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-white leading-tight">HelpNet AI</h3>
                <p className="text-[11px] text-white/70">Powered by Gemini</p>
              </div>
            </div>
            <button onClick={toggleOpen} className="text-white/60 hover:text-white p-1 rounded">
              <Minus className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#0D1224]">
            {/* Welcome message */}
            {messages.length === 0 && (
              <div className="flex gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 self-end mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-[#131B2E] border border-white/8 px-3.5 py-2.5 text-sm text-slate-200 max-w-[80%]">
                  Hi{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! I&apos;m your HelpNet AI assistant. I can help you write a great request, explain the platform, or just be here if you need support. What&apos;s on your mind?
                </div>
              </div>
            )}

            {messages.map((msg, i) => {
              const isAI = msg.role === 'model';
              const isLastAIInGroup = isAI && (i === messages.length - 1 || messages[i + 1]?.role !== 'model');
              return (
                <div key={i} className={`flex gap-2 ${isAI ? 'justify-start' : 'justify-end'}`}>
                  {isAI && (
                    <div className="w-6 shrink-0 self-end mb-1 flex justify-center">
                      {isLastAIInGroup ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600">
                          <Sparkles className="h-3.5 w-3.5 text-white" />
                        </div>
                      ) : <div className="w-6" />}
                    </div>
                  )}
                  <div className={`max-w-[80%] px-3.5 py-2.5 text-sm leading-relaxed ${
                    isAI
                      ? 'rounded-2xl rounded-bl-sm bg-[#131B2E] border border-white/8 text-slate-200'
                      : 'rounded-2xl rounded-br-sm bg-gradient-to-br from-indigo-600 to-violet-600 text-white'
                  }`}>
                    {msg.parts[0].text}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex gap-2 justify-start">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 self-end mb-1">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-[#131B2E] border border-white/8 px-3.5 py-2.5 flex gap-1 items-center h-[42px]">
                  <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Quick action chips */}
            {showQuickActions && messages.length === 0 && !isTyping && (
              <div className="space-y-2 pt-2 animate-in fade-in duration-300">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-1">Quick questions</p>
                <div className="flex flex-col gap-1.5">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => handleSend(action.prompt)}
                      className="text-left text-xs font-medium bg-[#131B2E] border border-white/8 text-slate-300 hover:border-indigo-500/40 hover:text-white px-3 py-2.5 rounded-xl transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="border-t border-white/8 p-3 bg-[#0D1224] flex items-center gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="flex-1 resize-none overflow-hidden outline-none bg-[#131B2E] text-slate-200 border border-white/10 rounded-2xl px-4 py-2.5 text-sm placeholder:text-slate-600 focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 max-h-24 min-h-[44px] transition-colors"
              rows={1}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white disabled:opacity-40 transition-transform hover:scale-105 active:scale-95"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
