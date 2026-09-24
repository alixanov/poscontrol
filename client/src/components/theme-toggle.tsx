'use client';

import React from 'react';
import { useThemeStore } from '@/stores/theme.store';
import { useTranslation } from '@/stores/language.store';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'segmented';
  showText?: boolean;
}

export function ThemeToggle({ className = '', variant = 'button', showText = true }: ThemeToggleProps) {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const { language } = useTranslation();

  const isDark = theme === 'dark';

  const lightTitle = language === 'uz' ? 'Kunduzgi rejim (Light mode)' : 'Светлая тема (Light mode)';
  const darkTitle = language === 'uz' ? 'Tungi rejim (Dark mode)' : 'Тёмная тема (Dark mode)';

  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center rounded-xl bg-slate-100/90 dark:bg-slate-800/90 p-1 border border-slate-200/80 dark:border-slate-700/80 shadow-sm backdrop-blur-sm ${className}`}
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
            !isDark
              ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          title={lightTitle}
        >
          <Sun className="h-3.5 w-3.5 text-amber-500" />
          <span>{language === 'uz' ? 'Kun' : 'День'}</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
            isDark
              ? 'bg-white dark:bg-slate-900 text-blue-500 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          title={darkTitle}
        >
          <Moon className="h-3.5 w-3.5 text-blue-400" />
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
      className={`relative flex h-8 sm:h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/90 text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700 active:scale-95 text-xs font-bold ${
        showText ? 'w-8 sm:w-auto px-0 sm:px-3' : 'w-8 sm:w-9'
      } ${className}`}
    >
      {isDark ? (
        <>
          <Moon className="h-4 w-4 text-blue-400 shrink-0" />
          {showText && (
            <span className="hidden sm:inline">
              {language === 'uz' ? 'Tungi rejim' : 'Тёмная тема'}
            </span>
          )}
        </>
      ) : (
        <>
          <Sun className="h-4 w-4 text-amber-500 shrink-0" />
          {showText && (
            <span className="hidden sm:inline">
              {language === 'uz' ? 'Kunduzgi' : 'Светлая тема'}
            </span>
          )}
        </>
      )}
    </button>
  );
}
