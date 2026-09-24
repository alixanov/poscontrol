'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useTranslation } from '@/stores/language.store';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogOut, User as UserIcon, Shield, ShieldCheck, Menu } from 'lucide-react';
import api from '@/lib/api';
import { useUiStore } from '@/stores/ui.store';

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const { openMobileSidebar } = useUiStore();

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    } catch (e) {
      // ignore
    } finally {
      logout();
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 dark:bg-slate-900/80 dark:border-slate-800 px-4 sm:px-6 lg:px-8 backdrop-blur-md transition-colors duration-200">
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={openMobileSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden transition"
          aria-label="Open mobile menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <span className="text-xs font-semibold px-2 sm:px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t.nav.adminMode}</span>
          <span className="sm:hidden">ADMIN</span>
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <ThemeToggle />
        <LanguageSwitcher showIcon />

        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700 text-xs sm:text-sm">
            {user?.name ? user.name[0].toUpperCase() : 'A'}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-sm font-semibold text-slate-800 dark:text-white leading-none">
              {user?.name || t.employees.roleAdmin}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">{user?.email}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          title={t.nav.logout}
          className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/40 dark:hover:text-red-400 dark:hover:border-red-900 transition"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
