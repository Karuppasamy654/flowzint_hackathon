'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, TranslationKey, t as translate } from './i18n';

interface LanguageContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  // Persist preference to localStorage
  useEffect(() => {
    const saved = localStorage.getItem('hn_lang') as Language | null;
    if (saved && ['en', 'ta', 'hi', 'ml', 'te'].includes(saved)) {
      setLangState(saved);
    }
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('hn_lang', l);
  };

  const t = (key: TranslationKey) => translate(lang, key);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
