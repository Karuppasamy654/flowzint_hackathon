'use client';

import { UserMenu } from './UserMenu';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import Link from 'next/link';

interface TopBarProps {
  user: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    avatarColor?: string | null;
    id?: string;
  };
}

export function TopBar({ user }: TopBarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-white/5 bg-[#0D1224]/90 backdrop-blur-md px-4 md:hidden sticky top-0 z-30">
      <Link href="/request" className="flex items-center">
        <span className="text-xl font-display font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Help</span>
        <span className="text-xl font-extrabold text-indigo-400">Net</span>
      </Link>

      <div className="flex items-center gap-1">
        <LanguageSwitcher variant="compact" />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
