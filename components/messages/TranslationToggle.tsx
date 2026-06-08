'use client';

import * as React from 'react';
import { Globe } from 'lucide-react';

interface TranslationToggleProps {
  originalText?: string;
  originalLanguage?: string;
  isShowingTranslation: boolean;
  onToggle: () => void;
}

export function TranslationToggle({
  originalText,
  originalLanguage,
  isShowingTranslation,
  onToggle,
}: TranslationToggleProps) {
  if (!originalText || !originalLanguage) return null;

  const langCode = originalLanguage.toUpperCase();

  return (
    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 select-none">
      <Globe className="h-3 w-3 text-slate-500" />
      <span>
        {isShowingTranslation 
          ? `Translated from ${langCode}` 
          : `Original message (${langCode})`}
      </span>
      <span className="text-slate-600 font-bold">•</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="text-indigo-400 hover:text-indigo-300 hover:underline font-semibold bg-transparent border-none p-0 cursor-pointer"
      >
        {isShowingTranslation ? 'Show Original' : 'Show Translation'}
      </button>
    </div>
  );
}
