'use client';

import React, { useRef, useState } from 'react';
import { LANGUAGES, Language } from '@/lib/i18n';
import { useLanguage } from '@/lib/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  /** 'sidebar' = full label inside sidebar, 'compact' = icon-only for top bar */
  variant?: 'sidebar' | 'compact';
}

export function LanguageSwitcher({ variant = 'sidebar' }: LanguageSwitcherProps) {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  // Close on outside click
  React.useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 rounded-md transition-colors text-slate-400 hover:text-white',
          variant === 'sidebar'
            ? 'w-full px-3 py-2 hover:bg-white/5 text-sm'
            : 'p-2 hover:bg-white/5'
        )}
        title="Change language"
      >
        <Globe className="h-4 w-4 shrink-0" />
        {variant === 'sidebar' && (
          <>
            <span className="flex-1 text-left text-xs font-semibold">{current.nativeLabel}</span>
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
          </>
        )}
        {variant === 'compact' && (
          <span className="text-xs font-bold uppercase">{lang}</span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-50 bg-[#0D1224] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150',
            variant === 'sidebar'
              ? 'bottom-full left-0 right-0 mb-1'
              : 'bottom-full right-0 mb-1 w-44'
          )}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code as Language); setOpen(false); }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-white/5',
                lang === l.code ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-300'
              )}
            >
              <span className="text-base w-6 text-center">{l.flag}</span>
              <span className="flex-1 font-medium">{l.nativeLabel}</span>
              <span className="text-[10px] text-slate-500">{l.label}</span>
              {lang === l.code && <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
