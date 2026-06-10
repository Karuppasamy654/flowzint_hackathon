'use client';

import * as React from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isSignup = pathname.startsWith('/signup');
  let currentStep = 1;
  if (pathname.includes('/step2')) currentStep = 2;
  if (pathname.includes('/step3')) currentStep = 3;

  const steps = [
    { number: 1, label: 'Account' },
    { number: 2, label: 'Skills' },
    { number: 3, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen w-full bg-surface flex flex-col items-center justify-center py-10 px-4">
      {/* Brand logo header */}
      <Link href="/" className="mb-6 flex items-center select-none">
        <Image src="/assets/vercel_logo.png" alt="Vercel Logo" width={32} height={32} className="h-8 w-8" unoptimized />
      </Link>

      {/* Main card box */}
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-lg shadow-modal border border-border/40 animate-in fade-in duration-300">
        {/* Step Indicator (only for Signup stages) */}
        {isSignup && (
          <div className="flex items-center justify-between mb-8 select-none">
            {steps.map((step, idx) => {
              const isDone = currentStep > step.number;
              const isActive = currentStep === step.number;

              return (
                <React.Fragment key={step.number}>
                  {/* Step Circle */}
                  <div className="flex flex-col items-center relative">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-all duration-300',
                        isDone
                          ? 'bg-primary border-primary text-white'
                          : isActive
                          ? 'border-primary text-primary bg-primary-light/50 font-bold scale-105'
                          : 'border-gray-200 text-gray-400 bg-white'
                      )}
                    >
                      {isDone ? <Check className="h-4.5 w-4.5 stroke-[3]" /> : step.number}
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-semibold uppercase tracking-wider mt-1.5',
                        isActive ? 'text-primary' : 'text-gray-400'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connector Line */}
                  {idx < steps.length - 1 && (
                    <div
                      className={cn(
                        'h-0.5 flex-1 -mt-4 bg-gray-200 transition-all duration-300 mx-2',
                        currentStep > step.number ? 'bg-primary' : 'bg-gray-100'
                      )}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
