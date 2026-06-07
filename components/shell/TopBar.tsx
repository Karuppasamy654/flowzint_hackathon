import { UserMenu } from './UserMenu';
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
    <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4 md:hidden sticky top-0 z-30 shadow-xs">
      <Link href="/request" className="flex items-center">
        <span className="text-xl font-display font-semibold text-primary">Help</span>
        <span className="text-xl font-sans font-extrabold text-primary-hover">Net</span>
      </Link>

      <UserMenu user={user} />
    </header>
  );
}
