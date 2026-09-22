'use client';

import { create } from 'zustand';
import { Language, translations, TranslationDict } from '@/lib/translations';

interface LanguageState {
  language: Language;
  t: TranslationDict;
  setLanguage: (lang: Language) => void;
  initialize: () => void;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'uz', // DEFAULT IS 'uz'
  t: translations.uz,

  setLanguage: (lang: Language) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('app_language', lang);
      } catch (e) {
        // ignore
      }
    }
    set({
      language: lang,
      t: translations[lang],
    });
  },

  initialize: () => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('app_language') as Language | null;
        if (saved && (saved === 'uz' || saved === 'ru')) {
          set({
            language: saved,
            t: translations[saved],
          });
          return;
        }
      } catch (e) {
        // ignore
      }
      // Default to 'uz'
      set({
        language: 'uz',
        t: translations.uz,
      });
    }
  },
}));

export function useTranslation() {
  const { language, setLanguage, t } = useLanguageStore();
  return { language, setLanguage, t };
}
