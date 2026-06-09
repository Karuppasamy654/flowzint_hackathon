'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';
import { useLanguage } from '@/lib/LanguageContext';
import { Avatar } from '../ui/avatar';
import { TopBar } from './TopBar';
import { TabBar } from './TabBar';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { HelpCircle, MessageSquare, Bell, User, LogOut, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppShellProps {
  user: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    avatarColor?: string | null;
    id?: string;
  };
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  
  // Realtime notification subscriptions
  const { unreadCount: notificationsCount } = useNotifications(user?.id);
  const [unreadChats, setUnreadChats] = React.useState(0);

  // Function to load latest chats and calculate unread messages sum
  const fetchUnreadChats = React.useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/chats');
      const result = await res.json();
      if (result.success) {
        const sum = (result.data || []).reduce(
          (acc: number, chat: any) => acc + (chat.unreadCount || 0),
          0
        );
        setUnreadChats(sum);
      }
    } catch (e) {
      console.error('Failed to load chats count:', e);
    }
  }, [user?.id]);

  // Sync chats read state on path transitions
  React.useEffect(() => {
    fetchUnreadChats();
  }, [pathname, fetchUnreadChats]);

  // Establish a small timer or rely on notification broadcasts to fetch chats count
  React.useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(fetchUnreadChats, 12000); // Fail-safe polling every 12s
    return () => clearInterval(interval);
  }, [user?.id, fetchUnreadChats]);

  // Desktop navigation items list
  const navItems = [
    {
      label: t('nav.requestHelp'),
      href: '/request',
      icon: HelpCircle,
      active: pathname.startsWith('/request'),
      badge: 0,
    },
    {
      label: t('nav.insights'),
      href: '/insights',
      icon: BarChart3,
      active: pathname.startsWith('/insights'),
      badge: 0,
    },
    {
      label: t('nav.conversations'),
      href: '/messages',
      icon: MessageSquare,
      active: pathname.startsWith('/messages'),
      badge: unreadChats,
    },
    {
      label: t('nav.notifications'),
      href: '/notifications',
      icon: Bell,
      active: pathname.startsWith('/notifications'),
      badge: notificationsCount,
    },
    {
      label: t('nav.myProfile'),
      href: '/profile',
      icon: User,
      active: pathname.startsWith('/profile'),
      badge: 0,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-slate-100 font-sans">
      {/* Mobile Top Header */}
      <TopBar user={user} />

      {/* Desktop Main Layout */}
      <div className="flex h-screen overflow-hidden">
        {/* Left Sidebar (Desktop only) */}
        <aside className="hidden md:flex w-60 flex-col border-r border-white/5 bg-[#0D1224]/80 backdrop-blur-md h-full shrink-0 select-none">
          {/* Logo Area */}
          <div className="py-6 px-6 border-b border-white/5">
            <Link href="/request" className="flex items-center">
              <span className="text-2xl font-display font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Help</span>
              <span className="text-2xl font-sans font-extrabold text-indigo-400">Net</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 rounded-md text-sm font-medium transition-all duration-150',
                    item.active
                      ? 'bg-indigo-500/10 text-indigo-400 font-semibold border-l-2 border-indigo-500'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User profile card & logout block */}
          <div className="border-t border-white/5 p-4 space-y-2">
            {/* Language Switcher */}
            <LanguageSwitcher variant="sidebar" />

            <div className="flex items-center justify-between">
              <Link href="/profile" className="flex items-center gap-3 max-w-[150px] group">
                <Avatar
                  src={user.avatarUrl}
                  name={user.name || 'User'}
                  color={(user as any).avatarColor}
                  size="sm"
                  className="group-hover:scale-105 transition-transform"
                />
                <div className="truncate text-left">
                  <p className="text-sm font-semibold text-slate-200 truncate leading-none">
                    {user.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{t('common.viewProfile')}</p>
                </div>
              </Link>

              <button
                onClick={() => signOut()}
                title={t('common.signOut')}
                className="text-slate-500 hover:text-red-400 p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#0B0F1A] pb-16 md:pb-0 h-full">
          <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 md:p-8 animate-in fade-in duration-200">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sticky Bottom Tab Bar */}
      <TabBar unreadChats={unreadChats} unreadNotifications={notificationsCount} />
    </div>
  );
}
