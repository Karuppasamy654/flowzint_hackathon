'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';

export default function RequestPage() {
  const { user, status, isLoading } = useCurrentUser();
  const router = useRouter();

  // Guard: redirect unauthenticated users back to login
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (isLoading || status === 'loading' || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4">Loading.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-8">
      <h1 className="text-4xl font-display mb-6">
        Hello, <span className="text-primary">{user.name}</span>!
      </h1>
      <p className="text-lg mb-8">
        This is the request dashboard. From here you can create new help requests,
        view matches, and manage your conversations.
      </p>
      <Button
        className="flex items-center gap-2 bg-primary hover:bg-primary-hover"
      >
        <ArrowRight className="h-4 w-4" />
        Return Home
      </Button>
    </div>
  );
}
