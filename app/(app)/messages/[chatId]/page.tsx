'use client';

import * as React from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatWindow } from '@/components/messages/ChatWindow';
import { Loader2 } from 'lucide-react';

interface ChatPageProps {
  params: {
    chatId: string;
  };
}

export default function ChatRoomPage({ params }: ChatPageProps) {
  const { user } = useCurrentUser();
  const { chatId } = params;

  if (!user) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left">
      {/* Splits layout: list on left (desktop only), chat window on right */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch h-[calc(100vh-100px)] md:h-[calc(100vh-80px)]">
        {/* Left Side: Conversation List (Hidden on Mobile) */}
        <div className="hidden md:block md:col-span-1 overflow-y-auto pr-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 pl-1">
            Conversations
          </h3>
          <ConversationList currentUserId={user.id} />
        </div>

        {/* Right Side: Chat Window */}
        <div className="col-span-1 md:col-span-2 h-full">
          <ChatWindow chatId={chatId} currentUserId={user.id} />
        </div>
      </div>
    </div>
  );
}
