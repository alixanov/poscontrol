'use client';

import React from 'react';
import { useLanguageStore } from '@/stores/language.store';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  showIcon?: boolean;
}

export function LanguageSwitcher({ className = '', showIcon = false }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguageStore();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-xl bg-slate-100/90 p-1 border border-slate-200/80 shadow-sm backdrop-blur-sm ${className}`}
    >
      {showIcon && (
        <span className="pl-1.5 pr-0.5 text-slate-400">
          <Globe className="h-3.5 w-3.5" />
        </span>
      )}
      <button
        type="button"
        onClick={() => setLanguage('uz')}
        className={`flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-bold transition ${
          language === 'uz'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        }`}
        title="O'zbek tili"
      >
        UZ
      </button>

      <button
        type="button"
        onClick={() => setLanguage('ru')}
        className={`flex items-center justify-center rounded-lg px-2.5 py-1 text-xs font-bold transition ${
          language === 'ru'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-800'
        }`}
        title="Русский язык"
      >
        RU
      </button>
    </div>
  );
}
