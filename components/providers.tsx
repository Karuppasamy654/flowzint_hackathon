'use client';

import * as React from 'react';
import { SessionProvider } from 'next-auth/react';
import { ToastContainer } from './ui/toast';
import { LanguageProvider } from '@/lib/LanguageContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        {children}
        <ToastContainer />
      </LanguageProvider>
    </SessionProvider>
  );
}
