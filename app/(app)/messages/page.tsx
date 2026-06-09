'use client';

import * as React from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLanguage } from '@/lib/LanguageContext';
import { ConversationList } from '@/components/messages/ConversationList';
import { MessageSquare, Loader2 } from 'lucide-react';

export default function MessagesIndexPage() {
  const { user } = useCurrentUser();
  const { t } = useLanguage();

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
        <h1 className="text-2xl font-display font-semibold text-white leading-tight">
            {t('messages.title')}
          </h1>
          <p className="text-sm text-slate-400">
            {t('messages.subtitle')}
          </p>
      </div>

      {/* Grid splits into list on left and prompt on right for desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Chat sidebar list */}
        <div className="md:col-span-1">
          <ConversationList currentUserId={user.id} />
        </div>

        {/* Desktop placeholder screen */}
        <div className="hidden md:flex md:col-span-2 h-[450px] bg-[#131B2E]/50 border border-white/10 rounded-lg flex-col items-center justify-center text-center space-y-3 p-8 backdrop-blur-md">
          <div className="h-14 w-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-slate-500">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-white">{t('messages.selectChat')}</h4>
            <p className="text-xs text-slate-400 max-w-xs leading-normal">
              {t('messages.selectChatDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
