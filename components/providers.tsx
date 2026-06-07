'use client';

import * as React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ToastContainer } from './ui/toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <ToastContainer />
    </SessionProvider>
  );
}
