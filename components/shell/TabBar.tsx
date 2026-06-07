import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HelpCircle, MessageSquare, Bell, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TabBarProps {
  unreadChats: number;
  unreadNotifications: number;
}

export function TabBar({ unreadChats, unreadNotifications }: TabBarProps) {
  const pathname = usePathname();

  const tabs = [
    {
      label: 'Request',
      href: '/request',
      icon: HelpCircle,
      active: pathname.startsWith('/request'),
      badge: 0,
    },
    {
      label: 'Assistant',
      href: '/chatbot',
      icon: Bot,
      active: pathname.startsWith('/chatbot'),
      badge: 0,
    },
    {
      label: 'Messages',
      href: '/messages',
      icon: MessageSquare,
      active: pathname.startsWith('/messages'),
      badge: unreadChats,
    },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: Bell,
      active: pathname.startsWith('/notifications'),
      badge: unreadNotifications,
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: User,
      active: pathname.startsWith('/profile') && !pathname.includes('past-requests'),
      badge: 0,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white px-2 py-1 md:hidden shadow-lg">
      <div className="flex justify-around items-center h-12">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors relative',
                tab.active ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full ring-2 ring-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="mt-0.5">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
