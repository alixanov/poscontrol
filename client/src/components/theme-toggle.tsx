'use client';

import React from 'react';
import { useThemeStore } from '@/stores/theme.store';
import { useTranslation } from '@/stores/language.store';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'segmented';
}

export function ThemeToggle({ className = '', variant = 'button' }: ThemeToggleProps) {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const { language } = useTranslation();

  const isDark = theme === 'dark';

  const lightTitle = language === 'uz' ? 'Kunduzgi rejim (Kun)' : 'Дневной режим (День)';
  const darkTitle = language === 'uz' ? 'Tungi rejim (Tun)' : 'Ночной режим (Ночь)';

  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80 shadow-sm backdrop-blur-sm dark:bg-slate-800 dark:border-slate-700 ${className}`}
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
            !isDark
              ? 'bg-white text-amber-500 shadow-sm dark:bg-slate-700'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
          title={lightTitle}
        >
          <Sun className="h-3.5 w-3.5" />
          <span>{language === 'uz' ? 'Kun' : 'День'}</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
            isDark
              ? 'bg-white text-blue-500 shadow-sm dark:bg-slate-700 dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
          title={darkTitle}
        >
          <Moon className="h-3.5 w-3.5" />
          <span>{language === 'uz' ? 'Tun' : 'Ночь'}</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? lightTitle : darkTitle}
      className={`relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white/90 text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:bg-slate-700 active:scale-95 ${className}`}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-slate-600 transition-transform duration-200 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
