'use client';

import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initialize: () => void;
}

const applyThemeToDocument = (theme: ThemeMode) => {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',

  setTheme: (theme: ThemeMode) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('app_theme', theme);
      } catch (e) {
        // ignore
      }
    }
    applyThemeToDocument(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },

  initialize: () => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('app_theme') as ThemeMode | null;
        if (saved && (saved === 'light' || saved === 'dark')) {
          applyThemeToDocument(saved);
          set({ theme: saved });
          return;
        }
      } catch (e) {
        // ignore
      }
      // Default to light
      applyThemeToDocument('light');
      set({ theme: 'light' });
    }
  },
}));
