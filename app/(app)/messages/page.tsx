'use client';

import * as React from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ConversationList } from '@/components/messages/ConversationList';
import { MessageSquare, Loader2 } from 'lucide-react';

export default function MessagesIndexPage() {
  const { user } = useCurrentUser();

  if (!user) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="py-2">
        <h1 className="text-2xl font-display font-semibold text-gray-900 leading-tight">
          Conversations
        </h1>
        <p className="text-sm text-gray-500">
          Coordinate with neighbors to solve pending help requests.
        </p>
      </div>

      {/* Grid splits into list on left and prompt on right for desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Chat sidebar list */}
        <div className="md:col-span-1">
          <ConversationList currentUserId={user.id} />
        </div>

        {/* Desktop placeholder screen */}
        <div className="hidden md:flex md:col-span-2 h-[450px] bg-white rounded-lg border border-border flex-col items-center justify-center text-center space-y-3 text-gray-400 p-8 shadow-xs">
          <div className="h-14 w-14 bg-gray-50 border border-border/70 rounded-full flex items-center justify-center text-gray-400">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-gray-800">Select a Conversation</h4>
            <p className="text-xs text-gray-400 max-w-xs leading-normal">
              Click a conversation bubble from the sidebar list to open your live community chat window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
